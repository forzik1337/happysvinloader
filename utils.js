// ===== UTILS =====

// Глобальные переменные
const DEFAULT_PROXY = 'https://super-block-092b.gameforzi2000.workers.dev/?url=';
let PROXY_BASE = DEFAULT_PROXY;
let vodState = null;

// DOM элементы (инициализируются после загрузки DOM)
let urlInput, goBtn, result, clearBtn, pasteBtn;

function proxiedFetch(url, opts){
  if(PROXY_BASE) return fetch(PROXY_BASE + encodeURIComponent(url), opts);
  return fetch(url, opts);
}

function escapeHtml(s){ 
  const d = document.createElement('div'); 
  d.textContent = s; 
  return d.innerHTML; 
}

function formatHMS(totalSec){
  totalSec = Math.max(0, Math.round(totalSec || 0));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return `${pad(h)}h${pad(m)}m${pad(s)}s`;
}

function parseHMS(str){
  if(!str) return null;
  str = str.trim().toLowerCase();
  let m = str.match(/^(\d+)h(\d+)m(\d+)s$/);
  if(m) return (+m[1])*3600 + (+m[2])*60 + (+m[3]);
  m = str.match(/^(\d+):(\d+):(\d+)$/);
  if(m) return (+m[1])*3600 + (+m[2])*60 + (+m[3]);
  m = str.match(/^(\d+):(\d+)$/);
  if(m) return (+m[1])*60 + (+m[2]);
  if(/^\d+$/.test(str)) return +str;
  return null;
}

function formatBytes(bytes){
  if(bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function parseMasterPlaylist(text){
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
  const out = [];
  let pendingName = null;
  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    if(line.startsWith('#EXT-X-MEDIA') && line.includes('NAME=')){
      const m = line.match(/NAME="([^"]+)"/);
      if(m) pendingName = m[1];
      continue;
    }
    if(line.startsWith('#EXT-X-STREAM-INF')){
      const resMatch = line.match(/RESOLUTION=(\d+x\d+)/);
      const fpsMatch = line.match(/FRAME-RATE=([\d.]+)/);
      let j = i + 1;
      while(j < lines.length && lines[j].startsWith('#')) j++;
      const urlLine = lines[j];
      if(urlLine && urlLine.startsWith('http')){
        const name = pendingName || (resMatch ? resMatch[1] + (fpsMatch ? '@' + Math.round(parseFloat(fpsMatch[1])) : '') : ('q ' + (out.length + 1)));
        out.push({ name, url: urlLine });
      }
      pendingName = null;
    }
  }
  return out;
}

function parseMediaPlaylist(text, baseUrl){
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length);
  const segments = [];
  let cursor = 0;
  for(let i = 0; i < lines.length; i++){
    if(lines[i].startsWith('#EXTINF:')){
      const dur = parseFloat(lines[i].slice(8));
      let j = i + 1;
      while(j < lines.length && lines[j].startsWith('#')) j++;
      let segUrl = lines[j];
      if(segUrl && !segUrl.startsWith('#')){
        if(!segUrl.startsWith('http')){
          const base = new URL(baseUrl);
          segUrl = new URL(segUrl, base).toString();
        }
        segments.push({ url: segUrl, duration: dur, start: cursor });
        cursor += dur;
        i = j;
      }
    }
  }
  return { segments, total: cursor };
}

function segmentsInRange(start, end){
  if(!vodState || !vodState.segments) return [];
  return vodState.segments.filter(seg => 
    seg.start < end && (seg.start + seg.duration) > start
  );
}

function hideResult(){ 
  result.classList.remove('show'); 
  result.innerHTML = ''; 
}

function setLoading(on){ 
  goBtn.disabled = on; 
  goBtn.classList.toggle('loading', on); 
}

function showStatus(msg, isError){
  result.innerHTML = `<div class="status-msg ${isError ? 'error' : ''}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round" stroke-linejoin="round"/></svg>
    ${msg}
  </div>`;
  result.classList.add('show');
}