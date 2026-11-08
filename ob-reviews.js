(function () {
  'use strict';
  var A = window.AXP, U = A.U, DB = A.DB, D = A.D, h = A.h, esc = U.esc, rules = window.AXP_OB_RULES;
  var labels = { pending: '수락 대기', accepted: '리뷰 중', completed: '조언 도착', declined: '이번에는 어려워요', cancelled: '요청 취소', expired: '대기 종료' };
  function base() { return D.me().role === 'mentor' ? '#/m/ob-reviews' : D.me().role === 'admin' ? '#/a/ob-reviews' : '#/ob-review'; }
  function auth() { return { uid: D.me().id, role: D.me().role }; }
  var local = {
    list: function (c) { return Promise.resolve(DB.all(c)); },
    get: function (c, id) { return Promise.resolve(DB.get(c, id)); },
    del: function (c, id) { DB.data[c] = DB.all(c).filter(function (r) { return r.id !== id; }); DB.saveLocal(); return Promise.resolve(); },
    put: function (c, r) { var out = DB._local(c, JSON.parse(JSON.stringify(r))); DB.saveLocal(); return Promise.resolve(out); },
    consume: function (key, limit) { var r = DB.get('quotas', key) || { id: key, count: 0 }; if (r.count >= limit) return Promise.resolve(false); r.count++; return local.put('quotas', r).then(function () { return true; }); }
  };
  function load() { return A.Mode.server ? A.api('api/ob-reviews') : rules.bootstrap(local, auth(), U.now()); }
  function act(b) {
    var p = A.Mode.server ? A.api('api/ob-reviews', { method: 'POST', body: b }) : rules.act(local, auth(), b, { now: U.now, uid: U.uid, ensurePortfolio: function (id) {
      if (!DB.where('portfolios', function (x) { return x.userId === id; }).length) return local.put('portfolios', { id: 'pf_' + id, userId: id, public: false, headline: '', projectIds: [], picks: [] });
      return Promise.resolve();
    } }).then(function (data) { return { data: rules.view(data, auth(), U.now()) }; });
    return p.then(function (j) { return DB.load().then(function () { return j.data; }); });
  }
  function bindForm(el, selector, fn) {
    var form = U.$(selector, el); if (!form) return;
    form.onsubmit = function (e) { e.preventDefault(); var button = U.$('button[type=submit]', form); button.disabled = true;
      return Promise.resolve().then(function () { return fn(Object.fromEntries(new FormData(form)), form); }).catch(function (x) { A.toast(x.message, true); }).finally(function () { button.disabled = false; });
    };
  }
  function feedbackHTML(rows) {
    return rows.map(function (r) { var f = r.feedback; return '<article class="item mt12"><span class="badge green">OB 멘토 조언</span><h3 class="mt8">' + esc(r.projectTitle || r.snapshot.title) + '</h3><p class="small muted mt8">' + esc(r.mentorName) + ' · ' + esc(r.mentorRole) + '</p><p class="pre small mt12"><b>좋았던 판단</b>\n' + esc(f.strength) + '</p><p class="pre small mt12"><b>더 확인할 점</b>\n' + esc(f.checkpoint) + '</p><p class="pre small mt12"><b>다음 시도</b>\n' + esc(f.nextAction) + '</p></article>'; }).join('');
  }
  A.OB = { load: load, act: act, feedbackHTML: feedbackHTML, mountPortfolio: function (el) {
    if (!el) return;
    el.innerHTML = '<h3>OB·YB 멘토 리뷰</h3><p class="small muted mt8">조언을 불러오는 중…</p>';
    return load().then(function (j) { var rows = j.reviews.filter(function (r) { return r.status === 'completed'; });
      el.innerHTML = '<h3>OB·YB 멘토 리뷰</h3><p class="small muted mt8">완료 ' + rows.length + '건 · 기본 비공개. 리뷰 상세에서 조언과 내 회고를 함께 확인해요.</p>' + rows.slice(-3).map(function (r) { return '<p class="small mt12"><a href="#/ob-review/' + esc(r.id) + '">' + esc(r.snapshot.title) + ' · ' + esc(r.mentorName) + '</a></p>'; }).join('') + '<a class="btn soft sm mt16" href="#/ob-review">리뷰 요청·받은 조언 보기</a>';
    }).catch(function (e) { el.innerHTML = '<h3>OB·YB 멘토 리뷰</h3><p class="small mt8">' + esc(e.message) + '</p><a href="#/ob-review">다시 확인하기</a>'; });
  } };
  function prefsHTML(p) {
    return '<section class="card mt16"><h2>내가 가능한 만큼 참여하기</h2><p class="small muted mt8">기본은 참여 꺼짐입니다. 수락 전에는 일정 약속이 생기지 않아요. 거절 사유는 적지 않아도 됩니다. 참여를 꺼도 이미 수락한 리뷰는 남아요.</p><form id="obPrefs" class="stack mt16"><label class="check"><input name="enabled" type="checkbox"' + (p.enabled ? ' checked' : '') + '> YB의 간편 리뷰 요청 받기</label><div class="grid g2"><label>월 수락 한도<select name="monthlyLimit">' + [1, 2, 3, 4].map(function (n) { return '<option' + (p.monthlyLimit === n ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label><label>한 건에 낼 수 있는 시간<select name="minutes">' + [5, 10, 15].map(function (n) { return '<option value="' + n + '"' + (p.minutes === n ? ' selected' : '') + '>' + n + '분</option>'; }).join('') + '</select></label></div><label>도움 줄 수 있는 범위<input name="scope" maxlength="200" value="' + esc(p.scope) + '" placeholder="예: HRD 프로젝트 문제 정의, 교육 효과 지표"></label><button class="btn" type="submit">참여 설정 저장</button></form><p class="tiny muted mt12">월 한도는 한국 시간 기준 수락 건수입니다. 수락 후 취소된 건도 포함합니다.</p></section>';
  }
  function rowHTML(r) { return '<a class="card" href="' + base() + '/' + esc(r.id) + '"><div class="row between"><span class="badge ' + (r.status === 'completed' ? 'green' : '') + '">' + labels[r.status] + '</span><span class="tiny muted">' + U.fmt(r.createdAt) + '</span></div><h3 class="mt12">' + esc(r.snapshot.title) + '</h3><p class="small muted mt8">' + esc(r.learnerName) + ' → ' + esc(r.mentorName) + ' · ' + esc(r.focus) + '</p><p class="small mt8">' + esc(r.question) + '</p></a>'; }
  function compose(el, target) {
    var projects = D.myProjects(), logs = D.logsOf(D.me().id).filter(function (l) { return !l.excludedFromPortfolio; });
    el.innerHTML = '<section class="card mt16"><h2>' + esc(target.name) + ' OB에게 질문 하나 보내기</h2><p class="small muted mt8">약 ' + target.minutes + '분 안에 살펴볼 수 있는 자료로 준비해 주세요. 전체 포트폴리오나 AI 대화는 전달되지 않습니다.</p><form id="obCompose" class="stack mt16"><label>내 프로젝트<select name="projectId" id="obProject"><option value="">직접 입력 / 외부 프로젝트</option>' + projects.map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.title) + '</option>'; }).join('') + '</select></label><label id="obTitleWrap">프로젝트 제목<input name="title" maxlength="120" required></label><div class="grid g2"><label>경험 유형<select name="contextType"><option>플랫폼 훈련</option><option>개인 프로젝트</option><option>현업 프로젝트</option></select></label><label>리뷰 초점<select name="focus"><option>판단 검토</option><option>산출물 방향</option><option>포트폴리오 설명</option></select></label></div><label>결과물과 맥락 설명<textarea name="artifactSummary" minlength="30" maxlength="1500" rows="4" required placeholder="누구의 어떤 문제를 풀었고, 어떤 결과물을 만들었나요? 목표·제약·본인이 한 일을 적어 주세요."></textarea></label><label>산출물 링크 (선택)<input name="artifactUrl" type="url" maxlength="1500" placeholder="https://..."></label><fieldset><legend>함께 보낼 내 판단 기록 · 최대 3개</legend><div id="obLogChoices" class="stack mt12"></div></fieldset><label>직접 내린 판단과 이유<textarea name="decisionNote" maxlength="1500" rows="3" placeholder="어떤 대안을 골랐고 왜 골랐나요? 기록을 선택하지 않았다면 20자 이상 적어 주세요."></textarea></label><label>지금 가장 궁금한 질문 하나<textarea name="question" minlength="10" maxlength="500" rows="3" required placeholder="예: 이 지표를 선택한 이유가 현업 관점에서도 설득력 있나요?"></textarea></label><div class="note">회사의 기밀·고객 개인정보는 제거해 주세요. 현업 프로젝트 표기는 본인의 설명이며, 재직이나 성과를 인증하지 않습니다. 링크의 열람 권한도 확인해 주세요.</div><label class="check"><input name="shareConsent" type="checkbox" required> 선택한 자료와 내 이름을 해당 멘토 및 운영진에게 공유합니다.</label><p class="tiny muted">진행 중 최대 2건 · 월 요청 최대 3건. 수락 대기는 7일 후 종료됩니다. 답변을 보장하거나 자동으로 재촉하지 않습니다.</p><button class="btn" type="submit">이 자료로 리뷰 요청</button></form></section>';
    function choices() { var pid = U.$('#obProject', el).value, list = logs.filter(function (l) { return !pid || l.projectId === pid; });
      U.$('#obLogChoices', el).innerHTML = list.length ? list.map(function (l) { return '<label class="check"><input type="checkbox" name="logId" value="' + esc(l.id) + '"><span>' + esc(l.text.slice(0, 220)) + '</span></label>'; }).join('') : '<p class="small muted">선택할 기록이 없어요. 아래에 내 판단과 이유를 적어 주세요.</p>';
      U.$('#obTitleWrap', el).hidden = !!pid; U.$('[name=title]', el).required = !pid;
    }
    choices(); U.$('#obProject', el).onchange = choices;
    bindForm(el, '#obCompose', function (b, form) { b.action = 'request'; b.mentorProfileId = target.id; b.logIds = Array.from(U.$$('[name=logId]:checked', form)).map(function (c) { return c.value; }); b.shareConsent = U.$('[name=shareConsent]', form).checked;
      return act(b).then(function (r) { A.toast('선택한 자료로 요청을 보냈어요.'); A.go(base() + '/' + r.id); });
    });
  }
  function list(el, j) {
    var role = D.me().role, rows = j.reviews.slice().sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
    el.innerHTML = h.head('OB·YB 멘토 리뷰', '링커스 선배의 경험을 빌려, 내가 한 판단을 한 번 더 살펴봐요.') + '<div class="community-hero"><span class="eyebrow">LINKUS · 작은 질문, 다음 시도</span><h2>완성된 결과물 뒤에 있는<br>선택의 이유를 함께 봅니다.</h2><p>질문 하나 · 판단 기록 최대 3개 · 짧은 조언 세 가지. 서로 가능한 만큼 연결되고, 받은 조언은 내 다음 행동으로 이어집니다.</p></div>' +
      (!A.Mode.server ? '<div class="note mt16">브라우저 데모입니다. 실제 사람에게 전달되지 않아요. 멘토 역할에서 참여를 켜면 요청·수락·조언 흐름을 체험할 수 있습니다.</div>' : '') +
      (role === 'mentor' ? prefsHTML(j.preferences) : '') +
      (role === 'learner' ? '<section class="mt24"><h2>지금 참여 중인 OB</h2><p class="small muted mt8">멘토 DB 중 계정 연결과 참여 설정을 마친 분만 보여요. 공개하지 않은 연락처는 전달되지 않습니다.</p><div class="grid g2 mt16">' + (j.directory.length ? j.directory.map(function (m) { return '<article class="card"><div class="row between"><h3>' + esc(m.name) + '</h3><span class="badge green">약 ' + m.minutes + '분</span></div><p class="small muted mt8">' + esc(m.company) + ' · ' + esc(m.role) + '</p><p class="small mt12">' + esc(m.scope || (m.tags || []).join(' · ')) + '</p><p class="tiny muted mt12">이번 달 수락 가능 ' + m.remaining + '건 · 수락 대기 ' + m.pending + '건</p><button class="btn soft sm mt12" data-ob-new="' + esc(m.id) + '"' + (!m.remaining || m.pending >= 5 ? ' disabled' : '') + '>이 OB에게 요청 준비</button></article>'; }).join('') : h.empty('지금 요청을 받는 OB가 없어요. 운영진이 참여 가능한 선배를 연결하고 있습니다.')) + '</div><div id="obComposeArea"></div></section>' : '') +
      '<section class="mt24"><h2>' + (role === 'admin' ? '리뷰 운영 현황' : role === 'mentor' ? '나에게 온 요청' : '내 요청과 받은 조언') + '</h2>' + (role === 'admin' ? '<p class="small muted mt8">요청 ' + rows.length + '건 · 수락 이력 ' + rows.filter(function (r) { return r.acceptedAt; }).length + '건 · 조언 완료 ' + rows.filter(function (r) { return r.status === 'completed'; }).length + '건. 수락·완료율을 보고 OB의 부담과 프로그램 운영 범위를 조정하세요.</p>' : '') + '<div class="grid g2 mt16">' + (rows.length ? rows.map(rowHTML).join('') : h.empty('아직 리뷰 요청이 없어요.')) + '</div></section>';
    U.$$('[data-ob-new]', el).forEach(function (button) { button.onclick = function () { var target = j.directory.find(function (m) { return m.id === button.getAttribute('data-ob-new'); }); var area = U.$('#obComposeArea', el); compose(area, target); if (area.scrollIntoView) area.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; });
    if (role === 'mentor') bindForm(el, '#obPrefs', function (b, form) { b.action = 'preferences'; b.enabled = U.$('[name=enabled]', form).checked; b.monthlyLimit = Number(b.monthlyLimit); b.minutes = Number(b.minutes); return act(b).then(function () { A.toast('참여 설정을 저장했어요.'); return screen(el, {}); }); });
  }
  function detail(el, r) {
    if (!r) { el.innerHTML = h.empty('리뷰를 찾을 수 없어요.'); return; }
    var me = D.me(), learner = me.role === 'learner' && r.learnerId === me.id, mentor = me.role === 'mentor' && r.mentorId === me.id, s = r.snapshot;
    el.innerHTML = h.head(s.title, esc(r.learnerName) + ' → ' + esc(r.mentorName) + ' · ' + esc(r.focus), '<a class="btn ghost" href="' + base() + '">리뷰 목록</a>') + '<div class="grid g-main-wide"><div class="stack-lg"><section class="card"><div class="row between"><span class="badge green">' + labels[r.status] + '</span><span class="small muted">예상 ' + r.requestedMinutes + '분</span></div><h2 class="mt16">' + esc(r.question) + '</h2><p class="tiny muted mt8">요청 ' + U.fmt(r.createdAt, true) + ' · ' + esc(s.contextType) + ' (본인 설명)</p><h3 class="mt24">결과물과 맥락</h3><p class="pre mt12">' + esc(s.artifactSummary) + '</p>' + (s.artifactUrl ? '<a class="btn ghost sm mt12" href="' + esc(s.artifactUrl) + '" target="_blank" rel="noopener noreferrer">보낸 산출물 열기 ↗</a>' : '') + '<h3 class="mt24">함께 보낸 판단</h3>' + s.logs.map(function (l) { return '<blockquote class="note mt12"><p class="pre">' + esc(l.text) + '</p><span class="tiny muted">' + U.fmt(l.createdAt) + ' · 요청 시점의 기록 사본</span></blockquote>'; }).join('') + (s.decisionNote ? '<p class="pre mt12">' + esc(s.decisionNote) + '</p>' : '') + '<p class="tiny muted mt16">요청할 때 선택한 자료를 보관한 사본입니다. 이후 원본을 수정해도 이 요청의 자료는 바뀌지 않습니다. AI 대화 전체는 포함하지 않습니다.</p></section>' +
      (r.feedback ? '<section class="card"><h2>선배가 남긴 짧은 조언</h2>' + feedbackHTML([r]) + '<p class="tiny muted mt16">선택한 자료에 대한 조언입니다. 실무 수행 사실·역량 수준을 인증하거나 단계 승인을 대신하지 않습니다.</p></section>' : '') +
      (mentor && r.status === 'accepted' ? '<section class="card"><h2>짧은 조언 세 가지만</h2><form id="obFeedback" class="stack mt16">' + [['strength', '좋았던 판단'], ['checkpoint', '더 확인할 점'], ['nextAction', '다음 시도']].map(function (x) { return '<label>' + x[1] + '<textarea name="' + x[0] + '" minlength="5" maxlength="600" rows="3" required></textarea></label>'; }).join('') + '<label class="check"><input name="publicConsent" type="checkbox">YB도 선택하면, 내 이름·직무와 이 조언 세 가지를 공개 포트폴리오에 표시해도 됩니다. 나중에 철회할 수 있어요.</label><button class="btn" type="submit">조언 전달하고 마치기</button></form></section>' : '') +
      (learner && r.status === 'completed' ? '<section class="card"><h2>받은 조언을 내 판단으로</h2><p class="small muted mt8">무엇을 받아들이거나 보류할지, 다음 행동과 그 이유를 적어 주세요. 내 문장만 비공개 포트폴리오의 판단 기록에 쌓입니다.</p><form id="obReflect" class="stack mt16"><label>다음 행동과 이유<textarea name="reflection" rows="4" minlength="20" maxlength="2000" required>' + esc(r.reflection || '') + '</textarea></label><button class="btn" type="submit">회고를 내 포트폴리오에 저장</button></form></section>' : r.reflection ? '<section class="card"><h3>YB의 다음 행동과 이유</h3><p class="pre mt12">' + esc(r.reflection) + '</p></section>' : '') +
      '</div><aside class="stack-lg"><section class="card"><h3>가능한 만큼 연결돼요</h3><p class="small muted mt12">대기 요청은 ' + U.fmt(r.expiresAt) + '에 종료됩니다. 수락 후에는 정해진 답변 기한이 없고, 앱 안에서 상태를 확인합니다.</p>' + (mentor && r.status === 'pending' ? '<button class="btn mt16" data-ob-action="accept">이 요청 수락</button><form id="obDecline" class="stack mt12"><label>짧은 안내 (선택)<input name="note" maxlength="300" placeholder="지금은 시간이 어려워요"></label><button class="btn ghost" type="submit">이번에는 어렵다고 알리기</button></form>' : '') + (learner && ['pending', 'accepted'].includes(r.status) ? '<button class="btn ghost mt16" data-ob-action="cancel">요청 취소</button>' : '') + (r.declineNote ? '<p class="note mt12">' + esc(r.declineNote) + '</p>' : '') + '</section>' +
      (r.status === 'completed' && (learner || mentor) ? '<section class="card"><h3>공개 포트폴리오 표시</h3><p class="small muted mt8">양쪽이 동의하고 포트폴리오 공유도 켜야 공개됩니다. 질문·링크·보낸 판단 사본·회고는 이 동의에 포함되지 않아요.</p><p class="small mt12">OB 동의: ' + (r.mentorPublic ? '있음' : '없음') + ' · YB 선택: ' + (r.learnerPublic ? '있음' : '없음') + '</p><label class="check mt12"><input id="obPublic" type="checkbox"' + ((mentor ? r.mentorPublic : r.learnerPublic) ? ' checked' : '') + '> 내 이름·직무와 조언 세 가지 공개에 ' + (mentor ? '동의합니다' : '이 리뷰를 선택합니다') + '</label><p class="tiny muted mt8">언제든 끌 수 있어요. 포트폴리오의 대표 판단 공개는 별도로 선택합니다.</p></section>' : '') + '<a class="btn soft" href="' + (learner ? '#/portfolio' : '#/sharing') + '">' + (learner ? '내 포트폴리오' : '공유시간에서 만나기') + '</a></aside></div>';
    function update(b) { b.id = r.id; return act(b).then(function () { A.toast('저장했어요.'); return screen(el, { id: r.id }); }); }
    U.$$('[data-ob-action]', el).forEach(function (button) { button.onclick = function () { button.disabled = true; return update({ action: button.getAttribute('data-ob-action') }).catch(function (e) { A.toast(e.message, true); button.disabled = false; }); }; });
    bindForm(el, '#obDecline', function (b) { b.action = 'decline'; return update(b); });
    bindForm(el, '#obFeedback', function (b, form) { b.action = 'complete'; b.publicConsent = U.$('[name=publicConsent]', form).checked; return update(b); });
    bindForm(el, '#obReflect', function (b) { b.action = 'reflect'; return update(b); });
    var cb = U.$('#obPublic', el); if (cb && r.status === 'completed') cb.onchange = function () { cb.disabled = true; return update({ action: 'publicConsent', enabled: cb.checked }).catch(function (e) { cb.checked = !cb.checked; cb.disabled = false; A.toast(e.message, true); }); };
  }
  function screen(el, p) {
    el.innerHTML = h.head('OB·YB 멘토 리뷰', '불러오는 중…');
    return load().then(function (j) { if (p.id) detail(el, j.reviews.find(function (r) { return r.id === p.id; })); else list(el, j); }).catch(function (e) { el.innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; });
  }
  [['learner', '#/ob-review'], ['mentor', '#/m/ob-reviews'], ['admin', '#/a/ob-reviews']].forEach(function (x) { A.route(x[0], x[1], screen); A.route(x[0], x[1] + '/:id', screen); });
})();
