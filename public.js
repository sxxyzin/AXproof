// GET /api/public?portfolio=ID — 로그인 없이 보는 공개 포트폴리오 (본인이 공개로 켠 경우만)
import { send, fail, query } from './_lib/util.js';
import { db } from './_lib/db.js';
import '../public/assets/js/ob-review-rules.js';

export default async function handler(req, res) {
  try {
    const q = query(req);
    const store = db();
    const p = await store.get('portfolios', q.portfolio);
    if (!p || !p.public) return send(res, 404, { error: '공개되지 않은 포트폴리오입니다' });
    if (p.expiresAt && new Date(p.expiresAt) < new Date()) return send(res, 410, { error: '공유 기간이 끝났습니다' });
    const user = await store.get('users', p.userId);
    if (!user || user.role !== 'learner' || user.audience === 'school') return send(res, 404, { error: '공개할 수 없는 학습 기록입니다' });
    const cohort = user && user.cohortId ? await store.get('cohorts', user.cohortId) : null;
    const projects = (await store.list('projects')).filter(x => (p.projectIds || []).includes(x.id) && (x.userId === p.userId || (x.members || []).includes(p.userId)));
    const cases = await store.list('cases');
    const selected = new Set([...(p.picks || []), ...(p.publicLogIds || [])]);
    const logs = (await store.list('logs')).filter(l => l.userId === p.userId && !l.excludedFromPortfolio && selected.has(l.id));
    const reviews = (await store.list('reviews')).filter(r => r.learnerId === p.userId);
    send(res, 200, {
      portfolio: p,
      user: user ? { name: user.name, track: user.track || '', bio: user.bio || '' } : null,
      cohort: cohort ? { name: cohort.name, org: cohort.org } : null,
      projects: projects.map(x => ({
        id: x.id, title: x.title, caseTitle: (cases.find(c => c.id === x.caseId) || {}).title || '',
        company: (cases.find(c => c.id === x.caseId) || {}).company || '',
        stage: x.stage, topic: x.data && x.data.topic ? x.data.topic.pick : '',
        final: x.data && x.data.final ? { report: x.data.final.report, readiness: (x.data.final.byUser && x.data.final.byUser[p.userId] && x.data.final.byUser[p.userId].readiness) || x.data.final.readiness || null, links: x.data.final.links } : null,
        mode: x.mode, kind: x.kind || 'personal'
      })),
      logs: logs.map(l => ({ id: l.id, stage: l.stage, kind: l.kind, source: l.source, text: l.text, createdAt: l.createdAt, edited: l.edited, original: l.edited ? l.original : undefined, verifiedBy: l.verifiedBy || null, picked: (p.picks || []).includes(l.id) })),
      reviews: reviews.map(r => ({ stage: r.stage, rubric: r.rubric || null, verified: !!r.verified, mentorName: r.mentorName || '현직 멘토' })),
      mentorFeedback: globalThis.AXP_OB_RULES.publicFeedback(await store.list('mentorReviews'), p.userId)
    });
  } catch (e) { fail(res, e); }
}
