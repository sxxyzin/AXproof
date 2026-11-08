// DOM 이벤트와 상태 전환 검증입니다. 실제 브라우저의 레이아웃·화면 캡처와는 구분합니다.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync('public/index.html', 'utf8');
class Element {
  constructor(attrs = '') {
    this.attrs = {}; this.events = {}; this.children = new Map(); this.value = ''; this.textContent = ''; this.innerHTML = 'initial'; this.tabIndex = 0; this.open = false;
    for (const m of attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) this.attrs[m[1]] = m[2] || '';
    this.hidden = Object.hasOwn(this.attrs, 'hidden'); this.disabled = Object.hasOwn(this.attrs, 'disabled');
    this.classes = new Set(); this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), toggle: (x, on) => on ? this.classes.add(x) : this.classes.delete(x) };
  }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'open') this.open = true; }
  getAttribute(k) { return this.attrs[k] ?? null; }
  removeAttribute(k) { delete this.attrs[k]; if (k === 'open') this.open = false; }
  addEventListener(k, fn) { (this.events[k] ||= []).push(fn); }
  emit(k, extras = {}) { const e = { target: this, preventDefault() {}, ...extras }; for (const fn of this.events[k] || []) fn.call(this, e); }
  querySelector(k) { if (!this.children.has(k)) this.children.set(k, new Element()); return this.children.get(k); }
  focus() { this.focused = true; }
  scrollIntoView() {}
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  play() { this.played = true; return Promise.resolve(); }
  pause() { this.paused = true; }
}
function boot(reduced = false) {
  const nodes = new Map(), buttons = [];
  for (const m of html.matchAll(/<[a-z][a-z0-9-]*\b([^>]*\bid="([^"]+)"[^>]*)>/g)) { assert(!nodes.has(m[2]), '중복 ID ' + m[2]); nodes.set(m[2], new Element(m[1])); }
  for (const m of html.matchAll(/<button\b([^>]*)>/g)) { const id = m[1].match(/\bid="([^"]+)"/); buttons.push(id ? nodes.get(id[1]) : new Element(m[1])); }
  const doc = new Element(); doc.body = new Element(); doc.documentElement = new Element(); doc.hidden = false;
  doc.querySelectorAll = selector => selector.startsWith('[data-') ? buttons.filter(b => b.getAttribute(selector.slice(1, -1)) !== null) : [];
  doc.querySelector = selector => selector[0] === '#' ? nodes.get(selector.slice(1)) : doc.querySelectorAll(selector)[0];
  const timers = new Map(); let timerId = 0; const preference = { matches: reduced, addEventListener(k, fn) { this.changed = fn; } };
  const context = { console, document: doc, matchMedia: () => preference, setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), fetch() { throw new Error('홈페이지 체험은 외부 API를 호출하면 안 됩니다'); } };
  context.window = context; vm.createContext(context); vm.runInContext(fs.readFileSync('public/assets/js/landing.js', 'utf8'), context);
  return { nodes, buttons, doc, timers, preference, get: id => nodes.get(id), data: key => buttons.filter(b => b.getAttribute(key) !== null) };
}
const ui = boot(), get = ui.get;
assert.equal(ui.timers.size, 1); assert.equal(get('preview-0').hidden, false);
ui.data('data-preview')[2].emit('click'); assert.equal(get('preview-2').hidden, false); assert.equal(ui.timers.size, 0);
ui.data('data-preview')[2].emit('keydown', { key: 'ArrowLeft' }); assert.equal(get('preview-1').hidden, false);
get('previewPlay').emit('click'); assert.equal(ui.timers.size, 1);
ui.doc.hidden = true; ui.doc.emit('visibilitychange'); assert.equal(ui.timers.size, 0);
ui.doc.hidden = false; ui.doc.emit('visibilitychange'); assert.equal(ui.timers.size, 1);
console.log('OK 재생·일시정지·방향키·백그라운드 타이머 중지');
for (let i = 0; i < 4; i++) { ui.data('data-journey')[i].emit('click'); assert.equal(get('journey-' + i).hidden, false); }
get('menuToggle').emit('click'); assert.equal(get('menuToggle').getAttribute('aria-expanded'), 'true'); ui.doc.emit('keydown', { key: 'Escape' }); assert.equal(get('menuToggle').getAttribute('aria-expanded'), 'false');
console.log('OK 훈련 과정 4개 전환·모바일 메뉴');
ui.data('data-open-film')[0].emit('click'); assert(get('filmDialog').open); assert(get('serviceFilm').played); assert.equal(ui.timers.size, 0);
get('filmClose').emit('click'); assert(!get('filmDialog').open); assert(get('serviceFilm').paused); assert.equal(ui.timers.size, 1);
ui.preference.changed({ matches: true }); assert.equal(ui.timers.size, 0);
assert.equal(boot(true).timers.size, 0);
console.log('OK 실제 영상 열기·닫기·모션 감소 설정');
let paths = 0;
for (const scenario of ['hrd', 'service', 'marketing']) {
  get('scenarioSelect').value = scenario; get('scenarioSelect').emit('change');
  assert(get('simReason').disabled); assert(get('simRecord').disabled);
  for (const button of ui.data('data-choice')) {
    button.emit('click'); assert(!get('simReason').disabled); assert(get('simRecord').disabled);
    get('simReason').value = '근거를 직접 확인해야 결정할 수 있기 때문입니다. <img src=x onerror=alert(1)>';
    get('simReason').emit('input'); assert(!get('simRecord').disabled);
    get('simForm').emit('submit'); assert(!get('simResult').hidden); assert.equal(get('simResultReason').textContent, get('simReason').value);
    get('simReason').value = ''; get('simReason').emit('input'); paths++;
  }
}
get('simReset').emit('click'); assert(get('simResult').hidden); assert(get('simReason').disabled);
console.log('OK 직무 3개 × 선택 4개 체험·이유 필수·문자열 안전 표시·초기화 (' + paths + '개 경로)');
for (const m of html.matchAll(/(?:src|poster|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) if (!/^(https?:|data:)/.test(m[1])) assert(fs.existsSync('public/' + m[1]), m[1]);
for (const m of html.matchAll(/aria-controls="([^"]+)"/g)) assert(ui.nodes.has(m[1]), m[1]);
const movie = fs.readFileSync('public/assets/media/axproof-walkthrough.mp4'); assert.equal(movie.toString('ascii', 4, 8), 'ftyp'); assert(movie.indexOf('moov') < movie.indexOf('mdat'));
console.log('OK 모든 로컬 자산·탭 연결·스트리밍용 MP4 파일 검증');
