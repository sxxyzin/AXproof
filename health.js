// GET /api/health — 서버 상태(저장소 종류, AI 키 연결 여부)
import { send, IS_SERVERLESS, getSecret } from './_lib/util.js';
import { db } from './_lib/db.js';
import { keyFor } from './_lib/providers.js';
import { demoEnabled } from './auth.js';

export default async function handler(req, res) {
  try {
  await db().list('settings');
  send(res, 200, {
    ok: true,
    app: 'axproof',
    version: '1.2.0',
    store: db().kind,
    serverless: IS_SERVERLESS,
    demo: demoEnabled(),
    ai: { anthropic: !!keyFor('anthropic'), openai: !!keyFor('openai') },
    configurationReady: db().kind === 'supabase' && getSecret('AXP_SECRET').length >= 32 && getSecret('AXP_ADMIN_CODE').length >= 12 && !demoEnabled() && !!keyFor('openai')
  });
  } catch { send(res, 503, { ok: false, app: 'axproof', error: '데이터베이스 연결과 서버 환경변수를 확인해 주세요' }); }
}
