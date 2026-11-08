// 실제 브라우저 시각 검증과 별도로, 화면 렌더 함수의 실행 오류를 잡는 최소 DOM 스텁입니다.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
class Element {
  constructor() { this.innerHTML = ''; this.style = {}; this.nodes = new Map(); this.classList = { add() {}, toggle() {} }; this.value = ''; }
  querySelector(key) { if (!this.nodes.has(key)) this.nodes.set(key, new Element()); return this.nodes.get(key); }
  querySelectorAll() { return []; }
  setAttribute() {} addEventListener() {} appendChild() {} focus() {}
  text() { return this.innerHTML + [...this.nodes.values()].map(n => n.text()).join(''); }
}
const local = new Map(), document = new Element(); document.getElementById = key => document.querySelector('#' + key); document.createElement = () => new Element();
const context = { console, setTimeout, clearTimeout, URL, AbortController, document, location: { protocol: 'file:', hash: '', search: '', href: 'file:///app.html', pathname: '/app.html' }, localStorage: { getItem: k => local.get(k) || null, setItem: (k, v) => local.set(k, v), removeItem: k => local.delete(k) }, addEventListener() {}, scrollTo() {} };
context.window = context; vm.createContext(context);
for (const f of ['seed', 'decision-rules', 'ob-review-rules', 'core', 'prompts', 'ai', 'evidence', 'ui']) vm.runInContext(fs.readFileSync('public/assets/js/' + f + '.js', 'utf8'), context, { filename: f });
const routes = [], A = context.AXP; A.route = (role, path, render) => routes.push({ role, path, render });
for (const f of ['chat', 'project', 'learner', 'mentor', 'admin', 'sharing', 'school', 'ob-reviews']) vm.runInContext(fs.readFileSync('public/assets/js/' + f + '.js', 'utf8'), context, { filename: f });
await A.DB.load();
for (const [role, uid, path, expected] of [
  ['learner', 'usr_seojin', '#/portfolio', '내 판단 자동 수집함'],
  ['learner', 'usr_seojin', '#/sharing', '이번 시간에 나눌 이야기'],
  ['learner', 'usr_seojin', '#/ob-review', '지금 참여 중인 OB'],
  ['mentor', 'usr_mentor', '#/m/ob-reviews', '내가 가능한 만큼 참여하기'],
  ['admin', 'usr_admin', '#/a/ob-reviews', '리뷰 운영 현황'],
  ['student', 'usr_school_student', '#/school', '오늘의 생각 미션'],
  ['teacher', 'usr_school_teacher', '#/school', '수업 운영'],
  ['guardian', 'usr_school_guardian', '#/school', '우리 아이의 생각'],
  ['admin', 'usr_admin', '#/school', '계정 등록·연결']
]) {
  A.Session.set('demo', A.DB.get('users', uid)); const el = new Element(); routes.find(r => r.role === role && r.path === path).render(el, {}); await new Promise(r => setTimeout(r, 0));
  assert(el.text().includes(expected), role + ' 화면: ' + el.text().slice(-400)); assert(!el.text().includes('undefined'), role + ' 미정의 값'); console.log('OK ' + role + ' ' + path + ' 렌더');
}
for (const match of fs.readFileSync('public/app.html', 'utf8').matchAll(/<script src="([^"]+)"/g)) assert(fs.existsSync('public/' + match[1]), match[1]);
A.Session.set('demo', A.DB.get('users', 'usr_seojin'));
const prep = new Element(); routes.find(r => r.role === 'learner' && r.path === '#/project/:id/:stage').render(prep, { id: 'prj_seojin', stage: 'prep' });
assert(prep.text().includes('AI로 질문 초안 생성')); assert(prep.text().includes('기본 질문 틀'));
console.log('OK 인터뷰 준비의 질문 초안 생성·기본 질문 틀 렌더');
const workspace = prep.querySelector('#stageBox'), project = A.DB.get('projects', 'prj_seojin'), before = project.data.prep.questions.slice(), logsBefore = A.DB.all('logs').length;
A.toast = () => {};
const example = A.TASKS.q_generate.mock({}); example._ai = { mode: 'model', model: 'test-model' };
A.AI.run = async task => { assert.equal(task, 'q_generate'); return example; };
await workspace.querySelector('#generateQ').onclick();
const stored = A.DB.get('projects', project.id);
assert.deepEqual(stored.data.prep.questions, before); assert.equal(A.DB.all('logs').length, logsBefore);
const draftBox = workspace.querySelector('#qDraft'), check = new Element(); check.checked = true; check.disabled = false; check.getAttribute = () => '0';
draftBox.querySelectorAll = key => key === '[data-draft-q]' ? [check] : [];
draftBox.querySelector('#qDraftReason').value = '실제 업무 시간을 확인해야 개선 범위를 정할 수 있기 때문입니다.';
await draftBox.querySelector('#applyDraftQ').onclick();
const changed = A.DB.get('projects', project.id).data.prep;
assert(before.every(q => changed.questions.includes(q))); assert(changed.questions.includes(example.items[0].question));
assert.equal(A.DB.all('logs').length, logsBefore + 1);
assert(A.DB.all('logs').at(-1).text.includes('개선 범위를 정할 수 있기 때문'));
console.log('OK 생성만으로 판단을 추가하지 않음·기존 질문 보존·선택 이유 기록');
A.Session.set('demo', A.DB.get('users', 'usr_mentor'));
await A.OB.act({ action: 'preferences', enabled: true, monthlyLimit: 2, minutes: 10, scope: '기획 판단과 검증 근거' });
A.Session.set('demo', A.DB.get('users', 'usr_seojin'));
const directory = (await A.OB.load()).directory; assert.equal(directory.length, 1);
const request = await A.OB.act({ action: 'request', mentorProfileId: directory[0].id, title: '데모 개선 프로젝트', contextType: '개인 프로젝트', focus: '판단 검토', artifactSummary: '외부 프로젝트에서 사용자의 요청과 실제 수행 조건을 비교하고 작은 개선 실험을 정리했습니다.', question: '이 선택의 이유에서 보완해야 할 지점이 있을까요?', decisionNote: '사용자의 실제 행동을 먼저 검증해야 하므로 작은 실험을 골랐습니다.', logIds: [], shareConsent: true });
A.Session.set('demo', A.DB.get('users', 'usr_mentor'));
await A.OB.act({ action: 'accept', id: request.id });
await A.OB.act({ action: 'complete', id: request.id, strength: '검증 범위를 좁힌 판단이 좋습니다.', checkpoint: '실험 조건을 좀 더 구체화해 주세요.', nextAction: '작은 사용자 실험을 먼저 해 보세요.', publicConsent: false });
A.Session.set('demo', A.DB.get('users', 'usr_seojin'));
await A.OB.act({ action: 'reflect', id: request.id, reflection: '사용자가 언제 어려워하는지 확인해야 하므로 실험 조건부터 구체화하겠습니다.' });
assert(A.DB.get('logs', 'ob_reflection_' + request.id));
const obDetail = new Element(); await routes.find(r => r.role === 'learner' && r.path === '#/ob-review/:id').render(obDetail, { id: request.id });
assert(obDetail.text().includes('선배가 남긴 짧은 조언')); assert(obDetail.text().includes('공개 포트폴리오 표시')); assert(!obDetail.text().includes('undefined'));
console.log('OK 파일 데모 역할 전환·참여·요청·수락·조언·포트폴리오 회고 저장·상세 렌더');
console.log('화면 11개 렌더·모든 앱 스크립트 경로 검증 통과. 실제 브라우저 시각 검증은 별도입니다.');
