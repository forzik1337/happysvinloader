// youtube.js — фронтенд-обвязка для скачивания YouTube-видео
// Работает в связке с твоим собственным backend-сервером (server.py),
// который запускает yt-dlp. GitHub Pages сам этот сервер не запустит —
// его нужно задеплоить отдельно (Render/Railway/PythonAnywhere) и вписать
// адрес ниже в BACKEND_URL.

// ===== YOUTUBE LOGIC =====
const BACKEND_URL = "https://happysvinyoutube.bounceme.net";

function isYoutubeUrl(raw) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/)/i.test(raw);
}

async function ytFetchInfo(url) {
  const res = await fetch(`${BACKEND_URL}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "не удалось получить данные о видео");
  return data;
}

async function ytDownload(url, formatId, audioOnly, onStatus) {
  onStatus && onStatus("скачиваю на сервере, это может занять время...");
  const res = await fetch(`${BACKEND_URL}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format_id: formatId, audio_only: audioOnly }),
  });
  if (!res.ok) {
    let msg = "ошибка скачивания";
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch (e) {}
    throw new Error(msg);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : (audioOnly ? "audio.mp3" : "video.mp4");
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

// ===== НОВАЯ ФУНКЦИЯ resolveYoutube =====
async function resolveYoutube(url) {
  const info = await ytFetchInfo(url);
  
  // Сохраняем информацию в глобальной переменной
  window._ytCurrentVideo = { url, info };
  
  // Отрисовываем результат
  renderYoutubeResult(info, url);
}

function renderYoutubeResult(info, url) {
  const title = info.title || 'без названия';
  const author = info.author || '';
  const duration = info.duration || 0;
  const thumb = info.thumbnail || '';
  const formats = info.formats || [];
  const isLive = info.is_live || false;
  
  // Форматируем длительность
  let durationText = '';
  if (isLive) {
    durationText = '🔴 LIVE';
  } else if (duration > 0) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    if (hours > 0) {
      durationText = `${hours} ч ${minutes} мин`;
    } else {
      durationText = `${minutes} мин`;
    }
  }
  
  let html = `<div class="preview-card">
    <img class="preview-thumb rect" src="${thumb}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(author)}${durationText ? ' · ' + durationText : ''}</div>
    </div>
  </div>
  <div class="quality-list">`;
  
  // Добавляем кнопку MP3
  html += `<div class="quality-row">
    <div><div class="label">🎵 Аудио (MP3)</div></div>
    <button class="dl-btn" onclick="downloadYoutubeFormat('mp3')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      скачать
    </button>
  </div>`;
  
  // Добавляем кнопки для каждого формата
  if (formats.length === 0) {
    html += `<div class="status-msg error">Нет доступных форматов. ${isLive ? 'Прямой эфир может быть недоступен для скачивания.' : 'Попробуй загрузить cookies.'}</div>`;
  } else {
    for (const fmt of formats) {
      html += `<div class="quality-row">
        <div><div class="label">${fmt.label} MP4</div></div>
        <button class="dl-btn" onclick="downloadYoutubeFormat('${fmt.format_id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
          скачать
        </button>
      </div>`;
    }
  }
  
  html += `</div>`;
  
  result.innerHTML = html;
  result.classList.add('show');
}

function downloadYoutubeFormat(formatId) {
  if (!window._ytCurrentVideo) return;
  
  const { url, info } = window._ytCurrentVideo;
  const isAudio = formatId === 'mp3';
  
  ytDownload(url, isAudio ? null : formatId, isAudio, (status) => {
    console.log(status);
  }).catch(err => {
    alert('Ошибка скачивания: ' + err.message);
  });
}

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "video.mp4";

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

async function ytDownload(url, formatId, audioOnly, onStatus) {
  onStatus && onStatus("скачиваю на сервере, это может занять время...");
  
  const res = await fetch(`${BACKEND_URL}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format_id: formatId, audio_only: audioOnly }),
  });
  
  // Проверяем что получили файл, а не HTML ошибку
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    const text = await res.text();
    console.error("Сервер вернул HTML:", text.substring(0, 200));
    throw new Error("Сервер недоступен. Проверь Flask и Caddy.");
  }
  
  if (!res.ok) {
    let msg = "ошибка скачивания";
    try {
      const data = await res.json();
      msg = data.error || msg;
    } catch (e) {
      const text = await res.text();
      console.error("Ответ сервера:", text.substring(0, 200));
    }
    throw new Error(msg);
  }
  
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "video.mp4";
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

async function ytFetchInfo(url) {
  // Проверяем есть ли сохранённые cookies
  const savedCookies = localStorage.getItem('yt_cookies');
  
  const res = await fetch(`${BACKEND_URL}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      url,
      cookies: savedCookies || null
    }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "не удалось получить данные о видео");
  return data;
}

// Проверяем статус cookies при загрузке страницы
async function checkCookiesStatus() {
  const res = await fetch(`${BACKEND_URL}/api/cookies-status`);
  const data = await res.json();
  const loadCookiesBtn = document.getElementById('loadCookiesBtn');
  
  if (loadCookiesBtn) {
    if (data.has_cookies) {
      loadCookiesBtn.style.display = 'none'; // Скрываем кнопку если cookies уже есть
    } else {
      loadCookiesBtn.style.display = 'flex';
    }
  }
}

// Загружаем cookies
async function uploadCookies(cookiesText) {
  const res = await fetch(`${BACKEND_URL}/api/upload-cookies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cookies: cookiesText }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  
  // Скрываем кнопку после успешной загрузки
  const loadCookiesBtn = document.getElementById('loadCookiesBtn');
  if (loadCookiesBtn) {
    loadCookiesBtn.style.display = 'none';
  }
}

// Вызываем проверку при загрузке
checkCookiesStatus();

function formatDuration(seconds) {
  if (!seconds) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  } else {
    return `${minutes} мин`;
  }
}

// Используй эту функцию при отображении длительности
async function ytFetchInfo(url) {
  // ... существующий код ...
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "не удалось получить данные о видео");
  
  // Добавляем отформатированную длительность
  data.durationFormatted = formatDuration(data.duration);
  return data;
}

// ===== ДОБАВЬ ЭТИ ФУНКЦИИ В КОНЕЦ youtube.js =====

async function resolveYoutube(url) {
  const info = await ytFetchInfo(url);
  window._ytCurrentVideo = { url, info };
  renderYoutubeResult(info);
}

function renderYoutubeResult(info) {
  const title = info.title || 'без названия';
  const author = info.author || '';
  const duration = info.duration || 0;
  const thumb = info.thumbnail || '';
  const formats = info.formats || [];
  
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const durationText = hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`;
  
  let html = `<div class="preview-card">
    <img class="preview-thumb rect" src="${thumb}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(author)} · ${durationText}</div>
    </div>
  </div>
  <div class="quality-list">`;
  
  if (formats.length === 0) {
    html += `<div class="status-msg error">Нет доступных форматов</div>`;
  } else {
    for (const fmt of formats) {
      html += `<div class="quality-row">
        <div><div class="label">${fmt.label}</div></div>
        <button class="dl-btn" onclick="downloadYoutubeFormat('${fmt.format_id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
          скачать
        </button>
      </div>`;
    }
  }
  
  html += `</div>`;
  
  result.innerHTML = html;
  result.classList.add('show');
}

function downloadYoutubeFormat(formatId) {
  if (!window._ytCurrentVideo) return;
  const { url } = window._ytCurrentVideo;
  ytDownload(url, formatId, false, (status) => {
    console.log(status);
  }).catch(err => {
    alert('Ошибка: ' + err.message);
  });
}

// Пример встраивания в общий обработчик ссылки (handleGo) в твоём app.js:
//
// if (isYoutubeUrl(raw)) {
//   const info = await ytFetchInfo(raw);
//   // отрисовать превью + список форматов из info.formats,
//   // на клик по кнопке скачивания вызвать:
//   // ytDownload(raw, formatId, false, statusCallback)
// }
