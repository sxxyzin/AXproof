import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
const port = 34000 + Math.floor(Math.random() * 1500), base = 'http://127.0.0.1:' + port;
const env = { ...process.env, PORT: String(port), VERCEL: '1', AXP_TEST_MODE: '1', AXP_DEMO: '1', AXP_SECRET: crypto.randomBytes(32).toString('hex'), AXP_ADMIN_CODE: 'platform-test-only', OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' };
const server = spawn(process.execPath, ['server.js'], { env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let output = ''; server.stdout.on('data', d => { output += d; }); server.stderr.on('data', d => { output += d; });
let count = 0;
async function call(url, body, token, method) { const r = await fetch(base + url, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json() }; }
async function check(name, fn) { await fn(); count++; console.log('OK ' + name); }
const login = async id => (await call('/api/auth', { action: 'demo', userId: id })).body.token;
try {
  let ready = false; for (let i = 0; i < 50; i++) { try { if ((await call('/api/health')).status === 200) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 100)); }
  assert(ready, output);
  const learner = await login('usr_seojin'), mentor = await login('usr_mentor'), admin = await login('usr_admin'), student = await login('usr_school_student'), teacher = await login('usr_school_teacher'), guardian = await login('usr_school_guardian');
  await check('소개 영상 형식·구간 재생·잘못된 Range 처리', async () => {
    const url = base + '/assets/media/axproof-walkthrough.mp4';
    const full = await fetch(url); assert.equal(full.status, 200); assert.equal(full.headers.get('Content-Type'), 'video/mp4'); const bytes = Buffer.from(await full.arrayBuffer());
    const part = await fetch(url, { headers: { Range: 'bytes=0-63' } }); assert.equal(part.status, 206); assert.equal(part.headers.get('Content-Range'), 'bytes 0-63/' + bytes.length); assert(Buffer.from(await part.arrayBuffer()).equals(bytes.subarray(0, 64)));
    const suffix = await fetch(url, { headers: { Range: 'bytes=-20' } }); assert.equal(suffix.status, 206); assert(Buffer.from(await suffix.arrayBuffer()).equals(bytes.subarray(-20)));
    assert.equal((await fetch(url, { headers: { Range: 'bytes=' + bytes.length + '-' } })).status, 416);
    const head = await fetch(url, { method: 'HEAD' }); assert.equal(head.headers.get('Content-Length'), String(bytes.length)); assert.equal((await head.text()).length, 0);
  });
  await check('기존 가입·로그인·팀 프로젝트 점검', async () => { const r = spawnSync(process.execPath, ['scripts/smoke-test.js'], { env, encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stdout + r.stderr); });
  let data = (await call('/api/store?all=1', null, learner)).body.data;
  await check('초대 코드·초중고 개인정보 비노출', async () => { assert(data.cohorts.every(c => !c.mentorCode && !c.inviteCode)); assert(!data.users.some(u => u.role === 'student')); assert(!('schoolAttempts' in data)); });
  await check('멘토의 운영진 역할 변경 방지', async () => { const me = (await call('/api/store?col=users&id=usr_mentor', null, mentor)).body.data; const r = await call('/api/store?col=users', { ...me, role: 'admin' }, mentor, 'PUT'); assert.equal(r.body.data.role, 'mentor'); });
  await check('타인 프로젝트를 공개 포트폴리오에 연결할 수 없음', async () => { const all = (await call('/api/store?all=1', null, admin)).body.data; const other = all.projects.find(p => p.userId !== 'usr_seojin' && !(p.members || []).includes('usr_seojin')); assert.equal((await call('/api/store?col=portfolios', { id: 'pf_bad', userId: 'usr_seojin', public: true, projectIds: [other.id], picks: [] }, learner, 'PUT')).status, 403); });
  const decision = 'AI가 제안한 숫자는 출처를 확인할 수 없기 때문에 사용하지 않기로 결정했어요.';
  const chat = { id: 'chat_test_auto', userId: 'usr_seojin', projectId: 'prj_seojin', mode: 'mentor', messages: [{ id: 'm1', role: 'user', content: decision }, { role: 'assistant', content: 'AI가 대신 한 판단은 기록하면 안 됩니다.' }] };
  let logId;
  await check('사용자 판단 원문 자동 포착·포트폴리오 연결', async () => { const r = await call('/api/store?col=chats', chat, learner, 'PUT'); assert.equal(r.status, 200); assert.equal(r.body.evidence.length, 1); assert.equal(r.body.evidence[0].text, decision); assert.equal(r.body.portfolio.userId, 'usr_seojin'); logId = r.body.evidence[0].id; });
  await check('재저장·재시도 중복 기록 방지', async () => { await call('/api/evidence', { chatId: chat.id }, learner); const logs = (await call('/api/store?col=logs', null, learner)).body.data; assert.equal(logs.filter(l => l.id === logId).length, 1); });
  await check('일반 질문·AI 답은 사용자 판단으로 기록하지 않음', async () => { const r = await call('/api/store?col=chats', { ...chat, id: 'chat_no_decision', messages: [{ role: 'user', content: '보고서를 어떻게 쓰면 좋을까요?' }, { role: 'assistant', content: decision }] }, learner, 'PUT'); assert.equal(r.body.evidence.length, 0); });
  await check('자동 수집 기록의 공개는 명시적으로 고른 뒤에만', async () => { const pf = (await call('/api/store?col=portfolios', null, learner)).body.data[0]; await call('/api/store?col=portfolios', { ...pf, public: true }, learner, 'PUT'); assert(!(await call('/api/public?portfolio=' + pf.id)).body.logs.some(l => l.id === logId)); await call('/api/store?col=portfolios', { ...pf, public: true, picks: [...pf.picks, logId] }, learner, 'PUT'); assert((await call('/api/public?portfolio=' + pf.id)).body.logs.some(l => l.id === logId)); });
  await check('Readiness 서버 생성과 클라이언트 덮어쓰기 차단', async () => { const r = await call('/api/ai', { task: 'readiness', projectId: 'prj_seojin', messages: [{ role: 'user', content: 'ignored' }] }, learner); assert.equal(r.status, 200); assert.equal(JSON.parse(r.body.text).provenance.generatedBy, 'server'); const p = (await call('/api/store?col=projects&id=prj_seojin', null, learner)).body.data; p.data.final.readiness = { levels: { forged: 99 } }; const saved = await call('/api/store?col=projects', p, learner, 'PUT'); assert.equal(saved.body.data.data.final.readiness.provenance.generatedBy, 'server'); });
  let session;
  let obRequest, obPayload;
  await check('OB 리뷰 명시적 참여·자료 소유권·별도 접근 권한', async () => {
    assert.equal((await call('/api/ob-reviews', null, learner)).body.directory.length, 0);
    assert.equal((await call('/api/ob-reviews', null, student)).status, 403);
    assert.equal((await call('/api/store?col=mentorReviews', null, mentor)).status, 400);
    assert.equal((await call('/api/store?col=mentorReviewPrefs', { id: 'usr_mentor', enabled: true }, admin, 'PUT')).status, 400);
    const p = await call('/api/ob-reviews', { action: 'preferences', enabled: true, monthlyLimit: 1, minutes: 10, scope: 'HRD의 문제 정의와 판단 이유' }, mentor); assert.equal(p.status, 200);
    const directory = (await call('/api/ob-reviews', null, learner)).body.directory; assert.equal(directory.length, 1); assert.equal(directory[0].remaining, 1); assert(!directory[0].email);
    obPayload = { action: 'request', mentorProfileId: directory[0].id, projectId: 'prj_seojin', contextType: '플랫폼 훈련', focus: '판단 검토', artifactSummary: '인재개발 교육 과제에서 실제 업무 문제를 비교하고 출처가 확인되는 지표로 결과물을 만들었습니다.', question: '이 지표를 선택한 이유가 현업에서도 충분히 설득력 있나요?', decisionNote: '', logIds: [logId], shareConsent: true };
    assert.equal((await call('/api/ob-reviews', { ...obPayload, shareConsent: false }, learner)).status, 400);
    assert.equal((await call('/api/ob-reviews', { ...obPayload, artifactUrl: 'javascript:alert(1)' }, learner)).status, 400);
    const all = (await call('/api/store?all=1', null, admin)).body.data; assert(!('mentorReviews' in all));
    const otherLog = all.logs.find(l => l.userId !== 'usr_seojin');
    assert.equal((await call('/api/ob-reviews', { ...obPayload, logIds: [otherLog.id] }, learner)).status, 403);
    const r = await call('/api/ob-reviews', obPayload, learner); assert.equal(r.status, 200); obRequest = r.body.data; assert.equal(obRequest.status, 'pending'); assert.equal(obRequest.snapshot.logs[0].text, decision); assert(!obRequest.snapshot.messages);
    assert.equal((await call('/api/ob-reviews', obPayload, learner)).status, 409);
    await call('/api/store?col=users', { id: 'ob_other', name: '다른 멘토', role: 'mentor', demo: true }, admin, 'PUT');
    const otherToken = await login('ob_other'); assert.equal((await call('/api/ob-reviews', null, otherToken)).body.reviews.length, 0);
    assert.equal((await call('/api/ob-reviews', { action: 'accept', id: obRequest.id }, otherToken)).status, 404);
    assert.equal((await call('/api/ob-reviews', { action: 'accept', id: obRequest.id }, learner)).status, 403);
  });
  await check('OB 수락 한도·원본과 분리된 사본·간편 조언', async () => {
    const log = (await call('/api/store?col=logs&id=' + logId, null, learner)).body.data;
    await call('/api/store?col=logs', { ...log, text: '원본을 나중에 수정한 문장입니다.' }, learner, 'PUT');
    assert.equal((await call('/api/ob-reviews', null, mentor)).body.reviews[0].snapshot.logs[0].text, decision);
    assert.equal((await call('/api/ob-reviews', { action: 'accept', id: obRequest.id }, mentor)).status, 200);
    assert.equal((await call('/api/ob-reviews', { action: 'accept', id: obRequest.id }, mentor)).status, 200);
    assert.equal((await call('/api/ob-reviews', null, learner)).body.directory[0].remaining, 0);
    const feedback = { action: 'complete', id: obRequest.id, strength: '지표의 출처를 먼저 확인한 판단이 좋습니다.', checkpoint: '이 지표가 교육 목표를 설명하는지도 확인하세요.', nextAction: '다른 지표와 비교한 표를 한 장 만들어 보세요.', publicConsent: false };
    const done = await call('/api/ob-reviews', feedback, mentor); assert.equal(done.status, 200); assert.equal(done.body.data.status, 'completed'); assert.equal(done.body.data.mentorPublic, false);
    assert.equal((await call('/api/ob-reviews', obPayload, learner)).status, 409);
    const original = (await call('/api/store?col=logs&id=' + logId, null, learner)).body.data; assert.equal(original.verifiedBy, null);
  });
  await check('OB·YB 양쪽 공개 동의·철회·회고 원문 보존과 중복 방지', async () => {
    const pf = (await call('/api/store?col=portfolios', null, learner)).body.data[0];
    assert.equal((await call('/api/public?portfolio=' + pf.id)).body.mentorFeedback.length, 0);
    assert.equal((await call('/api/ob-reviews', { action: 'publicConsent', id: obRequest.id, enabled: true }, learner)).status, 200);
    assert.equal((await call('/api/public?portfolio=' + pf.id)).body.mentorFeedback.length, 0);
    await call('/api/ob-reviews', { action: 'publicConsent', id: obRequest.id, enabled: true }, mentor);
    const pub = (await call('/api/public?portfolio=' + pf.id)).body.mentorFeedback; assert.equal(pub.length, 1); assert(!pub[0].snapshot && !pub[0].question && !pub[0].learnerId);
    await call('/api/ob-reviews', { action: 'publicConsent', id: obRequest.id, enabled: false }, mentor);
    assert.equal((await call('/api/public?portfolio=' + pf.id)).body.mentorFeedback.length, 0);
    const reflection = '교육 목표와의 관계도 확인해야 하므로 다른 지표 두 개를 비교한 표를 추가하겠습니다.';
    for (let n = 0; n < 2; n++) assert.equal((await call('/api/ob-reviews', { action: 'reflect', id: obRequest.id, reflection }, learner)).status, 200);
    await call('/api/ob-reviews', { action: 'reflect', id: obRequest.id, reflection: reflection + ' 그리고 표본의 한계도 적겠습니다.' }, learner);
    const logs = (await call('/api/store?col=logs', null, learner)).body.data.filter(l => l.id === 'ob_reflection_' + obRequest.id); assert.equal(logs.length, 1); assert.equal(logs[0].original, reflection); assert.equal(logs[0].edited, true); assert.equal(logs[0].verifiedBy, null);
    assert(!(await call('/api/ob-reviews', null, mentor)).body.reviews[0].reflection);
    const disabled = await call('/api/ob-reviews', { action: 'preferences', enabled: false, monthlyLimit: 1, minutes: 10, scope: '' }, mentor); assert.equal(disabled.status, 200);
    assert.equal((await call('/api/ob-reviews', null, learner)).body.directory.length, 0);
  });
  await check('공유시간 일정·참여·발표·질문·피드백·회고', async () => { session = (await call('/api/sharing', { action: 'create', cohortId: 'coh_20', title: '테스트 공유시간', startsAt: new Date().toISOString(), venue: '교실', agenda: '발표와 회고' }, admin)).body.data; assert.equal((await call('/api/sharing', { action: 'join', sessionId: session.id }, learner)).status, 200); for (const type of ['발표', '질문', '피드백', '회고']) assert.equal((await call('/api/sharing', { action: 'entry', sessionId: session.id, type, content: '동료의 원문 대조 방법을 들었습니다.', nextAction: '출처를 확인하기 때문에 자료 선택 기준을 바꾸겠습니다.', projectId: 'prj_seojin' }, learner)).status, 200); assert((await call('/api/store?col=logs', null, learner)).body.data.some(l => l.source === '공유시간 회고')); });
  await check('학생의 범용 AI·성인 데이터 접근 차단', async () => { assert.equal((await call('/api/ai', { messages: [] }, student)).status, 403); assert.equal((await call('/api/store?col=projects&id=prj_seojin', null, student)).status, 404); });
  let attemptId;
  await check('내 생각을 쓰기 전 AI 예시 열람 차단', async () => { const t = await call('/api/school', { action: 'start', missionId: 'mission_snack' }, student); assert.equal(t.status, 200); attemptId = t.body.data.id; assert.equal((await call('/api/school', { action: 'reveal', attemptId }, student)).status, 400); const boot = await call('/api/school', null, student); assert(!boot.body.missions.some(m => m.aiExample)); });
  await check('초중고 미션 전체 흐름·최초 생각 원문 보존', async () => { assert.equal((await call('/api/school', { action: 'think', attemptId, thoughts: '20명과 준비물 비용을 모두 비교하겠습니다.' }, student)).status, 200); assert.equal((await call('/api/school', { action: 'reveal', attemptId }, student)).status, 200); assert.equal((await call('/api/school', { action: 'think', attemptId, thoughts: '뒤늦게 바꾸기' }, student)).status, 409); assert.equal((await call('/api/school', { action: 'submit', attemptId, comparison: '전체 비용 6만 원은 예산보다 많습니다.', choice: '고쳐서 쓰기', reason: '가격표를 보고 1000원 간식으로 바꾸고 준비물 1만 원을 남기겠습니다.' }, student)).status, 200); });
  await check('교사 관찰·초안은 검토 전 보호자에게 비공개', async () => { assert.equal((await call('/api/school', { action: 'observe', attemptId, observations: { '조건 확인': '스스로 수행' }, teacherNote: '학생이 인원과 총액을 스스로 확인했습니다.' }, teacher)).status, 200); assert.equal((await call('/api/school', { action: 'draftReport', attemptId }, teacher)).status, 200); assert.equal((await call('/api/school', null, guardian)).body.reports.length, 0); });
  await check('교사가 확인한 리포트만 연결된 보호자 열람', async () => { assert.equal((await call('/api/school', { action: 'approveReport', attemptId, nextPractice: '왜 골랐는지 질문하기' }, teacher)).status, 200); assert.equal((await call('/api/school', null, guardian)).body.reports.length, 1); assert.equal((await call('/api/school', { action: 'approveReport', attemptId }, guardian)).status, 403); });
  await check('보호자 동의 철회 즉시 학생 미션·리포트 차단', async () => { assert.equal((await call('/api/school', { action: 'withdrawConsent', consentId: 'consent_demo' }, guardian)).status, 200); assert.equal((await call('/api/school', { action: 'start', missionId: 'mission_source' }, student)).status, 403); assert.equal((await call('/api/school', null, guardian)).body.reports.length, 0); });
  await check('학교 실계정 등록·보호자 연결·동의·교사 확인', async () => {
    const c = (await call('/api/school', { action: 'createClass', name: '실계정 점검 반', level: '초5–6' }, admin)).body.data;
    const enroll = async (role, guardianId) => call('/api/school', { action: 'enroll', classId: c.id, role, name: '점검 ' + role, email: role + '@school.axproof.test', password: 'SchoolTest2026!', ageBand: '초5–6', guardianId }, admin);
    assert.equal((await enroll('teacher')).status, 200); const g = await enroll('guardian'); assert.equal(g.status, 200); const s = await enroll('student', g.body.user.id); assert.equal(s.status, 200);
    const realLogin = async role => (await call('/api/auth', { action: 'login', email: role + '@school.axproof.test', password: 'SchoolTest2026!' })).body.token;
    const gt = await realLogin('guardian'), st = await realLogin('student'), tt = await realLogin('teacher');
    assert.equal((await call('/api/school', { action: 'start', missionId: 'mission_snack' }, st)).status, 403);
    const consent = (await call('/api/school', null, gt)).body.consents[0];
    assert.equal((await call('/api/school', { action: 'consent', consentId: consent.id }, gt)).status, 200);
    assert.equal((await call('/api/school', { action: 'verifyConsent', consentId: consent.id, verificationNote: '담당자의 오프라인 확인 절차 기록' }, tt)).status, 200);
    assert.equal((await call('/api/school', { action: 'start', missionId: 'mission_snack' }, st)).status, 200);
    assert.equal((await call('/api/school', { action: 'requestDeletion', consentId: consent.id }, gt)).status, 200);
    assert.equal((await call('/api/school', { action: 'deleteStudent', consentId: consent.id }, tt)).status, 403);
    assert.equal((await call('/api/school', { action: 'deleteStudent', consentId: consent.id }, admin)).status, 200);
    assert.equal((await call('/api/school', null, st)).status, 401);
  });
  await check('비밀번호 초기화 코드 확인·기존 로그인 만료', async () => {
    const email = 'reset@axproof.test', signup = { action: 'signup', code: 'LINKUS20', name: '초기화 점검', email, password: 'ResetTest2026', consents: { terms: true, logs: true } };
    const registered = (await call('/api/auth', signup)).body;
    const reset = await call('/api/auth', { action: 'resetPassword', userId: registered.user.id }, admin);
    assert.equal((await call('/api/store?all=1', null, registered.token)).status, 401);
    assert.equal((await call('/api/auth', signup)).status, 403);
    assert.equal((await call('/api/auth', { ...signup, resetCode: reset.body.resetCode })).status, 200);
  });
  await check('외부 수집의 사설 주소·허용하지 않은 도메인 차단', async () => {
    for (const url of ['http://127.0.0.1/', 'http://localhost/', 'http://[::1]/', 'https://not-allowed.example/']) assert.equal((await call('/api/fetch-url', { url }, admin)).status, 400);
  });
  console.log('\n' + count + '개 통합 시나리오 통과 (기존 점검 21개 포함). 실제 AI 비용과 운영 데이터 변경 없음.');
} finally { server.kill(); }
