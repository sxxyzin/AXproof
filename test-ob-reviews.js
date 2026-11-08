// 동시 수락·만료 등 실제 계정으로 재현하면 안 되는 경계 조건을 격리해서 확인합니다.
import assert from 'node:assert/strict';
import '../public/assets/js/ob-review-rules.js';
const rules = globalThis.AXP_OB_RULES, records = new Map(), clone = x => x == null ? null : JSON.parse(JSON.stringify(x));
const store = {
  async get(col, id) { return clone(records.get(col + ':' + id)); },
  async list(col) { return [...records.entries()].filter(([k]) => k.startsWith(col + ':')).map(([, r]) => clone(r)); },
  async put(col, r) { records.set(col + ':' + r.id, clone(r)); return r; },
  async del(col, id) { records.delete(col + ':' + id); },
  async consume(key, limit) { const r = records.get('quotas:' + key) || { id: key, count: 0 }; if (r.count >= limit) return false; r.count++; records.set('quotas:' + key, r); return true; }
};
let clock = '2026-11-08T03:00:00.000Z', seq = 0;
const utils = { now: () => clock, uid: () => 'r_' + (++seq), ensurePortfolio: async () => {} };
const m = { uid: 'm', role: 'mentor' }, y1 = { uid: 'y1', role: 'learner' }, y2 = { uid: 'y2', role: 'learner' };
for (const u of [{ id: 'm', role: 'mentor', name: '선배', cohortId: 'old' }, { id: 'y1', role: 'learner', name: '후배1', cohortId: 'new' }, { id: 'y2', role: 'learner', name: '후배2', cohortId: 'other' }]) await store.put('users', u);
await store.put('mentors', { id: 'mp', userId: 'm', role: '기획자' });
const act = (a, b) => rules.act(store, a, b, utils);
const preferences = limit => act(m, { action: 'preferences', enabled: true, monthlyLimit: limit, minutes: 5, scope: '프로젝트의 문제 정의' });
const payload = { action: 'request', mentorProfileId: 'mp', title: '업무 개선 프로젝트', contextType: '개인 프로젝트', focus: '산출물 방향', artifactSummary: '사용자의 불편을 인터뷰하고 결과물의 적용 범위를 정리한 개인 프로젝트입니다.', question: '이 판단에서 추가로 확인해야 할 제약은 무엇일까요?', decisionNote: '이번에는 검증 가능한 범위를 먼저 골라서 작은 실험부터 시작하기로 했습니다.', logIds: [], shareConsent: true };
await preferences(1);
const expired = await act(y1, payload);
clock = '2026-11-16T03:00:00.000Z';
assert.equal((await rules.bootstrap(store, m, clock)).reviews[0].status, 'expired');
await assert.rejects(act(m, { action: 'accept', id: expired.id }), e => e.status === 409);
console.log('OK 7일 대기 만료·만료 요청 수락 차단');

const a = await act(y1, payload), b = await act(y2, payload);
assert.equal((await rules.bootstrap(store, m, clock)).reviews.length, 3);
const result = await Promise.allSettled([act(m, { action: 'accept', id: a.id }), act(m, { action: 'accept', id: b.id })]);
assert.equal(result.filter(r => r.status === 'fulfilled').length, 1);
assert.equal((await store.get('quotas', 'ob-slot:m:2026-11')).count, 1);
const accepted = (await store.list('mentorReviews')).find(r => r.status === 'accepted'), pending = (await store.list('mentorReviews')).find(r => r.status === 'pending' && r.id !== expired.id);
await act(m, { action: 'accept', id: accepted.id });
assert.equal((await store.get('quotas', 'ob-slot:m:2026-11')).count, 1);
await preferences(2); await act(m, { action: 'accept', id: pending.id });
assert.equal((await store.get('quotas', 'ob-slot:m:2026-11')).count, 2);
console.log('OK 기수가 다른 OB·YB 요청·동시 수락의 월 한도·재시도 중복 방지·한도 상향 후 재수락');

const owner = accepted.learnerId === 'y1' ? y1 : y2;
await act(owner, { action: 'cancel', id: accepted.id });
assert.equal((await store.get('quotas', 'ob-slot:m:2026-11')).count, 2);
await assert.rejects(act(m, { action: 'complete', id: accepted.id, strength: '좋은 판단입니다', checkpoint: '근거를 더 확인하세요', nextAction: '다른 자료와 비교하세요' }), e => e.status === 409);
console.log('OK 수락 후 취소·월 한도 유지·취소된 요청에 조언 차단');

clock = '2026-12-01T03:00:00.000Z';
const pendingOwner = pending.learnerId === 'y1' ? y1 : y2;
await act(pendingOwner, { action: 'cancel', id: pending.id });
const decline = await act(y1, payload); await act(m, { action: 'decline', id: decline.id, note: '' });
assert.equal((await store.get('mentorReviews', decline.id)).status, 'declined');
assert.equal((await rules.bootstrap(store, y1, clock)).directory[0].remaining, 2);
for (let i = 0; i < 2; i++) { const r = await act(y1, payload); await act(y1, { action: 'cancel', id: r.id }); }
await assert.rejects(act(y1, payload), e => e.status === 429);
console.log('OK 월 전환·사유 없는 거절·취소로 요청 한도 우회 차단');
console.log('OB 리뷰 경계 조건 통과. 외부 요청·운영 DB 변경 없음.');
