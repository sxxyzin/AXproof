/* AX Proof · 화면 골격: 라우터, 역할별 메뉴, 로그인 */
(function () {
  var AXP = window.AXP, U = AXP.U, DB = AXP.DB, D = AXP.D, esc = U.esc;

  /* ---------- 라우터 ---------- */
  var routes = [];
  AXP.route = function (role, path, render) {
    var keys = [];
    var re = new RegExp('^' + path.replace(/:(\w+)/g, function (_, k) { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ role: role, path: path, re: re, keys: keys, render: render });
  };
  AXP.go = function (hash) { if (location.hash === hash) AXP.render(); else location.hash = hash; };

  var NAV = {
    learner: [
      ['홈', '#/home', '⌂'], ['AI 업무 온보딩', '#/onboarding', '①'], ['내 프로젝트', '#/projects', '▣'], ['AI 사수', '#/mentor', '◎'],
      ['판단 기록', '#/log', '✎'], ['제출함', '#/submit', '⇪'], ['실무자 컨택', '#/contact', '☏'], ['기업 챌린지', '#/challenge', '★'],
      ['자료실', '#/library', '▤'], ['내 포트폴리오', '#/portfolio', '◆']
    ],
    mentor: [
      ['홈', '#/m/home', '⌂'], ['리뷰 요청', '#/m/reviews', '✎'], ['담당 훈련생', '#/m/learners', '◎'], ['컨택 요청', '#/m/contacts', '☏'],
      ['AI 실무자 만들기', '#/m/case', '✚'], ['자료실', '#/m/library', '▤'], ['내 멘토 프로필', '#/m/profile', '◆']
    ],
    admin: [
      ['운영 대시보드', '#/a/home', '⌂'], ['훈련생', '#/a/learners', '◎'], ['기수·프로그램', '#/a/cohort', '▦'], ['제출물', '#/a/submissions', '⇪'],
      ['Case 라이브러리', '#/a/cases', '▣'], ['지식 베이스·에이전트', '#/a/knowledge', '⟳'], ['자료 아카이브', '#/a/archive', '▤'],
      ['멘토 DB', '#/a/mentors', '☏'], ['기업 챌린지', '#/a/challenges', '★'], ['AI 설정', '#/a/ai', '⚙'], ['데이터 관리', '#/a/data', '⇅']
    ]
  };
  var ROLE_NAME = { learner: '훈련생', mentor: '현직 멘토', admin: '운영진' };
  AXP.ROLE_NAME = ROLE_NAME;
  var HOME = { learner: '#/home', mentor: '#/m/home', admin: '#/a/home' };
  NAV.learner.splice(4, 0, ['공유시간', '#/sharing', '◉']);
  NAV.learner.splice(5, 0, ['OB·YB 멘토 리뷰', '#/ob-review', '↔']);
  NAV.mentor.splice(1, 0, ['OB·YB 멘토 리뷰', '#/m/ob-reviews', '↔']);
  NAV.admin.push(['OB·YB 리뷰 운영', '#/a/ob-reviews', '↔']);
  NAV.learner.push(['초중고 교육', '#/school', '◇']);
  NAV.mentor.push(['공유시간', '#/sharing', '◉'], ['초중고 교육', '#/school', '◇']);
  NAV.admin.push(['공유시간 운영', '#/sharing', '◉'], ['초중고 교육 운영', '#/school', '◇']);
  NAV.student = [['생각 미션', '#/school', '◇']];
  NAV.teacher = [['수업 · 관찰 · 리포트', '#/school', '◇']];
  NAV.guardian = [['아이의 생각 리포트', '#/school', '◇']];
  Object.assign(ROLE_NAME, { student: '학생', teacher: '교사·강사', guardian: '보호자' });
  Object.assign(HOME, { student: '#/school', teacher: '#/school', guardian: '#/school' });

  function badgeCount(href) {
    var me = D.me(); if (!me) return 0;
    if (href === '#/m/reviews') return DB.where('reviews', function (r) { return r.status === '요청' && (!r.mentorId || r.mentorId === me.id); }).length;
    if (href === '#/m/contacts') { var m = DB.where('mentors', function (x) { return x.userId === me.id; })[0]; return m ? DB.where('contacts', function (c) { return c.mentorId === m.id && c.status === '요청'; }).length : 0; }
    if (href === '#/a/knowledge') return DB.where('knowledge', function (k) { return k.status === '검수 대기'; }).length;
    if (href === '#/a/cases') return DB.where('cases', function (c) { return c.status === '검수 대기'; }).length;
    if (href === '#/a/submissions') return DB.where('submissions', function (s) { return s.status === '제출'; }).length;
    return 0;
  }

  function shell(role) {
    var me = D.me(), cohort = D.cohort();
    var nav = NAV[role].map(function (n) {
      var c = badgeCount(n[1]);
      return '<a href="' + n[1] + '" data-nav="' + n[1] + '"><span class="ic">' + n[2] + '</span>' + esc(n[0]) + (c ? '<span class="cnt">' + c + '</span>' : '') + '</a>';
    }).join('');
    var mode = AXP.Mode.server ? ('<b>서버 저장 · ' + esc(AXP.Mode.health.store === 'supabase' ? 'Supabase' : AXP.Mode.health.store === 'file' ? '로컬 파일 DB' : '임시 메모리') + '</b>') : '<b>브라우저 데모 모드</b>이 브라우저에만 저장됩니다';
    var ai = AXP.AI.label();
    return '<div class="mobile-top no-print"><button data-menu aria-label="메뉴">☰</button><b>AX Proof</b><span data-ai-status class="badge ' + ai.cls + '">' + esc(ai.text) + '</span></div>' +
      '<div class="shell"><aside class="side no-print" id="side">' +
      '<a class="logo" href="index.html"><span class="mark">AX</span>AX Proof</a><div class="org">' + esc(cohort ? cohort.org + ' · ' + cohort.name : '') + '</div>' +
      '<div class="who"><div class="av">' + esc((me.name || '?').slice(-2)) + '</div><div><b>' + esc(me.name) + '</b><span>' + ROLE_NAME[role] + (me.track ? ' · ' + esc(me.track) : '') + (me.teamId && D.team(me.teamId) ? ' · ' + esc(D.team(me.teamId).name) : '') + '</span></div></div>' +
      '<nav>' + nav + '</nav>' +
      '<div class="foot">' + mode + '<div class="mt8">AI · <span data-ai-status class="badge ' + ai.cls + '" title="' + esc(ai.title) + '">' + esc(ai.text) + '</span></div>' +
      '<div class="mt8 row"><button class="linkbtn" style="color:#BFE0D0" data-logout>로그아웃</button>' + (me.demo ? '<button class="linkbtn" style="color:#BFE0D0" data-switch>다른 역할로 보기</button>' : '') + '</div></div>' +
      '</aside><main class="main"><div class="page" id="view"></div></main></div>';
  }

  var currentRole = null;
  AXP.render = function () {
    var app = document.getElementById('app');
    var hash = (location.hash || '').split('?')[0];
    // 공개 포트폴리오
    var pm = hash.match(/^#\/p\/([^/]+)$/);
    if (pm) { currentRole = null; app.innerHTML = '<div class="main"><div class="page" id="view"></div></div>'; return AXP.publicPortfolio(document.getElementById('view'), pm[1]); }
    var me = D.me();
    if (!me) { currentRole = null; return AXP.renderLogin(app); }
    var role = me.role;
    var r = null, params = {};
    for (var i = 0; i < routes.length; i++) {
      var m = hash.match(routes[i].re);
      if (m && routes[i].role === role) { r = routes[i]; routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); break; }
    }
    if (!r) { location.replace(HOME[role]); return; }
    app.innerHTML = shell(role); currentRole = role;
    U.$$('[data-nav]').forEach(function (a) { var h = a.getAttribute('data-nav'); if (hash === h || hash.indexOf(h + '/') === 0) a.classList.add('on'); });
    U.$('[data-logout]').onclick = function () { AXP.Session.clear(); location.hash = ''; AXP.render(); };
    var sw = U.$('[data-switch]'); if (sw) sw.onclick = function () { AXP.Session.clear(); location.hash = '#/login'; AXP.render(); };
    var mb = U.$('[data-menu]'); if (mb) mb.onclick = function () { U.$('#side').classList.toggle('open'); };
    U.$('#side').addEventListener('click', function (e) { if (e.target.closest('a')) U.$('#side').classList.remove('open'); });
    var view = document.getElementById('view');
    try { r.render(view, params); } catch (e) { console.error(e); view.innerHTML = '<div class="note red">화면을 그리는 중 오류가 났어요: ' + esc(e.message) + '</div>'; }
    window.scrollTo(0, 0);
  };
  // 사이드바 배지만 갱신
  AXP.refreshNav = function () {
    U.$$('[data-nav]').forEach(function (a) {
      var c = badgeCount(a.getAttribute('data-nav')); var el = a.querySelector('.cnt');
      if (c && !el) { el = document.createElement('span'); el.className = 'cnt'; a.appendChild(el); }
      if (el) { if (c) el.textContent = c; else el.remove(); }
    });
  };

  /* ---------- 로그인 · 가입 ---------- */
  AXP.renderLogin = function (app) {
    var server = AXP.Mode.server;
    var tab = U.ls.get('axp:authTab', server ? 'login' : 'demo');
    app.innerHTML = '<div class="auth">' +
      '<div class="auth-l"><a href="index.html" class="row" style="color:#fff;text-decoration:none;font-weight:800;font-size:20px"><span class="mark" style="width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#3FBF8A,#0E6B4B);display:grid;place-items:center;font-size:13px">AX</span>AX Proof</a>' +
      '<div><span class="auth-eyebrow" id="cohortTag">AI 시대 실무 역량 훈련 플랫폼</span><h1>경력 없는 신입에게<br>첫 실무 경험을.</h1><p>AI 사수와 함께 현업 과제를 수행하고, 그 과정의 판단이 자동으로 쌓여 검증 가능한 포트폴리오가 됩니다.</p>' +
      '<ul class="auth-points"><li><b>◎ AI 사수</b><span>직무별 선배가 답 대신 질문으로 이끌어요. 단계마다 개입이 줄어들어요.</span></li><li><b>☏ 실무자 인터뷰</b><span>AI 실무자로 연습하고, 링커스 현직자를 실제로 만나요.</span></li><li><b>✎ 자동 판단 기록</b><span>따로 쓰지 않아도 판단이 서버 시각으로 남아요.</span></li><li><b>◆ 포트폴리오</b><span>수료 때 현직자 확인이 붙은 포트폴리오가 완성돼요.</span></li></ul></div>' +
      '<p class="small" style="color:#8FB3A3">링커스 파일럿 · 2026 · AI가 점수나 합격을 정하지 않아요</p></div>' +
      '<div class="auth-r"><div class="auth-box"><div class="auth-tabs" role="tablist">' +
      (server ? '<button data-at="login">로그인</button><button data-at="signup">처음이에요</button>' : '') + '<button data-at="demo">둘러보기</button></div><div id="authBox" class="mt16"><p class="muted">불러오는 중…</p></div></div></div></div>';
    var box = document.getElementById('authBox');
    var info = { demo: !server, demoUsers: server ? [] : DB.all('users').filter(function (u) { return u.demo; }), tracks: ['HRD', '서비스기획·운영', '마케팅', '데이터 분석', '영업·CS', '기타'] };
    var colors = { admin: '#163D30', learner: '#0E6B4B', mentor: '#B7791F' };
    var desc = { admin: '기수 운영 · Case·지식 베이스 · 멘토 DB · 기업 챌린지', learner: '온보딩 → 링커슈 → 개인·팀 프로젝트 → 포트폴리오', mentor: '리뷰 · 판단 확인 · 30분 인터뷰로 AI 실무자 만들기' };
    Object.assign(colors, { student: '#2C5DA5', teacher: '#0E6B4B', guardian: '#B7791F' });
    Object.assign(desc, { student: '내 생각 먼저 → AI 예시 비교 → 선택과 이유', teacher: '반 운영 · 관찰 기록 · 보호자 리포트 확인', guardian: '보호자 동의 · 아이의 말과 교사 관찰' });
    var done = function (token, user) { AXP.Session.set(token, user); U.ls.set('axp:authTab', 'login'); boot(); };

    function setTab(t) {
      tab = t; U.ls.set('axp:authTab', t);
      U.$$('[data-at]', app).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-at') === t); });
      ({ login: login, signup: signup, demo: demo })[t]();
    }
    U.$$('[data-at]', app).forEach(function (b) { b.onclick = function () { setTab(b.getAttribute('data-at')); }; });

    /* 로그인 */
    function login() {
      box.innerHTML = '<form id="lgForm" class="stack" novalidate><div><h2>다시 오셨네요</h2><p class="muted small mt8">가입할 때 쓴 이메일과 비밀번호로 로그인하세요.</p></div>' +
        '<div><label class="lb" for="lgEmail">이메일</label><input type="email" id="lgEmail" autocomplete="email" placeholder="name@example.com" required></div>' +
        '<div><label class="lb" for="lgPw">비밀번호</label><div class="pw"><input type="password" id="lgPw" autocomplete="current-password" required><button type="button" class="pw-eye" data-eye="lgPw" aria-label="비밀번호 보기">보기</button></div></div>' +
        '<div class="row between"><label class="check"><input type="checkbox" id="lgKeep" checked> 로그인 상태 유지 (30일)</label><button type="button" class="linkbtn" id="lgForgot">비밀번호를 잊었어요</button></div>' +
        '<p class="form-err" id="lgErr" role="alert"></p><button class="btn lg" type="submit" style="width:100%">로그인</button>' +
        '<p class="small muted center">처음이신가요? <button type="button" class="linkbtn" data-go="signup">초대 코드로 가입하기</button></p></form>';
      eyes();
      U.$('[data-go="signup"]', box).onclick = function () { setTab('signup'); };
      U.$('#lgForgot', box).onclick = function () { AXP.modal({ title: '비밀번호를 잊었어요', body: '<p>보안을 위해 비밀번호는 운영진도 볼 수 없어요.</p><ol class="small mt12"><li>운영진에게 <b>비밀번호 초기화</b>를 요청하세요. (운영진 → 훈련생 → 이름 → 비밀번호 초기화)</li><li>초기화되면 <b>처음이에요</b> 탭에서 같은 이메일과 초대 코드로 새 비밀번호를 정하세요.</li><li>그동안의 판단 기록과 프로젝트는 그대로 남아 있어요.</li></ol>' }); };
      U.$('#lgForm', box).onsubmit = function (e) {
        e.preventDefault();
        var email = U.$('#lgEmail', box).value.trim(), pw = U.$('#lgPw', box).value, err = U.$('#lgErr', box);
        if (!email || !pw) { err.textContent = '이메일과 비밀번호를 입력해 주세요.'; return; }
        var btn = e.submitter || U.$('button[type=submit]', box); btn.disabled = true; btn.textContent = '로그인 중…';
        AXP.api('api/auth', { method: 'POST', body: { action: 'login', email: email, password: pw, remember: U.$('#lgKeep', box).checked } })
          .then(function (j) { done(j.token, j.user); })
          .catch(function (x) { err.textContent = x.message; btn.disabled = false; btn.textContent = '로그인'; });
      };
    }

    /* 가입: ① 초대 코드 → ② 정보 → ③ 동의 */
    function signup() {
      var st = { step: 1, code: '', role: '', cohort: null, teams: [] };
      function draw() {
        var steps = ['초대 코드', '내 정보', '동의'];
        var head = '<div><h2>AX Proof 시작하기</h2><p class="muted small mt8">운영진에게 받은 초대 코드로 가입해요. 코드에 따라 훈련생·현직 멘토·운영진으로 정해져요.</p></div>' +
          '<div class="auth-steps">' + steps.map(function (s, i) { return '<span class="' + (i + 1 === st.step ? 'on' : i + 1 < st.step ? 'done' : '') + '"><i>' + (i + 1 < st.step ? '✓' : i + 1) + '</i>' + s + '</span>'; }).join('') + '</div>';
        if (st.step === 1) {
          box.innerHTML = '<form id="sg1" class="stack">' + head +
            '<div><label class="lb" for="sgCode">초대 코드</label><input type="text" id="sgCode" placeholder="예: LINKUS20" autocomplete="off" value="' + esc(st.code) + '" required><p class="tiny muted mt8">훈련생 코드와 멘토 코드가 달라요. 코드는 기수 안내 메시지에 있어요.</p></div>' +
            '<p class="form-err" id="sgErr" role="alert"></p><button class="btn lg" type="submit" style="width:100%">다음</button>' +
            '<p class="small muted center">이미 가입했나요? <button type="button" class="linkbtn" data-go="login">로그인</button></p></form>';
          U.$('[data-go="login"]', box).onclick = function () { setTab('login'); };
          U.$('#sg1', box).onsubmit = function (e) {
            e.preventDefault(); var code = U.$('#sgCode', box).value.trim(); if (!code) return;
            AXP.api('api/auth', { method: 'POST', body: { action: 'checkCode', code: code } }).then(function (j) {
              st.code = code; st.role = j.role; st.cohort = j.cohort; st.teams = j.teams || []; info.tracks = j.tracks || info.tracks; st.step = 2; draw();
            }).catch(function (x) { U.$('#sgErr', box).textContent = x.message; });
          };
        } else if (st.step === 2) {
          var roleLine = '<div class="note small"><b>' + esc(ROLE_NAME[st.role]) + '</b>로 가입해요' + (st.cohort ? ' · ' + esc(st.cohort.org + ' ' + st.cohort.name) : '') + '</div>';
          box.innerHTML = '<form id="sg2" class="stack" novalidate>' + head + roleLine +
            '<div class="grid g2"><div><label class="lb" for="sgName">이름</label><input type="text" id="sgName" autocomplete="name" value="' + esc(st.name || '') + '" required></div>' +
            '<div><label class="lb" for="sgEmail">이메일</label><input type="email" id="sgEmail" autocomplete="email" value="' + esc(st.email || '') + '" required></div></div>' +
            '<div><label class="lb" for="sgPw">비밀번호 <span class="hint">영문+숫자 8자 이상</span></label><div class="pw"><input type="password" id="sgPw" autocomplete="new-password" required><button type="button" class="pw-eye" data-eye="sgPw" aria-label="비밀번호 보기">보기</button></div><div class="pw-meter"><i id="pwBar"></i></div><p class="tiny muted" id="pwHint">영문과 숫자를 섞어 8자 이상</p></div>' +
            '<div><label class="lb" for="sgPw2">비밀번호 확인</label><input type="password" id="sgPw2" autocomplete="new-password" required></div>' +
            '<details><summary class="small muted">비밀번호를 초기화한 기존 회원인가요?</summary><label class="lb mt8" for="sgReset">운영진에게 받은 일회용 초기화 코드</label><input id="sgReset" type="text" autocomplete="off" value="' + esc(st.resetCode || '') + '"></details>' +
            (st.role === 'learner' ? '<div class="grid g2"><div><label class="lb" for="sgTrack">희망 직무</label><select id="sgTrack">' + info.tracks.map(function (t) { return '<option' + (st.track === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
              '<div><label class="lb" for="sgTeam">직무팀</label><select id="sgTeam"><option value="">아직 없음</option>' + st.teams.map(function (t) { return '<option value="' + esc(t.id) + '" data-track="' + esc(t.track) + '"' + (st.teamId === t.id ? ' selected' : '') + '>' + esc(t.name) + '</option>'; }).join('') + '</select></div></div><p class="tiny muted">직무팀은 링커슈와 팀 프로젝트를 함께하는 팀이에요. 나중에 운영진이 바꿀 수 있어요.</p>' : '') +
            (st.role === 'mentor' ? '<div class="grid g2"><div><label class="lb" for="sgCo">회사 <span class="hint">익명 가능 (예: 제조 대기업 A사)</span></label><input type="text" id="sgCo"></div><div><label class="lb" for="sgJob">직무</label><input type="text" id="sgJob" placeholder="예: HRD 리드"></div></div><div><label class="lb" for="sgYears">연차</label><input type="number" id="sgYears" min="0" style="width:120px"></div>' : '') +
            '<p class="form-err" id="sgErr" role="alert"></p><div class="row between"><button type="button" class="btn ghost" id="sgBack">이전</button><button class="btn" type="submit">다음</button></div></form>';
          eyes();
          var pw = U.$('#sgPw', box);
          pw.oninput = function () { var v = pw.value, sc = (v.length >= 8) + /[A-Za-z]/.test(v) + /\d/.test(v) + (v.length >= 12) + /[^A-Za-z0-9]/.test(v); var bar = U.$('#pwBar', box); bar.style.width = (sc * 20) + '%'; bar.style.background = sc >= 4 ? 'var(--brand)' : sc >= 3 ? 'var(--accent)' : 'var(--danger)'; U.$('#pwHint', box).textContent = sc >= 4 ? '안전한 비밀번호예요' : sc >= 3 ? '사용할 수 있어요' : '영문과 숫자를 섞어 8자 이상'; };
          var team = U.$('#sgTeam', box); if (team) team.onchange = function () { var o = team.options[team.selectedIndex]; if (o && o.getAttribute('data-track')) U.$('#sgTrack', box).value = o.getAttribute('data-track'); };
          U.$('#sgBack', box).onclick = function () { st.step = 1; draw(); };
          U.$('#sg2', box).onsubmit = function (e) {
            e.preventDefault(); var err = U.$('#sgErr', box);
            st.name = U.$('#sgName', box).value.trim(); st.email = U.$('#sgEmail', box).value.trim(); st.pw = pw.value;
            st.resetCode = U.$('#sgReset', box).value.trim();
            if (!st.name) return (err.textContent = '이름을 입력해 주세요.');
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email)) return (err.textContent = '이메일 형식을 확인해 주세요.');
            if (st.pw.length < 8 || !/[A-Za-z]/.test(st.pw) || !/\d/.test(st.pw)) return (err.textContent = '비밀번호는 영문과 숫자를 섞어 8자 이상이에요.');
            if (st.pw !== U.$('#sgPw2', box).value) return (err.textContent = '비밀번호 확인이 달라요.');
            if (st.role === 'learner') { st.track = U.$('#sgTrack', box).value; st.teamId = U.$('#sgTeam', box).value; }
            if (st.role === 'mentor') st.mentor = { company: U.$('#sgCo', box).value, role: U.$('#sgJob', box).value, years: U.$('#sgYears', box).value };
            st.step = 3; draw();
          };
        } else {
          box.innerHTML = '<form id="sg3" class="stack">' + head +
            '<div class="consent"><label class="check"><input type="checkbox" id="cAll"> <b>전체 동의</b></label><hr class="sep" style="margin:10px 0">' +
            '<label class="check"><input type="checkbox" data-c="terms"> <span><b>[필수]</b> 서비스 이용약관과 개인정보 수집·이용 (이름, 이메일, 활동 기록)</span></label>' +
            '<label class="check mt8"><input type="checkbox" data-c="logs"> <span><b>[필수]</b> 훈련 중 판단 기록(AI 대화 처리, 문서 작성, 멘토 대화, 디펜스)이 서버 시각과 함께 자동 기록되고, 운영진·담당 멘토가 볼 수 있음을 확인해요</span></label>' +
            '<label class="check mt8"><input type="checkbox" data-c="kb"> <span>[선택] 내 인터뷰 정리·보고서를 익명화해 다음 기수 훈련 자료(AI 실무자·Case)로 쓰는 데 동의해요</span></label>' +
            '<details class="small mt12"><summary class="muted">자세히 보기</summary><p class="mt8 muted">· 포트폴리오는 기본 비공개이고, 내가 공개로 바꾼 기간에만 링크로 열려요.<br>· 기업 챌린지 결과는 참여할 때 따로 동의한 경우에만 기업에 전달돼요.<br>· 외부 AI에 붙여넣는 대화에는 실명·연락처를 지워 주세요.<br>· 탈퇴·삭제 요청은 운영진에게 할 수 있어요.</p></details></div>' +
            '<p class="form-err" id="sgErr" role="alert"></p><div class="row between"><button type="button" class="btn ghost" id="sgBack">이전</button><button class="btn" type="submit">가입하고 시작하기</button></div></form>';
          var cs = U.$$('[data-c]', box);
          U.$('#cAll', box).onchange = function (e) { cs.forEach(function (c) { c.checked = e.target.checked; }); };
          U.$('#sgBack', box).onclick = function () { st.step = 2; draw(); };
          U.$('#sg3', box).onsubmit = function (e) {
            e.preventDefault(); var c = {}; cs.forEach(function (x) { c[x.getAttribute('data-c')] = x.checked; });
            if (!c.terms || !c.logs) return (U.$('#sgErr', box).textContent = '필수 항목에 동의해 주세요.');
            var btn = e.submitter || U.$('button[type=submit]', box); btn.disabled = true; btn.textContent = '가입하는 중…';
            AXP.api('api/auth', { method: 'POST', body: { action: 'signup', code: st.code, name: st.name, email: st.email, password: st.pw, resetCode: st.resetCode, track: st.track, teamId: st.teamId, consents: c, mentor: st.mentor } })
              .then(function (j) { AXP.toast('환영해요, ' + D.firstName(j.user.name) + ' 님!'); done(j.token, j.user); })
              .catch(function (x) { U.$('#sgErr', box).textContent = x.message; btn.disabled = false; btn.textContent = '가입하고 시작하기'; if (x.status === 409) setTimeout(function () { setTab('login'); }, 1500); });
          };
        }
      }
      draw();
    }

    /* 둘러보기 (데모 계정) */
    function demo() {
      var order = { learner: 0, mentor: 1, admin: 2, student: 3, teacher: 4, guardian: 5 };
      var list = (info.demoUsers || []).slice().sort(function (a, b) { return order[a.role] - order[b.role]; });
      if (!info.demo || !list.length) { box.innerHTML = '<div class="note">이 서버에서는 둘러보기가 꺼져 있어요. 초대 코드로 가입해 주세요.</div>'; return; }
      box.innerHTML = '<div><h2>예시 데이터로 둘러보기</h2><p class="muted small mt8">' + (server ? '가입 없이 역할별 화면을 체험해요. 둘러보기 데이터는 시연용이에요.' : '브라우저 데모 모드예요. 데이터는 이 브라우저에만 저장되고, AI는 데모 응답으로 동작해요.') + '</p></div><div class="role-pick mt16">' +
        list.map(function (u) { return '<button data-demo="' + esc(u.id) + '"><span class="av" style="background:' + colors[u.role] + '">' + esc(u.name.slice(-2)) + '</span><span><b>' + esc(u.name) + ' · ' + ROLE_NAME[u.role] + (u.track ? ' <small class="muted">' + esc(u.track) + '</small>' : '') + '</b><span>' + desc[u.role] + '</span></span></button>'; }).join('') + '</div>' +
        (!server ? '<p class="tiny muted mt16">실제 가입·로그인과 AI 연결은 서버로 실행했을 때 열려요 (web/README.md).</p>' : '');
      U.$$('[data-demo]', box).forEach(function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-demo');
          if (server) AXP.api('api/auth', { method: 'POST', body: { action: 'demo', userId: id } }).then(function (j) { done(j.token, j.user); }).catch(function (e) { AXP.toast(e.message, true); });
          else done('demo', DB.get('users', id));
        };
      });
    }
    function eyes() { U.$$('[data-eye]', box).forEach(function (b) { b.onclick = function () { var i = U.$('#' + b.getAttribute('data-eye'), box); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? '보기' : '숨기기'; }; }); }

    (server ? AXP.api('api/auth') : Promise.resolve(info)).then(function (j) {
      info.demo = j.demo; info.demoUsers = j.demoUsers || []; if (j.tracks) info.tracks = j.tracks;
      if (j.cohort) U.$('#cohortTag', app).textContent = j.cohort.org + ' · ' + j.cohort.name + ' 진행 중 (' + j.cohort.currentWeek + '/' + j.cohort.weeks + '주차)';
      if (!server && tab !== 'demo') tab = 'demo';
      setTab(tab);
    }).catch(function (e) { box.innerHTML = '<div class="note red">로그인 정보를 불러오지 못했어요: ' + esc(e.message) + '</div>'; });
  };

  function boot() {
    return DB.load().then(function () {
      var me = D.me();
      if (!AXP.Mode.server && me) {
        var current = DB.get('users', me.id);
        if (current) { AXP.Session.set('demo', current); me = current; }
        else { AXP.Session.clear(); me = null; if (location.hash.indexOf('#/p/') !== 0) location.hash = '#/login'; }
      }
      if (me && (!location.hash || location.hash === '#/login')) location.hash = HOME[me.role];
      AXP.render();
    }).catch(function (e) {
      if (e.status === 401) { AXP.Session.clear(); AXP.render(); return; }
      document.getElementById('app').innerHTML = '<div class="main"><div class="note red">데이터를 불러오지 못했어요: ' + esc(e.message) + '</div></div>';
    });
  }
  AXP.boot = boot;

  /* ---------- 공용 조각 ---------- */
  AXP.h = {
    head: function (title, sub, actions, crumb) {
      return '<div class="page-head"><div>' + (crumb ? '<div class="crumb">' + crumb + '</div>' : '') + '<h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (actions ? '<div class="row">' + actions + '</div>' : '') + '</div>';
    },
    stat: function (k, v, s, warn) { return '<div class="card stat"><div class="k">' + esc(k) + '</div><div class="v">' + v + '</div>' + (s ? '<div class="s' + (warn ? ' warn' : '') + '">' + esc(s) + '</div>' : '') + '</div>'; },
    lv: function (v, human) { var s = '<div class="lv' + (human ? ' human' : '') + '">'; for (var i = 1; i <= 4; i++) s += '<i class="' + (i <= v ? 'on' : '') + '"></i>'; return s + '</div>'; },
    precept: function (key) {
      var levels = D.program().preceptor.levels; var idx = levels.findIndex(function (l) { return l.key === key; });
      return '<div class="precept">' + levels.map(function (l, i) { return '<div class="' + (i === idx ? 'on' : i < idx ? 'past' : '') + '" title="' + esc(l.desc) + '"><b>' + (i + 1) + ' ' + esc(l.name) + '</b>' + (i === idx ? '지금 단계' : '') + '</div>'; }).join('') + '</div>';
    },
    srcBadge: function (s) {
      var cls = { 'AI 대화': 'blue', '외부 대화': 'blue', '멘토 대화': 'gold', '현직 멘토': 'gold', '디펜스': 'violet', '주간 체크인': 'green', '인터뷰': 'green', '실제 인터뷰': 'green' }[s] || '';
      return '<span class="badge ' + cls + '">' + esc(s) + '</span>';
    },
    stageBadge: function (s) { return '<span class="badge">' + esc(AXP.STAGE_NAME[s] || s) + '</span>'; },
    empty: function (t) { return '<div class="empty">' + esc(t) + '</div>'; }
  };

  // 판단 기록 타임라인 (훈련생·멘토·운영진 공용)
  AXP.timeline = function (logs, opts) {
    opts = opts || {};
    if (!logs.length) return AXP.h.empty('아직 기록이 없어요. 일을 시작하면 여기에 자동으로 쌓여요.');
    return '<div class="tl">' + logs.map(function (l, i) {
      var cls = /AI|외부/.test(l.source) ? 'ai' : /멘토/.test(l.source) ? 'mentor' : l.source === '디펜스' ? 'defense' : '';
      var verifier = l.verifiedBy ? D.user(l.verifiedBy) : null;
      return '<div class="tl-item ' + cls + '" data-log="' + esc(l.id) + '"><div class="tl-meta">' + (opts.numbered ? '<b>#' + (i + 1) + '</b>' : '') + (opts.author ? '<span class="badge ' + (l.userId === opts.me ? 'solid' : 'violet') + '">' + esc(AXP.D.user(l.userId).name) + '</span>' : '') + AXP.h.stageBadge(l.stage) + '<span class="badge">' + esc(l.kind) + '</span>' + AXP.h.srcBadge(l.source) +
        (l.action ? '<span class="badge blue">' + esc(l.action) + '</span>' : '') + (l.edited ? '<span class="badge gold">직접 수정</span>' : '') + (verifier ? '<span class="badge solid">✓ ' + esc(verifier.name) + ' 확인</span>' : '') +
        '<span>' + U.fmt(l.createdAt, true) + '</span>' + (opts.pick ? '<label class="check" style="margin-left:auto"><input type="checkbox" data-pick="' + esc(l.id) + '"' + ((opts.picked || []).indexOf(l.id) >= 0 ? ' checked' : '') + '> 대표 판단</label>' : '') + '</div>' +
        (l.aiMessage ? '<div class="tl-orig">AI 원문 · ' + esc(U.short(l.aiMessage, 240)) + '</div>' : '') +
        '<div class="tl-text">' + esc(l.text) + '</div>' +
        (l.edited && opts.showOrig !== false ? '<details class="small mt8"><summary class="muted">원래 기록 보기</summary><div class="tl-orig">' + esc(l.original) + '</div></details>' : '') +
        (l.verifyNote ? '<div class="tl-verify">멘토 · ' + esc(l.verifyNote) + '</div>' : '') +
        (opts.editable && (!opts.me || l.userId === opts.me) ? '<div class="row mt8"><button class="linkbtn" data-edit="' + esc(l.id) + '">고치기</button></div>' : '') +
        (opts.verify && !l.verifiedBy ? '<div class="row mt8"><button class="btn sm soft" data-verify="' + esc(l.id) + '">✓ 확인 표시</button></div>' : '') +
        '</div>';
    }).join('') + '</div>';
  };
  AXP.bindTimeline = function (root, onChange) {
    U.$$('[data-edit]', root).forEach(function (b) {
      b.onclick = function () {
        var l = DB.get('logs', b.getAttribute('data-edit'));
        var m = AXP.modal({ title: '판단 기록 고치기', sub: '고친 기록에는 "직접 수정"이 표시되고, 원래 기록도 함께 남아요.', body: '<textarea rows="6" id="edTxt">' + esc(l.text) + '</textarea><div class="row end mt12"><button class="btn" id="edSave">저장</button></div>' });
        U.$('#edSave', m.body).onclick = function () {
          var v = U.$('#edTxt', m.body).value.trim(); if (!v) return;
          var rec = Object.assign({}, l, { text: v });
          DB.put('logs', rec).then(function () { m.close(); AXP.toast('고쳤어요'); if (onChange) onChange(); });
        };
      };
    });
    U.$$('[data-verify]', root).forEach(function (b) {
      b.onclick = function () {
        var l = DB.get('logs', b.getAttribute('data-verify'));
        var m = AXP.modal({ title: '이 판단을 확인합니다', sub: '실제 현업 관점에서 타당하다고 본 판단에 "확인" 표시를 남겨요. 포트폴리오에 함께 표시됩니다.', body: '<div class="tl-text">' + esc(l.text) + '</div><label class="lb mt12" for="vNote">한 줄 코멘트 (선택)</label><input type="text" id="vNote"><div class="row end mt12"><button class="btn" id="vSave">✓ 확인 표시</button></div>' });
        U.$('#vSave', m.body).onclick = function () {
          var rec = Object.assign({}, l, { verifiedBy: D.me().id, verifyNote: U.$('#vNote', m.body).value.trim() });
          DB.put('logs', rec).then(function () { m.close(); AXP.toast('확인 표시를 남겼어요'); if (onChange) onChange(); });
        };
      };
    });
  };

  /* ---------- 시작 ---------- */
  window.addEventListener('hashchange', function () { AXP.render(); });
  // 홈페이지의 "역할별로 둘러보기" 링크: app.html?as=learner|mentor|admin
  function demoFromQuery() {
    var as = (location.search.match(/[?&]as=(learner|mentor|admin|student|teacher|guardian)/) || [])[1];
    if (!as) return Promise.resolve(false);
    history.replaceState(null, '', location.pathname + (location.hash || ''));
    var pickUser = function (list) { return list.filter(function (u) { return u.demo && u.role === as; })[0]; };
    if (AXP.Mode.server) {
      return AXP.api('api/auth').then(function (info) {
        var u = info.demo && pickUser(info.demoUsers || []); if (!u) return false;
        return AXP.api('api/auth', { method: 'POST', body: { action: 'demo', userId: u.id } }).then(function (j) { AXP.Session.set(j.token, j.user); if (!location.hash) location.hash = HOME[as]; return true; });
      }).catch(function () { return false; });
    }
    return DB.load().then(function () { var u = pickUser(DB.all('users')); if (!u) return false; AXP.Session.set('demo', u); if (!location.hash) location.hash = HOME[as]; return true; });
  }

  AXP.start = function () {
    AXP.detectMode().then(demoFromQuery).then(function () {
      if (AXP.Session.user && AXP.Mode.server && AXP.Session.token === 'demo') AXP.Session.clear();
      if (AXP.Session.user && !AXP.Mode.server && AXP.Session.token !== 'demo') AXP.Session.clear();
      if (!AXP.Session.user && !AXP.Mode.server) { DB.load().then(AXP.render); return; }
      if (!AXP.Session.user) { if (location.hash.indexOf('#/p/') === 0) { AXP.render(); return; } AXP.render(); return; }
      boot();
    });
  };
})();
