// 저장소: Supabase(배포) → 로컬 JSON 파일(개발·소규모 파일럿) → 메모리(임시) 순으로 자동 선택
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { DATA_DIR, ROOT, IS_SERVERLESS, getSecret, nowISO } from './util.js';

export const COLLECTIONS = [
  'users', 'cohorts', 'cases', 'projects', 'logs', 'chats', 'reviews', 'mentors', 'contacts',
  'archive', 'knowledge', 'challenges', 'portfolios', 'assignments', 'submissions', 'settings', 'usage', 'progress',
  'sharingSessions', 'sharingEntries', 'schoolClasses', 'schoolMissions', 'schoolAttempts', 'schoolReports', 'schoolConsents',
  'mentorReviews', 'mentorReviewPrefs', 'quotas',
  'creds' // 비밀번호 해시 — /api/store로는 절대 읽거나 쓸 수 없음
];

export function loadSeed() {
  const file = path.join(ROOT, 'public', 'assets', 'js', 'seed.js');
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {}, console };
  vm.runInNewContext(code, sandbox, { filename: 'seed.js' });
  return JSON.parse(JSON.stringify(sandbox.window.AXP_SEED()));
}
function deploymentSeed() {
  const s = loadSeed();
  if (IS_SERVERLESS && getSecret('AXP_DEMO') !== '1') {
    for (const c of ['users', 'mentors', 'challenges', 'projects', 'logs', 'chats', 'reviews', 'contacts', 'portfolios', 'submissions', 'progress', 'usage', 'sharingSessions', 'sharingEntries', 'schoolClasses', 'schoolConsents', 'schoolAttempts', 'schoolReports']) s[c] = [];
    s.cohorts.forEach(c => { c.teams.forEach(t => { t.members = []; }); c.inviteCode = ''; c.mentorCode = ''; });
    s.schoolMissions.forEach(m => { m.reviewed = false; m.reviewedBy = ''; m.reviewedAt = null; });
  }
  return s;
}

/* ---------- 파일/메모리 백엔드 ---------- */
class MemoryBackend {
  constructor(persist) {
    this.kind = persist ? 'file' : 'memory';
    this.persist = persist;
    this.file = path.join(DATA_DIR, 'db.json');
    this.db = null;
    this.timer = null;
  }
  ensure() {
    if (this.db) return;
    if (this.persist && fs.existsSync(this.file)) {
      try { this.db = JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (e) {
        console.error('[AXP] db.json 읽기 실패 — 백업 후 새로 시작합니다', e.message);
        fs.renameSync(this.file, this.file + '.broken-' + Date.now());
      }
    }
    if (!this.db) { this.db = {}; this.reset(deploymentSeed()); }
    for (const c of COLLECTIONS) this.db[c] = this.db[c] || {};
    const revision = 'platform-1.2';
    if (!this.db.settings[revision]) {
      const seed = loadSeed();
      const cols = ['schoolMissions'];
      if (getSecret('AXP_DEMO') === '1' || (!IS_SERVERLESS && getSecret('AXP_DEMO') !== '0')) cols.push('schoolClasses', 'schoolConsents', 'sharingSessions', 'users');
      for (const c of cols) for (const r of seed[c] || []) if (!this.db[c][r.id]) this.db[c][r.id] = r;
      this.db.settings[revision] = { id: revision, migratedAt: nowISO() }; this.save();
    }
  }
  reset(seed) {
    this.db = {};
    for (const c of COLLECTIONS) {
      this.db[c] = {};
      for (const r of (seed[c] || [])) this.db[c][r.id] = r;
    }
    this.save();
  }
  save() {
    if (!this.persist) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.db));
      fs.renameSync(tmp, this.file);
    }, 150);
  }
  async list(col) { this.ensure(); return Object.values(this.db[col] || {}); }
  async get(col, id) { this.ensure(); return (this.db[col] || {})[id] || null; }
  async put(col, rec) { this.ensure(); this.db[col][rec.id] = rec; this.save(); return rec; }
  async del(col, id) { this.ensure(); delete this.db[col][id]; this.save(); }
  async resetAll(seed) { this.reset(seed); }
  async consume(key, limit) { this.ensure(); const r = this.db.quotas[key] || { id: key, count: 0 }; if (r.count >= limit) return false; r.count++; this.db.quotas[key] = r; this.save(); return true; }
}

/* ---------- Supabase 백엔드 (PostgREST) ---------- */
class SupabaseBackend {
  constructor(url, key) {
    this.kind = 'supabase';
    this.base = url.replace(/\/$/, '') + '/rest/v1/axp_records';
    this.headers = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
    this.seeded = false;
  }
  async req(method, qs, body, prefer) {
    const r = await fetch(this.base + (qs ? '?' + qs : ''), {
      method, signal: AbortSignal.timeout(15000), headers: { ...this.headers, ...(prefer ? { Prefer: prefer } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) throw Object.assign(new Error('DB 오류: ' + (await r.text()).slice(0, 200)), { status: 502 });
    const raw = await r.text(); return raw ? JSON.parse(raw) : null;
  }
  async ensure() {
    if (this.seeded) return;
    const rows = await this.req('GET', 'select=id&col=eq.settings&limit=1');
    if (!rows.length) await this.resetAll(deploymentSeed(), true);
    this.seeded = true;
    const marker = await this.get('settings', 'platform-1.2');
    if (!marker) {
      const seed = deploymentSeed();
      for (const col of ['schoolMissions', 'schoolClasses', 'schoolConsents', 'sharingSessions', 'users']) for (const rec of seed[col] || []) if (!await this.get(col, rec.id)) await this.put(col, rec);
      await this.put('settings', { id: 'platform-1.2', migratedAt: nowISO() });
    }
  }
  row(col, rec) { return { id: col + ':' + rec.id, col, owner: rec.userId || null, data: rec, updated_at: nowISO() }; }
  async list(col) {
    await this.ensure();
    const all = [];
    for (let offset = 0; ; offset += 1000) {
      const rows = await this.req('GET', 'select=data&col=eq.' + encodeURIComponent(col) + '&order=id&limit=1000&offset=' + offset);
      all.push(...rows.map(r => r.data)); if (rows.length < 1000) return all;
    }
  }
  async get(col, id) {
    await this.ensure();
    const rows = await this.req('GET', 'select=data&id=eq.' + encodeURIComponent(col + ':' + id));
    return rows[0] ? rows[0].data : null;
  }
  async put(col, rec) {
    await this.ensure();
    await this.req('POST', 'on_conflict=id', [this.row(col, rec)], 'resolution=merge-duplicates,return=minimal');
    return rec;
  }
  async del(col, id) { await this.req('DELETE', 'id=eq.' + encodeURIComponent(col + ':' + id)); }
  async consume(key, limit) {
    const r = await fetch(this.base.replace(/axp_records$/, 'rpc/axp_take_quota'), { method: 'POST', headers: this.headers, body: JSON.stringify({ p_key: key, p_limit: limit }) });
    if (!r.ok) throw Object.assign(new Error('AI 사용 한도 테이블을 확인해 주세요. supabase/schema.sql을 적용해야 합니다.'), { status: 503 });
    return await r.json();
  }
  async resetAll(seed, skipDelete) {
    if (!skipDelete) await this.req('DELETE', 'id=neq.__none__');
    const rows = [];
    for (const c of COLLECTIONS) for (const r of (seed[c] || [])) rows.push(this.row(c, r));
    for (let i = 0; i < rows.length; i += 200) {
      await this.req('POST', 'on_conflict=id', rows.slice(i, i + 200), 'resolution=merge-duplicates,return=minimal');
    }
    this.seeded = true;
  }
}

let backend = null;
export function db() {
  if (backend) return backend;
  const url = getSecret('SUPABASE_URL');
  const key = getSecret('SUPABASE_SERVICE_ROLE_KEY');
  if (url && key) backend = new SupabaseBackend(url, key);
  else {
    if (IS_SERVERLESS && process.env.AXP_TEST_MODE !== '1') throw Object.assign(new Error('배포 환경에서는 Supabase 연결이 필요합니다'), { status: 503 });
    backend = new MemoryBackend(!IS_SERVERLESS);
  }
  return backend;
}
