// youtube.js — фронтенд-обвязка для скачивания YouTube-видео
// Работает в связке с твоим собственным backend-сервером (server.py),
// который запускает yt-dlp. GitHub Pages сам этот сервер не запустит —
// его нужно задеплоить отдельно (Render/Railway/PythonAnywhere) и вписать
// адрес ниже в BACKEND_URL.

const BACKEND_URL = "https://happysvinyoutube.bounceme.net"; // <-- замени на реальный адрес после деплоя

function isYoutubeUrl(raw) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/live\/|youtube\.com\/embed\/|youtube\.com\/v\/)/i.test(raw);
}

async function ytFetchInfo(url) {
  const res = await fetch(`${BACKEND_URL}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  
  // Проверяем что получили JSON, а не HTML
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    console.error("Сервер вернул не JSON:", text.substring(0, 200));
    throw new Error("Сервер недоступен или возвращает HTML. Проверь что Flask запущен и Caddy настроен правильно.");
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "не удалось получить данные о видео");
  return data;
}

function ytBuildDownloadUrl() {
  // скачивание идёт через POST, поэтому прямой ссылки нет —
  // используем функцию ниже, которая делает запрос и сама запускает download
  return null;
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
// Пример встраивания в общий обработчик ссылки (handleGo) в твоём app.js:
//
// if (isYoutubeUrl(raw)) {
//   const info = await ytFetchInfo(raw);
//   // отрисовать превью + список форматов из info.formats,
//   // на клик по кнопке скачивания вызвать:
//   // ytDownload(raw, formatId, false, statusCallback)
// }
