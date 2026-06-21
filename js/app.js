// ===== THEME =====
function applyTheme(theme){
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  document.documentElement.classList.toggle('light', !isDark);
  ['themeDark','themeLight','themeAuto'].forEach(id => 
    document.getElementById(id).classList.remove('selected')
  );
  document.getElementById(
    theme === 'dark' ? 'themeDark' : 
    theme === 'light' ? 'themeLight' : 'themeAuto'
  ).classList.add('selected');
}

function setTheme(theme){
  localStorage.setItem('twvod_theme', theme);
  applyTheme(theme);
}

// ===== PROXY =====
function selectProxy(mode){
  ['proxyDefaultOpt','proxyCustomOpt','proxyOffOpt'].forEach(id => 
    document.getElementById(id).classList.remove('selected')
  );
  if(mode === 'default'){
    document.getElementById('proxyDefaultOpt').classList.add('selected');
    document.getElementById('proxyInputWrap').classList.remove('show');
    PROXY_BASE = DEFAULT_PROXY;
    localStorage.setItem('twvod_proxy_mode', 'default');
    localStorage.removeItem('twvod_proxy');
  } else if(mode === 'custom'){
    document.getElementById('proxyCustomOpt').classList.add('selected');
    document.getElementById('proxyInputWrap').classList.add('show');
    const saved = localStorage.getItem('twvod_proxy') || '';
    document.getElementById('proxyCustomInput').value = saved;
    PROXY_BASE = saved || DEFAULT_PROXY;
    localStorage.setItem('twvod_proxy_mode', 'custom');
  } else {
    document.getElementById('proxyOffOpt').classList.add('selected');
    document.getElementById('proxyInputWrap').classList.remove('show');
    PROXY_BASE = '';
    localStorage.setItem('twvod_proxy_mode', 'off');
    localStorage.removeItem('twvod_proxy');
  }
}

function saveCustomProxy(){
  const val = document.getElementById('proxyCustomInput').value.trim();
  PROXY_BASE = val || DEFAULT_PROXY;
  localStorage.setItem('twvod_proxy', val);
  const btn = document.querySelector('.proxy-save-btn');
  btn.textContent = '✓';
  setTimeout(() => btn.textContent = t('save'), 1200);
}

function initProxy(){
  const mode = localStorage.getItem('twvod_proxy_mode') || 'default';
  if(mode === 'custom'){
    const saved = localStorage.getItem('twvod_proxy') || '';
    PROXY_BASE = saved || DEFAULT_PROXY;
    selectProxy('custom');
  } else if(mode === 'off'){
    PROXY_BASE = '';
    selectProxy('off');
  } else {
    PROXY_BASE = DEFAULT_PROXY;
    selectProxy('default');
  }
}

// ===== SETTINGS PANEL =====
function openSettings(){
  document.getElementById('settingsPanel').classList.add('open');
  document.getElementById('settingsOverlay').classList.add('open');
}

function closeSettings(){
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('settingsOverlay').classList.remove('open');
}

// ===== SERVICE SWITCH =====
let currentService = localStorage.getItem('hb_service') || 'twitch';

function switchService(svc){
  currentService = svc;
  localStorage.setItem('hb_service', svc);
  document.getElementById('svcTwitch').classList.toggle('active', svc === 'twitch');
  document.getElementById('svcSoundcloud').classList.toggle('active', svc === 'soundcloud');
  document.getElementById('svcYoutube').classList.toggle('active', svc === 'youtube');
  updateServiceUI();
  hideResult();
  urlInput.value = '';
  urlInput.focus();
}

function updateServiceUI(){
  const wrap = document.getElementById('inputWrap');
  const accent = document.getElementById('taglineAccent');
  const examples = document.getElementById('examples');

  if(currentService === 'soundcloud'){
    urlInput.placeholder = t('input_placeholder_sc');
    wrap.classList.add('sc-mode');
    goBtn.classList.add('sc-mode');
    wrap.classList.remove('yt-mode');
    goBtn.classList.remove('yt-mode');
    accent.textContent = t('tagline_sc');
    accent.style.color = 'var(--sc-orange)';
    examples.innerHTML = `
      <span class="example-chip"><b data-i18n="tracks">${t('tracks')}</b> — soundcloud.com/artist/track</span>
      <span class="example-chip"><b data-i18n="playlists">${t('playlists')}</b> — soundcloud.com/artist/sets/name</span>
      <span class="example-chip"><b data-i18n="shorts">${t('shorts')}</b> — on.soundcloud.com/xxxxx</span>
    `;
  } else if(currentService === 'youtube'){
    urlInput.placeholder = 'https://www.youtube.com/watch?v=...';
    wrap.classList.remove('sc-mode');
    goBtn.classList.remove('sc-mode');
    wrap.classList.add('yt-mode');
    goBtn.classList.add('yt-mode');
    accent.textContent = 'youtube';
    accent.style.color = '#ff0000';
    examples.innerHTML = `
      <span class="example-chip"><b>video</b> — youtube.com/watch?v=...</span>
      <span class="example-chip"><b>shorts</b> — youtube.com/shorts/...</span>
      <span class="example-chip"><b>short link</b> — youtu.be/...</span>
    `;
  } else {
    urlInput.placeholder = t('input_placeholder');
    wrap.classList.remove('sc-mode');
    goBtn.classList.remove('sc-mode');
    wrap.classList.remove('yt-mode');
    goBtn.classList.remove('yt-mode');
    accent.textContent = t('tagline_twitch');
    accent.style.color = '';
    examples.innerHTML = `
      <span class="example-chip"><b data-i18n="clips">${t('clips')}</b> — twitch.tv/&lt;канал&gt;/clip/...</span>
      <span class="example-chip"><b>vod</b> — twitch.tv/videos/&lt;id&gt;</span>
    `;
  }
}

// ===== URL PARSING =====
function parseUrl(raw){
  raw = raw.trim();
  let m = raw.match(/twitch\.tv\/videos\/(\d+)/);
  if(m) return { service: 'twitch', type: 'vod', id: m[1] };
  m = raw.match(/twitch\.tv\/[^\/]+\/clip\/([A-Za-z0-9_-]+)/);
  if(m) return { service: 'twitch', type: 'clip', slug: m[1] };
  m = raw.match(/clips\.twitch\.tv\/([A-Za-z0-9_-]+)/);
  if(m) return { service: 'twitch', type: 'clip', slug: m[1] };
  m = raw.match(/soundcloud\.com\/[^\s]+/i);
  if(m) return { service: 'soundcloud', type: 'track', url: 'https://' + m[0] };
  m = raw.match(/on\.soundcloud\.com\/[A-Za-z0-9]+/i);
  if(m) return { service: 'soundcloud', type: 'track', url: 'https://' + m[0] };
  m = raw.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if(m) return { service: 'youtube', type: 'video', id: m[1] };
  m = raw.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if(m) return { service: 'youtube', type: 'video', id: m[1] };
  return null;
}

async function handleGo(){
  const raw = urlInput.value;
  const parsed = parseUrl(raw);
  if(!parsed){
    if(/soundcloud/i.test(raw)) showStatus(t('err_url_sc'), true);
    else showStatus(t('err_url_twitch'), true);
    return;
  }
  setLoading(true); 
  hideResult();
  showStatus(parsed.service === 'soundcloud' ? t('loading_sc') : t('loading'));
  try{
    if(parsed.service === 'soundcloud') await resolveSoundcloud(parsed.url);
    else if(parsed.service === 'youtube') await resolveYoutube(parsed.id);
    else if(parsed.type === 'clip') await resolveClip(parsed.slug);
    else await resolveVod(parsed.id);
  }catch(err){
    const suffix = parsed.service === 'soundcloud' ? t('err_generic2_sc') : t('err_generic2');
    showStatus(t('err_generic') + err.message + suffix, true);
  }finally{ 
    setLoading(false); 
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем DOM элементы
  urlInput = document.getElementById('urlInput');
  goBtn = document.getElementById('goBtn');
  result = document.getElementById('result');
  clearBtn = document.getElementById('clearBtn');
  pasteBtn = document.getElementById('pasteBtn');

  // Применяем сохранённые настройки
  const savedTheme = localStorage.getItem('twvod_theme') || 'auto';
  applyTheme(savedTheme);
  applyI18n();
  initProxy();

  // Активируем сохранённый сервис
  document.getElementById('svcTwitch').classList.toggle('active', currentService === 'twitch');
  document.getElementById('svcSoundcloud').classList.toggle('active', currentService === 'soundcloud');
  updateServiceUI();

  // Слушатели событий
  clearBtn.onclick = () => { urlInput.value = ''; urlInput.focus(); hideResult(); };
  pasteBtn.onclick = async () => {
    try { 
      const txt = await navigator.clipboard.readText(); 
      urlInput.value = txt; 
    } catch(e) {}
  };
  urlInput.addEventListener('keydown', e => { if(e.key === 'Enter') handleGo(); });
  goBtn.onclick = handleGo;

  document.getElementById('settingsNavItem').addEventListener('click', openSettings);
  document.getElementById('settingsClose').addEventListener('click', closeSettings);
  document.getElementById('settingsOverlay').addEventListener('click', closeSettings);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if(localStorage.getItem('twvod_theme') === 'auto') applyTheme('auto');
  });

  window.addEventListener('resize', () => { 
    if(vodState && vodState.segments) {
      if(vodState.isSc) positionScThumbs();
      else positionThumbs();
    }
  });
});
