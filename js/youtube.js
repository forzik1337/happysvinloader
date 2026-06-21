// ===== YOUTUBE FRONTEND =====
const BACKEND_URL = "https://happysvinyoutube.bounceme.net";

// Проверка URL YouTube
function isYoutubeUrl(raw) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/)/i.test(raw);
}

// Получение информации о видео
async function ytFetchInfo(url) {
  const savedCookies = localStorage.getItem('yt_cookies');
  
  const res = await fetch(`${BACKEND_URL}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      url,
      cookies: savedCookies || null
    }),
  });
  
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Сервер вернул не JSON");
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "не удалось получить данные");
  return data;
}

// Скачивание видео
async function ytDownload(url, formatId, audioOnly, onStatus) {
  const savedCookies = localStorage.getItem('yt_cookies');
  
  onStatus && onStatus("скачиваю на сервере...");
  
  const res = await fetch(`${BACKEND_URL}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      url, 
      format_id: formatId, 
      audio_only: audioOnly,
      cookies: savedCookies || null
    }),
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

// Загрузка cookies с сервера
async function checkCookiesStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cookies-status`);
    const data = await res.json();
    return data.has_cookies;
  } catch (e) {
    return false;
  }
}

// Загрузка cookies на сервер
async function uploadCookies(cookiesText) {
  const res = await fetch(`${BACKEND_URL}/api/upload-cookies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cookies: cookiesText }),
  });
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "ошибка загрузки cookies");
  return true;
}

// Загрузка cookies из файла
async function loadCookiesFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      await uploadCookies(text);
      localStorage.setItem('yt_cookies', text);
      alert('✓ Cookies загружены!');
      
      // Скрываем кнопку
      const btn = document.getElementById('loadCookiesBtn');
      if (btn) btn.style.display = 'none';
    } catch (err) {
      alert('Ошибка: ' + err.message);
    }
  };
  
  input.click();
}

// Форматирование длительности
function formatDuration(seconds) {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

// Основная функция разрешения YouTube URL
async function resolveYoutube(url) {
  const info = await ytFetchInfo(url);
  window._ytCurrentVideo = { url, info };
  renderYoutubeResult(info);
}

// Отрисовка результата
function renderYoutubeResult(info) {
  const title = info.title || 'без названия';
  const author = info.author || '';
  const duration = info.duration || 0;
  const thumb = info.thumbnail || '';
  const formats = info.formats || [];
  
  let html = `<div class="preview-card">
    <img class="preview-thumb rect" src="${thumb}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(author)} · ${formatDuration(duration)}</div>
    </div>
  </div>
  <div class="quality-list">`;
  
  // Кнопка MP3
  html += `<div class="quality-row">
    <div><div class="label">🎵 Аудио (MP3)</div></div>
    <button class="dl-btn" onclick="downloadYoutubeFormat('mp3')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      скачать
    </button>
  </div>`;
  
  // Кнопки для форматов
  if (formats.length === 0) {
    html += `<div class="status-msg error">Нет доступных форматов. Попробуй загрузить cookies.</div>`;
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

// Скачивание выбранного формата
function downloadYoutubeFormat(formatId) {
  if (!window._ytCurrentVideo) return;
  
  const { url } = window._ytCurrentVideo;
  const isAudio = formatId === 'mp3';
  
  ytDownload(url, isAudio ? null : formatId, isAudio, (status) => {
    console.log(status);
  }).catch(err => {
    alert('Ошибка скачивания: ' + err.message);
  });
}
