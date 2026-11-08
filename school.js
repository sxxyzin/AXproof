import crypto from 'node:crypto';
import { db } from './_lib/db.js';
import { readBody, query, send, fail, requireUser, uid, nowISO } from './_lib/util.js';
import { generate, keyFor } from './_lib/providers.js';
import { aiSettings, logUsage } from './ai.js';
import { takeAIQuota } from './_lib/quota.js';

const failWith = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (v, max = 4000) => String(v || '').trim().slice(0, max);
const fields = ['조건 확인', '근거 대조', '선택 이유', '피드백 대응'];
const levels = ['미확인', '도움을 받은 뒤 수행', '스스로 수행'];
const belongs = (c, a) => a.role === 'admin' || (c.teacherIds || []).includes(a.uid) || (c.studentIds || []).includes(a.uid) || (c.guardianIds || []).includes(a.uid);
const teaches = (c, a) => a.role === 'admin' || (a.role === 'teacher' && (c.teacherIds || []).includes(a.uid));
async function consentFor(studentId) { return (await db().list('schoolConsents')).find(c => c.studentId === studentId && c.status === 'verified'); }
async function classroom(id, a) { const c = await db().get('schoolClasses', id); if (!c || !belongs(c, a)) failWith(404, '접근할 수 없는 반입니다'); return c; }
async function attemptFor(id, a, teacher = false) {
  const t = await db().get('schoolAttempts', id);
  if (!t) failWith(404, '학습 기록이 없습니다');
  const c = await classroom(t.classId, a);
  if (teacher ? !teaches(c, a) : !(teaches(c, a) || t.userId === a.uid)) failWith(403, '이 학습 기록을 바꿀 수 없습니다');
  return { t, c };
}
export default async function handler(req, res) {
  try {
    const a = await requireUser(req);
    const user = await db().get('users', a.uid);
    if (!user || user.role !== a.role) failWith(401, '다시 로그인해 주세요');
    const store = db();
    if (req.method === 'GET') {
      const classes = (await store.list('schoolClasses')).filter(c => belongs(c, a));
      const ids = new Set(classes.map(c => c.id));
      const consents = (await store.list('schoolConsents')).filter(c => ids.has(c.classId) && (a.role === 'admin' || a.role === 'teacher' || c.guardianId === a.uid || c.studentId === a.uid));
      const childIds = new Set(consents.filter(c => c.guardianId === a.uid && c.status === 'verified').map(c => c.studentId));
      const attempts = (await store.list('schoolAttempts')).filter(t => ids.has(t.classId) && (a.role === 'admin' || a.role === 'teacher' || t.userId === a.uid));
      const reports = (await store.list('schoolReports')).filter(r => ids.has(r.classId) && (a.role === 'admin' || a.role === 'teacher' || (r.approvedAt && (r.studentId === a.uid || childIds.has(r.studentId)))));
      const missions = (await store.list('schoolMissions')).filter(m => (!m.classId || ids.has(m.classId)) && (m.reviewed || ['teacher', 'admin'].includes(a.role))).map(m => {
        if (['teacher', 'admin'].includes(a.role)) return m;
        const { aiExample, ...safe } = m; return safe;
      });
      const visibleUserIds = new Set([a.uid]);
      if (['teacher', 'admin'].includes(a.role)) classes.forEach(c => [...(c.teacherIds || []), ...(c.studentIds || []), ...(c.guardianIds || [])].forEach(id => visibleUserIds.add(id)));
      if (a.role === 'guardian') consents.filter(c => c.guardianId === a.uid).forEach(c => visibleUserIds.add(c.studentId));
      const users = (await store.list('users')).filter(u => visibleUserIds.has(u.id)).map(u => ({ id: u.id, name: u.name, role: u.role, ageBand: u.ageBand || '' }));
      return send(res, 200, { classes, consents, attempts, reports, missions, users });
    }
    if (req.method !== 'POST') return send(res, 405, { error: '지원하지 않는 요청' });
    const b = await readBody(req);
    if (b.action === 'createClass') {
      if (a.role !== 'admin') failWith(403, '운영진만 반을 만들 수 있습니다');
      if (!text(b.name)) failWith(400, '반 이름을 적어 주세요');
      const c = { id: uid('cls'), name: text(b.name, 80), level: text(b.level, 30) || '초5–6', teacherIds: [], studentIds: [], guardianIds: [], createdAt: nowISO() };
      await store.put('schoolClasses', c); return send(res, 200, { data: c });
    }
    if (b.action === 'enroll') {
      const c = await classroom(b.classId, a);
      if (!teaches(c, a)) failWith(403, '담당 교사만 학생을 등록할 수 있습니다');
      const role = ['teacher', 'guardian', 'student'].includes(b.role) ? b.role : 'student';
      if (a.role !== 'admin' && role !== 'student') failWith(403, '성인 계정은 운영진이 등록합니다');
      const email = text(b.email, 200).toLowerCase(), name = text(b.name, 30), password = String(b.password || '');
      if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) failWith(400, '이름·로그인 이메일과 영문·숫자를 포함한 12자 이상 임시 비밀번호가 필요합니다');
      if ((await store.list('users')).some(u => u.email === email)) failWith(409, '이미 등록한 이메일입니다');
      const guardian = role === 'student' ? await store.get('users', b.guardianId) : null;
      if (role === 'student' && (!guardian || guardian.role !== 'guardian' || !(c.guardianIds || []).includes(guardian.id))) failWith(400, '이 반의 보호자 계정을 먼저 연결해 주세요');
      const u = { id: uid('usr'), role, name, email, audience: 'school', ageBand: text(b.ageBand, 30), schoolClassId: c.id, createdAt: nowISO(), authVersion: 1 };
      const salt = crypto.randomBytes(16).toString('hex');
      await store.put('users', u); await store.put('creds', { id: u.id, salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });
      const key = role === 'student' ? 'studentIds' : role === 'teacher' ? 'teacherIds' : 'guardianIds';
      c[key] = [...new Set([...(c[key] || []), u.id])]; await store.put('schoolClasses', c);
      if (guardian) await store.put('schoolConsents', { id: 'consent_' + u.id, classId: c.id, studentId: u.id, guardianId: guardian.id, status: 'requested', createdAt: nowISO() });
      return send(res, 200, { user: { id: u.id, name, role }, message: guardian ? '보호자 동의와 교사 확인 후 미션이 열립니다' : '계정이 등록됐습니다' });
    }
    if (b.action === 'deleteStudent') {
      if (a.role !== 'admin') failWith(403, '운영진만 삭제 요청을 처리할 수 있습니다');
      const consent = await store.get('schoolConsents', b.consentId);
      if (!consent?.deletionRequestedAt) failWith(400, '보호자의 삭제 요청을 먼저 확인해 주세요');
      for (const col of ['schoolAttempts', 'schoolReports']) for (const r of await store.list(col)) if (r.userId === consent.studentId || r.studentId === consent.studentId) await store.del(col, r.id);
      const c = await store.get('schoolClasses', consent.classId); if (c) { c.studentIds = (c.studentIds || []).filter(id => id !== consent.studentId); await store.put('schoolClasses', c); }
      await store.del('creds', consent.studentId); await store.del('users', consent.studentId); await store.del('schoolConsents', consent.id);
      return send(res, 200, { ok: true });
    }
    if (b.action === 'consent' || b.action === 'verifyConsent' || b.action === 'withdrawConsent' || b.action === 'requestDeletion') {
      const consent = await store.get('schoolConsents', b.consentId);
      if (!consent) failWith(404, '동의 기록이 없습니다');
      const c = await classroom(consent.classId, a);
      if (b.action === 'verifyConsent') {
        if (!teaches(c, a) || !consent.acceptedAt || !text(b.verificationNote)) failWith(400, '보호자 동의 후 확인 방법을 남겨 주세요');
        consent.status = 'verified'; consent.verifiedAt = nowISO(); consent.verifiedBy = a.uid; consent.verificationNote = text(b.verificationNote, 500);
      } else {
        if (consent.guardianId !== a.uid) failWith(403, '연결된 보호자만 동의를 변경할 수 있습니다');
        if (b.action === 'consent' && consent.deletionRequestedAt) failWith(409, '삭제 요청 처리 중입니다. 운영진에게 문의해 주세요');
        consent.status = b.action === 'withdrawConsent' || b.action === 'requestDeletion' ? 'withdrawn' : 'accepted';
        if (b.action === 'requestDeletion') consent.deletionRequestedAt = nowISO();
        if (b.action === 'consent') { consent.acceptedAt = nowISO(); consent.noticeVersion = 'school-2026-11'; }
        consent.verifiedAt = null;
      }
      await store.put('schoolConsents', consent); return send(res, 200, { data: consent });
    }
    if (b.action === 'saveMission') {
      if (!['teacher', 'admin'].includes(a.role)) failWith(403, '교사만 수업을 검토할 수 있습니다');
      const c = await classroom(b.classId, a); if (!teaches(c, a)) failWith(403, '담당 반이 아닙니다');
      const m = { id: uid('mission'), classId: c.id, title: text(b.title, 100), level: text(b.level, 30), conditions: text(b.conditions), resources: text(b.resources), aiExample: text(b.aiExample), question: text(b.question), reviewed: true, reviewedBy: a.uid, reviewedAt: nowISO() };
      if (![m.title, m.conditions, m.resources, m.aiExample, m.question].every(Boolean)) failWith(400, '조건·자료·AI 예시·점검 질문을 모두 검토해 주세요');
      await store.put('schoolMissions', m); return send(res, 200, { data: m });
    }
    if (b.action === 'start') {
      if (a.role !== 'student') failWith(403, '학생 계정에서 미션을 시작해 주세요');
      const consent = await consentFor(a.uid); if (!consent) failWith(403, '보호자 동의와 교사 확인 후 시작할 수 있어요');
      const c = await classroom(consent.classId, a), mission = await store.get('schoolMissions', b.missionId);
      if (!mission || !mission.reviewed || (mission.classId && mission.classId !== c.id)) failWith(404, '검토된 미션이 없습니다');
      const existing = (await store.list('schoolAttempts')).find(t => t.userId === a.uid && t.missionId === mission.id && !t.submittedAt);
      const t = existing || { id: uid('attempt'), classId: c.id, userId: a.uid, missionId: mission.id, phase: 0, thoughts: '', comparison: '', choice: '', reason: '', observations: {}, createdAt: nowISO() };
      await store.put('schoolAttempts', t); return send(res, 200, { data: t });
    }
    if (['think', 'reveal', 'submit', 'observe', 'draftReport', 'approveReport'].includes(b.action)) {
      const { t, c } = await attemptFor(b.attemptId, a, ['observe', 'draftReport', 'approveReport'].includes(b.action));
      if (['think', 'reveal', 'submit'].includes(b.action)) {
        if (a.role !== 'student' || t.userId !== a.uid || !(await consentFor(a.uid))) failWith(403, '동의된 학생 본인만 미션을 진행할 수 있어요');
        if (t.submittedAt) failWith(409, '이미 마친 미션입니다');
      }
      if (b.action === 'think') {
        if (t.aiSeenAt) failWith(409, 'AI를 보기 전에 적은 원문은 보존됩니다');
        t.thoughts = text(b.thoughts); if (t.thoughts.length < 5) failWith(400, '먼저 지켜야 할 조건과 내 생각을 적어 주세요'); t.phase = 1;
      }
      if (b.action === 'reveal') {
        if (!t.thoughts || t.phase < 1) failWith(400, '내 생각을 먼저 적어 주세요');
        const m = await store.get('schoolMissions', t.missionId); if (!m || !m.reviewed) failWith(409, '선생님의 검토가 필요해요');
        t.aiSeenAt = t.aiSeenAt || nowISO(); t.revealedExample = m.aiExample; t.phase = 2;
      }
      if (b.action === 'submit') {
        if (!t.aiSeenAt) failWith(400, '내 생각과 AI 예시를 먼저 비교해 주세요');
        t.comparison = text(b.comparison); t.choice = text(b.choice, 30); t.reason = text(b.reason);
        if (!t.comparison || !t.reason || !['그대로 쓰기', '고쳐서 쓰기', '더 확인하기'].includes(t.choice)) failWith(400, '비교한 근거와 선택 이유를 적어 주세요');
        t.phase = 3; t.submittedAt = nowISO();
      }
      if (b.action === 'observe') {
        if (!t.submittedAt) failWith(400, '마친 미션부터 관찰해 주세요');
        t.observations = Object.fromEntries(fields.map(k => [k, levels.includes(b.observations?.[k]) ? b.observations[k] : '미확인']));
        t.teacherNote = text(b.teacherNote); t.observedBy = a.uid; t.observedAt = nowISO();
      }
      if (b.action === 'draftReport') {
        if (!t.observedAt) failWith(400, '교사의 관찰 기록을 먼저 남겨 주세요');
        let nextPractice = '다음 미션에서는 조건과 자료를 먼저 비교하고, 왜 골랐는지 한 문장으로 말해 보세요.';
        const cfg = await aiSettings(); const provider = keyFor(cfg.provider) ? cfg.provider : '';
        if (provider) {
          await takeAIQuota(a);
          const out = await generate({ provider, model: cfg.models[provider].quick, effort: 'low', maxTokens: 1200,
            system: '아이의 실제 말과 교사의 관찰만 바탕으로 다음 연습 한 가지와 보호자가 할 질문 한 가지를 한국어 두 문장으로 제안한다. 진단·점수·순위·성격 추정·새로운 사실은 만들지 않는다. 이름 등 개인정보는 입력되지 않는다.',
            messages: [{ role: 'user', content: JSON.stringify({ quote: t.reason, observations: t.observations, teacherNote: t.teacherNote }) }] });
          nextPractice = out.text; await logUsage(a, 'school_report', provider, out.model, out.usage);
        }
        const r = { id: 'report_' + t.id, attemptId: t.id, classId: c.id, studentId: t.userId, quote: t.reason, thoughts: t.thoughts, observations: t.observations, teacherNote: t.teacherNote, nextPractice, status: '검토 대기', draftedBy: a.uid, aiAssisted: !!provider, updatedAt: nowISO() };
        await store.put('schoolReports', r); return send(res, 200, { data: r });
      }
      if (b.action === 'approveReport') {
        const r = await store.get('schoolReports', 'report_' + t.id);
        if (!r || !(await consentFor(t.userId))) failWith(400, '동의와 리포트 초안을 확인해 주세요');
        r.teacherNote = text(b.teacherNote || r.teacherNote); r.nextPractice = text(b.nextPractice || r.nextPractice);
        r.status = '교사 확인 완료'; r.approvedAt = nowISO(); r.approvedBy = a.uid;
        await store.put('schoolReports', r); return send(res, 200, { data: r });
      }
      t.updatedAt = nowISO(); await store.put('schoolAttempts', t); return send(res, 200, { data: t });
    }
    failWith(400, '지원하지 않는 요청입니다');
  } catch (e) { fail(res, e); }
}
