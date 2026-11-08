import { db } from './_lib/db.js';
import { readBody, send, fail, requireUser, nowISO, uid } from './_lib/util.js';
import { ensurePortfolio } from './_lib/capture.js';
export default async function handler(req, res) {
  try {
    const a = await requireUser(req, ['learner', 'mentor', 'admin']); const b = await readBody(req), store = db();
    if (req.method !== 'POST') return send(res, 405, { error: 'POST만 지원합니다' });
    const user = await store.get('users', a.uid);
    if (b.action === 'create') {
      if (a.role !== 'admin') return send(res, 403, { error: '운영진만 모임을 열 수 있습니다' });
      if (!b.title || !b.startsAt || !b.cohortId || !await store.get('cohorts', b.cohortId) || !Number.isFinite(new Date(b.startsAt).getTime())) return send(res, 400, { error: '모임명·기수·일정을 확인해 주세요' });
      const s = { id: uid('session'), cohortId: b.cohortId, title: String(b.title).slice(0, 120), startsAt: new Date(b.startsAt).toISOString(), venue: String(b.venue || '').slice(0, 300), agenda: String(b.agenda || '').slice(0, 3000), format: b.format === '온라인' ? '온라인' : '오프라인', status: '예정', participants: [], createdAt: nowISO() };
      await store.put('sharingSessions', s); return send(res, 200, { data: s });
    }
    const session = await store.get('sharingSessions', b.sessionId);
    if (!session || (a.role !== 'admin' && user.cohortId !== session.cohortId)) return send(res, 404, { error: '소속 모임을 찾을 수 없습니다' });
    if (b.action === 'join') {
      session.participants = [...new Set([...(session.participants || []), a.uid])]; await store.put('sharingSessions', session); return send(res, 200, { data: session });
    }
    if (b.action === 'complete') {
      if (a.role !== 'admin') return send(res, 403, { error: '운영진만 모임을 마칠 수 있습니다' });
      session.status = '완료'; await store.put('sharingSessions', session); return send(res, 200, { data: session });
    }
    if (b.action === 'entry') {
      if (!['발표', '질문', '피드백', '회고'].includes(b.type) || !String(b.content || '').trim()) return send(res, 400, { error: '활동과 내용을 적어 주세요' });
      let projectId = '';
      if (b.projectId) { const p = await store.get('projects', b.projectId); if (!p || !(p.userId === a.uid || (p.members || []).includes(a.uid))) return send(res, 403, { error: '내 프로젝트만 연결할 수 있습니다' }); projectId = p.id; }
      const entry = { id: uid('sharing'), sessionId: session.id, cohortId: session.cohortId, userId: a.uid, type: b.type, content: String(b.content).trim().slice(0, 5000), nextAction: String(b.nextAction || '').trim().slice(0, 2000), projectId, createdAt: nowISO() };
      if (entry.type === '회고' && !entry.nextAction) return send(res, 400, { error: '피드백을 듣고 바꿀 행동과 이유를 적어 주세요' });
      await store.put('sharingEntries', entry);
      if (entry.type === '회고' && a.role === 'learner') {
        const quote = entry.content + '\n다음 판단과 이유: ' + entry.nextAction;
        await store.put('logs', { id: 'log_' + entry.id, userId: a.uid, projectId, stage: 'sharing', kind: '방향 전환', source: '공유시간 회고', origin: 'sharing', ref: session.id, text: quote, original: quote, edited: false, verifiedBy: null, createdAt: nowISO() });
        await ensurePortfolio(a.uid);
      }
      return send(res, 200, { data: entry });
    }
    send(res, 400, { error: '지원하지 않는 요청' });
  } catch (e) { fail(res, e); }
}
