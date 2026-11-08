// AX Proof 로컬/단일 서버 실행기
//   npm install  →  npm start  →  http://localhost:3000
// Vercel 등 서버리스에 올리면 api/*.js 가 각각 함수로 동작하고, 이 파일은 쓰이지 않습니다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(here, '.env'));

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(here, 'public');
const DOCS = path.resolve(here, '..', 'docs');

const ROUTES = {
  '/api/ai': () => import('./api/ai.js'),
  '/api/store': () => import('./api/store.js'),
  '/api/auth': () => import('./api/auth.js'),
  '/api/health': () => import('./api/health.js'),
  '/api/public': () => import('./api/public.js'),
  '/api/fetch-url': () => import('./api/fetch-url.js'),
  '/api/settings': () => import('./api/settings.js'),
  '/api/evidence': () => import('./api/evidence.js'),
  '/api/school': () => import('./api/school.js'),
  '/api/sharing': () => import('./api/sharing.js'),
  '/api/ob-reviews': () => import('./api/ob-reviews.js')
};

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8'
};

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    const v = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

function serveFile(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('페이지를 찾을 수 없습니다'); }
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    // 영상의 탐색·다시 재생을 위한 단일 byte range. Vercel은 정적 파일 서버에서 처리합니다.
    res.setHeader('Accept-Ranges', 'bytes');
    var start = 0, end = st.size - 1;
    if (req.headers.range) {
      var match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (match && match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), st.size - 1) : end; }
      else if (match && match[2]) start = Math.max(0, st.size - Number(match[2]));
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= st.size) {
        res.statusCode = 416; res.setHeader('Content-Range', 'bytes */' + st.size); return res.end();
      }
      res.statusCode = 206; res.setHeader('Content-Range', 'bytes ' + start + '-' + end + '/' + st.size);
    }
    res.setHeader('Content-Length', Math.max(0, end - start + 1));
    if (req.method === 'HEAD' || st.size === 0) return res.end();
    fs.createReadStream(file, { start: start, end: end }).on('error', function (e) { res.destroy(e); }).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://local');
  try {
    let p = decodeURIComponent(url.pathname);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (ROUTES[p]) {
      const mod = await ROUTES[p]();
      return await mod.default(req, res);
    }
    if (p.startsWith('/api/')) { res.statusCode = 404; return res.end('{"error":"없는 API"}'); }
    if (p.startsWith('/docs/')) {
      const f = path.join(DOCS, path.normalize(p.slice(6)));
      if (!f.startsWith(DOCS + path.sep)) { res.statusCode = 403; return res.end(); }
      return serveFile(req, res, f);
    }
    if (p === '/') p = '/index.html';
    if (p === '/app' || p === '/app/') p = '/app.html';
    if (p === '/plan' || p === '/plan/') p = '/plan.html';
    const f = path.join(PUBLIC, path.normalize(p));
    if (!f.startsWith(PUBLIC + path.sep)) { res.statusCode = 403; return res.end(); }
    serveFile(req, res, f);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) { res.statusCode = 500; res.setHeader('Content-Type', 'application/json; charset=utf-8'); }
    res.end(JSON.stringify({ error: e.message || '서버 오류' }));
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  AX Proof 실행 중  →  http://localhost:' + PORT);
  console.log('  · 서비스 소개      http://localhost:' + PORT + '/');
  console.log('  · 플랫폼(앱)       http://localhost:' + PORT + '/app.html');
  console.log('  · 기획서           http://localhost:' + PORT + '/plan.html');
  console.log('');
});
