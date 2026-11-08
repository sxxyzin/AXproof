// /api/store — 역할별 읽기/쓰기 규칙이 걸린 데이터 API
//  GET  ?all=1            : 내가 볼 수 있는 전체 데이터
//  GET  ?col=X[&id=Y]     : 컬렉션 / 레코드
//  PUT  ?col=X  (body=레코드) : 저장(생성·수정)
//  DELETE ?col=X&id=Y
//  POST ?action=reset|import|export (운영진)
import { readBody, send, fail, query, requireUser, nowISO, uid } from './_lib/util.js';
import { db, COLLECTIONS, loadSeed } from './_lib/db.js';
import { captureChat, ensurePortfolio } from './_lib/capture.js';

const HIDDEN = ['creds', 'quotas', 'mentorReviews', 'mentorReviewPrefs', 'schoolClasses', 'schoolMissions', 'schoolAttempts', 'schoolReports', 'schoolConsents'];
const PUBLIC_COLS = COLLECTIONS.filter(c => !HIDDEN.includes(c));
const ADMIN_ONLY_READ = ['usage'];
const LEARNER_WRITABLE = ['projects', 'logs', 'chats', 'portfolios', 'submissions', 'progress', 'contacts', 'users'];
const MENTOR_WRITABLE = ['reviews', 'cases', 'contacts', 'mentors', 'logs', 'knowledge', 'archive', 'users', 'projects', 'submissions'];

const isMember = (p, a) => p.userId === a.uid || (p.members || []).includes(a.uid);

// 훈련생 읽기 범위: 본인 것 + (직무팀 프로젝트라면) 같은 프로젝트 팀원의 판단 기록·리뷰
function learnerCanRead(col, r, a, ctx) {
  switch (col) {
    case 'projects': return isMember(r, a);
    case 'logs': return r.userId === a.uid || ctx.myProjects.has(r.projectId);
    case 'reviews': return r.learnerId === a.uid || ctx.myProjects.has(r.projectId);
    case 'chats': case 'portfolios': case 'submissions': case 'progress': return r.userId === a.uid;
    case 'contacts': return r.learnerId === a.uid;
    default: return true;
  }
}
function canRead(col, rec, a, ctx) {
  if (HIDDEN.includes(col)) return false;
  if (a.role === 'admin') return true;
  if (!['learner', 'mentor'].includes(a.role)) return col === 'users' && rec.id === a.uid;
  if (ADMIN_ONLY_READ.includes(col)) return false;
  if (col === 'users') return rec.id === a.uid || (rec.role !== 'student' && rec.role !== 'guardian' && rec.role !== 'teacher' && (!rec.cohortId || rec.cohortId === ctx.cohortId));
  if (col === 'sharingSessions' || col === 'sharingEntries' || col === 'cohorts') return rec.cohortId === ctx.cohortId || rec.id === ctx.cohortId;
  if (a.role === 'mentor') {
    const owner = rec.userId || rec.learnerId;
    if (owner) return ctx.cohortUsers.has(owner);
    if (rec.projectId) return ctx.cohortProjects.has(rec.projectId);
    return !rec.cohortId || rec.cohortId === ctx.cohortId;
  }
  return learnerCanRead(col, rec, a, ctx);
}
// 다른 사람의 이메일·동의 기록은 운영진만 봄
function shape(col, rec, a) {
  if (col === 'cases' && a.role === 'learner') { const { hidden, judgment, ...persona } = rec.persona || {}; return { ...rec, persona }; }
  if (col === 'mentors' && a.role === 'learner') { const { email, phone, contact, ...safe } = rec; return safe; }
  if (col === 'cohorts' && a.role !== 'admin') { const { inviteCode, mentorCode, ...safe } = rec; return safe; }
  if (col === 'challenges' && a.role !== 'admin') { const { contact, ...safe } = rec; return safe; }
  if (col === 'chats') { const { captureChecked, ...safe } = rec; return safe; }
  if (col !== 'users' || a.role === 'admin' || rec.id === a.uid) return rec;
  const { email, consents, lastLoginAt, ...rest } = rec;
  return rest;
}
async function context(a) {
  const user = await db().get('users', a.uid);
  if (!user || user.role !== a.role) throw Object.assign(new Error('다시 로그인해 주세요'), { status: 401 });
  if (a.role !== 'learner') return { myProjects: new Set(), cohortId: user.cohortId, cohortUsers: new Set((await db().list('users')).filter(u => u.cohortId === user.cohortId).map(u => u.id)), cohortProjects: new Set((await db().list('projects')).filter(p => p.cohortId === user.cohortId).map(p => p.id)) };
  const ps = (await db().list('projects')).filter(p => isMember(p, a));
  return { myProjects: new Set(ps.map(p => p.id)), cohortId: user.cohortId };
}

async function checkWrite(col, rec, prev, a) {
  if (!COLLECTIONS.includes(col) || HIDDEN.includes(col)) throw Object.assign(new Error('알 수 없는 컬렉션'), { status: 400 });
  if (a.role === 'admin') return;
  const deny = () => { throw Object.assign(new Error('이 데이터를 바꿀 권한이 없습니다'), { status: 403 }); };
  if (!['learner', 'mentor'].includes(a.role) || ['sharingSessions', 'sharingEntries'].includes(col)) deny();
  if (col === 'chats') {
    if (!Array.isArray(rec.messages) || rec.messages.length > 400 || JSON.stringify(rec.messages).length > 350000) deny();
    if (prev) for (let i = 0; i < (prev.messages || []).length; i++) if (prev.messages[i].role === 'user' && (rec.messages[i]?.content !== prev.messages[i].content || rec.messages[i]?.role !== 'user')) deny();
    if (rec.projectId) { const p = await db().get('projects', rec.projectId); if (!p || !isMember(p, a)) deny(); }
  }
  if (col === 'users') {
    if (!prev || rec.id !== a.uid) deny();
    const editable = ['name', 'bio'];
    const profile = Object.fromEntries(editable.filter(k => k in rec).map(k => [k, String(rec[k]).slice(0, k === 'name' ? 30 : 1500)]));
    for (const k of Object.keys(rec)) delete rec[k]; Object.assign(rec, prev, profile); return;
  }
  if (col === 'portfolios') {
    if ((prev || rec).userId !== a.uid || rec.userId !== a.uid) deny();
    for (const id of rec.projectIds || []) { const p = await db().get('projects', id); if (!p || !isMember(p, a)) deny(); }
    for (const id of [...(rec.picks || []), ...(rec.publicLogIds || [])]) { const l = await db().get('logs', id); if (!l || l.userId !== a.uid) deny(); }
  }
  if (col === 'projects' && prev && a.role === 'learner') {
    if (!isMember(prev, a)) deny();
    Object.assign(rec, { userId: prev.userId, members: prev.members, cohortId: prev.cohortId, teamId: prev.teamId });
  }
  if (col === 'projects' && !prev && a.role === 'learner') {
    const user = await db().get('users', a.uid); if (rec.userId !== a.uid) deny();
    rec.cohortId = user.cohortId;
    if (rec.teamId) {
      const cohort = await db().get('cohorts', user.cohortId), team = (cohort?.teams || []).find(t => t.id === rec.teamId && (t.members || []).includes(a.uid));
      if (!team) deny(); rec.members = team.members;
    } else rec.members = [a.uid];
  }
  if (col === 'logs') {
    if (prev?.origin === 'chat-auto') { rec.chatId = prev.chatId; rec.messageIndex = prev.messageIndex; rec.userQuote = prev.userQuote; rec.origin = prev.origin; rec.detection = prev.detection; }
    else { delete rec.origin; delete rec.detection; delete rec.userQuote; delete rec.evidenceKey; }
  }
  if (a.role === 'learner') {
    // 리뷰 요청·지식 제안은 '새로 만들기'만, 평가·승인 값 없이
    if (col === 'reviews') { if (prev || rec.learnerId !== a.uid || rec.status !== '요청' || rec.rubric || rec.approved || rec.verified) deny(); return; }
    if (col === 'knowledge') { if (prev || rec.status !== '검수 대기' || rec.auto) deny(); return; }
    if (!LEARNER_WRITABLE.includes(col)) deny();
    if (col === 'users') {
      if (rec.id !== a.uid) deny();
      if (prev && (rec.role !== prev.role || rec.cohortId !== prev.cohortId)) deny();
      return;
    }
    const target = prev || rec;
    if (col === 'contacts') { if (target.learnerId !== a.uid) deny(); return; }
    if (col === 'projects') { if (!isMember(target, a) || (prev && !isMember(rec, a))) deny(); return; }
    if (target.userId !== a.uid || (prev && rec.userId !== a.uid)) deny();
    return;
  }
  if (a.role === 'mentor') {
    if (!MENTOR_WRITABLE.includes(col)) deny();
    if (col === 'users' && rec.id !== a.uid) deny();
    const me = await db().get('users', a.uid);
    if (['projects', 'logs', 'reviews', 'submissions'].includes(col)) {
      const ownerId = (prev || rec).userId || (prev || rec).learnerId;
      const owner = ownerId ? await db().get('users', ownerId) : null;
      if (owner && me.cohortId !== owner.cohortId) deny();
    }
  }
}

// 판단 기록 원본 잠금: 최초 시각·원문은 서버가 지키고, 바뀌면 '직접 수정' 표시
function lockLog(rec, prev) {
  if (!prev) { rec.createdAt = nowISO(); rec.original = rec.text; rec.edited = false; return rec; }
  rec.createdAt = prev.createdAt; rec.original = prev.original; rec.userId = prev.userId;
  rec.edited = rec.text !== prev.original;
  if (rec.text !== prev.text) rec.history = [...(prev.history || []), { text: prev.text, at: nowISO() }].slice(-20);
  return rec;
}
// 직무팀이 같은 프로젝트를 함께 고칠 때: 이번에 바뀐 단계(_touch)만 덮어쓰고 나머지 단계는 서버 최신본 유지
function mergeProject(rec, prev) {
  if (!prev || !Array.isArray(rec._touch)) { delete rec._touch; return rec; }
  const data = { ...(prev.data || {}) };
  for (const k of rec._touch) if (rec.data && k in rec.data) data[k] = rec.data[k];
  const out = { ...rec, data, reached: Math.max(prev.reached || 0, rec.reached || 0) };
  delete out._touch;
  return out;
}

export default async function handler(req, res) {
  try {
    const a = await requireUser(req);
    const q = query(req);
    const store = db();

    if (req.method === 'GET' && q.all) {
      const ctx = await context(a);
      const out = {};
      for (const c of PUBLIC_COLS) out[c] = (await store.list(c)).filter(r => canRead(c, r, a, ctx)).map(r => shape(c, r, a));
      return send(res, 200, { data: out, serverTime: nowISO() });
    }
    if (req.method === 'GET') {
      if (!PUBLIC_COLS.includes(q.col)) throw Object.assign(new Error('알 수 없는 컬렉션'), { status: 400 });
      const ctx = await context(a);
      if (q.id) {
        const r = await store.get(q.col, q.id);
        if (!r || !canRead(q.col, r, a, ctx)) return send(res, 404, { error: '없음' });
        return send(res, 200, { data: shape(q.col, r, a) });
      }
      return send(res, 200, { data: (await store.list(q.col)).filter(r => canRead(q.col, r, a, ctx)).map(r => shape(q.col, r, a)) });
    }
    if (req.method === 'PUT') {
      let rec = await readBody(req);
      if (!rec || typeof rec !== 'object') throw Object.assign(new Error('레코드가 없습니다'), { status: 400 });
      rec.id = rec.id || uid(String(q.col).slice(0, 3));
      const prev = await store.get(q.col, rec.id);
      await context(a);
      await checkWrite(q.col, rec, prev, a);
      if (q.col === 'users' && prev && a.role !== 'admin') { rec.email = prev.email; rec.consents = rec.consents || prev.consents; }
      if (q.col === 'logs' && a.role === 'learner') { rec.verifiedBy = prev ? prev.verifiedBy || null : null; rec.verifyNote = prev ? prev.verifyNote || '' : ''; }
      if (q.col === 'logs') lockLog(rec, prev);
      else rec.createdAt = prev ? prev.createdAt : (rec.createdAt || nowISO());
      if (q.col === 'projects') rec = mergeProject(rec, prev);
      if (q.col === 'projects' && a.role !== 'admin') {
        const protect = (next, old) => { if (!next) return; delete next.readiness; delete next.readinessAt; if (old?.readiness) { next.readiness = old.readiness; next.readinessAt = old.readinessAt; } };
        protect(rec.data?.final, prev?.data?.final);
        for (const [uid, final] of Object.entries(rec.data?.final?.byUser || {})) protect(final, prev?.data?.final?.byUser?.[uid]);
      }
      if (q.col === 'chats') rec.captureChecked = prev?.captureChecked || {};
      rec.updatedAt = nowISO();
      await store.put(q.col, rec);
      let evidence = [], portfolio = null;
      if (q.col === 'chats') { const captured = await captureChat(a, rec); evidence = captured.logs; portfolio = captured.portfolio; }
      if (q.col === 'logs' && a.role === 'learner') portfolio = await ensurePortfolio(a.uid);
      return send(res, 200, { data: shape(q.col, rec, a), evidence, portfolio });
    }
    if (req.method === 'DELETE') {
      if (HIDDEN.includes(q.col)) throw Object.assign(new Error('알 수 없는 컬렉션'), { status: 400 });
      const prev = await store.get(q.col, q.id);
      if (!prev) return send(res, 200, { ok: true });
      if (q.col === 'logs' && a.role !== 'admin') throw Object.assign(new Error('판단 기록은 지울 수 없습니다 (고치기만 가능)'), { status: 403 });
      await checkWrite(q.col, prev, prev, a);
      await store.del(q.col, q.id);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST') {
      if (a.role !== 'admin') throw Object.assign(new Error('운영진만 할 수 있습니다'), { status: 403 });
      if (q.action === 'reset' || q.action === 'import') {
        const b = await readBody(req);
        let next;
        if (q.action === 'import') { if (!b || !b.data) throw Object.assign(new Error('data가 필요합니다'), { status: 400 }); next = b.data; }
        else next = b.empty ? emptySeed() : loadSeed();
        await resetKeepingAdmins(store, next);
        return send(res, 200, { ok: true });
      }
      if (q.action === 'export') {
        const out = {};
        for (const c of COLLECTIONS.filter(c => !['creds', 'quotas'].includes(c))) out[c] = await store.list(c);
        return send(res, 200, { data: out });
      }
    }
    send(res, 400, { error: '지원하지 않는 요청' });
  } catch (e) { fail(res, e); }
}

// 초기화·가져오기를 해도 지금 운영진 계정과 모든 비밀번호는 유지 (운영진이 잠기지 않게)
async function resetKeepingAdmins(store, next) {
  const admins = (await store.list('users')).filter(u => u.role === 'admin');
  const creds = await store.list('creds');
  const data = { ...next, users: [...(next.users || [])] };
  for (const u of admins) if (!data.users.some(x => x.id === u.id)) data.users.push(u);
  const ids = new Set(data.users.map(u => u.id));
  data.creds = creds.filter(c => ids.has(c.id));
  await store.resetAll(data);
}

// 빈 상태: 설정·Case·지식·아카이브 같은 기본 콘텐츠만 남기고 사람 데이터는 비움
function emptySeed() {
  const s = loadSeed();
  const keep = ['cases', 'settings', 'knowledge', 'archive'];
  const out = {};
  for (const c of COLLECTIONS) out[c] = keep.includes(c) ? s[c] : [];
  out.users = (s.users || []).filter(u => u.role === 'admin');
  out.cohorts = (s.cohorts || []).slice(0, 1).map(c => ({ ...c, teams: (c.teams || []).map(t => ({ ...t, members: [] })) }));
  out.assignments = (s.assignments || []).filter(x => out.cohorts.some(c => c.id === x.cohortId));
  return out;
}
