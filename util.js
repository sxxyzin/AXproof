// 공통 유틸: 요청 본문 파싱, JSON 응답, 비밀값, 토큰 서명/검증
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);

export async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}'); } catch { return {}; } }
    if (Buffer.isBuffer(req.body)) { try { return JSON.parse(req.body.toString('utf8') || '{}'); } catch { return {}; } }
    return req.body;
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 8 * 1024 * 1024) throw Object.assign(new Error('요청이 너무 큽니다 (8MB 제한)'), { status: 413 });
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw Object.assign(new Error('JSON 형식이 아닙니다'), { status: 400 }); }
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export function fail(res, err) {
  const status = err && err.status ? err.status : 500;
  if (status >= 500) console.error('[AXP]', err);
  send(res, status, { error: (err && err.message) || '서버 오류' });
}

export function query(req) {
  const u = new URL(req.url, 'http://local');
  return Object.fromEntries(u.searchParams.entries());
}

/* ---------- 비밀값: 환경변수 → data/secrets.json (로컬 전용) ---------- */
const SECRETS_FILE = path.join(DATA_DIR, 'secrets.json');
let secretsCache = null;
function loadSecrets() {
  if (process.env.AXP_TEST_MODE === '1') return {};
  if (secretsCache) return secretsCache;
  try { secretsCache = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8')); } catch { secretsCache = {}; }
  return secretsCache;
}
export function getSecret(name) {
  return process.env[name] || loadSecrets()[name] || '';
}
export function secretSource(name) {
  if (process.env[name]) return 'env';
  if (loadSecrets()[name]) return 'local';
  return '';
}
export function setLocalSecret(name, value) {
  if (IS_SERVERLESS) throw Object.assign(new Error('서버리스 환경에서는 환경변수(Environment Variables)로 설정하세요'), { status: 400 });
  const s = loadSecrets();
  if (value) s[name] = value; else delete s[name];
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SECRETS_FILE, JSON.stringify(s, null, 2));
  secretsCache = s;
}

/* ---------- 토큰 ---------- */
let runtimeSecret = null;
function signingKey() {
  const k = getSecret('AXP_SECRET');
  if (k) return k;
  if (!IS_SERVERLESS) {
    const v = crypto.randomBytes(32).toString('hex');
    try { setLocalSecret('AXP_SECRET', v); return v; } catch { /* 아래로 */ }
  }
  if (!runtimeSecret) {
    runtimeSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[AXP] AXP_SECRET 환경변수가 없어 임시 키를 씁니다. 배포 환경에서는 반드시 설정하세요.');
  }
  return runtimeSecret;
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');
export function signToken(payload, days = 30) {
  const body = b64u(JSON.stringify({ ...payload, exp: Date.now() + days * 864e5 }));
  const sig = b64u(crypto.createHmac('sha256', signingKey()).update(body).digest());
  return body + '.' + sig;
}
export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = b64u(crypto.createHmac('sha256', signingKey()).update(body).digest());
  const a = Buffer.from(sig), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!p.exp || p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}
export function getAuth(req) {
  const h = req.headers['authorization'] || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  return verifyToken(t);
}
export function requireAuth(req, roles) {
  const a = getAuth(req);
  if (!a) throw Object.assign(new Error('로그인이 필요합니다'), { status: 401 });
  if (roles && !roles.includes(a.role)) throw Object.assign(new Error('권한이 없습니다'), { status: 403 });
  return a;
}
export async function requireUser(req, roles) {
  const a = requireAuth(req, roles);
  const { db } = await import('./db.js');
  const user = await db().get('users', a.uid);
  if (!user || user.disabled || user.role !== a.role || (a.ver || 0) !== (user.authVersion || 0)) throw Object.assign(new Error('다시 로그인해 주세요'), { status: 401 });
  return a;
}

export const uid = (p = 'id') => p + '_' + crypto.randomBytes(6).toString('hex');
export const nowISO = () => new Date().toISOString();
