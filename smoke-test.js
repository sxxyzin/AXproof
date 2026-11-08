// API 동작 점검: npm start 로 서버를 띄운 뒤 다른 창에서 npm run check
const BASE = process.env.AXP_URL || 'http://localhost:' + (process.env.PORT || 3000);
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✕ ') + m); if (!c) process.exitCode = 1; };

const j = async (path, opts = {}) => {
  const r = await fetch(BASE + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const post = (path, body, headers) => j(path, { method: 'POST', body: JSON.stringify(body), headers });

console.log('AX Proof 점검 →', BASE);
const h = await j('/api/health');
ok(h.status === 200 && h.body.app === 'axproof', '서버 응답 (저장소: ' + h.body.store + ', GPT 키: ' + h.body.ai?.openai + ', Claude 키: ' + h.body.ai?.anthropic + ')');

const anon = await j('/api/store?all=1');
ok(anon.status === 401, '로그인 없이 데이터 접근 차단');

const info = await j('/api/auth');
ok(info.status === 200 && Array.isArray(info.body.tracks), '로그인 화면 정보 (진행 중 기수: ' + (info.body.cohort ? info.body.cohort.name : '없음') + ')');

// 가입 → 로그인 (초대 코드는 로컬 기본 예시 데이터 기준)
const code = process.env.AXP_TEST_CODE || 'LINKUS20';
const chk = await post('/api/auth', { action: 'checkCode', code });
if (chk.status === 200) {
  ok(chk.body.role === 'learner', '초대 코드 확인 → 훈련생 · 직무팀 ' + (chk.body.teams || []).length + '개');
  const email = 'smoke_' + Date.now() + '@axproof.test';
  const weak = await post('/api/auth', { action: 'signup', code, name: '점검용', email, password: 'short', consents: { terms: true, logs: true } });
  ok(weak.status === 400, '약한 비밀번호 거절');
  const noConsent = await post('/api/auth', { action: 'signup', code, name: '점검용', email, password: 'axproof1234', consents: { terms: true } });
  ok(noConsent.status === 400, '필수 동의 없으면 가입 거절');
  const team = (chk.body.teams || [])[0];
  const su = await post('/api/auth', { action: 'signup', code, name: '점검용', email, password: 'axproof1234', track: 'HRD', teamId: team && team.id, consents: { terms: true, logs: true } });
  ok(su.status === 200 && su.body.token, '가입 성공' + (team ? ' (' + team.name + ')' : ''));
  const dup = await post('/api/auth', { action: 'signup', code, name: '점검용', email, password: 'axproof1234', consents: { terms: true, logs: true } });
  ok(dup.status === 409, '같은 이메일 중복 가입 거절');
  const bad = await post('/api/auth', { action: 'login', email, password: 'wrongpass1' });
  ok(bad.status === 401, '틀린 비밀번호 거절');
  const li = await post('/api/auth', { action: 'login', email, password: 'axproof1234', remember: true });
  ok(li.status === 200 && li.body.user.email === email, '이메일·비밀번호 로그인');
  const mine = await j('/api/store?all=1', { headers: { Authorization: 'Bearer ' + li.body.token } });
  ok(!('creds' in mine.body.data), '비밀번호 해시는 API로 노출되지 않음');
  ok(mine.body.data.users.filter(u => u.email).every(u => u.email === email), '다른 사람의 이메일은 보이지 않음');
} else console.log('  · 초대 코드 ' + code + '가 없어 가입 점검은 건너뜁니다 (AXP_TEST_CODE로 지정)');

if (h.body.demo) {
  const login = await post('/api/auth', { action: 'demo', userId: 'usr_seojin' });
  ok(login.status === 200 && login.body.token, '데모 훈련생(우서진) 로그인');
  const auth = { Authorization: 'Bearer ' + login.body.token };
  const all = await j('/api/store?all=1', { headers: auth });
  const myP = new Set(all.body.data.projects.map(p => p.id));
  ok(all.status === 200 && all.body.data.projects.every(p => p.userId === 'usr_seojin' || (p.members || []).includes('usr_seojin')), '훈련생은 본인·소속 팀 프로젝트만 조회');
  ok(all.body.data.logs.some(l => l.userId !== 'usr_seojin' && myP.has(l.projectId)) && all.body.data.logs.every(l => l.userId === 'usr_seojin' || myP.has(l.projectId)), '같은 직무팀 프로젝트의 팀원 기록은 보이고, 다른 기록은 안 보임');
  const forged = await j('/api/store?col=logs', { method: 'PUT', headers: auth, body: JSON.stringify({ id: 'log_smoke', userId: 'usr_seojin', projectId: 'prj_seojin', stage: 'run', kind: 'AI 검증', source: '판단 카드', text: '점검용', verifiedBy: 'usr_mentor' }) });
  ok(forged.status === 200 && !forged.body.data.verifiedBy, '훈련생이 보낸 "멘토 확인" 값은 무시');
  const edited = await j('/api/store?col=logs', { method: 'PUT', headers: auth, body: JSON.stringify({ ...forged.body.data, text: '점검용 (수정)' }) });
  ok(edited.body.data.edited === true && edited.body.data.original === '점검용', '판단 기록 수정 시 원본 보존 + 직접 수정 표시');
  const del = await j('/api/store?col=logs&id=log_smoke', { method: 'DELETE', headers: auth });
  ok(del.status === 403, '훈련생은 판단 기록 삭제 불가');
  const tp = all.body.data.projects.find(p => p.id === 'prj_team_hrd');
  if (tp) {
    const mine2 = { ...tp, data: { ...tp.data, prep: { ...tp.data.prep, goal: '점검: prep만 수정' } }, _touch: ['prep'] };
    const saved = await j('/api/store?col=projects', { method: 'PUT', headers: auth, body: JSON.stringify(mine2) });
    ok(saved.status === 200 && saved.body.data.data.talk && saved.body.data.data.prep.goal.startsWith('점검'), '팀 프로젝트는 바뀐 단계만 저장 (다른 단계 보존)');
  }
  const cfg = await j('/api/store?col=settings', { method: 'PUT', headers: auth, body: JSON.stringify({ id: 'ai', provider: 'anthropic' }) });
  ok(cfg.status === 403, '훈련생은 설정 변경 불가');
  const ai = await post('/api/ai', { task: 'smoke', tier: 'quick', system: '한 단어로만 답한다.', messages: [{ role: 'user', content: '안녕' }] }, auth);
  ok(ai.status === 200 || ai.status === 503, 'AI 중계 ' + (ai.status === 200 ? '실제 응답(' + ai.body.provider + '): ' + ai.body.text : '(키 없음 → 앱은 데모 응답 사용)'));
} else console.log('  · 데모 로그인이 꺼져 있어 권한 점검은 건너뜁니다');
