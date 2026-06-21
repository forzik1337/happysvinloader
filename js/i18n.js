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

function t(key){
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.ru)[key] || key;
}

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
  if(typeof updateServiceUI === 'function') updateServiceUI();
}

function setLang(lang){
  currentLang = lang;
  localStorage.setItem('twvod_lang', lang);
  applyI18n();
}
