// ===== YOUTUBE FRONTEND =====
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
  if (!res.ok) throw new Error(data.error || "не удалось получить данные");
  return data;
}

async function ytStartDownload(url, formatId, audioOnly) {
  const res = await fetch(`${BACKEND_URL}/api/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format_id: formatId, audio_only: audioOnly }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "ошибка запуска скачивания");
  return data.job_id;
}

function ytWatchProgress(jobId, onProgress) {
  return new Promise((resolve, reject) => {
    const es = new EventSource(`${BACKEND_URL}/api/progress/${jobId}`);
    es.onmessage = (e) => {
      try {
        const p = JSON.parse(e.data);
        onProgress(p);
        if (p.status === "done") {
          es.close();
          resolve();
        } else if (p.status === "error") {
          es.close();
          reject(new Error(p.error || "ошибка скачивания на сервере"));
        }
      } catch (err) {
        es.close();
        reject(err);
      }
    };
    es.onerror = () => {
      es.close();
      reject(new Error("потеряно соединение с сервером"));
    };
  });
}

function ytDownloadFile(jobId) {
  const a = document.createElement("a");
  a.href = `${BACKEND_URL}/api/file/${jobId}`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function checkCookiesStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cookies-status`);
    const data = await res.json();
    return data.has_cookies;
  } catch (e) {
    return false;
  }
}

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

async function loadCookiesFromFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".txt";

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      await uploadCookies(text);
      alert("✓ Cookies загружены!");
      const btn = document.getElementById("loadCookiesBtn");
      if (btn) btn.style.display = "none";
    } catch (err) {
      alert("Ошибка загрузки cookies: " + err.message);
    }
  };

  input.click();
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

async function resolveYoutube(url) {
  const info = await ytFetchInfo(url);
  window._ytCurrentVideo = { url, info };
  renderYoutubeResult(info);
}

function renderYoutubeResult(info) {
  const title = info.title || "без названия";
  const author = info.author || "";
  const duration = info.duration || 0;
  const thumb = info.thumbnail || "";
  const formats = info.formats || [];

  let html = `<div class="preview-card">
    <img class="preview-thumb rect" src="${thumb}" onerror="this.style.display='none'">
    <div class="preview-info">
      <div class="preview-title">${escapeHtml(title)}</div>
      <div class="preview-meta">${escapeHtml(author)} · ${formatDuration(duration)}</div>
    </div>
  </div>
  <div class="quality-list">`;

  html += `<div class="quality-row">
    <div><div class="label">🎵 Аудио (MP3)</div></div>
    <button class="dl-btn" onclick="downloadYoutubeFormat('mp3')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
      скачать
    </button>
  </div>`;

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
  result.classList.add("show");
}

async function downloadYoutubeFormat(formatId) {
  if (!window._ytCurrentVideo) return;
  const { url } = window._ytCurrentVideo;
  const isAudio = formatId === "mp3";

  // Показываем статус
  showYtProgress("запускаю скачивание на сервере...", 0);

  let jobId;
  try {
    jobId = await ytStartDownload(url, isAudio ? null : formatId, isAudio);
  } catch (err) {
    showStatus("Ошибка: " + err.message, true);
    return;
  }

  try {
    await ytWatchProgress(jobId, (p) => {
      if (p.status === "downloading") {
        const pct = Math.round(p.percent || 0);
        const speed = p.speed ? ` · ${p.speed}` : "";
        const eta = p.eta ? ` · осталось ${p.eta}` : "";
        showYtProgress(`скачиваю на сервере: ${pct}%${speed}${eta}`, pct);
      } else if (p.status === "processing") {
        showYtProgress("склеиваю видео и аудио...", 100);
      } else if (p.status === "starting") {
        showYtProgress("запускаю скачивание на сервере...", 0);
      }
    });
  } catch (err) {
    showStatus("Ошибка скачивания: " + err.message, true);
    return;
  }

  // Всё готово — отдаём файл
  showYtProgress("готово! начинаю загрузку файла...", 100);
  ytDownloadFile(jobId);

  // Через 2 секунды восстанавливаем результат
  setTimeout(() => {
    renderYoutubeResult(window._ytCurrentVideo.info);
  }, 2000);
}

function showYtProgress(msg, percent) {
  const bar = percent > 0
    ? `<div style="margin-top:8px;background:var(--border);border-radius:4px;height:4px;overflow:hidden">
         <div style="width:${percent}%;height:100%;background:var(--accent);transition:width 0.3s"></div>
       </div>`
    : "";

  result.innerHTML = `<div class="status-msg">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ${escapeHtml(msg)}${bar}
  </div>`;
  result.classList.add("show");
}
