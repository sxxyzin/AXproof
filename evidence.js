import { readBody, send, fail, requireUser } from './_lib/util.js';
import { db } from './_lib/db.js';
import { captureChat } from './_lib/capture.js';
export default async function handler(req, res) {
  try {
    const a = await requireUser(req, ['learner']);
    if (req.method !== 'POST') return send(res, 405, { error: 'POST만 지원합니다' });
    const b = await readBody(req);
    const chat = await db().get('chats', b.chatId);
    if (!chat || chat.userId !== a.uid) return send(res, 404, { error: '대화를 찾을 수 없습니다' });
    const result = await captureChat(a, chat);
    send(res, 200, { chat, evidence: result.logs, portfolio: result.portfolio });
  } catch (e) { fail(res, e); }
}
