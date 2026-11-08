/* AX Proof · 현직 멘토(현업 검토자) 화면
   사람의 개입은 최소로: 30분 인터뷰로 AI 실무자 만들기 · 비동기 리뷰 · 판단 확인 표시 · 컨택 수락 */
(function () {
  var AXP = window.AXP, U = AXP.U, DB = AXP.DB, D = AXP.D, esc = U.esc, h = AXP.h;
  var R = function (path, fn) { AXP.route('mentor', path, fn); };
  function myMentor() { var me = D.me(); return DB.where('mentors', function (m) { return m.userId === me.id; })[0]; }
  function learners() { var me = D.me(); return DB.where('users', function (u) { return u.role === 'learner' && (!me.cohortId || u.cohortId === me.cohortId); }); }

  /* ---------- 홈 ---------- */
  R('#/m/home', function (el) {
    var me = D.me(), mm = myMentor();
    var reqs = DB.where('reviews', function (r) { return r.status === '요청'; });
    var mine = DB.where('reviews', function (r) { return r.mentorId === me.id && r.status !== '요청'; });
    var cts = mm ? DB.where('contacts', function (c) { return c.mentorId === mm.id; }) : [];
    var cases = DB.where('cases', function (c) { return c.authorId === me.id; });
    el.innerHTML = h.head('안녕하세요, ' + me.name + ' 멘토님', '멘토님의 시간은 꼭 필요한 곳에만 쓰이도록 설계했어요. 반복 코칭은 AI 사수가 맡고, 멘토님은 현업의 눈으로 확인만 해 주세요.') +
      '<div class="grid g4">' + h.stat('리뷰 요청', reqs.length, '비동기 · 건당 약 10분') + h.stat('컨택 요청', cts.filter(function (c) { return c.status === '요청'; }).length, '실제 인터뷰 요청') + h.stat('내가 확인한 판단', DB.where('logs', function (l) { return l.verifiedBy === me.id; }).length, '포트폴리오에 표시됨') + h.stat('만든 AI 실무자', cases.length, '30분 인터뷰 → 수백 명이 인터뷰') + '</div>' +
      '<div class="grid g2 mt16"><div class="card"><div class="card-head"><h2>리뷰 요청</h2><a class="small" href="#/m/reviews">전체</a></div>' + (reqs.length ? reqs.slice(0, 4).map(reviewItem).join('') : h.empty('대기 중인 요청이 없어요')) + '</div>' +
      '<div class="card"><h2>멘토님이 하는 일 (1인당 기수당 1~2시간)</h2><div class="stack mt12">' +
      [['30분 인터뷰 1회', '내 업무 이야기를 들려주면 AI가 가상 회사와 AI 실무자로 만들어요. 수백 명의 훈련생이 인터뷰할 수 있어요.', '#/m/case'], ['비동기 리뷰 (선택)', '훈련생의 기획안·판단 기록을 보고 질문형 코멘트와 5영역 평가를 남겨요.', '#/m/reviews'], ['판단 확인 표시', '현업 관점에서 타당한 판단에 ✓를 남기면 포트폴리오의 신뢰가 올라가요.', '#/m/learners'], ['실제 인터뷰 (선택)', '컨택 요청을 수락하면 훈련생과 30분 인터뷰를 해요.', '#/m/contacts']].map(function (x) { return '<a class="item click" style="display:block;text-decoration:none;color:inherit" href="' + x[2] + '"><b>' + x[0] + '</b><p class="small muted">' + x[1] + '</p></a>'; }).join('') + '</div></div></div>';
  });
  function reviewItem(r) {
    var u = D.user(r.learnerId), p = DB.get('projects', r.projectId) || {};
    return '<a class="item click" style="display:block;text-decoration:none;color:inherit" href="#/m/review/' + r.id + '"><div class="row between"><b>' + esc(u.name) + ' · ' + esc(AXP.STAGE_NAME[r.stage] || r.stage) + '</b><span class="badge ' + (r.status === '요청' ? 'gold' : 'green') + '">' + esc(r.status || '완료') + '</span></div><p class="small muted">' + esc(p.title || '') + ' · ' + U.fmt(r.createdAt) + '</p></a>';
  }

  /* ---------- 리뷰 목록 ---------- */
  R('#/m/reviews', function (el) {
    var me = D.me();
    var reqs = DB.where('reviews', function (r) { return r.status === '요청'; });
    var done = DB.where('reviews', function (r) { return r.mentorId === me.id && r.status !== '요청'; });
    el.innerHTML = h.head('리뷰 요청', '훈련생이 현직 멘토의 리뷰를 요청한 건이에요. AI 평가는 멘토님이 평가를 마친 뒤에 보여요(블라인드 비교로 AI 피드백의 신뢰도를 검증해요).') +
      '<div class="card"><h2>대기</h2><div class="mt12">' + (reqs.length ? reqs.map(reviewItem).join('') : h.empty('대기 중인 요청이 없어요')) + '</div></div>' +
      '<div class="card"><h2>완료</h2><div class="mt12">' + (done.length ? done.map(reviewItem).join('') : h.empty('아직 없어요')) + '</div></div>';
  });

  /* ---------- 리뷰 상세 ---------- */
  R('#/m/review/:id', function (el, prm) {
    var me = D.me(), r = DB.get('reviews', prm.id);
    if (!r) { el.innerHTML = h.empty('리뷰를 찾을 수 없어요'); return; }
    var p = DB.get('projects', r.projectId), u = D.user(r.learnerId), c = p ? D.case(p.caseId) : null, d = (p && p.data) || {};
    var logs = D.logsOf(r.learnerId, r.projectId);
    r.comments = r.comments || []; r.rubric = r.rubric || {};
    var done = r.status !== '요청';
    function stageContent() {
      var s = '';
      if (d.propose && d.propose.secs && d.propose.secs.problem) s += '<h3>링커슈 · AI 프로젝트 제안</h3><dl class="kv mt8">' + [['problem', '문제 정의'], ['overview', '프로젝트 개요'], ['how', '데이터·AI 방식'], ['effect', '기대 효과'], ['risk', '실현가능성·리스크']].map(function (x) { return '<dt>' + x[1] + '</dt><dd class="pre">' + esc(d.propose.secs[x[0]] || '-') + '</dd>'; }).join('') + '</dl><button class="btn ghost sm mt8" id="lkRepM">링커슈 보고서 전체 보기</button><hr class="sep">';
      if (d.issue && d.issue.keyword) s += '<h3>이슈 탐구</h3><p class="small mt8"><b>' + esc(d.issue.keyword) + '</b> — ' + esc(d.issue.define || '') + '</p><hr class="sep">';
      if (d.topic && d.topic.pick) s += '<h3>주제 선정</h3><dl class="kv mt8"><dt>주제</dt><dd>' + esc(d.topic.pick) + '</dd><dt>고른 이유</dt><dd>' + esc(d.topic.why || '') + '</dd><dt>버린 후보</dt><dd>' + esc(d.topic.drop || '') + '</dd></dl>';
      if (d.plan && d.plan.secs && Object.keys(d.plan.secs).length) s += '<h3 class="mt16">기획안 v' + (d.plan.ver || 0) + '</h3><dl class="kv mt8">' + [['bg', '문제와 배경'], ['goal', '목표와 성공 기준'], ['how', '해결 방안'], ['alt', '대안과 선택 이유'], ['risk', '가정과 리스크'], ['plan', '4주 일정']].map(function (x) { return '<dt>' + x[1] + '</dt><dd class="pre">' + esc(d.plan.secs[x[0]] || '-') + '</dd>'; }).join('') + '</dl>';
      if (d.insight && d.insight.pains) s += '<h3 class="mt16">인사이트</h3>' + d.insight.pains.map(function (x) { return '<div class="tip"><span class="badge">' + esc(x.kind) + '</span> ' + esc(x.text) + '</div>'; }).join('');
      return s || '<p class="muted">아직 산출물이 적어요.</p>';
    }
    el.innerHTML = h.head(u.name + ' · ' + (AXP.STAGE_NAME[r.stage] || r.stage) + ' 리뷰', esc(p ? p.title : '') + (c ? ' · ' + esc(c.company) : ''), '', '<a href="#/m/reviews">리뷰 요청</a>') +
      '<div class="grid g-main-wide"><div class="stack-lg"><div class="card">' + stageContent() + '</div>' +
      '<div class="card"><div class="card-head"><div><h2>판단 기록</h2><p>현업 관점에서 타당한 판단에 ✓ 확인 표시를 남겨 주세요.</p></div></div>' + AXP.timeline(logs, { verify: true }) + '</div></div>' +
      '<div class="stack-lg"><div class="card"><h2>코멘트</h2><p class="small muted mt8">답을 주기보다 질문으로 짚어 주세요. 훈련생은 답하거나 고쳐요.</p><div id="cmts" class="mt12"></div>' + (done ? '' : '<input type="text" id="cq" class="mt12" placeholder="짚을 문장 (선택)"><textarea id="ct" rows="3" class="mt8" placeholder="질문형 코멘트"></textarea><button class="btn ghost sm mt8" id="addC">+ 코멘트 추가</button>') + '</div>' +
      '<div class="card"><h2>5영역 평가</h2><p class="small muted mt8">1 근거 없음 · 2 부분적 · 3 대체로 타당 · 4 근거·대안·제약·검증 모두 고려</p><div class="mt12">' + AXP.COMPETENCIES.map(function (k) { return '<div class="row between mt8"><span class="small">' + esc(k) + '</span><div class="seg">' + [1, 2, 3, 4].map(function (v) { return '<button data-rb="' + esc(k) + ':' + v + '" aria-pressed="' + (r.rubric[k] === v) + '"' + (done ? ' disabled' : '') + '>' + v + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>' +
      (done ? '' : '<label class="check mt16"><input type="checkbox" id="appr"> 다음 단계로 진행해도 좋아요 (승인)</label><button class="btn mt12" id="finish" style="width:100%">리뷰 완료</button>') + '<div id="aiCmp" class="mt12"></div></div></div></div>';
    function renderC() {
      U.$('#cmts', el).innerHTML = r.comments.length ? r.comments.map(function (x) { return '<div class="coach gold mt8">' + (x.quote ? '<div class="tiny muted">"' + esc(x.quote) + '"</div>' : '') + '<p>' + esc(x.text) + '</p>' + (x.reply ? '<div class="tip good">훈련생 답 · ' + esc(x.reply) + '</div>' : '') + '</div>'; }).join('') : '<p class="small muted">아직 코멘트가 없어요.</p>';
    }
    renderC();
    var lkm = U.$('#lkRepM', el); if (lkm) lkm.onclick = function () { AXP.linkushuReportModal(p); };
    AXP.bindTimeline(el, function () { AXP.render(); });
    U.$$('[data-rb]', el).forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-rb').split(':'); r.rubric[a[0]] = Number(a[1]); U.$$('[data-rb^="' + a[0] + ':"]', el).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
    var ab = U.$('#addC', el); if (ab) ab.onclick = function () { var t = U.$('#ct', el).value.trim(); if (!t) return; r.comments.push({ quote: U.$('#cq', el).value.trim(), text: t }); U.$('#ct', el).value = ''; U.$('#cq', el).value = ''; renderC(); };
    var fb = U.$('#finish', el); if (fb) fb.onclick = function () {
      if (AXP.COMPETENCIES.some(function (k) { return !r.rubric[k]; })) return AXP.toast('5영역 평가를 모두 골라 주세요', true);
      r.status = '완료'; r.mentorId = me.id; r.mentorName = me.name; r.approved = U.$('#appr', el).checked; r.verified = true; r.doneAt = U.now();
      DB.put('reviews', r).then(function () {
        r.comments.forEach(function (x) { D.addLog({ userId: r.learnerId, projectId: r.projectId, stage: r.stage, kind: '대안 선택', source: '현직 멘토', text: '현직 멘토 ' + me.name + ': ' + (x.quote ? '"' + x.quote + '" — ' : '') + x.text }).catch(function () { }); });
        AXP.toast('리뷰를 남겼어요'); showCompare();
      });
    };
    function showCompare() {
      var ready = p ? AXP.readinessOf(p, r.learnerId) : null;
      if (!ready) { U.$('#aiCmp', el).innerHTML = '<div class="note small">AI 피드백이 아직 없어요(디펜스 전). 디펜스 후 AI와 멘토님 평가의 차이가 운영진 화면에서 비교돼요.</div>'; return; }
      U.$('#aiCmp', el).innerHTML = '<div class="note small"><b>AI 피드백과 비교</b>' + AXP.COMPETENCIES.map(function (k) { var a = ready.levels[k] || 0, m = r.rubric[k] || 0; return '<div class="row between mt8"><span>' + k + '</span><span>멘토 ' + m + ' · AI ' + a + (Math.abs(a - m) >= 2 ? ' <span class="badge red">차이 큼</span>' : '') + '</span></div>'; }).join('') + '</div>';
    }
    if (done) showCompare();
  });

  /* ---------- 담당 훈련생 ---------- */
  R('#/m/learners', function (el) {
    el.innerHTML = h.head('담당 훈련생', '훈련생의 진행과 판단 기록을 보고, 현업 관점에서 타당한 판단에 확인 표시를 남겨 주세요.') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>이름</th><th>희망 직무</th><th>프로젝트</th><th>단계</th><th>판단 기록</th><th>멘토 확인</th></tr></thead><tbody>' +
      learners().map(function (u) { var p = D.myProjects(u.id)[0], logs = D.logsOf(u.id); return '<tr class="click" data-u="' + u.id + '"><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.track || '') + '</td><td>' + esc(p ? p.title : '-') + '</td><td>' + (p ? h.stageBadge(p.stage) : '-') + '</td><td>' + logs.length + '</td><td>' + logs.filter(function (l) { return l.verifiedBy; }).length + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    U.$$('[data-u]', el).forEach(function (tr) { tr.onclick = function () { AXP.go('#/m/learner/' + tr.getAttribute('data-u')); }; });
  });
  R('#/m/learner/:id', function (el, prm) {
    var u = D.user(prm.id), logs = D.logsOf(u.id);
    el.innerHTML = h.head(u.name, esc(u.track || '') + ' · 판단 기록 ' + logs.length + '개', '', '<a href="#/m/learners">담당 훈련생</a>') + '<div class="card">' + AXP.timeline(logs.slice().reverse(), { verify: true }) + '</div>';
    AXP.bindTimeline(el, function () { AXP.render(); });
  });

  /* ---------- 컨택 요청 ---------- */
  R('#/m/contacts', function (el) {
    var mm = myMentor();
    if (!mm) { el.innerHTML = h.head('컨택 요청', '') + '<div class="note gold">멘토 DB에 내 프로필이 아직 없어요. <a href="#/m/profile">프로필 만들기</a></div>'; return; }
    var list = DB.where('contacts', function (c) { return c.mentorId === mm.id; }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    el.innerHTML = h.head('컨택 요청', '훈련생의 실제 인터뷰 요청이에요. 수락하면 일정을 정하고, 인터뷰 후 "완료"로 바꿔 주세요. 인터뷰 내용은 동의 범위 안에서만 지식 베이스에 쓰여요.') +
      '<div class="stack">' + (list.length ? list.map(function (c) {
        var u = D.user(c.learnerId), p = DB.get('projects', c.projectId);
        return '<div class="card"><div class="row between"><div><b>' + esc(u.name) + '</b> <span class="small muted">· ' + esc(u.track || '') + ' · ' + esc(p ? p.title : '') + '</span></div><span class="badge ' + (c.status === '요청' ? 'gold' : c.status === '거절' ? 'red' : 'green') + '">' + esc(c.status) + '</span></div><p class="mt12 pre">' + esc(c.message) + '</p>' +
          '<div class="row mt12">' + (c.status === '요청' ? '<input type="date" data-date="' + c.id + '" style="width:auto"><button class="btn sm" data-acc="' + c.id + '">수락</button><button class="btn sm danger" data-rej="' + c.id + '">정중히 거절</button>' : c.status === '수락' ? '<span class="small">일정 ' + esc(c.schedule || '') + '</span><button class="btn sm soft" data-done="' + c.id + '">인터뷰 완료</button>' : '') + '</div></div>';
      }).join('') : h.empty('요청이 없어요')) + '</div>';
    function upd(id, patch, msg) { var c = DB.get('contacts', id); DB.put('contacts', Object.assign({}, c, patch)).then(function () { if (patch.status === '완료') { mm.contactCount = (mm.contactCount || 0) + 1; mm.lastContact = U.now().slice(0, 10); DB.put('mentors', mm); } AXP.toast(msg); AXP.render(); }); }
    U.$$('[data-acc]', el).forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-acc'); upd(id, { status: '수락', schedule: U.$('[data-date="' + id + '"]', el).value || '추후 조율' }, '수락했어요'); }; });
    U.$$('[data-rej]', el).forEach(function (b) { b.onclick = function () { upd(b.getAttribute('data-rej'), { status: '거절' }, '거절했어요'); }; });
    U.$$('[data-done]', el).forEach(function (b) { b.onclick = function () { upd(b.getAttribute('data-done'), { status: '완료' }, '완료로 바꿨어요'); }; });
  });

  /* ---------- 30분 인터뷰로 AI 실무자 만들기 ---------- */
  function caseMaker(el) {
    var me = D.me();
    var mineCases = DB.where('cases', function (c) { return c.authorId === me.id; });
    el.innerHTML = h.head('AI 실무자 만들기', '현직자 한 분의 30분 인터뷰가, 수백 명이 인터뷰할 수 있는 AI 실무자가 돼요. 실제 회사명·실명·기밀은 자동으로 익명화하고, 운영진 검수 후 공개돼요.') +
      '<div class="grid g-main-wide"><div class="card"><h2>1. 내 업무 이야기</h2><p class="small muted mt8">아래 질문에 편하게 답하거나, 인터뷰 녹취 요약을 붙여넣으세요.</p>' +
      '<div class="note blue small mt12">하루 일과는 어떻게 흘러가나요? · 가장 시간을 많이 쓰는 반복 업무는? · 최근 가장 답답했던 순간은? · 데이터와 도구는? · 지켜야 하는 제약(보안·예산·기한)은? · 최근 내린 중요한 판단과 그 이유는?</div>' +
      '<label class="lb mt12" for="who">현직자 정보 <span class="hint">익명화돼요</span></label><input type="text" id="who" value="' + esc(me.track || '') + '" placeholder="예: 물류 스타트업 운영기획 5년차"><label class="lb mt12" for="notes">인터뷰 메모</label><textarea id="notes" rows="12"></textarea>' +
      '<label class="check mt12"><input type="checkbox" id="agree"> 익명화된 내용이 훈련용 가상 Case로 쓰이는 데 동의합니다</label><div class="row mt12"><button class="btn" id="draft">AI로 Case 초안 만들기</button><span class="small muted" id="st"></span></div><div id="out" class="mt16"></div></div>' +
      '<div class="card"><h2>내가 만든 AI 실무자</h2>' + (mineCases.length ? mineCases.map(function (c) { return '<div class="item mt8"><div class="row between"><b class="small">' + esc(c.persona.name) + ' · ' + esc(c.persona.title) + '</b><span class="badge ' + (c.status === '운영 중' ? 'green' : 'gold') + '">' + esc(c.status) + '</span></div><p class="tiny muted">' + esc(c.title) + '</p></div>'; }).join('') : h.empty('아직 없어요')) + '</div></div>';
    U.$('#draft', el).onclick = function () {
      var notes = U.$('#notes', el).value.trim();
      if (notes.length < 50) return AXP.toast('인터뷰 메모를 조금 더 적어 주세요', true);
      if (!U.$('#agree', el).checked) return AXP.toast('활용 동의가 필요해요', true);
      var b = this; b.disabled = true; U.$('#st', el).textContent = 'AI가 가상 회사와 실무자를 만들고 있어요…';
      AXP.AI.run('case_draft', { who: U.$('#who', el).value, notes: notes }).then(function (r) {
        U.$('#st', el).textContent = '';
        U.$('#out', el).innerHTML = '<div class="coach"><b>◎ Case 초안</b><h3 class="mt8">' + esc(r.title) + '</h3><p class="small">' + esc(r.company) + ' · ' + esc(r.industry) + ' · ' + esc(r.track) + '</p><p class="small mt8"><b>AI 실무자</b> ' + esc(r.persona.name) + ' ' + esc(r.persona.title) + ' (' + esc(r.persona.career) + ')</p>' +
          '<p class="small mt8"><b>pain point</b> ' + esc((r.pains || []).join(' · ')) + '</p><p class="small mt8"><b>숨은 제약</b> ' + esc(((r.persona.hidden || [])[0] || [])[1] || '') + '</p><p class="small mt8"><b>현직자의 판단(비교 기준)</b> ' + esc(r.persona.judgment || '') + '</p>' +
          '<p class="small mt8"><b>조건 변경 이벤트</b> ' + esc(((r.events || [])[0] || {}).text || '') + '</p><div class="row mt12"><button class="btn sm" id="send">운영진 검수 요청</button></div></div>';
        U.$('#send', el).onclick = function () {
          DB.put('cases', Object.assign({ id: U.uid('case'), source: '현업 실사례 재구성', status: '검수 대기', difficulty: '기본', parallelCaseId: '', knowledgeIds: [], authorId: me.id, rawNotesLength: notes.length }, r))
            .then(function () { AXP.toast('운영진 검수를 요청했어요'); AXP.render(); });
        };
      }).catch(function (e) { U.$('#st', el).textContent = e.message; }).then(function () { b.disabled = false; });
    };
  }
  R('#/m/case', caseMaker);
  R('#/m/library', function (el) { AXP.library(el); });

  /* ---------- 내 멘토 프로필 ---------- */
  R('#/m/profile', function (el) {
    var me = D.me(), mm = myMentor() || { id: U.uid('mtr'), userId: me.id, name: me.name, company: '', role: '', years: 0, industry: '', tags: [], contactOk: true, channel: '플랫폼 메시지', contactCount: 0 };
    el.innerHTML = h.head('내 멘토 프로필', '멘토 DB에 보이는 정보예요. 회사명은 "이커머스 A사"처럼 익명으로 적어도 돼요.', '<a class="btn soft" href="#/m/ob-reviews">OB·YB 리뷰 참여 설정</a>') +
      '<div class="card" style="max-width:640px"><div class="grid g2"><div><label class="lb">회사 (익명 가능)</label><input type="text" id="f1" value="' + esc(mm.company) + '"></div><div><label class="lb">직무</label><input type="text" id="f2" value="' + esc(mm.role) + '"></div><div><label class="lb">연차</label><input type="number" id="f3" value="' + esc(mm.years) + '"></div><div><label class="lb">산업</label><input type="text" id="f4" value="' + esc(mm.industry) + '"></div></div>' +
      '<label class="lb mt12">키워드 <span class="hint">쉼표로 구분</span></label><input type="text" id="f5" value="' + esc((mm.tags || []).join(', ')) + '"><label class="lb mt12">연락 채널</label><input type="text" id="f6" value="' + esc(mm.channel || '') + '">' +
      '<label class="check mt12"><input type="checkbox" id="f7"' + (mm.contactOk ? ' checked' : '') + '> 훈련생의 인터뷰 요청을 받을게요</label><button class="btn mt16" id="save">저장</button></div>';
    U.$('#save', el).onclick = function () {
      Object.assign(mm, { company: U.$('#f1', el).value, role: U.$('#f2', el).value, years: Number(U.$('#f3', el).value) || 0, industry: U.$('#f4', el).value, tags: U.$('#f5', el).value.split(',').map(function (x) { return x.trim(); }).filter(Boolean), channel: U.$('#f6', el).value, contactOk: U.$('#f7', el).checked });
      DB.put('mentors', mm).then(function () { AXP.toast('저장했어요'); });
    };
  });
})();
