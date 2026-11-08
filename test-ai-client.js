// 실제 프롬프트와 공통 AI 클라이언트를 함께 실행합니다. 외부 API는 호출하지 않습니다.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const local = new Map(), badges = [{ textContent: '', className: '' }];
const context = { console, setTimeout, clearTimeout, AbortController, TextDecoder,
  location: { protocol: 'file:' }, document: { querySelectorAll: () => badges },
  localStorage: { getItem: k => local.get(k) || null, setItem: (k, v) => local.set(k, v), removeItem: k => local.delete(k) } };
context.window = context; vm.createContext(context);
for (const file of ['seed', 'decision-rules', 'core', 'prompts', 'ai']) vm.runInContext(fs.readFileSync('public/assets/js/' + file + '.js', 'utf8'), context, { filename: file });
const A = context.AXP; await A.DB.load();
A.Session.set('test-token', A.DB.get('users', 'usr_seojin'));
const c = A.DB.get('cases', 'case_hrd'), p = A.DB.get('projects', 'prj_seojin');
const ctx = { case: c, project: p, projectId: p.id, user: A.Session.user, stage: 'prep', level: 'together', logs: [], messages: [{ role: 'user', content: 'Test message' }],
  goal: '교육 운영의 반복 업무를 확인해서 개선 주제를 결정한다', research: '교육 담당자는 매주 의견을 정리한다', questions: ['반복 업무는 무엇인가요?'], job: '교육 운영', issue: '서술형 의견 분석',
  part: 'job', track: 'HRD', text: '교육 담당자의 업무를 조사했습니다', transcript: '사용자: 출처가 없기 때문에 AI 숫자는 쓰지 않겠습니다', pains: [{ text: '의견 정리 반복', evidence: '매주 정리한다', kind: '사실' }],
  table: '후보 비교', why: '시간을 측정할 수 있어서', drop: '비용 때문에 보류', planText: '목표: 샘플 20건 확인', week: 1, topic: '교육 의견 분석', schedule: '매주 확인', out: '분류표', did: '원문 대조',
  history: '출처가 없어 AI 숫자는 쓰지 않기로 했다', report: '원문과 비교했다', source: 'AI 대화', notes: '매주 의견을 정리한다', title: '교육 운영', sourceType: '인터뷰', task: '안전한 요청 작성',
  checklist: ['목적', '검증'], answer: '개인정보를 지우고 원문을 대조한다', to: 'HRD 담당자', message: '30분 인터뷰를 요청합니다', picks: '원문과 대조했다', list: [] };
const draft = A.TASKS.q_generate.mock(ctx), requests = [];
let failure = 0;
context.fetch = async (url, opts) => {
  if (url === 'api/health') return new Response(JSON.stringify({ app: 'axproof', ai: { openai: true, anthropic: false } }));
  const body = JSON.parse(opts.body); requests.push(body);
  assert.equal(opts.headers.Authorization, 'Bearer test-token');
  if (failure) return new Response(JSON.stringify({ error: 'Provider temporarily unavailable' }), { status: failure });
  if (body.stream) return new Response('Live streamed response');
  return new Response(JSON.stringify({ text: body.task === 'q_generate' ? JSON.stringify(draft) : body.json ? '{"api":true}' : 'Live response', provider: 'openai', model: 'configured-model' }));
};
A.Mode.server = true; A.Mode.health = { ai: { openai: false, anthropic: false } };
const originalMocks = {};
for (const [task, definition] of Object.entries(A.TASKS)) {
  originalMocks[task] = definition.mock;
  definition.mock = () => { throw new Error(task + ' unexpectedly used a demo response'); };
  const result = await A.AI.run(task, ctx);
  assert.equal(requests.at(-1).task, task);
  assert.equal(requests.at(-1).tier, definition.tier);
  if (task === 'q_generate') assert.equal(result._ai.mode, 'model');
}
assert.equal(requests.length, Object.keys(A.TASKS).length); assert(badges[0].textContent.includes('GPT'));
console.log('OK 모든 AI 작업 ' + requests.length + '개의 실제 프롬프트·공통 API 전달 (오래된 미연결 상태 갱신 포함)');
A.Mode.health.ai.openai = false;
let streamed = ''; assert.equal(await A.AI.stream('mentor_chat', ctx, text => { streamed = text; }), 'Live streamed response');
assert.equal(streamed, 'Live streamed response'); console.log('OK 채팅도 변경된 키 상태를 확인한 뒤 스트리밍');
failure = 503;
await assert.rejects(() => A.AI.run('q_review', ctx), e => e.status === 503);
await assert.rejects(() => A.AI.stream('mentor_chat', ctx, () => {}), e => e.status === 503);
assert(A.Mode.health.ai.openai); console.log('OK 일시적 API 장애를 데모 성공으로 숨기지 않음');
assert.throws(() => A.TASKS.q_generate.validate({ note: '', items: [{ question: '누락' }] }));
A.TASKS.q_generate.validate(draft); console.log('OK 질문 초안 형식 검증');
A.Mode.server = false; A.TASKS.q_generate.mock = originalMocks.q_generate;
assert.equal((await A.AI.run('q_generate', ctx))._ai.mode, 'demo');
console.log('OK 서버 없는 파일 데모에는 데모 예시 표시');
