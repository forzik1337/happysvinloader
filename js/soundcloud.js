// ===== SOUNDCLOUD LOGIC =====
let scClientIdCache = localStorage.getItem('hb_sc_client_id') || null;

async function fetchSoundcloudClientId(){
  if(scClientIdCache) return scClientIdCache;
  if(!PROXY_BASE) throw new Error(t('sc_need_proxy'));
  
  try{
    const res = await proxiedFetch('https://soundcloud.com/');
    const html = await res.text();
    const scriptMatches = html.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[^"'\s]+\.js/g) || [];
    console.log(`Found ${scriptMatches.length} SoundCloud JS files`);
    
    for(const jsUrl of scriptMatches){
      try{
        const jsRes = await proxiedFetch(jsUrl);
        const js = await jsRes.text();
        const patterns = [
          /client_id\s*[:=]\s*["']([a-zA-Z0-9]{32})["']/,
          /clientId\s*[:=]\s*["']([a-zA-Z0-9]{32})["']/,
          /["']client_id["']\s*:\s*["']([a-zA-Z0-9]{32})["']/,
          /CLIENT_ID\s*[:=]\s*["']([a-zA-Z0-9]{32})["']/
        ];
        for(const pattern of patterns){
          const m = js.match(pattern);
          if(m){
            scClientIdCache = m[1];
            localStorage.setItem('hb_sc_client_id', scClientIdCache);
            console.log(`Using client_id: ${scClientIdCache}`);
            return scClientIdCache;
          }
        }
      }catch(e){ 
        console.warn(`Failed to load JS ${jsUrl}:`, e); 
      }
    }
  }catch(e){ 
    console.error('Failed to fetch soundcloud.com:', e); 
  }
  
  throw new Error('не удалось получить актуальный client_id SoundCloud');
}

function getAvailableFormats(track){
  const transcodings = track.media?.transcodings || [];
  const formats = [];
  const seen = new Set();
  
  for(const tr of transcodings){
    const protocol = tr.format?.protocol || 'unknown';
    const mimeType = tr.format?.mime_type || '';
    const preset = tr.preset || '';
    
    let formatKey = '';
    let formatName = '';
    let bitrate = '';
    let quality = 'standard';
    let icon = 'mp3';
    let badge = null;
    
    if(/mpeg|mp3/i.test(mimeType)){
      if(preset.includes('_0_') || preset === 'mp3_0_1'){
        formatKey = 'mp3_128';
        formatName = 'MP3';
        bitrate = '128 kbps';
      } else if(preset.includes('hq') || /high/i.test(preset)){
        formatKey = 'mp3_hq';
        formatName = 'MP3 HQ';
        bitrate = '256 kbps';
        quality = 'high';
        badge = 'HQ';
      } else {
        formatKey = 'mp3_' + preset;
        formatName = 'MP3';
        bitrate = preset;
      }
    } else if(/ogg|opus/i.test(mimeType)){
      formatKey = 'ogg_' + preset;
      formatName = 'OGG Vorbis';
      bitrate = preset || '128 kbps';
      icon = 'ogg';
    } else if(/aac|mp4|m4a/i.test(mimeType)){
      formatKey = 'aac_' + preset;
      formatName = 'AAC';
      bitrate = preset || '128 kbps';
      icon = 'aac';
    } else if(/flac/i.test(mimeType) || /flac/i.test(preset)){
      formatKey = 'flac';
      formatName = 'FLAC';
      bitrate = 'Lossless';
      quality = 'lossless';
      icon = 'flac';
      badge = 'HQ';
    } else if(/wav/i.test(mimeType)){
      formatKey = 'wav';
      formatName = 'WAV';
      bitrate = 'Lossless';
      quality = 'lossless';
      icon = 'wav';
      badge = 'HQ';
    } else {
      formatKey = 'other_' + preset;
      formatName = preset || 'Unknown';
      bitrate = mimeType;
      icon = 'other';
    }
    
    formatKey += '_' + protocol;
    
    if(!seen.has(formatKey)){
      seen.add(formatKey);
      formats.push({
        key: formatKey,
        name: formatName,
        bitrate: bitrate,
        quality: quality,
        icon: icon,
        badge: badge,
        protocol: protocol,
        mimeType: mimeType,
        preset: preset,
        transcoding: tr
      });
    }
  }
  
  formats.sort((a, b) => {
    const qualityOrder = { 'lossless': 0, 'high': 1, 'standard': 2 };
    const qa = qualityOrder[a.quality] ?? 3;
    const qb = qualityOrder[b.quality] ?? 3;
    if(qa !== qb) return qa - qb;
    return a.name.localeCompare(b.name);
  });
  
  return formats;
}

async function getStreamUrlForFormat(track, format, clientId){
  const transcoding = format.transcoding;
  const protocol = format.protocol || 'progressive';
  
  if(protocol === 'progressive'){
    const separator = transcoding.url.includes('?') ? '&' : '?';
    const directUrl = `${transcoding.url}${separator}client_id=${clientId}`;
    return { 
      url: directUrl, 
      isHls: false,
      format: format
    };
  } else {
    const streamEndpoint = `${transcoding.url}?client_id=${clientId}`;
    const streamRes = await proxiedFetch(streamEndpoint);
    if(!streamRes.ok) throw new Error('stream endpoint: ' + streamRes.status);
    const streamData = await streamRes.json();
    return { 
      url: streamData.url, 
      isHls: true,
      format: format
    };
  }
}

async function resolveSoundcloud(rawUrl){
  if(!PROXY_BASE) throw new Error(t('sc_need_proxy'));
  
  let clientId = await fetchSoundcloudClientId();
  let resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(rawUrl)}&client_id=${clientId}`;
  let res = await proxiedFetch(resolveUrl);
  
  if(res.status === 401 || res.status === 404){
    console.warn('client_id invalid, resetting cache');
    scClientIdCache = null;
    localStorage.removeItem('hb_sc_client_id');
    clientId = await fetchSoundcloudClientId();
    resolveUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(rawUrl)}&client_id=${clientId}`;
    res = await proxiedFetch(resolveUrl);
  }
  
  if(!res.ok) throw new Error('SoundCloud API: ' + res.status);
  const data = await res.json();

  if(data.kind === 'track'){
    await renderSoundcloudTrack(data, clientId);
  } else if(data.kind === 'playlist' || data.kind === 'system-playlist'){
    renderSoundcloudPlaylist(data, clientId);
  } else if(data.collection && Array.isArray(data.collection)){
    renderSoundcloudCollection(data, clientId);
  } else {
    throw new Error('неизвестный тип: ' + (data.kind || 'unknown'));
  }
}

async function renderSoundcloudTrack(track, clientId){
  const title = track.title || 'без названия';
  const artist = track.user?.username || '';
  const artwork = (track.artwork_url || track.user?.avatar_url || '').replace('-large', '-t500x500');
  const durationSec = Math.floor((track.duration || 0) / 1000);
  const genre = track.genre || '';
  const permalink = track.permalink_url || '';

  const formats = getAvailableFormats(track);
  
  let html = `<div class="preview-card">
    <img class="preview-thumb" src="${artwork}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(artist)} · ${t('track_label')} · ${formatHMS(durationSec)}</div>
      ${genre ? `<div class="preview-meta" style="margin-top:4px">${escapeHtml(genre)}</div>` : ''}
      ${permalink ? `<div class="preview-meta" style="margin-top:4px"><a href="${permalink}" target="_blank" style="color:var(--sc-orange)">↗ soundcloud</a></div>` : ''}
    </div>
  </div>`;

  if(formats.length === 0){
    html += `<div class="status-msg error" style="margin-bottom:12px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>${t('sc_no_transcoding')}</span>
    </div>`;
    result.innerHTML = html; 
    result.classList.add('show');
    return;
  }

  html += `<div class="trim-box">
    <div class="format-selector">
      <div class="format-selector-title">Формат скачивания:</div>
      <div class="format-options" id="formatOptions">`;
  
  formats.forEach((fmt, idx) => {
    const isSelected = idx === 0;
    const iconSvg = getFormatIcon(fmt.icon);
    html += `
      <div class="format-option ${isSelected ? 'selected' : ''}" 
           data-format-idx="${idx}" 
           onclick="selectFormat(${idx})">
        ${iconSvg}
        <div>
          <div class="format-name">${fmt.name}</div>
          <div class="format-bitrate">${fmt.bitrate} · ${fmt.protocol}</div>
        </div>
        ${fmt.badge ? `<div class="format-badge">${fmt.badge}</div>` : ''}
      </div>`;
  });
  
  html += `</div></div>
    <div id="scSliderArea"><div class="slider-loading">${t('seg_loading')}</div></div>
    <div class="dl-actions">
      <button class="dl-btn sc" id="scDlOneBtn" onclick="downloadScTrackAsFile()" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span id="dlBtnText">${t('dl_one')}</span>
      </button>
    </div>
    <div class="progress-box" id="scProgressBox">
      <div class="progress-track"><div class="progress-fill sc" id="scProgressFill"></div></div>
      <div class="progress-label" id="scProgressLabel"></div>
    </div>
  </div>`;

  result.innerHTML = html; 
  result.classList.add('show');

  vodState = {
    id: track.id, 
    title: track.title, 
    isSc: true,
    formats: formats,
    selectedFormatIdx: 0,
    clientId: clientId,
    segments: null,
    total: 0,
    start: 0,
    end: 0
  };

  await loadFormatStream(0);
}

function getFormatIcon(type){
  const icons = {
    mp3: '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    ogg: '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8" stroke-linecap="round"/></svg>',
    aac: '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-9 4 18 3-9h4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    flac: '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    wav: '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h2l2-4 2 8 2-12 2 16 2-8 2 4 2-4h2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    other: '<svg class="format-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>'
  };
  return icons[type] || icons.other;
}

async function selectFormat(idx){
  if(!vodState || !vodState.isSc) return;
  
  document.querySelectorAll('.format-option').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
  
  vodState.selectedFormatIdx = idx;
  await loadFormatStream(idx);
}

async function loadFormatStream(formatIdx){
  const format = vodState.formats[formatIdx];
  const sliderArea = document.getElementById('scSliderArea');
  const dlBtn = document.getElementById('scDlOneBtn');
  const dlBtnText = document.getElementById('dlBtnText');
  
  if(!sliderArea) return;
  sliderArea.innerHTML = `<div class="slider-loading">${t('seg_loading')}</div>`;
  if(dlBtn) dlBtn.disabled = true;
  if(dlBtnText) dlBtnText.textContent = `${t('dl_one')} (${format.name})`;
  
  try{
    const streamInfo = await getStreamUrlForFormat(
      { media: { transcodings: [format.transcoding] } },
      format,
      vodState.clientId
    );
    
    if(streamInfo.isHls){
      const plRes = await proxiedFetch(streamInfo.url);
      const plText = await plRes.text();
      if(!plRes.ok) throw new Error('hls playlist: '+plRes.status);
      const parsed = parseMediaPlaylist(plText, streamInfo.url);
      
      vodState.segments = parsed.segments;
      vodState.total = parsed.total;
      vodState.start = 0;
      vodState.end = parsed.total;
      vodState.streamUrl = streamInfo.url;
      
      buildScSlider();
      if(dlBtn) dlBtn.disabled = false;
    } else {
      vodState.segments = null;
      vodState.streamUrl = streamInfo.url;
      vodState.total = 0;
      
      sliderArea.innerHTML = `<div class="slider-loading" style="color:var(--green)">✓ Прямая ссылка готова.</div>`;
      if(dlBtn) dlBtn.disabled = false;
    }
  }catch(e){
    console.warn('Format load warning:', e.message);
    // Не показываем красную ошибку — кнопка всё равно работает
    sliderArea.innerHTML = `<div class="slider-loading" style="color:var(--text-dim)">⚠ ${e.message} — похуй, скачивание доступно</div>`;
    if(dlBtn) dlBtn.disabled = false;
  }
}

function buildScSlider(){
  const area = document.getElementById('scSliderArea');
  if(!area) return;
  area.innerHTML = `<div class="slider-wrap" id="scSliderWrap">
    <div class="slider-track"></div>
    <div class="slider-range" id="scSliderRange" style="background:var(--sc-orange)"></div>
    <div class="slider-thumb start" id="scThumbStart" style="background:var(--sc-orange)"></div>
    <div class="slider-thumb end" id="scThumbEnd"></div>
    <div class="slider-tag start" id="scTagStart" style="border-color:var(--sc-orange)"><input id="scInputStart"></div>
    <div class="slider-tag end" id="scTagEnd"><input id="scInputEnd"></div>
  </div>`;
  document.getElementById('scInputStart').addEventListener('change', e => {
    const v = parseHMS(e.target.value); 
    if(v != null) setScRange(v, null); 
    else e.target.value = formatHMS(vodState.start);
  });
  document.getElementById('scInputEnd').addEventListener('change', e => {
    const v = parseHMS(e.target.value); 
    if(v != null) setScRange(null, v); 
    else e.target.value = formatHMS(vodState.end);
  });
  attachScDrag('scThumbStart', true); 
  attachScDrag('scThumbEnd', false); 
  positionScThumbs();
}

function setScRange(start, end){
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
  positionScThumbs();
}

function positionScThumbs(){
  const wrap = document.getElementById('scSliderWrap'); 
  if(!wrap) return;
  const total = vodState.total || 1;
  const thumbW = 24;
  const usable = Math.max(0, wrap.clientWidth - thumbW);
  const xStart = (vodState.start / total) * usable;
  const xEnd = (vodState.end / total) * usable;
  document.getElementById('scThumbStart').style.left = xStart + 'px';
  document.getElementById('scThumbEnd').style.left = xEnd + 'px';
  document.getElementById('scSliderRange').style.left = (xStart + thumbW / 2) + 'px';
  document.getElementById('scSliderRange').style.width = Math.max(0, xEnd - xStart) + 'px';
  const wrapWidth = wrap.clientWidth;
  const tagStart = document.getElementById('scTagStart');
  const tagEnd = document.getElementById('scTagEnd');
  tagStart.style.left = Math.min(Math.max(xStart + thumbW / 2, 38), wrapWidth - 38) + 'px';
  tagEnd.style.left = Math.min(Math.max(xEnd + thumbW / 2, 38), wrapWidth - 38) + 'px';
  const inputStart = document.getElementById('scInputStart');
  const inputEnd = document.getElementById('scInputEnd');
  if(document.activeElement !== inputStart) inputStart.value = formatHMS(vodState.start);
  if(document.activeElement !== inputEnd) inputEnd.value = formatHMS(vodState.end);
}

function attachScDrag(thumbId, isStart){
  const thumb = document.getElementById(thumbId);
  thumb.addEventListener('pointerdown', e => {
    e.preventDefault(); 
    thumb.setPointerCapture(e.pointerId);
    const wrap = document.getElementById('scSliderWrap');
    const thumbW = 24;
    function onMove(ev){ 
      const rect = wrap.getBoundingClientRect();
      const usable = Math.max(0, rect.width - thumbW); 
      let x = ev.clientX - rect.left - thumbW / 2; 
      x = Math.max(0, Math.min(x, usable)); 
      const t2 = (usable > 0 ? x / usable : 0) * vodState.total; 
      if(isStart) setScRange(t2, null); 
      else setScRange(null, t2); 
    }
    function onUp(){ 
      window.removeEventListener('pointermove', onMove); 
      window.removeEventListener('pointerup', onUp); 
    }
    window.addEventListener('pointermove', onMove); 
    window.addEventListener('pointerup', onUp);
  });
}

async function downloadScTrackAsFile(){
  if(!vodState || !vodState.isSc) return;
  
  const format = vodState.formats[vodState.selectedFormatIdx];
  const btn = document.getElementById('scDlOneBtn');
  const box = document.getElementById('scProgressBox');
  const fill = document.getElementById('scProgressFill');
  const label = document.getElementById('scProgressLabel');
  
  btn.disabled = true;
  box.classList.add('show');
  fill.style.width = '0%';
  
  const safeName = (vodState.title || ('sc_' + vodState.id)).replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
  const ext = getFormatExtension(format);
  
  try{
    if(vodState.segments && vodState.segments.length > 0){
      const segs = segmentsInRange(vodState.start, vodState.end);
      if(!segs.length){ 
        alert(t('no_seg')); 
        btn.disabled = false; 
        return; 
      }
      
      const chunks = new Array(segs.length);
      let done = 0, nextIdx = 0, failed = null;
      const concurrency = 5;
      
      async function worker(){
        while(nextIdx < segs.length && !failed){
          const idx = nextIdx++;
          try{
            const res = await proxiedFetch(segs[idx].url);
            if(!res.ok) throw new Error('http ' + res.status);
            chunks[idx] = await res.arrayBuffer();
          }catch(e){ 
            failed = e; 
            return; 
          }
          done++;
          const pct = Math.round(done / segs.length * 100);
          fill.style.width = pct + '%';
          label.textContent = t('dl_progress') + `${done}/${segs.length} (${pct}%)`;
        }
      }
      
      await Promise.all(Array.from({length: Math.min(concurrency, segs.length)}, worker));
      if(failed) throw failed;
      
      label.textContent = t('splicing');
      const mimeType = format.mimeType || 'audio/mpeg';
      const blob = new Blob(chunks, {type: mimeType});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      
      label.textContent = t('seg_done');
      fill.style.width = '100%';
    } else {
      label.textContent = 'Скачивание...';
      const dlUrl = PROXY_BASE + encodeURIComponent(vodState.streamUrl);
      
      try {
        const res = await fetch(dlUrl);
        if(!res.ok) throw new Error('download failed: ' + res.status);
        
        const contentLength = res.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        const reader = res.body.getReader();
        const chunks = [];
        let received = 0;
        
        while(true){
          const {done, value} = await reader.read();
          if(done) break;
          chunks.push(value);
          received += value.length;
          if(total > 0){
            const pct = Math.round(received / total * 100);
            fill.style.width = pct + '%';
            label.textContent = `Скачивание: ${formatBytes(received)} / ${formatBytes(total)} (${pct}%)`;
          } else {
            label.textContent = `Скачивание: ${formatBytes(received)}`;
            fill.style.width = '50%';
          }
        }
        
        const blob = new Blob(chunks, {type: format.mimeType || 'audio/mpeg'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeName}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        
        label.textContent = t('seg_done');
        fill.style.width = '100%';
      } catch(e) {
        window.open(dlUrl, '_blank');
        label.textContent = 'Открыто в новой вкладке';
        fill.style.width = '100%';
      }
    }
  }catch(e){
    label.textContent = t('seg_fail') + e.message;
  }finally{
    btn.disabled = false;
  }
}

function getFormatExtension(format){
  const mimeType = format.mimeType || '';
  const name = format.name || '';
  
  if(/flac/i.test(mimeType) || /flac/i.test(name)) return 'flac';
  if(/wav/i.test(mimeType) || /wav/i.test(name)) return 'wav';
  if(/ogg|opus/i.test(mimeType) || /ogg/i.test(name)) return 'ogg';
  if(/aac|mp4|m4a/i.test(mimeType) || /aac/i.test(name)) return 'm4a';
  return 'mp3';
}

function renderSoundcloudPlaylist(playlist, clientId){
  const title = playlist.title || 'плейлист';
  const artist = playlist.user?.username || '';
  const artwork = (playlist.artwork_url || '').replace('-large', '-t500x500');
  const tracks = playlist.tracks || [];

  let html = `<div class="preview-card">
    <img class="preview-thumb" src="${artwork}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(artist)} · ${t('playlist_label')} · ${tracks.length} ${t('sc_track_count')}</div>
    </div>
  </div>
  <div class="sc-playlist">`;

  for(let i = 0; i < tracks.length; i++){
    const tr = tracks[i];
    if(!tr.media || !tr.media.transcodings){
      html += `<div class="sc-track-row" data-sc-track-id="${tr.id}" data-sc-idx="${i}">
        <div class="sc-track-num">${i + 1}</div>
        <div class="sc-track-art" style="background:var(--border)"></div>
        <div class="sc-track-info">
          <div class="sc-track-title">${escapeHtml(tr.title || '...')}</div>
          <div class="sc-track-artist">${escapeHtml(tr.user?.username || '')} · загрузка...</div>
        </div>
      </div>`;
    } else {
      const dur = Math.floor((tr.duration || 0) / 1000);
      const art = (tr.artwork_url || tr.user?.avatar_url || '').replace('-large', '-t100x100');
      html += `<div class="sc-track-row" data-sc-track-id="${tr.id}" data-sc-idx="${i}">
        <div class="sc-track-num">${i + 1}</div>
        <img class="sc-track-art" src="${art}" onerror="this.style.background='var(--border)';this.src=''">
        <div class="sc-track-info">
          <div class="sc-track-title">${escapeHtml(tr.title || 'без названия')}</div>
          <div class="sc-track-artist">${escapeHtml(tr.user?.username || '')}</div>
        </div>
        <div class="sc-track-dur">${formatHMS(dur)}</div>
        <button class="dl-btn sc sc-track-dl-btn" onclick="downloadPlaylistTrack(${tr.id}, this)" data-sc-client-id="${clientId}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
          MP3
        </button>
      </div>`;
    }
  }
  html += `</div>`;
  result.innerHTML = html; 
  result.classList.add('show');

  tracks.forEach(async (tr, i) => {
    if(!tr.media || !tr.media.transcodings){
      try{
        const r = await proxiedFetch(`https://api-v2.soundcloud.com/tracks/${tr.id}?client_id=${clientId}`);
        if(!r.ok) return;
        const full = await r.json();
        tracks[i] = full;
        const row = document.querySelector(`[data-sc-track-id="${tr.id}"]`);
        if(!row) return;
        const dur = Math.floor((full.duration || 0) / 1000);
        const art = (full.artwork_url || full.user?.avatar_url || '').replace('-large', '-t100x100');
        row.innerHTML = `
          <div class="sc-track-num">${i + 1}</div>
          <img class="sc-track-art" src="${art}" onerror="this.style.background='var(--border)';this.src=''">
          <div class="sc-track-info">
            <div class="sc-track-title">${escapeHtml(full.title || 'без названия')}</div>
            <div class="sc-track-artist">${escapeHtml(full.user?.username || '')}</div>
          </div>
          <div class="sc-track-dur">${formatHMS(dur)}</div>
          <button class="dl-btn sc sc-track-dl-btn" onclick="downloadPlaylistTrack(${full.id}, this)" data-sc-client-id="${clientId}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
            MP3
          </button>`;
      }catch(e){}
    }
  });
}

function renderSoundcloudCollection(data, clientId){
  const tracks = data.collection || [];
  renderSoundcloudPlaylist({ 
    title: data.title || 'системный плейлист', 
    user: {}, 
    artwork_url: '', 
    tracks: tracks 
  }, clientId);
}

async function downloadPlaylistTrack(trackId, btn){
  const clientId = btn.getAttribute('data-sc-client-id');
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 0.8s linear infinite"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  try{
    const r = await proxiedFetch(`https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`);
    if(!r.ok) throw new Error('track ' + r.status);
    const track = await r.json();
    
    const formats = getAvailableFormats(track);
    if(formats.length === 0) throw new Error(t('sc_no_transcoding'));
    
    const format = formats[0];
    const streamInfo = await getStreamUrlForFormat(track, format, clientId);
    const safeName = (track.title + ' — ' + (track.user?.username || '')).replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
    const ext = getFormatExtension(format);
    
    if(streamInfo.isHls){
      const plRes = await proxiedFetch(streamInfo.url);
      const plText = await plRes.text();
      const parsed = parseMediaPlaylist(plText, streamInfo.url);
      const segs = parsed.segments;
      const chunks = new Array(segs.length);
      let done = 0, nextIdx = 0;
      async function worker(){
        while(nextIdx < segs.length){
          const idx = nextIdx++;
          const res = await proxiedFetch(segs[idx].url);
          if(!res.ok) throw new Error('seg ' + res.status);
          chunks[idx] = await res.arrayBuffer();
          done++;
          btn.innerHTML = `${Math.round(done / segs.length * 100)}%`;
        }
      }
      await Promise.all(Array.from({length: Math.min(5, segs.length)}, worker));
      const blob = new Blob(chunks, {type: format.mimeType || 'audio/mpeg'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; 
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } else {
      const dlUrl = PROXY_BASE + encodeURIComponent(streamInfo.url);
      const a = document.createElement('a');
      a.href = dlUrl; 
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
    }
    btn.innerHTML = `✓`;
    setTimeout(() => { 
      btn.innerHTML = origHtml; 
      btn.disabled = false; 
    }, 1500);
  }catch(e){
    btn.innerHTML = `!`;
    alert('Ошибка: ' + e.message);
    setTimeout(() => { 
      btn.innerHTML = origHtml; 
      btn.disabled = false; 
    }, 1500);
  }
}