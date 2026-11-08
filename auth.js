// /api/auth — 가입(초대 코드) · 이메일/비밀번호 로그인 · 데모 계정 · 비밀번호 초기화
//  GET                                   : 로그인 화면 정보(진행 중 기수, 데모 허용 여부, 데모 계정)
//  POST {action:'checkCode', code}        : 초대 코드 확인 → 역할·기수·직무팀
//  POST {action:'signup', code, name, email, password, track, teamId, consents, mentor}
//  POST {action:'login', email, password, remember}
//  POST {action:'demo', userId}
//  POST {action:'me'}
//  POST {action:'resetPassword', userId}  : 운영진 전용
import crypto from 'node:crypto';
import { readBody, send, fail, signToken, getAuth, requireUser, getSecret, IS_SERVERLESS, uid, nowISO } from './_lib/util.js';
import { db } from './_lib/db.js';

export const TRACKS = ['HRD', '서비스기획·운영', '마케팅', '데이터 분석', '영업·CS', '기타'];

export function demoEnabled() {
  const v = getSecret('AXP_DEMO');
  if (v === '0' || v === 'false') return false;
  if (v === '1' || v === 'true') return true;
  return !IS_SERVERLESS; // 로컬 실행은 기본 허용, 배포 환경은 명시적으로 켜야 함
}
function adminCode() { return getSecret('AXP_ADMIN_CODE') || (IS_SERVERLESS ? '' : 'axproof-admin'); }
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, cohortId: u.cohortId || null, track: u.track || '', teamId: u.teamId || null, audience: u.audience || 'career', schoolClassId: u.schoolClassId || '', ageBand: u.ageBand || '', demo: !!u.demo });

function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') };
}
function verifyPw(pw, rec) {
  if (!rec || !rec.hash || !rec.salt) return false;
  const h = crypto.scryptSync(pw, rec.salt, 64), a = Buffer.from(rec.hash, 'hex');
  return a.length === h.length && crypto.timingSafeEqual(a, h);
}
// 로그인 실패 5회면 5분 잠금 (서버 인스턴스 단위)
const fails = new Map();
function locked(email) { const f = fails.get(email); return f && f.until && f.until > Date.now(); }
function failOnce(email) { const f = fails.get(email) || { n: 0 }; f.n += 1; if (f.n >= 5) { f.until = Date.now() + 5 * 60e3; f.n = 0; } fails.set(email, f); }

async function resolveCode(code) {
  code = String(code || '').trim();
  if (!code) return null;
  const ac = adminCode();
  if (ac && code === ac) return { role: 'admin', cohort: null };
  const cohorts = await db().list('cohorts');
  const c1 = cohorts.find(c => c.inviteCode && c.inviteCode === code);
  if (c1) return { role: 'learner', cohort: c1 };
  const c2 = cohorts.find(c => c.mentorCode && c.mentorCode === code);
  if (c2) return { role: 'mentor', cohort: c2 };
  return null;
}
const err = (status, message, extra) => Object.assign(new Error(message), { status }, extra || {});

export default async function handler(req, res) {
  try {
    const store = db();
    if (req.method === 'GET') {
      const demo = demoEnabled();
      const users = demo ? (await store.list('users')).filter(u => u.demo) : [];
      const cohorts = await store.list('cohorts');
      const c = cohorts.find(x => x.status === '진행 중') || cohorts[0];
      return send(res, 200, { demo, demoUsers: users.map(pub), cohort: c ? { name: c.name, org: c.org, currentWeek: c.currentWeek, weeks: c.weeks } : null, tracks: TRACKS });
    }
    if (req.method !== 'POST') return send(res, 405, { error: '지원하지 않는 요청' });
    const b = await readBody(req);

    if (b.action === 'me') {
      const a = await requireUser(req);
      if (!a) return send(res, 401, { error: '로그인이 필요합니다' });
      const u = await store.get('users', a.uid);
      if (!u) return send(res, 401, { error: '계정을 찾을 수 없습니다' });
      return send(res, 200, { user: pub(u) });
    }

    if (b.action === 'demo') {
      if (!demoEnabled()) throw err(403, '데모 로그인이 꺼져 있습니다');
      const u = await store.get('users', b.userId);
      if (!u || !u.demo) throw err(404, '데모 계정이 없습니다');
      return send(res, 200, { token: signToken({ uid: u.id, role: u.role, ver: u.authVersion || 0 }, 1), user: pub(u) });
    }

    if (b.action === 'checkCode') {
      const r = await resolveCode(b.code);
      if (!r) throw err(401, '초대 코드가 맞지 않아요. 운영진에게 받은 코드를 다시 확인해 주세요.');
      return send(res, 200, { role: r.role, cohort: r.cohort ? { id: r.cohort.id, name: r.cohort.name, org: r.cohort.org } : null, teams: r.cohort ? (r.cohort.teams || []).map(t => ({ id: t.id, name: t.name, track: t.track })) : [], tracks: TRACKS });
    }

    if (b.action === 'signup') {
      const r = await resolveCode(b.code);
      if (!r) throw err(401, '초대 코드가 맞지 않아요.');
      const email = String(b.email || '').trim().toLowerCase();
      const name = String(b.name || '').trim();
      const pw = String(b.password || '');
      if (!name || name.length > 30) throw err(400, '이름을 확인해 주세요.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw err(400, '이메일 형식을 확인해 주세요.');
      if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw err(400, '비밀번호는 영문과 숫자를 섞어 8자 이상으로 정해 주세요.');
      const c = b.consents || {};
      if (!c.terms || !c.logs) throw err(400, '필수 동의 항목을 확인해 주세요.');
      const users = await store.list('users');
      let u = users.find(x => (x.email || '').toLowerCase() === email);
      if (u) {
        const cr = await store.get('creds', u.id);
        if (cr && cr.hash) throw err(409, '이미 가입된 이메일이에요. 로그인해 주세요.');
        if (!u.demo && !cr?.resetAllowed) throw err(403, '기존 계정의 비밀번호는 운영진을 통해 초기화해 주세요.');
        if (cr?.resetAllowed && crypto.createHash('sha256').update(String(b.resetCode || '')).digest('hex') !== cr.resetHash) throw err(403, '운영진에게 받은 일회용 비밀번호 초기화 코드를 입력해 주세요.');
        if (u.role !== r.role && r.role !== 'admin') throw err(403, '이 이메일은 다른 역할로 등록되어 있어요. 운영진에게 문의해 주세요.');
      }
      const consents = { terms: nowISO(), logs: nowISO(), kb: c.kb ? nowISO() : null };
      const team = r.cohort && b.teamId ? (r.cohort.teams || []).find(t => t.id === b.teamId) : null;
      u = Object.assign(u || { id: uid('usr'), createdAt: nowISO() }, {
        name, email, role: r.role === 'admin' ? 'admin' : (u ? u.role : r.role), cohortId: r.cohort ? r.cohort.id : (u && u.cohortId) || null,
        track: TRACKS.includes(b.track) ? b.track : ((team && team.track) || (u && u.track) || ''), teamId: team ? team.id : (u && u.teamId) || null,
        consents, updatedAt: nowISO()
      });
      await store.put('users', u);
      await store.put('creds', { id: u.id, ...hashPw(pw), updatedAt: nowISO() });
      if (team && r.cohort) {
        const coh = await store.get('cohorts', r.cohort.id);
        coh.teams = (coh.teams || []).map(t => ({ ...t, members: (t.members || []).filter(m => m !== u.id).concat(t.id === team.id ? [u.id] : []) }));
        coh.updatedAt = nowISO();
        await store.put('cohorts', coh);
        // 이미 진행 중인 직무팀 프로젝트(링커슈·팀 프로젝트)에 새 팀원으로 합류
        for (const p of await store.list('projects')) {
          if (p.teamId === team.id && !(p.members || []).includes(u.id)) { p.members = [...(p.members || []), u.id]; p.updatedAt = nowISO(); await store.put('projects', p); }
        }
      }
      if (u.role === 'mentor') {
        const ms = await store.list('mentors');
        if (!ms.some(m => m.userId === u.id)) {
          const m = b.mentor || {};
          await store.put('mentors', { id: uid('mtr'), userId: u.id, name, company: String(m.company || ''), role: String(m.role || ''), years: Number(m.years) || 0, industry: String(m.industry || ''), tags: [], contactOk: true, channel: '플랫폼 메시지', contactCount: 0, note: (r.cohort ? r.cohort.name + ' 멘토로 가입' : ''), createdAt: nowISO(), updatedAt: nowISO() });
        }
      }
      return send(res, 200, { token: signToken({ uid: u.id, role: u.role, ver: u.authVersion || 0 }, 30), user: pub(u) });
    }

    if (b.action === 'login') {
      const email = String(b.email || '').trim().toLowerCase();
      if (!email || !b.password) throw err(400, '이메일과 비밀번호를 입력해 주세요.');
      if (locked(email)) throw err(429, '로그인을 여러 번 실패해 5분 동안 잠겼어요. 잠시 뒤 다시 시도해 주세요.');
      const u = (await store.list('users')).find(x => (x.email || '').toLowerCase() === email);
      const cr = u ? await store.get('creds', u.id) : null;
      if (!u || !verifyPw(String(b.password), cr)) {
        failOnce(email);
        if (u && !cr) throw err(401, '아직 비밀번호가 없는 계정이에요. "처음이에요" 탭에서 초대 코드로 가입해 주세요.');
        throw err(401, '이메일 또는 비밀번호가 맞지 않아요.');
      }
      fails.delete(email);
      u.lastLoginAt = nowISO(); await store.put('users', u);
      return send(res, 200, { token: signToken({ uid: u.id, role: u.role, ver: u.authVersion || 0 }, b.remember ? 30 : 1), user: pub(u) });
    }

    if (b.action === 'resetPassword') {
      await requireUser(req, ['admin']);
      const target = await store.get('users', b.userId);
      if (!target) throw err(404, '계정이 없습니다');
      target.authVersion = (target.authVersion || 0) + 1; await store.put('users', target);
      const reset = crypto.randomBytes(18).toString('hex');
      await store.put('creds', { id: String(b.userId || ''), resetAllowed: true, resetHash: crypto.createHash('sha256').update(reset).digest('hex') });
      return send(res, 200, { ok: true, resetCode: reset });
    }
    send(res, 400, { error: '지원하지 않는 요청' });
  } catch (e) { fail(res, e); }
}
