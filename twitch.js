// ===== TWITCH LOGIC =====
const GQL_URL = "https://gql.twitch.tv/gql";
const CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

async function gql(body){
  const res = await fetch(GQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-ID': CLIENT_ID },
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('Twitch API error (' + res.status + ')');
  return res.json();
}

async function resolveClip(slug){
  const body = {
    operationName: "VideoAccessToken_Clip",
    query: `query VideoAccessToken_Clip($slug: ID!) {
      clip(slug: $slug) {
        id title thumbnailURL
        broadcaster { displayName }
        videoQualities { frameRate quality sourceURL }
        playbackAccessToken(params: {platform: "web", playerBackend: "mediaplayer", playerType: "embed"}) { signature value }
      }
    }`,
    variables: { slug }
  };
  const data = await gql(body);
  const clip = data?.data?.clip;
  if(!clip || !clip.playbackAccessToken) throw new Error('клип не найден');
  const token = clip.playbackAccessToken;
  const qualities = (clip.videoQualities || []).slice().sort((a, b) => (b.quality - a.quality));
  const urls = qualities.map(q => {
    const u = new URL(q.sourceURL);
    u.searchParams.set('sig', token.signature);
    u.searchParams.set('token', token.value);
    return { 
      quality: q.quality + 'p' + (q.frameRate ? '@' + Math.round(q.frameRate) : ''), 
      url: u.toString() 
    };
  });
  renderClipResult(clip, urls);
}

function renderClipResult(clip, urls){
  let html = `<div class="preview-card">
    <img class="preview-thumb rect" src="${clip.thumbnailURL || ''}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(clip.title || 'без названия')}</div>
      <div class="preview-meta">${escapeHtml(clip.broadcaster?.displayName || '')} · ${t('clip_label')}</div>
    </div>
  </div>
  <div class="quality-list">`;
  if(urls.length === 0) html += `<div class="status-msg error">${t('no_qualities')}</div>`;
  for(const v of urls){
    html += `<div class="quality-row">
      <div><div class="label">${v.quality}</div></div>
      <a class="dl-btn" href="${v.url}" target="_blank" rel="noopener" download>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('dl')}
      </a>
    </div>`;
  }
  html += `</div>`;
  result.innerHTML = html; 
  result.classList.add('show');
}

async function resolveVod(id){
  const body = {
    operationName: "PlaybackAccessToken_Template",
    query: `query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {
      streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) { value signature __typename }
      videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) { value signature __typename }
    }`,
    variables: { isLive: false, login: "", isVod: true, vodID: id, playerType: "site" }
  };
  const data = await gql(body);
  const token = data?.data?.videoPlaybackAccessToken;
  if(!token) throw new Error('не удалось получить токен доступа');
  const metaBody = {
    operationName: "VideoMetadata",
    query: `query VideoMetadata($videoID: ID!) { video(id: $videoID) { id title lengthSeconds previewThumbnailURL owner { displayName } } }`,
    variables: { videoID: id }
  };
  let meta = null;
  try { 
    const md = await gql(metaBody); 
    meta = md?.data?.video; 
  } catch(e) {}
  const playlistParams = new URLSearchParams({
    sig: token.signature, token: token.value,
    allow_source: 'true', allow_audio_only: 'true', allow_spectre: 'false',
    p: String(Math.floor(Math.random() * 1000000)),
    player: 'twitchweb', player_backend: 'mediaplayer',
    playlist_include_framerate: 'true', reassignments_supported: 'true',
    supported_codecs: 'avc1', fast_bread: 'true'
  });
  const playlistUrl = `https://usher.ttvnw.net/vod/${id}.m3u8?${playlistParams.toString()}`;
  let qualities = [], qualitiesError = null;
  try{
    const plRes = await proxiedFetch(playlistUrl);
    const text = await plRes.text();
    if(!plRes.ok) throw new Error(`usher: ${plRes.status}`);
    qualities = parseMasterPlaylist(text);
    if(!qualities.length) qualitiesError = 'no qualities in playlist';
  } catch(e){ 
    qualitiesError = (e && e.message) ? e.message : String(e); 
  }
  renderVodResult(meta, id, qualities, playlistUrl, qualitiesError);
}

function renderVodResult(meta, id, qualities, playlistUrl, qualitiesError){
  const title = meta?.title || ('VOD #' + id);
  const author = meta?.owner?.displayName || '';
  const thumb = meta?.previewThumbnailURL || '';
  const fallbackTotal = meta?.lengthSeconds || 0;
  vodState = { 
    id, title, author, qualities, playlistUrl, 
    qualityIdx: 0, segments: null, 
    total: fallbackTotal, start: 0, end: fallbackTotal 
  };

  let html = `<div class="preview-card">
    <img class="preview-thumb rect" src="${thumb}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(author)} · vod</div>
    </div>
  </div>`;

  if(qualitiesError){
    html += `<div class="status-msg error" style="margin-bottom:12px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${t('cors_err')}${escapeHtml(qualitiesError)}. ${t('cors_hint')}</span>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
      <button class="dl-btn secondary" onclick="openSettings()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009.1 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9.1a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('setup_proxy')}
      </button>
      <button class="dl-btn secondary" onclick="handleGo()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('retry')}
      </button>
    </div>`;
  }

  html += `<div class="trim-box">
    <div class="trim-row">
      <label>${t('dl')}:</label>
      <select class="quality-select" id="qualitySelect" onchange="onQualityChange(this.value)">`;
  for(let i = 0; i < qualities.length; i++) 
    html += `<option value="${i}">${qualities[i].name}</option>`;
  html += `</select></div>
    <div class="trim-desc">${t('seg_loading')}</div>
    <div id="sliderArea"><div class="slider-loading">${t('seg_loading')}</div></div>
    <div class="dl-actions">
      <button class="dl-btn" id="dlOneFileBtn" onclick="downloadRangeAsOneFile()" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('dl_one')}
      </button>
      <button class="dl-btn secondary" id="dlPlaylistBtn" onclick="downloadRangeAsPlaylist()" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        ${t('dl_playlist')}
      </button>
    </div>
    <div class="progress-box" id="progressBox">
      <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
      <div class="progress-label" id="progressLabel"></div>
    </div>
  </div>
  <div class="hint-box">
    ${t('open_master')} <code><a href="${playlistUrl}" target="_blank" style="color:inherit">${t('master_hint')}</a></code>
  </div>`;

  result.innerHTML = html;
  result.classList.add('show');
  if(qualities.length) loadSegments(qualities[0].url);
}

function onQualityChange(idx){
  vodState.qualityIdx = +idx;
  vodState.segments = null;
  const area = document.getElementById('sliderArea');
  if(area) area.innerHTML = `<div class="slider-loading">${t('seg_loading')}</div>`;
  document.getElementById('dlOneFileBtn').disabled = true;
  document.getElementById('dlPlaylistBtn').disabled = true;
  loadSegments(vodState.qualities[+idx].url);
}

async function loadSegments(url){
  try{
    const res = await proxiedFetch(url);
    const text = await res.text();
    if(!res.ok) throw new Error('http ' + res.status);
    const parsed = parseMediaPlaylist(text, url);
    vodState.segments = parsed.segments;
    vodState.total = parsed.total;
    vodState.start = 0; 
    vodState.end = parsed.total;
    buildSlider();
    document.getElementById('dlOneFileBtn').disabled = false;
    document.getElementById('dlPlaylistBtn').disabled = false;
  }catch(e){
    const area = document.getElementById('sliderArea');
    if(area) area.innerHTML = `<div class="slider-loading" style="color:#eb4b4b">${t('seg_fail')}${e.message}</div>`;
  }
}

function buildSlider(){
  const area = document.getElementById('sliderArea');
  area.innerHTML = `<div class="slider-wrap" id="sliderWrap">
    <div class="slider-track"></div>
    <div class="slider-range" id="sliderRange"></div>
    <div class="slider-thumb start" id="thumbStart"></div>
    <div class="slider-thumb end" id="thumbEnd"></div>
    <div class="slider-tag start" id="tagStart"><input id="inputStart"></div>
    <div class="slider-tag end" id="tagEnd"><input id="inputEnd"></div>
  </div>`;
  document.getElementById('inputStart').addEventListener('change', e => {
    const v = parseHMS(e.target.value); 
    if(v != null) setRange(v, null); 
    else e.target.value = formatHMS(vodState.start);
  });
  document.getElementById('inputEnd').addEventListener('change', e => {
    const v = parseHMS(e.target.value); 
    if(v != null) setRange(null, v); 
    else e.target.value = formatHMS(vodState.end);
  });
  attachDrag('thumbStart', true); 
  attachDrag('thumbEnd', false); 
  positionThumbs();
}

function setRange(start, end){
  const minGap = vodState.total > 1 ? 1 : 0;
  if(start != null){ 
    start = Math.max(0, Math.min(start, vodState.total)); 
    if(start > vodState.end - minGap) start = Math.max(0, vodState.end - minGap); 
    vodState.start = start; 
  }
  if(end != null){ 
    end = Math.max(0, Math.min(end, vodState.total)); 
    if(end < vodState.start + minGap) end = Math.min(vodState.total, vodState.start + minGap); 
    vodState.end = end; 
  }
  positionThumbs();
}

function positionThumbs(){
  const wrap = document.getElementById('sliderWrap'); 
  if(!wrap) return;
  const total = vodState.total || 1;
  const thumbW = 24;
  const usable = Math.max(0, wrap.clientWidth - thumbW);
  const xStart = (vodState.start / total) * usable;
  const xEnd = (vodState.end / total) * usable;
  document.getElementById('thumbStart').style.left = xStart + 'px';
  document.getElementById('thumbEnd').style.left = xEnd + 'px';
  document.getElementById('sliderRange').style.left = (xStart + thumbW / 2) + 'px';
  document.getElementById('sliderRange').style.width = Math.max(0, xEnd - xStart) + 'px';
  const wrapWidth = wrap.clientWidth;
  const tagStart = document.getElementById('tagStart');
  const tagEnd = document.getElementById('tagEnd');
  tagStart.style.left = Math.min(Math.max(xStart + thumbW / 2, 38), wrapWidth - 38) + 'px';
  tagEnd.style.left = Math.min(Math.max(xEnd + thumbW / 2, 38), wrapWidth - 38) + 'px';
  const inputStart = document.getElementById('inputStart');
  const inputEnd = document.getElementById('inputEnd');
  if(document.activeElement !== inputStart) inputStart.value = formatHMS(vodState.start);
  if(document.activeElement !== inputEnd) inputEnd.value = formatHMS(vodState.end);
}

function attachDrag(thumbId, isStart){
  const thumb = document.getElementById(thumbId);
  thumb.addEventListener('pointerdown', e => {
    e.preventDefault(); 
    thumb.setPointerCapture(e.pointerId);
    const wrap = document.getElementById('sliderWrap');
    const thumbW = 24;
    function onMove(ev){ 
      const rect = wrap.getBoundingClientRect();
      const usable = Math.max(0, rect.width - thumbW); 
      let x = ev.clientX - rect.left - thumbW / 2; 
      x = Math.max(0, Math.min(x, usable)); 
      const t2 = (usable > 0 ? x / usable : 0) * vodState.total; 
      if(isStart) setRange(t2, null); 
      else setRange(null, t2); 
    }
    function onUp(){ 
      window.removeEventListener('pointermove', onMove); 
      window.removeEventListener('pointerup', onUp); 
    }
    window.addEventListener('pointermove', onMove); 
    window.addEventListener('pointerup', onUp);
  });
}

async function downloadRangeAsOneFile(){
  if(!vodState || !vodState.segments) return;
  const segs = segmentsInRange(vodState.start, vodState.end);
  if(!segs.length){ alert(t('no_seg')); return; }
  const btn1 = document.getElementById('dlOneFileBtn');
  const btn2 = document.getElementById('dlPlaylistBtn');
  btn1.disabled = true; 
  btn2.disabled = true;
  const box = document.getElementById('progressBox');
  const fill = document.getElementById('progressFill');
  const label = document.getElementById('progressLabel');
  box.classList.add('show'); 
  fill.style.width = '0%';
  const chunks = new Array(segs.length); 
  let done = 0, nextIdx = 0, failed = null;
  const concurrency = 5;
  async function worker(){
    while(nextIdx < segs.length && !failed){
      const idx = nextIdx++;
      try { 
        const res = await proxiedFetch(segs[idx].url); 
        if(!res.ok) throw new Error('http ' + res.status); 
        chunks[idx] = await res.arrayBuffer(); 
      } catch(e){ 
        failed = e; 
        return; 
      }
      done++; 
      const pct = Math.round(done / segs.length * 100);
      fill.style.width = pct + '%'; 
      label.textContent = t('dl_progress') + `${done}/${segs.length} (${pct}%)`;
    }
  }
  try{
    await Promise.all(Array.from({length: Math.min(concurrency, segs.length)}, worker));
    if(failed) throw failed;
    label.textContent = t('splicing');
    const blob = new Blob(chunks, {type: 'video/mp2t'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (vodState.title || ('vod_' + vodState.id)).replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
    a.href = url; 
    a.download = `${safeName}_${formatHMS(vodState.start)}-${formatHMS(vodState.end)}.ts`;
    document.body.appendChild(a); 
    a.click(); 
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    label.textContent = t('seg_done'); 
    fill.style.width = '100%';
  }catch(e){
    label.textContent = t('seg_fail') + e.message + t('seg_fail2');
  }finally{ 
    btn1.disabled = false; 
    btn2.disabled = false; 
  }
}

function downloadRangeAsPlaylist(){
  if(!vodState || !vodState.segments) return;
  const segs = segmentsInRange(vodState.start, vodState.end);
  if(!segs.length){ alert(t('no_seg')); return; }
  const targetDuration = Math.ceil(Math.max(...segs.map(s => s.duration)));
  let m3u8 = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${targetDuration}\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXT-X-MEDIA-SEQUENCE:0\n`;
  for(const s of segs) m3u8 += `#EXTINF:${s.duration.toFixed(3)},\n${s.url}\n`;
  m3u8 += `#EXT-X-ENDLIST\n`;
  const blob = new Blob([m3u8], {type: 'application/vnd.apple.mpegurl'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (vodState.title || ('vod_' + vodState.id)).replace(/[\\/:*?"<>|]/g, '_').slice(0, 80);
  a.href = url; 
  a.download = `${safeName}_${formatHMS(vodState.start)}-${formatHMS(vodState.end)}.m3u8`;
  document.body.appendChild(a); 
  a.click(); 
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}