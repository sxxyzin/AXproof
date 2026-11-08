import { db } from './_lib/db.js';
import { requireUser, readBody, send, fail, nowISO, uid } from './_lib/util.js';
import { ensurePortfolio } from './_lib/capture.js';
import '../public/assets/js/ob-review-rules.js';

export default async function handler(req, res) {
  try {
    const a = await requireUser(req, ['learner', 'mentor', 'admin']), store = db(), rules = globalThis.AXP_OB_RULES;
    if (req.method === 'GET') return send(res, 200, await rules.bootstrap(store, a, nowISO()));
    if (req.method !== 'POST') return send(res, 405, { error: 'GET 또는 POST만 지원합니다.' });
    const data = await rules.act(store, a, await readBody(req), { now: nowISO, uid, ensurePortfolio });
    return send(res, 200, { data: rules.view(data, a, nowISO()) });
  } catch (e) { fail(res, e); }
}
