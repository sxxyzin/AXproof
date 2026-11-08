// /api/settings — 운영진 전용 AI 설정 (모델·effort·API 키)
//  GET  : 현재 설정 + 키 연결 상태(키 값은 절대 돌려주지 않음)
//  POST {ai, anthropicKey?, openaiKey?}  : 저장 (키는 로컬 실행 시 data/secrets.json, 배포 시 환경변수 사용)
//  POST {action:'test', provider}        : 연결 테스트
import { readBody, send, fail, requireUser, setLocalSecret, secretSource, IS_SERVERLESS, nowISO } from './_lib/util.js';
import { db } from './_lib/db.js';
import { generate, keyFor } from './_lib/providers.js';
import { aiSettings } from './ai.js';
import { takeAIQuota } from './_lib/quota.js';

function keyStatus() {
  return {
    anthropic: { connected: !!keyFor('anthropic'), source: secretSource('ANTHROPIC_API_KEY') },
    openai: { connected: !!keyFor('openai'), source: secretSource('OPENAI_API_KEY') },
    canSaveKeys: !IS_SERVERLESS
  };
}

export default async function handler(req, res) {
  try {
    const auth = await requireUser(req, ['admin']);
    if (req.method === 'GET') return send(res, 200, { ai: await aiSettings(), keys: keyStatus() });
    if (req.method !== 'POST') return send(res, 405, { error: '지원하지 않는 요청' });
    const b = await readBody(req);
    if (b.action === 'test') {
      const cfg = await aiSettings();
      const provider = b.provider === 'anthropic' ? 'anthropic' : 'openai';
      if (!keyFor(provider)) return send(res, 503, { error: '키가 연결되지 않았습니다' });
      await takeAIQuota(auth);
      const t0 = Date.now();
      const out = await generate({ provider, model: cfg.models[provider].quick, effort: provider === 'openai' ? cfg.openaiEffort.quick : 'low', system: '한 문장으로만 답한다.', messages: [{ role: 'user', content: 'AX Proof 연결 테스트입니다. "연결됐어요"라고만 답해 주세요.' }] });
      return send(res, 200, { ok: true, reply: out.text.trim(), model: out.model, ms: Date.now() - t0 });
    }
    if (b.anthropicKey !== undefined) setLocalSecret('ANTHROPIC_API_KEY', String(b.anthropicKey || '').trim());
    if (b.openaiKey !== undefined) setLocalSecret('OPENAI_API_KEY', String(b.openaiKey || '').trim());
    if (b.ai) {
      const prev = (await db().get('settings', 'ai')) || { id: 'ai', createdAt: nowISO() };
      const next = { ...prev, ...b.ai, id: 'ai', updatedAt: nowISO() };
      await db().put('settings', next);
    }
    send(res, 200, { ai: await aiSettings(), keys: keyStatus() });
  } catch (e) { fail(res, e); }
}
