// ===== YOUTUBE =====
const YOUTUBE_BACKEND = 'https://happysvinyoutube.bounceme.net';

async function resolveYoutube(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  showStatus(t('loading_yt') || 'получаем инфо о видео...');

  const res = await fetch(`${YOUTUBE_BACKEND}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

  showYoutubeResult(url, data);
}

function showYoutubeResult(url, data) {
  const { title, thumbnail, author, duration, formats } = data;

  const mins = duration ? Math.floor(duration / 60) + ':' + String(duration % 60).padStart(2, '0') : '';

  const fmtRows = formats.map(f => `
    <button class="fmt-row yt-fmt-btn" onclick="downloadYoutube('${url}', '${f.format_id}', false)">
      <span class="fmt-quality">${f.label}</span>
      <span class="fmt-ext">mp4</span>
      <svg class="fmt-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`).join('');

  result.innerHTML = `
    <div class="yt-result">
      ${thumbnail ? `<img class="yt-thumb" src="${thumbnail}" alt="thumbnail">` : ''}
      <div class="yt-title">${escapeHtml(title)}</div>
      ${author ? `<div class="yt-author">${escapeHtml(author)}${mins ? ' · ' + mins : ''}</div>` : ''}
      <div class="fmt-list">
        ${fmtRows}
        <button class="fmt-row yt-fmt-btn" onclick="downloadYoutube('${url}', '', true)">
          <span class="fmt-quality">аудио</span>
          <span class="fmt-ext">mp3</span>
          <svg class="fmt-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>`;

  result.classList.add('visible');
  hideStatus();
}

async function downloadYoutube(url, formatId, audioOnly) {
  showStatus(t('loading_yt_dl') || 'скачиваем видео, подожди...');

  try {
    const res = await fetch(`${YOUTUBE_BACKEND}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format_id: formatId, audio_only: audioOnly })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    // получаем файл как blob и запускаем скачивание
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const nameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/i);
    const filename = nameMatch ? decodeURIComponent(nameMatch[1]) : (audioOnly ? 'audio.mp3' : 'video.mp4');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);

    hideStatus();
  } catch(err) {
    showStatus((t('err_generic') || 'ошибка: ') + err.message, true);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
