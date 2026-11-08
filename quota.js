import { db } from './db.js';
import { getSecret } from './util.js';
export async function takeAIQuota(auth) {
  const daily = Number(getSecret('AXP_AI_DAILY_LIMIT') || 120);
  const cap = Number.isFinite(daily) && daily > 0 ? Math.min(daily, 10000) : 120;
  const key = auth.uid + '_' + new Date().toISOString().slice(0, 10);
  if (!await db().consume(key, cap)) throw Object.assign(new Error('오늘의 AI 사용 한도에 도달했어요. 운영진에게 문의해 주세요.'), { status: 429 });
}
