// ===== I18N =====
const TRANSLATIONS = {
  ru: {
    settings:'настройки', proxy_title:'прокси', proxy_default:'по умолчанию',
    proxy_custom:'свой прокси', proxy_custom_sub:'вставь адрес воркера', proxyused:'дефолтный прокси',
    proxy_off:'выключен', proxy_off_sub:'ползунок и скачивание одним файлом не будут работать',
    save:'сохранить', theme_title:'тема', theme_dark:'тёмная', theme_light:'светлая', theme_auto:'система',
    lang_title:'язык / language', nav_download:'скачать', nav_settings:'настройки',
    nav_donate:'донаты', nav_news:'новости', nav_info:'инфо',
    topbar_text:'happybotloader · twitch + soundcloud + youtube',
    tagline:'самый пиздатый сайт для скачивания',
    tagline_twitch:'vod/clip',
    tagline_sc:'треков',
    tagline_yt:'видео',
    input_placeholder:'https://www.twitch.tv/videos/... или /clip/...',
    input_placeholder_sc:'https://soundcloud.com/artist/track',
    input_placeholder_yt:'https://youtube.com/watch?v=...',
    auto:'авто', paste:'вставить', clips:'клипы',
    footer:'продолжая, ты идёшь нахуй ))',
    loading:'тяну данные...',
    loading_sc:'тяну данные с soundcloud...',
    loading_yt:'тяну данные с youtube...',
    err_url_twitch:'Не понимаю эту ссылку. Нужна ссылка на клип или VOD twitch.tv',
    err_url_sc:'Не понимаю эту ссылку. Нужна ссылка на трек/плейлист soundcloud.com',
    err_url_yt:'Не понимаю эту ссылку. Нужна ссылка на видео youtube.com',
    err_generic:'Не получилось: ',
    err_generic2:'. Возможно видео приватное, удалено, или Twitch поменял API.',
    err_generic2_sc:'. Возможно трек приватный, удалён, или SoundCloud поменял API.',
    err_generic2_yt:'. Возможно видео приватное, удалено, или YouTube поменял API.',
    proxy_saved:'прокси сохранён. попробуй отправить ссылку снова.',
    dl:'скачать', dl_mp3:'скачать MP3',
    clip_label:'клип', track_label:'трек', playlist_label:'плейлист', video_label:'видео',
    no_qualities:'не нашлось доступных вариантов качества',
    dl_one:'скачать одним файлом', dl_playlist:'обрезанный .m3u8',
    seg_loading:'загружаю список сегментов...', seg_done:'готово',
    seg_fail:'не получилось загрузить плейлист: ', seg_fail2:'. Попробуй уменьшить диапазон.',
    splicing:'склеиваю файл...', no_seg:'в выбранном диапазоне нет сегментов',
    dl_progress:'качаю сегменты: ',
    open_master:'открыть мастер-плейлист', master_hint:'все качества внутри, без ползунка',
    cors_err:'не получилось получить список качеств для ползунка: ',
    cors_hint:'Похоже на CORS-блокировку. Без CORS-прокси ползунок не построить.',
    setup_proxy:'настроить CORS-прокси', retry:'попробовать снова',
    sc_need_proxy:'для SoundCloud нужен прокси-воркер. Настрой его в настройках.',
    sc_no_transcoding:'не нашлось MP3-транскодинга для этого трека',
    sc_track_count:'треков', tracks:'трек', playlists:'плейлист', shorts:'короткая',
    load_cookies:'загрузить cookies'
  },
  en: {
    settings:'settings', proxy_title:'proxy', proxy_default:'default',
    proxy_custom:'custom proxy', proxy_custom_sub:'paste your worker url', proxyused:'default proxy',
    proxy_off:'disabled', proxy_off_sub:'trim slider and single-file download won\'t work',
    save:'save', theme_title:'theme', theme_dark:'dark', theme_light:'light', theme_auto:'system',
    lang_title:'язык / language', nav_download:'download', nav_settings:'settings',
    nav_donate:'donate', nav_news:'news', nav_info:'info',
    topbar_text:'happybotloader · twitch + soundcloud + youtube',
    tagline:'the best site for downloading',
    tagline_twitch:'vod/clip',
    tagline_sc:'tracks',
    tagline_yt:'video',
    input_placeholder:'https://www.twitch.tv/videos/... or /clip/...',
    input_placeholder_sc:'https://soundcloud.com/artist/track',
    input_placeholder_yt:'https://youtube.com/watch?v=...',
    auto:'auto', paste:'paste', clips:'clips',
    footer:'by continuing you go fuck yourself ))',
    loading:'fetching data...',
    loading_sc:'fetching data from soundcloud...',
    loading_yt:'fetching data from youtube...',
    err_url_twitch:'Can\'t parse this URL. Need a Twitch clip or VOD link.',
    err_url_sc:'Can\'t parse this URL. Need a SoundCloud track or playlist link.',
    err_url_yt:'Can\'t parse this URL. Need a YouTube video link.',
    err_generic:'Failed: ',
    err_generic2:'. Video might be private, deleted, or Twitch changed their API.',
    err_generic2_sc:'. Track might be private, deleted, or SoundCloud changed their API.',
    err_generic2_yt:'. Video might be private, deleted, or YouTube changed their API.',
    proxy_saved:'proxy saved. try submitting the link again.',
    dl:'download', dl_mp3:'download MP3',
    clip_label:'clip', track_label:'track', playlist_label:'playlist', video_label:'video',
    no_qualities:'no quality options found',
    dl_one:'download as one file', dl_playlist:'trimmed .m3u8',
    seg_loading:'loading segment list...', seg_done:'done',
    seg_fail:'couldn\'t load playlist: ', seg_fail2:'. Try a smaller range.',
    splicing:'merging file...', no_seg:'no segments in selected range',
    dl_progress:'downloading segments: ',
    open_master:'open master playlist', master_hint:'all qualities inside, no slider',
    cors_err:'failed to get quality list for slider: ',
    cors_hint:'Looks like a CORS block. A CORS proxy is needed.',
    setup_proxy:'configure CORS proxy', retry:'try again',
    sc_need_proxy:'SoundCloud requires a proxy worker. Configure it in settings.',
    sc_no_transcoding:'no MP3 transcoding found for this track',
    sc_track_count:'tracks', tracks:'track', playlists:'playlist', shorts:'short',
    load_cookies:'load cookies'
  }
};

let currentLang = localStorage.getItem('twvod_lang') || 'ru';
function t(key){ return (TRANSLATIONS[currentLang] || TRANSLATIONS.ru)[key] || key; }

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.getElementById('langRu').classList.toggle('selected', currentLang==='ru');
  document.getElementById('langEn').classList.toggle('selected', currentLang==='en');
}

function setLang(lang){
  currentLang = lang;
  localStorage.setItem('twvod_lang', lang);
  applyI18n();
}

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
// DEFAULT_PROXY, PROXY_BASE объявлены в utils.js

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
  const loadCookiesBtn = document.getElementById('loadCookiesBtn');

  if(currentService === 'soundcloud'){
    urlInput.placeholder = t('input_placeholder_sc');
    wrap.classList.add('sc-mode');
    wrap.classList.remove('yt-mode');
    goBtn.classList.add('sc-mode');
    goBtn.classList.remove('yt-mode');
    accent.textContent = t('tagline_sc');
    accent.style.color = 'var(--sc-orange)';
    if (loadCookiesBtn) loadCookiesBtn.style.display = 'none';
    examples.innerHTML = `
      <span class="example-chip"><b data-i18n="tracks">${t('tracks')}</b> — soundcloud.com/artist/track</span>
      <span class="example-chip"><b data-i18n="playlists">${t('playlists')}</b> — soundcloud.com/artist/sets/name</span>
      <span class="example-chip"><b data-i18n="shorts">${t('shorts')}</b> — on.soundcloud.com/xxxxx</span>
    `;
  } else if(currentService === 'youtube'){
    urlInput.placeholder = t('input_placeholder_yt');
    wrap.classList.remove('sc-mode');
    wrap.classList.add('yt-mode');
    goBtn.classList.remove('sc-mode');
    goBtn.classList.add('yt-mode');
    accent.textContent = t('tagline_yt');
    accent.style.color = '#ff0000';
    if (loadCookiesBtn) loadCookiesBtn.style.display = 'flex';
    examples.innerHTML = `
      <span class="example-chip"><b>video</b> — youtube.com/watch?v=...</span>
      <span class="example-chip"><b>shorts</b> — youtube.com/shorts/...</span>
      <span class="example-chip"><b>short link</b> — youtu.be/...</span>
      <span class="example-chip"><b>live</b> — youtube.com/live/...</span>
    `;
  } else {
    urlInput.placeholder = t('input_placeholder');
    wrap.classList.remove('sc-mode');
    wrap.classList.remove('yt-mode');
    goBtn.classList.remove('sc-mode');
    goBtn.classList.remove('yt-mode');
    accent.textContent = t('tagline_twitch');
    accent.style.color = '';
    if (loadCookiesBtn) loadCookiesBtn.style.display = 'none';
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
  m = raw.match(/youtube\.com\/live\/([A-Za-z0-9_-]+)/);
  if(m) return { service: 'youtube', type: 'video', id: m[1] };
  return null;
}

async function handleGo(){
  const raw = urlInput.value;
  
  // YouTube проверка
  if(isYoutubeUrl(raw)){
    setLoading(true);
    hideResult();
    showStatus(t('loading_yt'));
    try {
      await resolveYoutube(raw);
    } catch(err) {
      showStatus(t('err_generic') + err.message + t('err_generic2_yt'), true);
    } finally {
      setLoading(false);
    }
    return;
  }
  
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
// urlInput, goBtn, result, clearBtn, pasteBtn объявлены в utils.js

document.addEventListener('DOMContentLoaded', () => {
  urlInput = document.getElementById('urlInput');
  goBtn = document.getElementById('goBtn');
  result = document.getElementById('result');
  clearBtn = document.getElementById('clearBtn');
  pasteBtn = document.getElementById('pasteBtn');

  const savedTheme = localStorage.getItem('twvod_theme') || 'auto';
  applyTheme(savedTheme);
  applyI18n();
  initProxy();

  document.getElementById('svcTwitch').classList.toggle('active', currentService === 'twitch');
  document.getElementById('svcSoundcloud').classList.toggle('active', currentService === 'soundcloud');
  document.getElementById('svcYoutube').classList.toggle('active', currentService === 'youtube');
  updateServiceUI();

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
  
  // Проверяем cookies при загрузке
  if (currentService === 'youtube') {
    checkCookiesStatus().then(hasCookies => {
      const btn = document.getElementById('loadCookiesBtn');
      if (btn) {
        btn.style.display = hasCookies ? 'none' : 'flex';
      }
    });
  }
});
