/* AX Proof · 운영진 화면 */
(function () {
  var AXP = window.AXP, U = AXP.U, DB = AXP.DB, D = AXP.D, esc = U.esc, h = AXP.h;
  var R = function (path, fn) { AXP.route('admin', path, fn); };
  function learners() { var c = D.cohort(); return DB.where('users', function (u) { return u.role === 'learner' && (!c || u.cohortId === c.id); }); }
  function lastActive(u) {
    var t = [u.createdAt];
    D.myProjects(u.id).forEach(function (p) { t.push(p.updatedAt); });
    D.logsOf(u.id).forEach(function (l) { t.push(l.createdAt); });
    return t.filter(Boolean).sort().pop();
  }
  function risks(u) {
    var out = [], logs = D.logsOf(u.id), p = D.myProjects(u.id)[0];
    var la = lastActive(u); if (la && (Date.now() - new Date(la)) / 864e5 >= 3) out.push(['3일 이상 활동 없음', 'red']);
    if (!D.onboarded(u.id)) out.push(['온보딩 미완료', 'gold']);
    if (logs.some(function (l) { return /코치 검토 없이/.test(l.text); })) out.push(['질문지 검토 없이 인터뷰', 'gold']);
    var acts = logs.filter(function (l) { return l.action; }), used = acts.filter(function (l) { return l.action === '쓴다'; });
    if (acts.length >= 1 && used.length / acts.length >= 0.7) out.push(['AI 답을 대부분 그대로 사용', 'gold']);
    if (p && (p.data.prep || {}).questions && !(p.data.prep.goal || '').trim()) out.push(['인터뷰 목적 미작성', 'gold']);
    if (DB.where('reviews', function (r) { return r.learnerId === u.id && r.status === '요청'; }).length) out.push(['멘토 리뷰 대기', 'blue']);
    return out;
  }
  AXP.adminRisks = risks;

  /* ================= 운영 대시보드 ================= */
  R('#/a/home', function (el) {
    var cohort = D.cohort(), L = learners();
    var allLogs = DB.where('logs', function (l) { return L.some(function (u) { return u.id === l.userId; }); });
    var week = allLogs.filter(function (l) { return Date.now() - new Date(l.createdAt) < 7 * 864e5; });
    var auto = allLogs.filter(function (l) { return l.source !== '판단 카드'; }).length;
    var acts = allLogs.filter(function (l) { return l.action; });
    var STG = Object.keys(AXP.STAGE_DEFS).map(function (k) { return { key: k, name: AXP.STAGE_DEFS[k].name }; });
    var activeOf = function (u) { var ps = D.myProjects(u.id); return ps.filter(function (p) { return !p.completedAt; })[0] || ps[0]; };
    var stageCount = STG.map(function (s) { return L.filter(function (u) { var p = activeOf(u); return p && p.stage === s.key; }).length; });
    var noProj = L.filter(function (u) { return !D.myProjects(u.id).length; }).length;
    var kb = DB.all('knowledge'), kbAuto = kb.filter(function (k) { return k.auto; }).length;
    var usage = DB.all('usage'), calls = usage.reduce(function (s, x) { return s + (x.calls || 0); }, 0);
    var rub = DB.where('reviews', function (r) { return r.rubric; });
    var flagged = L.map(function (u) { return [u, risks(u)]; }).filter(function (x) { return x[1].some(function (r) { return r[1] === 'red'; }) || x[1].length >= 2; });
    el.innerHTML = h.head('운영 대시보드', esc(cohort ? cohort.org + ' · ' + cohort.name + ' · ' + cohort.currentWeek + '주차 / ' + cohort.weeks + '주' : '') + ' — 모든 숫자는 플랫폼에 쌓인 데이터로 실시간 계산돼요.', '<button class="btn ghost" onclick="window.print()">인쇄 · PDF</button>') +
      '<div class="grid g4">' + h.stat('참여 훈련생', L.length + '명', '온보딩 완료 ' + L.filter(function (u) { return D.onboarded(u.id); }).length + '명') + h.stat('이번 주 판단 기록', week.length, '전체 ' + allLogs.length + ' · 자동 ' + U.pct(auto, allLogs.length) + '%') +
      h.stat('멘토 확인 판단', allLogs.filter(function (l) { return l.verifiedBy; }).length, '현직자 리뷰 ' + rub.length + '건') + h.stat('AI 답 그대로 사용', U.pct(acts.filter(function (l) { return l.action === '쓴다'; }).length, acts.length) + '%', 'AI 답 처리 ' + acts.length + '건 중', U.pct(acts.filter(function (l) { return l.action === '쓴다'; }).length, acts.length) > 60) + '</div>' +
      '<div class="grid g2 mt16"><div class="card"><h2>단계별 분포</h2><p class="small muted mt8">각 훈련생의 현재 프로젝트 단계' + (noProj ? ' · 프로젝트 시작 전 ' + noProj + '명' : '') + '</p><div class="mt12">' +
      STG.map(function (s, i) { return '<div class="hbar"><span>' + s.name + '</span><div class="bar"><i style="width:' + U.pct(stageCount[i], L.length || 1) + '%"></i></div><span class="small">' + stageCount[i] + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="card"><h2>AI 답 처리 방식</h2><p class="small muted mt8">훈련생이 AI 답을 어떻게 다뤘는지 — 비판적 활용의 신호</p><div class="mt12">' + AXP.ACTIONS.map(function (a) { var n = acts.filter(function (l) { return l.action === a; }).length; return '<div class="hbar"><span>' + a + '</span><div class="bar' + (a === '쓴다' ? ' gold' : '') + '"><i style="width:' + U.pct(n, acts.length || 1) + '%"></i></div><span class="small">' + n + '</span></div>'; }).join('') +
      '</div><hr class="sep"><h3>역량 평균 (현직 멘토 평가)</h3><div class="mt8">' + AXP.COMPETENCIES.map(function (k) { var v = U.avg(rub.map(function (r) { return r.rubric[k]; })); return '<div class="hbar"><span class="small">' + k + '</span><div class="bar gold"><i style="width:' + (v / 4 * 100) + '%"></i></div><span class="small">' + (v ? v.toFixed(1) : '-') + '</span></div>'; }).join('') + '</div></div></div>' +
      '<div class="grid g-main-wide mt16"><div class="card"><div class="card-head"><div><h2>챙겨야 할 훈련생</h2><p>막힌 사람을 먼저 찾아 드려요. 사람의 개입은 여기에만 쓰세요.</p></div><a class="small" href="#/a/learners">전체 보기</a></div>' +
      (flagged.length ? flagged.map(function (x) { return '<a class="item click" style="display:block;text-decoration:none;color:inherit" href="#/a/learner/' + x[0].id + '"><div class="row between"><b>' + esc(x[0].name) + '</b><span class="tiny muted">마지막 활동 ' + U.fmt(lastActive(x[0])) + '</span></div><div class="row mt8">' + x[1].map(function (r) { return '<span class="badge ' + r[1] + '">' + esc(r[0]) + '</span>'; }).join('') + '</div></a>'; }).join('') : h.empty('지금은 없어요')) + '</div>' +
      '<div class="stack-lg"><div class="card"><h3>지식 베이스 자동 반영률</h3><div class="row between mt8"><span class="small">' + kbAuto + ' / ' + kb.length + '건</span><b>' + U.pct(kbAuto, kb.length) + '%</b></div><div class="bar mt8"><i style="width:' + U.pct(kbAuto, kb.length) + '%"></i></div><p class="tiny muted mt8">목표 80% · 나머지는 운영진 검수</p><a class="btn ghost sm mt12" href="#/a/knowledge">지식 에이전트</a></div>' +
      '<div class="card"><h3>AI 사용량</h3><p class="mt8"><b style="font-size:24px">' + calls + '</b> 회 호출</p><p class="tiny muted">입력 ' + Math.round(usage.reduce(function (s, x) { return s + (x.input || 0); }, 0) / 1000) + 'K · 출력 ' + Math.round(usage.reduce(function (s, x) { return s + (x.output || 0); }, 0) / 1000) + 'K 토큰</p><a class="btn ghost sm mt12" href="#/a/ai">AI 설정</a></div>' +
      '<div class="card"><h3>검수 대기</h3><p class="small mt8">Case ' + DB.where('cases', function (c) { return c.status === '검수 대기'; }).length + '건 · 지식 ' + kb.filter(function (k) { return k.status === '검수 대기'; }).length + '건 · 제출물 ' + DB.where('submissions', function (s) { return s.status === '제출'; }).length + '건</p></div></div></div>';
  });

  /* ================= 훈련생 ================= */
  R('#/a/learners', function (el) {
    var L = learners();
    el.innerHTML = h.head('훈련생', '진행 단계·기록·위험 신호를 한눈에 봐요.', '<button class="btn ghost" id="inv">초대 안내</button>') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>이름</th><th>희망 직무</th><th>직무팀</th><th>온보딩</th><th>프로젝트 · 단계</th><th>기록</th><th>멘토 확인</th><th>마지막 활동</th><th>신호</th></tr></thead><tbody>' +
      L.map(function (u) { var p = D.myProjects(u.id)[0], logs = D.logsOf(u.id); return '<tr class="click" data-u="' + u.id + '"><td><b>' + esc(u.name) + '</b></td><td>' + esc(u.track || '') + '</td><td>' + esc((D.team(u.teamId) || {}).name || '-') + '</td><td>' + (D.onboarded(u.id) ? '<span class="dot on"></span>' : '<span class="dot warn"></span>') + '</td><td>' + (p ? esc(U.short(p.title, 22)) + ' ' + h.stageBadge(p.stage) : '<span class="muted">-</span>') + '</td><td>' + logs.length + '</td><td>' + logs.filter(function (l) { return l.verifiedBy; }).length + '</td><td class="small">' + U.fmt(lastActive(u)) + '</td><td>' + risks(u).map(function (r) { return '<span class="badge ' + r[1] + '" style="margin:1px">' + esc(r[0]) + '</span>'; }).join('') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    U.$$('[data-u]', el).forEach(function (tr) { tr.onclick = function () { AXP.go('#/a/learner/' + tr.getAttribute('data-u')); }; });
    U.$('#inv', el).onclick = function () { var c = D.cohort(); AXP.modal({ title: '훈련생·멘토 초대', body: '<p>아래 주소와 코드를 안내하세요. 로그인 화면의 <b>처음이에요</b> 탭에서 초대 코드 → 이름·이메일·비밀번호·직무팀 → 동의 순서로 가입해요.</p><dl class="kv mt12"><dt>접속 주소</dt><dd>' + esc(location.href.split('#')[0]) + '</dd><dt>훈련생 코드</dt><dd><b>' + esc(c.inviteCode) + '</b></dd><dt>멘토 코드</dt><dd><b>' + esc(c.mentorCode) + '</b></dd></dl>' + (!AXP.Mode.server ? '<div class="note gold mt12">지금은 브라우저 데모 모드예요. 여러 사람이 함께 쓰려면 서버로 실행·배포해야 해요 (README 참고).</div>' : '') }); };
  });
  R('#/a/learner/:id', function (el, prm) {
    var u = D.user(prm.id), prjs = D.myProjects(u.id), logs = D.logsOf(u.id), chats = DB.where('chats', function (c) { return c.userId === u.id; }), subs = DB.where('submissions', function (s) { return s.userId === u.id; });
    var tab = 'log';
    function render() {
      el.innerHTML = h.head(u.name, esc(u.track || '') + ' · ' + esc(u.email || ''), '', '<a href="#/a/learners">훈련생</a>') +
        '<div class="row between"><div class="row">' + (u.teamId && D.team(u.teamId) ? '<span class="badge violet">' + esc(D.team(u.teamId).name) + '</span>' : '') + risks(u).map(function (r) { return '<span class="badge ' + r[1] + '">' + esc(r[0]) + '</span>'; }).join('') + '</div>' + (AXP.Mode.server ? '<button class="btn sm danger" id="pwReset">비밀번호 초기화</button>' : '') + '</div>' +
        '<div class="grid g4 mt16">' + h.stat('판단 기록', logs.length, '직접 수정 ' + logs.filter(function (l) { return l.edited; }).length) + h.stat('AI 사수 대화', chats.filter(function (c) { return c.mode === 'mentor'; }).length, '업무용 AI ' + chats.filter(function (c) { return c.mode === 'work'; }).length) + h.stat('외부 대화', chats.filter(function (c) { return c.mode === 'external'; }).length, '붙여넣은 대화') + h.stat('제출물', subs.length, '') + '</div>' +
        '<div class="card mt16"><div class="seg"><button data-t="log" aria-pressed="' + (tab === 'log') + '">판단 기록</button><button data-t="prj" aria-pressed="' + (tab === 'prj') + '">프로젝트</button><button data-t="chat" aria-pressed="' + (tab === 'chat') + '">AI 대화</button><button data-t="sub" aria-pressed="' + (tab === 'sub') + '">제출물</button></div><div class="mt16" id="tb"></div></div>';
      var tb = U.$('#tb', el);
      if (tab === 'log') { tb.innerHTML = AXP.timeline(logs.slice().reverse(), { verify: true }); AXP.bindTimeline(tb, function () { logs = D.logsOf(u.id); render(); }); }
      if (tab === 'prj') tb.innerHTML = prjs.map(function (p) { var c = D.case(p.caseId); return '<div class="item"><div class="row between"><b>' + esc(p.title) + '</b>' + h.stageBadge(p.stage) + '</div><p class="small muted"><span class="badge ' + AXP.KINDS_INFO[AXP.kindOf(p)].badge + '">' + esc(AXP.KINDS_INFO[AXP.kindOf(p)].name) + '</span> ' + esc(c.company) + ' · ' + (p.data.talk && p.data.talk.mode === 'real' ? '실제 인터뷰' : 'AI 실무자') + '</p>' + (AXP.readinessOf(p, u.id) ? AXP.readinessCard(AXP.readinessOf(p, u.id), { showInterview: true }) : '') + '</div>'; }).join('') || h.empty('없음');
      var pr = U.$('#pwReset', el); if (pr) pr.onclick = function () {
        AXP.confirm(u.name + ' 님의 비밀번호를 초기화할까요? 판단 기록·프로젝트는 그대로 남고, 본인이 같은 이메일과 초대 코드로 다시 가입하면 새 비밀번호를 정할 수 있어요.', '초기화')
          .then(function (ok) { if (ok) AXP.api('api/auth', { method: 'POST', body: { action: 'resetPassword', userId: u.id } }).then(function (j) { AXP.modal({ title: '일회용 초기화 코드', sub: '본인 확인 후 이 회원에게만 전달하세요. 이전 로그인은 만료됐습니다. 처음이에요 탭에서 같은 이메일·초대 코드와 이 코드를 입력해 새 비밀번호를 정합니다.', body: '<input readonly value="' + esc(j.resetCode) + '" aria-label="초기화 코드">' }); }).catch(function (e) { AXP.toast(e.message, true); }); });
      };
      if (tab === 'chat') tb.innerHTML = chats.map(function (c) { return '<details class="item"><summary><span class="badge">' + esc(c.mode === 'external' ? c.source : c.mode === 'mentor' ? 'AI 사수' : '업무용 AI') + '</span> ' + esc(c.title || '') + ' <span class="tiny muted">' + c.messages.length + '개 메시지</span></summary><div class="mt12 small pre">' + esc(AXP.Chat.transcriptText(c, 'AI')) + '</div></details>'; }).join('') || h.empty('없음');
      if (tab === 'sub') tb.innerHTML = subs.map(function (s) { var a = DB.get('assignments', s.assignmentId) || {}; return '<details class="item"><summary><b>' + esc(s.title || a.title || '제출물') + '</b> <span class="badge">' + esc(s.status) + '</span>' + (s.aiUnchanged ? ' <span class="badge gold">AI 초안 그대로</span>' : '') + '</summary><div class="mt12 small pre">' + esc(s.body || '') + '</div></details>'; }).join('') || h.empty('없음');
      U.$$('[data-t]', el).forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-t'); render(); }; });
    }
    render();
  });

  /* ================= 기수 · 프로그램 ================= */
  R('#/a/cohort', function (el) {
    var c = JSON.parse(JSON.stringify(D.cohort())), prog = JSON.parse(JSON.stringify(D.program()));
    var asgs = DB.where('assignments', function (a) { return a.cohortId === c.id; });
    var levels = prog.preceptor.levels;
    el.innerHTML = h.head('기수 · 프로그램 설계', '링커슈 → 개인 프로젝트 → 팀 프로젝트로 이어지는 메인 프로그램을 플랫폼 안에서 운영해요. 참여자가 흐름을 따라가도록 단계 관문을 걸 수 있어요.', '<button class="btn" id="saveAll">저장</button>') +
      '<div class="grid g2"><div class="card"><h2>기수</h2><div class="grid g2 mt12"><div><label class="lb">기수 이름</label><input type="text" id="cName" value="' + esc(c.name) + '"></div><div><label class="lb">운영 기관</label><input type="text" id="cOrg" value="' + esc(c.org) + '"></div><div><label class="lb">시작일</label><input type="date" id="cStart" value="' + esc(c.startDate) + '"></div><div><label class="lb">현재 주차 / 총 주차</label><div class="row" style="flex-wrap:nowrap"><input type="number" id="cWeek" value="' + c.currentWeek + '"><input type="number" id="cWeeks" value="' + c.weeks + '"></div></div><div><label class="lb">훈련생 초대 코드</label><input type="text" id="cInv" value="' + esc(c.inviteCode) + '"></div><div><label class="lb">멘토 초대 코드</label><input type="text" id="cMen" value="' + esc(c.mentorCode) + '"></div></div></div>' +
      '<div class="card"><h2>흐름 관리 (관문)</h2><div class="stack mt12">' +
      [['onboardingGate', 'AI 업무 활용 온보딩을 마쳐야 프로젝트 시작'], ['mentorApprovalGate', '기획안 단계에서 현직 멘토 승인 후 수행 시작'], ['preceptorAuto', '단계에 따라 AI 사수 개입 수준 자동 조정 (프리셉터십)'], ['defenseNoPaste', '디펜스·멘토 질문 답변에서 붙여넣기 차단']].map(function (x) { return '<label class="check"><input type="checkbox" data-pol="' + x[0] + '"' + (c.policy[x[0]] ? ' checked' : '') + '> ' + x[1] + '</label>'; }).join('') +
      '<div><label class="lb">AI 실무자 인터뷰 최대 질문 수</label><input type="number" id="maxQ" value="' + (c.policy.maxInterviewQuestions || 15) + '" style="width:120px"></div></div></div></div>' +
      '<div class="card mt16"><div class="card-head"><div><h2>직무팀</h2><p>링커슈와 팀 프로젝트는 직무팀 단위로 해요. 훈련생은 가입할 때 팀을 고르고, 여기서 바꿀 수 있어요. 팀 프로젝트의 판단 기록은 팀원마다 따로 남아요.</p></div><button class="btn ghost sm" id="addTeam">+ 직무팀</button></div><div id="teams" class="stack"></div></div>' +
      '<div class="card mt16"><div class="card-head"><div><h2>프로그램 모듈</h2><p>기수의 큰 흐름이에요. 훈련생 홈에 그대로 보여요.</p></div><button class="btn ghost sm" id="addM">+ 모듈</button></div><div id="mods" class="stack"></div></div>' +
      '<div class="card mt16"><h2>프리셉터십 — AI 사수 개입 단계</h2><p class="small muted mt8">간호 프리셉터십처럼 "보여주기 → 같이하기 → 지켜보기 → 맡기기"로 개입을 점점 줄여 독립 수행으로 이끌어요. 단계별로 정하세요.</p>' +
      '<div class="grid g4 mt12">' + levels.map(function (l, i) { return '<div class="item"><b>' + (i + 1) + ' ' + esc(l.name) + '</b><p class="tiny muted mt8">' + esc(l.desc) + '</p></div>'; }).join('') + '</div>' +
      '<div class="table-wrap mt16"><table class="t"><thead><tr><th>프로젝트 단계</th><th>AI 사수 개입</th></tr></thead><tbody>' + [['onboarding', '온보딩']].concat(Object.keys(AXP.STAGE_DEFS).map(function (k) { return [k, AXP.STAGE_DEFS[k].name + (['job', 'issue', 'propose'].indexOf(k) >= 0 ? ' (링커슈)' : '')]; })).map(function (s) { return '<tr><td>' + s[1] + '</td><td><select data-sm="' + s[0] + '" style="width:auto">' + levels.map(function (l) { return '<option value="' + l.key + '"' + (prog.preceptor.stageMap[s[0]] === l.key ? ' selected' : '') + '>' + l.name + '</option>'; }).join('') + '</select></td></tr>'; }).join('') + '</tbody></table></div></div>' +
      '<div class="card mt16"><div class="card-head"><div><h2>AI 사수 페르소나</h2><p>직무별 선배. 지식 베이스가 쌓일수록 같은 페르소나가 더 현업다워져요.</p></div><button class="btn ghost sm" id="addPer">+ 페르소나</button></div><div id="pers" class="stack"></div></div>' +
      '<div class="card mt16"><div class="card-head"><div><h2>과제 (제출함)</h2><p>카페·구글폼 대신 플랫폼 제출함으로 받아요. 자동 연결 과제는 프로젝트 산출물이 그대로 들어와요.</p></div><button class="btn ghost sm" id="addA">+ 과제</button></div><div class="table-wrap"><table class="t"><thead><tr><th>과제</th><th>유형</th><th>모듈</th><th>마감</th><th>자동 연결</th><th></th></tr></thead><tbody>' +
      asgs.map(function (a) { return '<tr><td><b>' + esc(a.title) + '</b><div class="tiny muted">' + esc(a.desc || '') + '</div></td><td>' + esc(a.type) + '</td><td>' + esc((c.modules.find(function (m) { return m.id === a.moduleId; }) || {}).title || '') + '</td><td>' + esc(a.due) + '</td><td>' + (a.auto ? '<span class="badge green">' + esc(a.auto) + '</span>' : '-') + '</td><td><button class="linkbtn" data-delA="' + a.id + '">삭제</button></td></tr>'; }).join('') + '</tbody></table></div></div>';
    function mods() {
      U.$('#mods', el).innerHTML = c.modules.map(function (m, i) { return '<div class="row" style="flex-wrap:nowrap"><input type="text" data-mw="' + i + '" value="' + esc(m.weeks) + '" style="width:110px"><input type="text" data-mt="' + i + '" value="' + esc(m.title) + '" style="width:220px"><input type="text" data-md="' + i + '" value="' + esc(m.desc) + '"><button class="btn ghost sm" data-mx="' + i + '">×</button></div>'; }).join('');
      U.$$('[data-mw]', el).forEach(function (x) { x.oninput = function () { c.modules[+x.getAttribute('data-mw')].weeks = x.value; }; });
      U.$$('[data-mt]', el).forEach(function (x) { x.oninput = function () { c.modules[+x.getAttribute('data-mt')].title = x.value; }; });
      U.$$('[data-md]', el).forEach(function (x) { x.oninput = function () { c.modules[+x.getAttribute('data-md')].desc = x.value; }; });
      U.$$('[data-mx]', el).forEach(function (x) { x.onclick = function () { c.modules.splice(+x.getAttribute('data-mx'), 1); mods(); }; });
    }
    function pers() {
      U.$('#pers', el).innerHTML = prog.mentorPersonas.map(function (p, i) { return '<div class="grid g4"><input type="text" data-pn="' + i + '" value="' + esc(p.name) + '" placeholder="이름"><input type="text" data-pt="' + i + '" value="' + esc(p.title) + '" placeholder="직무·연차"><input type="text" data-ps="' + i + '" value="' + esc(p.style) + '" placeholder="말투"><input type="text" data-pk="' + i + '" value="' + esc((p.tracks || []).join(', ')) + '" placeholder="담당 직무(쉼표)"></div>'; }).join('');
      U.$$('[data-pn]', el).forEach(function (x) { x.oninput = function () { prog.mentorPersonas[+x.getAttribute('data-pn')].name = x.value; }; });
      U.$$('[data-pt]', el).forEach(function (x) { x.oninput = function () { prog.mentorPersonas[+x.getAttribute('data-pt')].title = x.value; }; });
      U.$$('[data-ps]', el).forEach(function (x) { x.oninput = function () { prog.mentorPersonas[+x.getAttribute('data-ps')].style = x.value; }; });
      U.$$('[data-pk]', el).forEach(function (x) { x.oninput = function () { prog.mentorPersonas[+x.getAttribute('data-pk')].tracks = x.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean); }; });
    }
    c.teams = c.teams || [];
    var learnersAll = DB.where('users', function (u) { return u.role === 'learner' && u.cohortId === c.id; });
    function teams() {
      U.$('#teams', el).innerHTML = c.teams.length ? c.teams.map(function (t, i) {
        return '<div class="item"><div class="row" style="flex-wrap:nowrap"><input type="text" data-tn="' + i + '" value="' + esc(t.name) + '" placeholder="팀 이름 (예: HRD팀)" style="width:180px"><input type="text" data-tt="' + i + '" value="' + esc(t.track) + '" placeholder="직무 (예: HRD)" style="width:180px"><span class="small muted">' + (t.members || []).length + '명</span><button class="btn ghost sm" data-tx="' + i + '" style="margin-left:auto">삭제</button></div>' +
          '<div class="chips mt8">' + learnersAll.map(function (u) { var on = (t.members || []).indexOf(u.id) >= 0; return '<button class="chip" data-tm="' + i + ':' + u.id + '" aria-pressed="' + on + '">' + esc(u.name) + '</button>'; }).join('') + '</div></div>';
      }).join('') : '<p class="small muted">아직 직무팀이 없어요.</p>';
      U.$$('[data-tn]', el).forEach(function (x) { x.oninput = function () { c.teams[+x.getAttribute('data-tn')].name = x.value; }; });
      U.$$('[data-tt]', el).forEach(function (x) { x.oninput = function () { c.teams[+x.getAttribute('data-tt')].track = x.value; }; });
      U.$$('[data-tx]', el).forEach(function (x) { x.onclick = function () { c.teams.splice(+x.getAttribute('data-tx'), 1); teams(); }; });
      U.$$('[data-tm]', el).forEach(function (x) { x.onclick = function () {
        var a = x.getAttribute('data-tm').split(':'), i = +a[0], uid = a[1];
        var has = (c.teams[i].members || []).indexOf(uid) >= 0;
        c.teams.forEach(function (t) { t.members = (t.members || []).filter(function (m) { return m !== uid; }); });
        if (!has) c.teams[i].members.push(uid);
        teams();
      }; });
    }
    U.$('#addTeam', el).onclick = function () { c.teams.push({ id: U.uid('team'), name: '', track: '', members: [] }); teams(); };
    mods(); pers(); teams();
    U.$('#addM', el).onclick = function () { c.modules.push({ id: U.uid('m'), title: '', weeks: '', kind: 'etc', desc: '' }); mods(); };
    U.$('#addPer', el).onclick = function () { prog.mentorPersonas.push({ id: U.uid('per'), name: '', title: '', style: '', tracks: [] }); pers(); };
    U.$$('[data-delA]', el).forEach(function (b) { b.onclick = function () { DB.del('assignments', b.getAttribute('data-delA')).then(function () { AXP.render(); }); }; });
    U.$('#addA', el).onclick = function () {
      var md = AXP.modal({ title: '과제 추가', body: '<label class="lb">제목</label><input type="text" id="aT"><div class="grid g2 mt12"><div><label class="lb">유형</label><select id="aY"><option>링커슈</option><option>컨택 보고서</option><option>Decision Log</option><option>결과 보고</option><option>세션 과제</option><option>기타</option></select></div><div><label class="lb">마감</label><input type="date" id="aD"></div></div><label class="lb mt12">모듈</label><select id="aM">' + c.modules.map(function (m) { return '<option value="' + m.id + '">' + esc(m.title) + '</option>'; }).join('') + '</select><label class="lb mt12">설명</label><textarea id="aS" rows="3"></textarea><div class="row end mt12"><button class="btn" id="aGo">추가</button></div>' });
      U.$('#aGo', md.body).onclick = function () { var t = U.$('#aT', md.body).value.trim(); if (!t || !U.$('#aD', md.body).value) return AXP.toast('제목과 마감을 입력하세요', true); DB.put('assignments', { id: U.uid('asg'), cohortId: c.id, moduleId: U.$('#aM', md.body).value, title: t, type: U.$('#aY', md.body).value, due: U.$('#aD', md.body).value, desc: U.$('#aS', md.body).value }).then(function () { md.close(); AXP.render(); }); };
    };
    U.$('#saveAll', el).onclick = function () {
      c.name = U.$('#cName', el).value; c.org = U.$('#cOrg', el).value; c.startDate = U.$('#cStart', el).value; c.currentWeek = +U.$('#cWeek', el).value; c.weeks = +U.$('#cWeeks', el).value; c.inviteCode = U.$('#cInv', el).value.trim(); c.mentorCode = U.$('#cMen', el).value.trim();
      U.$$('[data-pol]', el).forEach(function (x) { c.policy[x.getAttribute('data-pol')] = x.checked; }); c.policy.maxInterviewQuestions = +U.$('#maxQ', el).value || 15;
      U.$$('[data-sm]', el).forEach(function (x) { prog.preceptor.stageMap[x.getAttribute('data-sm')] = x.value; });
      prog.mentorPersonas = prog.mentorPersonas.filter(function (p) { return p.name; });
      c.teams = c.teams.filter(function (t) { return t.name; });
      var userUpdates = learnersAll.map(function (u) { var t = c.teams.find(function (x) { return (x.members || []).indexOf(u.id) >= 0; }); var tid = t ? t.id : null; if ((u.teamId || null) === tid) return null; var nu = Object.assign({}, u, { teamId: tid }); if (t && t.track && !u.track) nu.track = t.track; return DB.put('users', nu); }).filter(Boolean);
      // 직무팀 프로젝트의 팀원도 팀 구성에 맞춤 (기존 팀원의 기록은 그대로 남음)
      var projUpdates = DB.where('projects', function (p) { return p.teamId; }).map(function (p) { var t = c.teams.find(function (x) { return x.id === p.teamId; }); if (!t) return null; var mem = (t.members || []).slice(); if (JSON.stringify(mem.slice().sort()) === JSON.stringify((p.members || []).slice().sort())) return null; return DB.put('projects', Object.assign({}, p, { members: mem.length ? mem : p.members, _touch: [] })); }).filter(Boolean);
      Promise.all([DB.put('cohorts', c), DB.put('settings', prog)].concat(userUpdates, projUpdates)).then(function () { AXP.toast('저장했어요'); });
    };
  });

  /* ================= 제출물 ================= */
  R('#/a/submissions', function (el) {
    var c = D.cohort(), L = learners(), asgs = DB.where('assignments', function (a) { return a.cohortId === c.id; }).sort(function (a, b) { return a.due.localeCompare(b.due); });
    el.innerHTML = h.head('제출물', '흩어진 카페·노션·구글폼 대신 한 표에서 제출 현황을 보고 피드백해요. 칸을 누르면 내용을 볼 수 있어요.') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>훈련생</th>' + asgs.map(function (a) { return '<th title="' + esc(a.title) + '">' + esc(U.short(a.title, 12)) + '<div class="tiny muted">' + esc(a.due.slice(5)) + '</div></th>'; }).join('') + '</tr></thead><tbody>' +
      L.map(function (u) { return '<tr><td><b>' + esc(u.name) + '</b></td>' + asgs.map(function (a) { var s = DB.where('submissions', function (x) { return x.userId === u.id && x.assignmentId === a.id; }).pop(); var late = !s && new Date(a.due) < new Date(); return '<td>' + (s ? '<button class="badge ' + (s.status === '제출' ? 'gold' : 'green') + '" style="border:0;cursor:pointer" data-s="' + s.id + '">' + esc(s.status) + (s.aiUnchanged ? ' · AI' : '') + '</button>' : '<span class="badge ' + (late ? 'red' : '') + '">' + (late ? '미제출' : '-') + '</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></div>';
    U.$$('[data-s]', el).forEach(function (b) {
      b.onclick = function () {
        var s = DB.get('submissions', b.getAttribute('data-s')), u = D.user(s.userId);
        var md = AXP.modal({ title: s.title || '제출물', sub: u.name + ' · ' + U.fmt(s.createdAt, true) + (s.aiUnchanged ? ' · AI 초안을 고치지 않고 제출' : ''), wide: true, body: '<div class="pre small card soft">' + esc(s.body || '') + '</div>' + (s.link ? '<p class="mt8"><a href="' + esc(s.link) + '" target="_blank" rel="noopener">' + esc(s.link) + '</a></p>' : '') + '<label class="lb mt12">피드백</label><textarea id="fb" rows="3">' + esc(s.feedback || '') + '</textarea>' + (s.shareOk ? '<label class="check mt8"><input type="checkbox" id="toArc"> 자료 아카이브에도 담기 (작성자 동의함)</label>' : '') + '<div class="row end mt12"><button class="btn" id="fbGo">피드백 저장</button></div>' });
        U.$('#fbGo', md.body).onclick = function () {
          s.feedback = U.$('#fb', md.body).value.trim(); s.status = s.feedback ? '피드백 완료' : s.status;
          var ta = U.$('#toArc', md.body);
          DB.put('submissions', s).then(function () {
            if (ta && ta.checked) { var a = DB.get('assignments', s.assignmentId) || {}; return DB.put('archive', { id: U.uid('arc'), type: a.type === '링커슈' ? '링커슈' : a.type === '컨택 보고서' ? '컨택 보고서' : '기타', title: s.title, cohort: (D.cohort() || {}).name, author: u.name, source: 'AX Proof 제출함', tags: [], body: s.body, useInKB: true }); }
          }).then(function () { md.close(); AXP.toast('저장했어요'); AXP.render(); });
        };
      };
    });
  });

  /* ================= Case 라이브러리 ================= */
  R('#/a/cases', function (el) {
    var list = DB.all('cases');
    el.innerHTML = h.head('Case 라이브러리', 'Case = 가상의 회사 + 그 회사의 실무자(AI 실무자) + 현장 이야기. 현직자 인터뷰·컨택 보고서·지식 베이스로 만들고, 쌓일수록 다른 서비스가 따라올 수 없는 자산이 돼요.', '<button class="btn" id="newC">+ 새 Case</button>') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Case</th><th>직무</th><th>출처</th><th>용도</th><th>AI 실무자</th><th>지식</th><th>상태</th></tr></thead><tbody>' +
      list.map(function (c) { var kn = DB.where('knowledge', function (k) { return (k.caseIds || []).indexOf(c.id) >= 0; }).length; return '<tr class="click" data-c="' + c.id + '"><td><b>' + esc(U.short(c.title, 40)) + '</b><div class="tiny muted">' + esc(c.company) + '</div></td><td>' + esc(c.track) + '</td><td>' + esc(c.source) + '</td><td>' + esc(c.difficulty) + '</td><td>' + esc(c.persona.name) + ' ' + esc(c.persona.title) + '</td><td>' + kn + '</td><td><span class="badge ' + (c.status === '운영 중' ? 'green' : 'gold') + '">' + esc(c.status) + '</span></td></tr>'; }).join('') + '</tbody></table></div></div>';
    U.$$('[data-c]', el).forEach(function (tr) { tr.onclick = function () { AXP.go('#/a/case/' + tr.getAttribute('data-c')); }; });
    U.$('#newC', el).onclick = function () {
      DB.put('cases', { id: U.uid('case'), title: '새 Case', company: '(가상)', industry: '', track: '서비스기획·운영', source: '가상 시나리오', status: '검수 대기', difficulty: '기본', parallelCaseId: '', persona: { name: '', title: '', career: '', greeting: '', story: [], hidden: [], judgment: '' }, pains: [], events: [], knowledgeIds: [] })
        .then(function (c) { AXP.go('#/a/case/' + c.id); });
    };
  });
  R('#/a/case/:id', function (el, prm) {
    var c = JSON.parse(JSON.stringify(DB.get('cases', prm.id) || {}));
    if (!c.id) { el.innerHTML = h.empty('Case를 찾을 수 없어요'); return; }
    var lines = function (arr) { return (arr || []).map(function (x) { return x[0] + ' | ' + x[1]; }).join('\n'); };
    var parse = function (t) { return t.split('\n').map(function (l) { var k = l.indexOf('|'); return k > 0 ? [l.slice(0, k).trim(), l.slice(k + 1).trim()] : null; }).filter(Boolean); };
    var kn = DB.all('knowledge');
    el.innerHTML = h.head(c.title, '', '<button class="btn ghost" id="test">AI 실무자 테스트</button>' + (c.status !== '운영 중' ? '<button class="btn gold" id="appr">검수 완료 · 공개</button>' : '') + '<button class="btn" id="save">저장</button>', '<a href="#/a/cases">Case 라이브러리</a>') +
      '<div class="grid g2"><div class="card"><h2>회사와 업무 맥락</h2><label class="lb mt12">제목</label><input type="text" id="t" value="' + esc(c.title) + '"><div class="grid g2 mt12"><div><label class="lb">회사</label><input type="text" id="co" value="' + esc(c.company) + '"></div><div><label class="lb">산업</label><input type="text" id="in" value="' + esc(c.industry) + '"></div><div><label class="lb">직무</label><input type="text" id="tr" value="' + esc(c.track) + '"></div><div><label class="lb">출처</label><select id="so">' + ['가상 시나리오', '현업 실사례 재구성', '기업·기관 제시'].map(function (x) { return '<option' + (c.source === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div><div><label class="lb">용도</label><select id="di">' + ['기본', '검증', '챌린지'].map(function (x) { return '<option' + (c.difficulty === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div><div><label class="lb">평행 Case (전이 검증)</label><select id="pa"><option value="">없음</option>' + DB.all('cases').filter(function (x) { return x.id !== c.id; }).map(function (x) { return '<option value="' + x.id + '"' + (c.parallelCaseId === x.id ? ' selected' : '') + '>' + esc(U.short(x.title, 30)) + '</option>'; }).join('') + '</select></div></div>' +
      '<label class="lb mt12">pain point <span class="hint">한 줄에 하나 · AI로 풀기 좋은 정도가 서로 다르게</span></label><textarea id="pn" rows="4">' + esc((c.pains || []).join('\n')) + '</textarea>' +
      '<label class="lb mt12">조건 변경 이벤트 <span class="hint">주차 | 메시지</span></label><textarea id="ev" rows="2">' + esc((c.events || []).map(function (e) { return e.week + ' | ' + e.text; }).join('\n')) + '</textarea>' +
      '<label class="lb mt12">연결된 지식</label><div class="chips">' + kn.map(function (k) { return '<button class="chip" data-kn="' + k.id + '" aria-pressed="' + ((k.caseIds || []).indexOf(c.id) >= 0) + '">' + esc(U.short(k.title, 24)) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card"><h2>AI 실무자 페르소나</h2><div class="grid g2 mt12"><div><label class="lb">이름</label><input type="text" id="pnm" value="' + esc(c.persona.name) + '"></div><div><label class="lb">직책</label><input type="text" id="ptt" value="' + esc(c.persona.title) + '"></div></div><label class="lb mt12">경력</label><input type="text" id="pca" value="' + esc(c.persona.career) + '"><label class="lb mt12">첫 인사</label><input type="text" id="pgr" value="' + esc(c.persona.greeting) + '">' +
      '<label class="lb mt12">현장 이야기 <span class="hint">영역 | 이야기 · 질문이 닿을 때만 말해요</span></label><textarea id="pst" rows="7">' + esc(lines(c.persona.story)) + '</textarea>' +
      '<label class="lb mt12">숨은 정보 <span class="hint">제약·예산·보안 — 물어야만 나와요</span></label><textarea id="phd" rows="3">' + esc(lines(c.persona.hidden)) + '</textarea>' +
      '<label class="lb mt12">실무자의 실제 판단 <span class="hint">정답이 아니라 비교 기준 · "왜"를 물을 때만</span></label><textarea id="pjd" rows="2">' + esc(c.persona.judgment || '') + '</textarea></div></div>';
    var kset = {};
    kn.forEach(function (k) { if ((k.caseIds || []).indexOf(c.id) >= 0) kset[k.id] = 1; });
    U.$$('[data-kn]', el).forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-kn'); if (kset[id]) delete kset[id]; else kset[id] = 1; b.setAttribute('aria-pressed', !!kset[id]); }; });
    function collect() {
      c.title = U.$('#t', el).value; c.company = U.$('#co', el).value; c.industry = U.$('#in', el).value; c.track = U.$('#tr', el).value; c.source = U.$('#so', el).value; c.difficulty = U.$('#di', el).value; c.parallelCaseId = U.$('#pa', el).value;
      c.pains = U.$('#pn', el).value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      c.events = parse(U.$('#ev', el).value).map(function (x) { return { week: Number(x[0]) || 3, text: x[1] }; });
      c.persona = { name: U.$('#pnm', el).value, title: U.$('#ptt', el).value, career: U.$('#pca', el).value, greeting: U.$('#pgr', el).value, story: parse(U.$('#pst', el).value), hidden: parse(U.$('#phd', el).value), judgment: U.$('#pjd', el).value };
      return c;
    }
    function saveAll() {
      collect();
      var ks = kn.map(function (k) { var has = (k.caseIds || []).indexOf(c.id) >= 0; if (!!kset[k.id] === has) return null; k = Object.assign({}, k); k.caseIds = kset[k.id] ? (k.caseIds || []).concat([c.id]) : k.caseIds.filter(function (x) { return x !== c.id; }); return DB.put('knowledge', k); }).filter(Boolean);
      return Promise.all([DB.put('cases', c)].concat(ks));
    }
    U.$('#save', el).onclick = function () { saveAll().then(function () { AXP.toast('저장했어요'); }); };
    var ap = U.$('#appr', el); if (ap) ap.onclick = function () { c.status = '운영 중'; saveAll().then(function () { AXP.toast('공개했어요'); AXP.render(); }); };
    U.$('#test', el).onclick = function () {
      collect();
      var turns = [{ role: 'assistant', content: c.persona.greeting || '안녕하세요.' }];
      var md = AXP.modal({ title: 'AI 실무자 테스트 · ' + c.persona.name, sub: '정보를 너무 쉽게 흘리지 않는지, 물은 것에만 답하는지 확인하세요.', wide: true, body: '<div class="chat-log" id="tl" style="max-height:360px"></div><form class="composer mt12" id="tf"><textarea rows="1" id="tq"></textarea><button class="btn">보내기</button></form>' });
      function draw() { U.$('#tl', md.body).innerHTML = turns.map(function (x) { return '<div class="msg ' + (x.role === 'user' ? 'me' : 'ai persona') + '">' + esc(x.content) + '</div>'; }).join(''); }
      draw();
      U.$('#tf', md.body).onsubmit = function (e) {
        e.preventDefault(); var q = U.$('#tq', md.body).value.trim(); if (!q) return; U.$('#tq', md.body).value = ''; turns.push({ role: 'user', content: q }); draw();
        AXP.AI.run('persona', { case: c, messages: turns }).then(function (r) { turns.push({ role: 'assistant', content: (r && r.reply) || '' }); draw(); }).catch(function (er) { AXP.toast(er.message, true); });
      };
    };
  });

  /* ================= 지식 베이스 · 에이전트 ================= */
  R('#/a/knowledge', function (el) {
    var agent = DB.get('settings', 'agent') || { id: 'agent', sources: [], schedule: '매주 월요일 09:00', threshold: 0.8 };
    var list = DB.all('knowledge').slice().sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    var auto = list.filter(function (k) { return k.auto; }).length, wait = list.filter(function (k) { return k.status === '검수 대기'; });
    el.innerHTML = h.head('지식 베이스 · 에이전트', 'AI 실무자와 AI 사수가 현업답게 말하려면 지식이 계속 새로워져야 해요. 채용공고(직무기술서)·기업 소식·컨택 보고서를 에이전트가 정기 수집·추출하고, 신뢰도가 높은 건 자동 반영(목표 80%), 나머지만 운영진이 검수해요.', '<button class="btn ghost" id="add">+ 자료 직접 추가</button><button class="btn" id="runNow">지금 수집 실행</button>') +
      '<div class="grid g4">' + h.stat('지식 항목', list.length, '') + h.stat('자동 반영률', U.pct(auto, list.length) + '%', '목표 80%', U.pct(auto, list.length) < 80) + h.stat('검수 대기', wait.length, '운영진 확인 필요') + h.stat('정기 수집 출처', agent.sources.length, agent.schedule) + '</div>' +
      '<div class="grid g2 mt16"><div class="card"><div class="card-head"><div><h2>정기 수집 목록</h2><p>채용공고·보도자료 페이지 주소를 등록하면 일정에 맞춰 가져와요.</p></div></div><div id="srcs" class="stack"></div>' +
      '<div class="row mt12" style="flex-wrap:nowrap"><select id="sType" style="width:150px"><option>채용공고(JD)</option><option>업계 소식</option><option>기업 보도자료</option></select><input type="url" id="sUrl" placeholder="https://..."><button class="btn ghost sm" id="sAdd">추가</button></div>' +
      '<div class="grid g2 mt12"><div><label class="lb">수집 주기</label><select id="sch">' + ['매일 09:00', '매주 월요일 09:00', '매월 1일'].map(function (x) { return '<option' + (agent.schedule === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div><div><label class="lb">자동 반영 기준 신뢰도</label><input type="number" step="0.05" min="0.5" max="1" id="thr" value="' + agent.threshold + '"></div></div>' +
      '<p class="tiny muted mt8">배포 환경에서는 Vercel Cron 또는 GitHub Actions가 이 목록으로 /api/fetch-url → 추출을 실행해요 (README 참고). 지금은 "지금 수집 실행"으로 바로 돌려볼 수 있어요.</p></div>' +
      '<div class="card"><h2>검수 대기</h2><div class="mt12">' + (wait.length ? wait.map(itemHTML).join('') : h.empty('검수할 항목이 없어요')) + '</div></div></div>' +
      '<div class="card mt16"><h2>전체 지식</h2><div class="mt12">' + list.map(itemHTML).join('') + '</div></div>';
    function itemHTML(k) {
      var e = k.extracted || {};
      return '<div class="item"><div class="row between"><div class="row"><span class="badge blue">' + esc(k.sourceType) + '</span><span class="badge ' + (k.status === '검수 대기' ? 'gold' : k.status === '반려' ? 'red' : 'green') + '">' + esc(k.status) + '</span><span class="tiny muted">신뢰도 ' + Math.round((k.confidence || 0) * 100) + '% · ' + U.fmt(k.createdAt) + '</span></div>' +
        (k.status === '검수 대기' ? '<div class="row"><button class="btn sm" data-ok="' + k.id + '">승인</button><button class="btn sm danger" data-no="' + k.id + '">반려</button></div>' : '') + '</div><h3 class="mt8">' + esc(k.title) + '</h3>' +
        '<p class="small mt8"><b>직무</b> ' + esc(e.role || '-') + ' · <b>업무</b> ' + esc((e.tasks || []).join(', ') || '-') + '</p><p class="small"><b>pain</b> ' + esc((e.pains || []).join(', ') || '-') + ' · <b>판단 기준</b> ' + esc((e.criteria || []).join(', ') || '-') + '</p><p class="tiny muted">연결 Case: ' + esc((k.caseIds || []).map(function (id) { return (D.case(id) || {}).company || id; }).join(', ') || '없음') + (k.url ? ' · <a href="' + esc(k.url) + '" target="_blank" rel="noopener">원문</a>' : '') + '</p></div>';
    }
    function srcs() {
      U.$('#srcs', el).innerHTML = agent.sources.length ? agent.sources.map(function (s, i) { return '<div class="row between item" style="padding:8px 12px"><span class="small"><span class="badge">' + esc(s.type) + '</span> ' + esc(U.short(s.url, 48)) + '</span><span class="row"><span class="tiny muted">' + (s.last ? '최근 ' + U.fmt(s.last) : '아직 안 돌림') + '</span><button class="linkbtn" data-sx="' + i + '">삭제</button></span></div>'; }).join('') : '<p class="small muted">등록된 출처가 없어요.</p>';
      U.$$('[data-sx]', el).forEach(function (b) { b.onclick = function () { agent.sources.splice(+b.getAttribute('data-sx'), 1); saveAgent(); srcs(); }; });
    }
    function saveAgent() { agent.schedule = U.$('#sch', el).value; agent.threshold = Number(U.$('#thr', el).value) || 0.8; return DB.put('settings', agent).then(function (x) { agent = x; }); }
    srcs();
    U.$('#sch', el).onchange = saveAgent; U.$('#thr', el).onchange = saveAgent;
    U.$('#sAdd', el).onclick = function () { var u = U.$('#sUrl', el).value.trim(); if (!/^https?:\/\//.test(u)) return AXP.toast('주소를 확인하세요', true); agent.sources.push({ type: U.$('#sType', el).value, url: u }); saveAgent().then(srcs); U.$('#sUrl', el).value = ''; };
    U.$$('[data-ok]', el).forEach(function (b) { b.onclick = function () { var k = DB.get('knowledge', b.getAttribute('data-ok')); DB.put('knowledge', Object.assign({}, k, { status: '승인', reviewedAt: U.now() })).then(function () { AXP.toast('승인했어요. 연결된 AI 실무자·사수에 바로 반영돼요'); AXP.render(); }); }; });
    U.$$('[data-no]', el).forEach(function (b) { b.onclick = function () { var k = DB.get('knowledge', b.getAttribute('data-no')); DB.put('knowledge', Object.assign({}, k, { status: '반려', reviewedAt: U.now() })).then(function () { AXP.render(); }); }; });
    function ingest(src, text, title) {
      return AXP.AI.run('kb_extract', { sourceType: src.type, title: title, text: text }).then(function (r) {
        var conf = Number(r.confidence) || 0;
        var official = src.type === '채용공고(JD)' || src.type === '기업 보도자료';
        var isAuto = official && conf >= agent.threshold;
        var caseIds = src.caseIds && src.caseIds.length ? src.caseIds : DB.where('cases', function (c) { return r.role && (c.persona.title.indexOf(r.role.slice(0, 2)) >= 0 || c.track.indexOf(r.role.slice(0, 2)) >= 0); }).map(function (c) { return c.id; });
        return DB.put('knowledge', { id: U.uid('kn'), sourceType: src.type, title: title, url: src.url || '', status: isAuto ? '자동 반영' : '검수 대기', confidence: conf, auto: isAuto, extracted: { role: r.role, tasks: r.tasks || [], pains: r.pains || [], criteria: r.criteria || [], tools: r.tools || [] }, summary: r.summary || '', caseIds: caseIds });
      });
    }
    U.$('#runNow', el).onclick = function () {
      if (!agent.sources.length) return AXP.toast('정기 수집 목록에 주소를 먼저 추가하세요', true);
      if (!AXP.Mode.server) return AXP.toast('웹 페이지 수집은 서버 실행 시에만 돼요. "자료 직접 추가"로 붙여넣어 보세요', true);
      var b = this; b.disabled = true; b.textContent = '수집 중…';
      var n = 0;
      agent.sources.reduce(function (p, s) {
        return p.then(function () { return AXP.api('api/fetch-url', { method: 'POST', body: { url: s.url } }).then(function (j) { s.last = U.now(); n++; return ingest(s, j.text, j.title); }).catch(function (e) { AXP.toast(s.url + ': ' + e.message, true); }); });
      }, Promise.resolve()).then(saveAgent).then(function () { AXP.toast(n + '개 출처를 수집했어요'); AXP.render(); });
    };
    U.$('#add', el).onclick = function () {
      var md = AXP.modal({ title: '자료 추가', sub: '주소를 넣으면 서버가 페이지를 가져오고, 아니면 본문을 붙여넣으세요. 에이전트가 직무 지식을 추출해요.', wide: true,
        body: '<div class="grid g2"><div><label class="lb">자료 유형</label><select id="kT"><option>채용공고(JD)</option><option>업계 소식</option><option>기업 보도자료</option><option>컨택 보고서</option><option>설문 결과</option></select></div><div><label class="lb">연결할 Case</label><select id="kC"><option value="">자동 매칭</option>' + DB.all('cases').map(function (c) { return '<option value="' + c.id + '">' + esc(U.short(c.title, 30)) + '</option>'; }).join('') + '</select></div></div>' +
          '<label class="lb mt12">제목</label><input type="text" id="kTi"><label class="lb mt12">주소 (선택)</label><div class="row" style="flex-wrap:nowrap"><input type="url" id="kU"><button class="btn ghost sm" id="kF">가져오기</button></div><label class="lb mt12">본문</label><textarea id="kX" rows="8"></textarea><div class="row end mt12"><button class="btn" id="kGo">추출하기</button></div>' });
      U.$('#kF', md.body).onclick = function () {
        if (!AXP.Mode.server) return AXP.toast('서버 실행 시에만 가져올 수 있어요', true);
        AXP.api('api/fetch-url', { method: 'POST', body: { url: U.$('#kU', md.body).value } }).then(function (j) { U.$('#kX', md.body).value = j.text; if (!U.$('#kTi', md.body).value) U.$('#kTi', md.body).value = j.title; }).catch(function (e) { AXP.toast(e.message, true); });
      };
      U.$('#kGo', md.body).onclick = function () {
        var t = U.$('#kX', md.body).value.trim(); if (t.length < 30) return AXP.toast('본문이 너무 짧아요', true);
        var cid = U.$('#kC', md.body).value;
        this.disabled = true;
        ingest({ type: U.$('#kT', md.body).value, url: U.$('#kU', md.body).value, caseIds: cid ? [cid] : [] }, t, U.$('#kTi', md.body).value || '제목 없음').then(function (k) { md.close(); AXP.toast(k.status === '자동 반영' ? '신뢰도가 높아 자동 반영했어요' : '검수 대기로 넣었어요'); AXP.render(); });
      };
    };
  });

  /* ================= 자료 아카이브 ================= */
  R('#/a/archive', function (el) {
    var type = '';
    function render() {
      var list = DB.where('archive', function (a) { return !type || a.type === type; }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
      var types = ['링커슈', '컨택 보고서', '인터뷰 설계', '세션 자료', '기타'];
      el.innerHTML = h.head('자료 아카이브', '노션·네이버 카페·구글 드라이브에 흩어진 링커스 자료(링커슈, 컨택 보고서, 인터뷰 설계, 세션 자료)를 한곳에 모아 데이터베이스로 써요. 지식 추출을 누르면 AI 실무자·사수의 지식이 돼요.', '<button class="btn" id="imp">자료 가져오기</button>') +
        '<div class="card"><div class="chips"><button class="chip" data-ty="" aria-pressed="' + !type + '">전체 ' + DB.all('archive').length + '</button>' + types.map(function (t) { return '<button class="chip" data-ty="' + t + '" aria-pressed="' + (type === t) + '">' + t + ' ' + DB.where('archive', function (a) { return a.type === t; }).length + '</button>'; }).join('') + '</div>' +
        '<div class="table-wrap mt16"><table class="t"><thead><tr><th>제목</th><th>유형</th><th>기수·작성</th><th>원래 위치</th><th>자료실 공개·지식 활용</th><th></th></tr></thead><tbody>' +
        list.map(function (a) { return '<tr><td><button class="linkbtn" style="font-size:14px;text-align:left" data-open="' + a.id + '">' + esc(a.title) + '</button></td><td>' + esc(a.type) + '</td><td class="small">' + esc(a.cohort || '') + ' · ' + esc(a.author || '') + '</td><td class="small">' + esc(a.source || '') + '</td><td><label class="check"><input type="checkbox" data-kb="' + a.id + '"' + (a.useInKB ? ' checked' : '') + '></label></td><td><button class="btn sm ghost" data-ex="' + a.id + '">지식 추출</button></td></tr>'; }).join('') + '</tbody></table></div></div>';
      U.$$('[data-ty]', el).forEach(function (b) { b.onclick = function () { type = b.getAttribute('data-ty'); render(); }; });
      U.$$('[data-open]', el).forEach(function (b) { b.onclick = function () { var a = DB.get('archive', b.getAttribute('data-open')); AXP.modal({ title: a.title, sub: a.type + ' · ' + a.cohort + ' · ' + a.author, wide: true, body: '<div class="pre small">' + esc(a.body) + '</div>' }); }; });
      U.$$('[data-kb]', el).forEach(function (cb) { cb.onchange = function () { var a = DB.get('archive', cb.getAttribute('data-kb')); DB.put('archive', Object.assign({}, a, { useInKB: cb.checked })); }; });
      U.$$('[data-ex]', el).forEach(function (b) {
        b.onclick = function () {
          var a = DB.get('archive', b.getAttribute('data-ex')); b.disabled = true; b.textContent = '추출 중…';
          AXP.AI.run('kb_extract', { sourceType: a.type, title: a.title, text: a.body }).then(function (r) {
            return DB.put('knowledge', { id: U.uid('kn'), sourceType: a.type === '컨택 보고서' ? '컨택 보고서' : '링커스 아카이브', title: a.title, status: '검수 대기', confidence: Number(r.confidence) || 0.6, auto: false, extracted: { role: r.role, tasks: r.tasks || [], pains: r.pains || [], criteria: r.criteria || [], tools: r.tools || [] }, caseIds: [], fromArchive: a.id });
          }).then(function () { AXP.toast('지식 베이스 검수 대기로 보냈어요'); b.textContent = '보냄'; });
        };
      });
      U.$('#imp', el).onclick = importModal;
    }
    function importModal() {
      var md = AXP.modal({ title: '자료 가져오기', sub: '노션·구글 문서는 "텍스트/마크다운으로 내보내기" 후 파일을 올리거나 본문을 붙여넣으세요. 카페 글은 복사해 붙여넣으면 돼요. 여러 파일을 한 번에 올릴 수 있어요.', wide: true,
        body: '<div class="grid g4"><div><label class="lb">유형</label><select id="iT"><option>링커슈</option><option>컨택 보고서</option><option>인터뷰 설계</option><option>세션 자료</option><option>기타</option></select></div><div><label class="lb">원래 위치</label><select id="iS"><option>노션</option><option>네이버 카페</option><option>구글 드라이브</option><option>기타</option></select></div><div><label class="lb">기수</label><input type="text" id="iC" placeholder="예: 20기"></div><div><label class="lb">작성자</label><input type="text" id="iA"></div></div>' +
          '<label class="lb mt12">파일 (.txt .md .csv .html)</label><input type="file" id="iF" multiple accept=".txt,.md,.csv,.html,.htm,.json"><p class="tiny muted mt8">또는 아래에 붙여넣기</p><label class="lb mt8">제목</label><input type="text" id="iTi"><label class="lb mt12">본문</label><textarea id="iB" rows="8"></textarea>' +
          '<label class="check mt12"><input type="checkbox" id="iK" checked> 자료실 공개 · 지식 활용 (개인정보가 없는 경우만)</label><div class="row end mt12"><button class="btn" id="iGo">가져오기</button></div>' });
      U.$('#iGo', md.body).onclick = function () {
        var base = { type: U.$('#iT', md.body).value, source: U.$('#iS', md.body).value, cohort: U.$('#iC', md.body).value, author: U.$('#iA', md.body).value, tags: [], useInKB: U.$('#iK', md.body).checked };
        var files = Array.prototype.slice.call(U.$('#iF', md.body).files || []);
        var jobs = files.map(function (f) { return f.text().then(function (t) { if (/\.html?$/i.test(f.name)) t = t.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+\n/g, '\n'); return DB.put('archive', Object.assign({ id: U.uid('arc'), title: f.name.replace(/\.[^.]+$/, ''), body: t.slice(0, 50000) }, base)); }); });
        var b = U.$('#iB', md.body).value.trim();
        if (b) jobs.push(DB.put('archive', Object.assign({ id: U.uid('arc'), title: U.$('#iTi', md.body).value || U.short(b, 30), body: b }, base)));
        if (!jobs.length) return AXP.toast('파일이나 본문을 넣어 주세요', true);
        Promise.all(jobs).then(function () { md.close(); AXP.toast(jobs.length + '개를 가져왔어요'); render(); });
      };
    }
    render();
  });

  /* ================= 멘토 DB ================= */
  R('#/a/mentors', function (el) {
    var list = DB.all('mentors');
    el.innerHTML = h.head('멘토 DB', '링커스가 쌓아 온 현직자 네트워크예요. 인터뷰와 별도로, 계정을 연결하고 참여를 켠 OB에게 간편 리뷰를 요청할 수 있습니다.', '<a class="btn ghost" href="#/a/ob-reviews">OB·YB 리뷰 운영</a><button class="btn ghost" id="csv">CSV 가져오기</button><button class="btn" id="add">+ 멘토 추가</button>') +
      '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>이름</th><th>회사 · 직무</th><th>연차</th><th>키워드</th><th>컨택</th><th>이력</th><th>마지막 컨택</th><th>메모</th></tr></thead><tbody>' +
      list.map(function (m) { var hist = DB.where('contacts', function (c) { return c.mentorId === m.id; }); return '<tr class="click" data-m="' + m.id + '"><td><b>' + esc(m.name) + '</b>' + (m.userId ? ' <span class="badge green">플랫폼 계정</span>' : '') + '</td><td>' + esc(m.company) + '<div class="tiny muted">' + esc(m.role) + '</div></td><td>' + (m.years || '-') + '</td><td>' + (m.tags || []).map(function (t) { return '<span class="badge" style="margin:1px">' + esc(t) + '</span>'; }).join('') + '</td><td>' + (m.contactOk ? '<span class="dot on"></span> 가능' : '<span class="dot bad"></span> 불가') + '</td><td>' + ((m.contactCount || 0) + hist.length) + '회</td><td class="small">' + esc(m.lastContact || '-') + '</td><td class="tiny muted">' + esc(m.note || '') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    function edit(m) {
      m = m || { id: U.uid('mtr'), name: '', company: '', role: '', years: 0, industry: '', tags: [], contactOk: true, channel: '', note: '' };
      var md = AXP.modal({ title: m.name ? m.name + ' 수정' : '멘토 추가', body: '<div class="grid g2"><div><label class="lb">이름</label><input type="text" id="n" value="' + esc(m.name) + '"></div><div><label class="lb">회사 (익명 가능)</label><input type="text" id="c" value="' + esc(m.company) + '"></div><div><label class="lb">직무</label><input type="text" id="r" value="' + esc(m.role) + '"></div><div><label class="lb">연차</label><input type="number" id="y" value="' + (m.years || 0) + '"></div><div><label class="lb">산업</label><input type="text" id="i" value="' + esc(m.industry) + '"></div><div><label class="lb">연락 채널</label><input type="text" id="ch" value="' + esc(m.channel || '') + '"></div></div><label class="lb mt12">키워드 (쉼표)</label><input type="text" id="t" value="' + esc((m.tags || []).join(', ')) + '"><label class="lb mt12">메모</label><input type="text" id="no" value="' + esc(m.note || '') + '"><label class="check mt12"><input type="checkbox" id="ok"' + (m.contactOk ? ' checked' : '') + '> 컨택 가능</label><div class="row end mt12"><button class="btn" id="go">저장</button></div>' });
      U.$('#go', md.body).onclick = function () { Object.assign(m, { name: U.$('#n', md.body).value, company: U.$('#c', md.body).value, role: U.$('#r', md.body).value, years: +U.$('#y', md.body).value, industry: U.$('#i', md.body).value, channel: U.$('#ch', md.body).value, tags: U.$('#t', md.body).value.split(',').map(function (x) { return x.trim(); }).filter(Boolean), note: U.$('#no', md.body).value, contactOk: U.$('#ok', md.body).checked }); DB.put('mentors', m).then(function () { md.close(); AXP.render(); }); };
    }
    U.$('#add', el).onclick = function () { edit(); };
    U.$$('[data-m]', el).forEach(function (tr) { tr.onclick = function () { edit(JSON.parse(JSON.stringify(DB.get('mentors', tr.getAttribute('data-m'))))); }; });
    U.$('#csv', el).onclick = function () {
      var md = AXP.modal({ title: 'CSV 가져오기', sub: '첫 줄은 머리글: 이름,회사,직무,연차,산업,키워드,컨택가능,채널,메모 (키워드는 ; 로 구분, 컨택가능은 Y/N)', wide: true, body: '<textarea id="cv" rows="10" placeholder="이름,회사,직무,연차,산업,키워드,컨택가능,채널,메모\n홍길동,유통 G사,MD,6,유통,상품기획;데이터,Y,이메일,19기 OB"></textarea><div class="row end mt12"><button class="btn" id="go">가져오기</button></div>' });
      U.$('#go', md.body).onclick = function () {
        var rows = U.$('#cv', md.body).value.trim().split('\n').slice(1).map(function (l) { return l.split(',').map(function (x) { return x.trim(); }); }).filter(function (r) { return r[0]; });
        Promise.all(rows.map(function (r) { return DB.put('mentors', { id: U.uid('mtr'), name: r[0], company: r[1] || '', role: r[2] || '', years: +r[3] || 0, industry: r[4] || '', tags: (r[5] || '').split(';').map(function (x) { return x.trim(); }).filter(Boolean), contactOk: /^y/i.test(r[6] || 'Y'), channel: r[7] || '', note: r[8] || '', contactCount: 0 }); }))
          .then(function () { md.close(); AXP.toast(rows.length + '명을 가져왔어요'); AXP.render(); });
      };
    };
  });

  /* ================= 기업 챌린지 ================= */
  R('#/a/challenges', function (el) {
    var list = DB.all('challenges'), m = new Date().getMonth() + 1;
    el.innerHTML = h.head('기업 챌린지', '기업이 낸 과제를 훈련생이 AX Proof에서 수행하고, 동의한 사람의 결과·판단 과정·우수 인재 추천을 기업에 전달해요. 기업은 돈을 크게 쓰지 않고도 AI 역량이 검증된 인재를 추천받아요.', '<button class="btn" id="new">+ 챌린지 만들기</button>') +
      '<div class="note ' + (m >= 9 && m <= 11 ? 'gold' : 'blue') + '"><b>제안 타이밍</b> · 기업 CSR·HR은 보통 9~11월에 다음 해 예산과 아젠다를 정해요. ' + (m >= 9 && m <= 11 ? '<b>지금이 제안 적기예요.</b> 신규 인재 발굴 캠페인·공모전형 과제로 콜드 메일을 보내 보세요.' : '9월부터 제안 자료를 준비하세요.') + '</div>' +
      '<div class="stack mt16">' + list.map(function (c) { var ps = AXP.challengeParticipants(c); return '<a class="item click" style="display:block;text-decoration:none;color:inherit" href="#/a/challenge/' + c.id + '"><div class="row between"><div><div class="row"><span class="badge gold">' + esc(c.status) + '</span><span class="badge">' + esc(c.company) + '</span></div><h3 class="mt8">' + esc(c.title) + '</h3></div><span class="small muted">참여 ' + ps.length + '명 · ' + esc(c.period) + '</span></div></a>'; }).join('') + '</div>';
    U.$('#new', el).onclick = function () {
      var md = AXP.modal({ title: '챌린지 만들기', wide: true, body: '<div class="grid g2"><div><label class="lb">기업 (익명 가능)</label><input type="text" id="co"></div><div><label class="lb">담당 부서·담당자</label><input type="text" id="ct" placeholder="예: HR 인재영입팀"></div></div><label class="lb mt12">과제 제목</label><input type="text" id="ti"><label class="lb mt12">과제 설명 (기업이 준 브리프)</label><textarea id="br" rows="5"></textarea><div class="grid g2 mt12"><div><label class="lb">기간</label><input type="text" id="pe" placeholder="2026-12-01 ~ 2026-12-14"></div><div><label class="lb">혜택</label><input type="text" id="rw" placeholder="우수 3명 서류 우대"></div></div><label class="lb mt12">Case</label><select id="cs"><option value="__new">브리프로 Case 초안 자동 생성</option>' + DB.all('cases').map(function (c) { return '<option value="' + c.id + '">' + esc(U.short(c.title, 40)) + '</option>'; }).join('') + '</select><div class="row end mt12"><button class="btn" id="go">만들기</button></div>' });
      U.$('#go', md.body).onclick = function () {
        var b = this; b.disabled = true;
        var cid = U.$('#cs', md.body).value, brief = U.$('#br', md.body).value, co = U.$('#co', md.body).value || '기업 (익명)';
        var pc = cid !== '__new' ? Promise.resolve(cid) : AXP.AI.run('case_draft', { who: co + ' 과제 담당자', notes: brief }).then(function (r) { return DB.put('cases', Object.assign({ id: U.uid('case'), source: '기업·기관 제시', status: '검수 대기', difficulty: '챌린지', parallelCaseId: '', knowledgeIds: [] }, r, { company: co })).then(function (c) { return c.id; }); });
        pc.then(function (caseId) { return DB.put('challenges', { id: U.uid('chl'), company: co, contact: U.$('#ct', md.body).value, title: U.$('#ti', md.body).value, brief: brief, period: U.$('#pe', md.body).value, reward: U.$('#rw', md.body).value, status: '모집 중', caseId: caseId, participants: [], consentRequired: true }); })
          .then(function (c) { md.close(); AXP.go('#/a/challenge/' + c.id); });
      };
    };
  });
  R('#/a/challenge/:id', function (el, prm) {
    var c = DB.get('challenges', prm.id);
    if (!c) { el.innerHTML = h.empty('없음'); return; }
    var rows = AXP.challengeParticipants(c).map(function (uid) {
      var u = D.user(uid), p = DB.where('projects', function (x) { return x.userId === uid && x.challengeId === c.id; })[0] || D.myProjects(uid)[0];
      var r = p ? AXP.readinessOf(p, uid) : null;
      var lv = r ? U.avg(AXP.COMPETENCIES.map(function (k) { return r.levels[k]; })) : 0;
      var rub = DB.where('reviews', function (x) { return x.learnerId === uid && x.rubric; });
      var hl = rub.length ? U.avg(rub.map(function (x) { return U.avg(AXP.COMPETENCIES.map(function (k) { return x.rubric[k]; })); })) : 0;
      var logs = D.logsOf(uid, p ? p.id : null);
      return { u: u, p: p, ai: lv, human: hl, verified: logs.filter(function (l) { return l.verifiedBy; }).length, logs: logs.length, consent: !!(p && p.challengeConsentAt) || (c.participants || []).indexOf(uid) >= 0, score: (hl || lv) * 10 + logs.filter(function (l) { return l.verifiedBy; }).length };
    }).sort(function (a, b) { return b.score - a.score; });
    el.innerHTML = h.head(c.title, esc(c.company) + ' · ' + esc(c.period) + ' · ' + esc(c.status), '<select id="st" style="width:auto">' + ['모집 중', '진행 중', '평가 중', '완료'].map(function (s) { return '<option' + (c.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><button class="btn" id="rep">우수 인재 추천 리포트</button>', '<a href="#/a/challenges">기업 챌린지</a>') +
      '<div class="card"><p>' + esc(c.brief) + '</p><dl class="kv mt12"><dt>담당</dt><dd>' + esc(c.contact || '-') + '</dd><dt>혜택</dt><dd>' + esc(c.reward || '-') + '</dd><dt>Case</dt><dd>' + esc((D.case(c.caseId) || {}).title || '-') + '</dd></dl></div>' +
      '<div class="card mt16"><h2>참여자 · 순위</h2><p class="small muted mt8">현직 멘토 평가를 우선, 없으면 AI 피드백 수준을 쓰고 멘토 확인 판단 수를 더해요. AI가 합격을 정하지 않고, 근거를 보여 줄 뿐이에요.</p><div class="table-wrap mt12"><table class="t"><thead><tr><th>#</th><th>훈련생</th><th>단계</th><th>멘토 평가</th><th>AI 피드백</th><th>판단 기록</th><th>멘토 확인</th><th>공유 동의</th></tr></thead><tbody>' +
      rows.map(function (r, i) { return '<tr><td>' + (i + 1) + '</td><td><a href="#/a/learner/' + r.u.id + '">' + esc(r.u.name) + '</a></td><td>' + (r.p ? h.stageBadge(r.p.stage) : '-') + '</td><td>' + (r.human ? r.human.toFixed(1) : '-') + '</td><td>' + (r.ai ? r.ai.toFixed(1) : '-') + '</td><td>' + r.logs + '</td><td>' + r.verified + '</td><td>' + (r.consent ? '<span class="badge green">동의</span>' : '<span class="badge red">미동의</span>') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    U.$('#st', el).onchange = function (e) { c.status = e.target.value; DB.put('challenges', c).then(function () { AXP.toast('상태를 바꿨어요'); }); };
    U.$('#rep', el).onclick = function () {
      var top = rows.filter(function (r) { return r.consent; }).slice(0, 5);
      var md = AXP.modal({ title: '우수 인재 추천 리포트 · ' + c.company, sub: '공유에 동의한 참여자만 담겨요. 연락처는 본인이 수락할 때만 따로 전달해요.', wide: true,
        body: '<div id="repBody"><h2>' + esc(c.title) + '</h2><p class="small muted">' + esc(c.period) + ' · 참여 ' + rows.length + '명 · 추천 ' + top.length + '명 · AX Proof</p>' +
          top.map(function (r, i) { var ready = r.p && r.p.data.final && r.p.data.final.readiness; var picks = D.logsOf(r.u.id, r.p ? r.p.id : null).filter(function (l) { return l.verifiedBy; }).slice(0, 2); return '<div class="item mt12"><div class="row between"><h3>' + (i + 1) + '. ' + esc(r.u.name) + ' <span class="small muted">· ' + esc(r.u.track || '') + '</span></h3><span class="small">멘토 ' + (r.human ? r.human.toFixed(1) : '-') + ' · AI ' + (r.ai ? r.ai.toFixed(1) : '-') + '</span></div>' + (ready && ready.delegation ? '<p class="small mt8"><b>업무 위임 수준</b> ' + esc(ready.delegation.level) + ' — ' + esc(ready.delegation.why) + '</p>' : '') + picks.map(function (l) { return '<div class="tip good">✓ ' + esc(U.short(l.text, 160)) + '</div>'; }).join('') + (ready && ready.interview ? '<p class="tiny muted mt8">면접에서 확인할 질문: ' + esc(ready.interview.join(' / ')) + '</p>' : '') + '</div>'; }).join('') + '</div><div class="row end mt12"><button class="btn" id="pr">인쇄 · PDF</button></div>' });
      U.$('#pr', md.body).onclick = function () { var w = window.open('', '_blank'); if (!w) return; w.document.write('<html><head><meta charset="utf-8"><title>추천 리포트</title><link rel="stylesheet" href="' + location.href.split('#')[0].replace(/[^/]*$/, '') + 'assets/css/app.css"></head><body style="background:#fff;padding:32px">' + U.$('#repBody', md.body).innerHTML + '</body></html>'); w.document.close(); setTimeout(function () { w.print(); }, 500); };
    };
  });

  /* ================= AI 설정 ================= */
  R('#/a/ai', function (el) {
    var usage = DB.all('usage').slice().sort(function (a, b) { return (b.day || '').localeCompare(a.day || ''); });
    var usageHTML = '<div class="card mt16"><h2>사용량</h2><div class="table-wrap mt12"><table class="t"><thead><tr><th>날짜</th><th>작업</th><th>공급자 · 모델</th><th>호출</th><th>입력 토큰</th><th>출력 토큰</th><th>사용자</th></tr></thead><tbody>' + (usage.length ? usage.map(function (u) { return '<tr><td>' + esc(u.day) + '</td><td>' + esc(u.task) + '</td><td class="small">' + esc(u.provider) + ' · ' + esc(u.model) + '</td><td>' + u.calls + '</td><td>' + (u.input || 0).toLocaleString() + '</td><td>' + (u.output || 0).toLocaleString() + '</td><td>' + (u.users || []).length + '</td></tr>'; }).join('') : '<tr><td colspan="7" class="muted">기록 없음</td></tr>') + '</tbody></table></div></div>';
    var promptHTML = '<div class="card mt16"><h2>프롬프트 투명성</h2><p class="small muted mt8">AI 사수가 실제로 받는 지시문 예시예요 (첫 훈련생의 현재 단계 기준). 원칙: AI는 "어떻게"를 돕고 "답"은 주지 않아요.</p><pre class="small card soft mt12" style="white-space:pre-wrap;max-height:360px;overflow:auto" id="pv"></pre></div>';
    if (!AXP.Mode.server) {
      el.innerHTML = h.head('AI 설정', '') + '<div class="note gold"><b>지금은 브라우저 데모 모드예요.</b> AI 답변은 규칙 기반 데모 응답이에요. 실제 Claude·GPT를 연결하려면 서버로 실행하세요.<ol class="small mt8"><li>이 폴더(web)에서 <code>npm install</code> → <code>npm start</code></li><li>http://localhost:3000/app.html 로 접속해 운영진으로 로그인</li><li>이 화면에서 API 키를 넣거나 <code>.env</code> 파일에 OPENAI_API_KEY 설정 (Claude를 쓰려면 ANTHROPIC_API_KEY)</li></ol></div>' + promptHTML + usageHTML;
      preview(); return;
    }
    el.innerHTML = h.head('AI 설정', 'AI 사수·AI 실무자·코치·리포트가 쓰는 모델과 키를 관리해요. 키는 서버에만 저장되고 브라우저로 내려오지 않아요.', '<button class="btn" id="save">저장</button>') + '<div id="body"><p class="muted">불러오는 중…</p></div>' + promptHTML + usageHTML;
    preview();
    AXP.api('api/settings').then(function (j) {
      var ai = j.ai, k = j.keys;
      var opts = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'];
      var sel = function (id, v) { return '<select id="' + id + '">' + opts.concat(opts.indexOf(v) < 0 ? [v] : []).map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; };
      var oeff = function (id, v) { return '<select id="' + id + '">' + ['none', 'minimal', 'low', 'medium', 'high'].map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; };
      var eff = function (id, v) { return '<select id="' + id + '">' + ['low', 'medium', 'high'].map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; };
      U.$('#body', el).innerHTML = '<div class="grid g2"><div class="card"><h2>API 키</h2>' +
        [['openai', 'GPT (OpenAI) · 기본', 'OPENAI_API_KEY', 'sk-...'], ['anthropic', 'Claude (Anthropic) · 선택', 'ANTHROPIC_API_KEY', 'sk-ant-...']].map(function (x) { var s = k[x[0]]; return '<div class="item mt12"><div class="row between"><b>' + x[1] + '</b><span class="badge ' + (s.connected ? 'green' : '') + '">' + (s.connected ? '연결됨 · ' + (s.source === 'env' ? '환경변수' : '로컬 저장') : '미연결') + '</span></div>' + (k.canSaveKeys && s.source !== 'env' ? '<input type="password" class="mt8" id="key_' + x[0] + '" placeholder="' + x[3] + ' (바꿀 때만 입력)" autocomplete="off">' : '<p class="tiny muted mt8">배포 환경의 Environment Variables에 ' + x[2] + '를 설정하세요.</p>') + '<button class="btn ghost sm mt8" data-test="' + x[0] + '"' + (s.connected ? '' : ' disabled') + '>연결 테스트</button><span class="small muted" id="tr_' + x[0] + '"></span></div>'; }).join('') + '</div>' +
        '<div class="card"><h2>모델</h2><label class="lb mt12">기본 공급자</label><select id="prov"><option value="openai"' + (ai.provider === 'openai' ? ' selected' : '') + '>GPT (OpenAI)</option><option value="anthropic"' + (ai.provider === 'anthropic' ? ' selected' : '') + '>Claude</option></select>' +
        '<div class="table-wrap mt12"><table class="t"><thead><tr><th>용도</th><th>GPT 모델</th><th>GPT 추론 강도</th><th>Claude 모델</th><th>Claude effort</th></tr></thead><tbody>' +
        [['chat', 'AI 사수·업무용 AI 대화'], ['quick', 'AI 실무자·코치·추출'], ['deep', '리뷰·디펜스·리포트']].map(function (t) { return '<tr><td class="small">' + t[1] + '</td><td><input type="text" id="om_' + t[0] + '" value="' + esc(ai.models.openai[t[0]]) + '"></td><td>' + oeff('oe_' + t[0], (ai.openaiEffort || {})[t[0]]) + '</td><td>' + sel('am_' + t[0], ai.models.anthropic[t[0]]) + '</td><td>' + eff('ef_' + t[0], ai.effort[t[0]]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<label class="check mt12"><input type="checkbox" id="lpc"' + (ai.allowLearnerProviderChoice ? ' checked' : '') + '> 두 키가 모두 있으면 훈련생이 대화 중 Claude/GPT를 고를 수 있게</label>' +
        '<p class="tiny muted mt8">Claude 5.5 계열 Opus·Sonnet은 답변 거절 시 서버 측 대체 모델(fallbacks: default)이 이어받도록 켜져 있어요. GPT는 OpenAI Responses API로 호출하고(store: false), 추론 강도를 모델이 지원하지 않으면 서버가 자동으로 낮춰 다시 보내요. GPT 모델명은 OpenAI 콘솔에서 쓸 수 있는 이름으로 입력하세요 (기본 gpt-5.6).</p></div></div>';
      U.$$('[data-test]', el).forEach(function (b) { b.onclick = function () { var p = b.getAttribute('data-test'); U.$('#tr_' + p, el).textContent = ' 테스트 중…'; AXP.api('api/settings', { method: 'POST', body: { action: 'test', provider: p } }).then(function (r) { U.$('#tr_' + p, el).textContent = ' ✓ ' + r.reply + ' (' + r.model + ', ' + r.ms + 'ms)'; }).catch(function (e) { U.$('#tr_' + p, el).textContent = ' ✕ ' + e.message; }); }; });
      U.$('#save', el).onclick = function () {
        var body = { ai: { provider: U.$('#prov', el).value, allowLearnerProviderChoice: U.$('#lpc', el).checked, models: { anthropic: {}, openai: {} }, effort: {}, openaiEffort: {} } };
        ['chat', 'quick', 'deep'].forEach(function (t) { body.ai.models.anthropic[t] = U.$('#am_' + t, el).value; body.ai.models.openai[t] = U.$('#om_' + t, el).value.trim(); body.ai.effort[t] = U.$('#ef_' + t, el).value; body.ai.openaiEffort[t] = U.$('#oe_' + t, el).value; });
        ['anthropic', 'openai'].forEach(function (p) { var i = U.$('#key_' + p, el); if (i && i.value.trim()) body[p === 'anthropic' ? 'anthropicKey' : 'openaiKey'] = i.value.trim(); });
        AXP.api('api/settings', { method: 'POST', body: body }).then(function () { return AXP.detectMode(); }).then(function () { AXP.toast('저장했어요'); AXP.render(); }).catch(function (e) { AXP.toast(e.message, true); });
      };
    }).catch(function (e) { U.$('#body', el).innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; });
    function preview() {
      var u = learners()[0]; if (!u) return;
      var ctx = AXP.Chat.ctxFor ? (function () { var p = D.myProjects(u.id)[0]; var c = p ? D.case(p.caseId) : null; return { user: u, project: p, case: c, stage: p ? p.stage : 'onboarding', topic: p && p.data.topic ? p.data.topic.pick : '', logs: D.logsOf(u.id, p ? p.id : null), messages: [] }; })() : {};
      U.$('#pv', el).textContent = AXP.TASKS.mentor_chat.build(ctx).system;
    }
  });

  /* ================= 데이터 관리 ================= */
  R('#/a/data', function (el) {
    var h0 = AXP.Mode.health;
    el.innerHTML = h.head('데이터 관리', '') +
      '<div class="grid g2"><div class="card"><h2>저장 위치</h2><p class="mt8">' + (AXP.Mode.server ? '서버 · <b>' + esc(h0.store === 'supabase' ? 'Supabase (Postgres)' : h0.store === 'file' ? '로컬 파일 (web/data/db.json)' : '임시 메모리 — 재시작하면 사라져요') + '</b>' : '<b>브라우저 데모 모드</b> · 이 브라우저의 localStorage') + '</p>' +
      (AXP.Mode.server && h0.store === 'memory' ? '<div class="note red mt12">서버리스 환경에서 Supabase가 연결되지 않았어요. SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 설정하세요.</div>' : '') + '</div>' +
      '<div class="card"><h2>백업 · 복원</h2><div class="row mt12"><button class="btn ghost" id="exp">전체 내보내기 (JSON)</button><label class="btn ghost" style="cursor:pointer">가져오기<input type="file" id="imp" accept=".json" hidden></label></div><hr class="sep"><h3>초기화</h3><p class="small muted mt8">시범 운영 전에는 "빈 상태로 시작"을 권장해요 (Case·지식·아카이브는 유지).</p><div class="row mt12"><button class="btn ghost" id="demo">예시 데이터로 되돌리기</button><button class="btn danger" id="empty">빈 상태로 시작</button></div></div></div>';
    U.$('#exp', el).onclick = function () { DB.exportAll().then(function (d) { U.download('axproof-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(d, null, 2)); }); };
    U.$('#imp', el).onchange = function (e) { var f = e.target.files[0]; if (!f) return; f.text().then(function (t) { var d = JSON.parse(t); return AXP.confirm('현재 데이터를 이 파일로 바꿀까요?', '가져오기').then(function (ok) { if (ok) return DB.importAll(d.data || d).then(function () { AXP.toast('가져왔어요'); AXP.render(); }); }); }).catch(function (er) { AXP.toast('파일을 읽지 못했어요: ' + er.message, true); }); };
    U.$('#demo', el).onclick = function () { AXP.confirm('모든 데이터를 예시 데이터로 되돌릴까요?', '되돌리기').then(function (ok) { if (ok) DB.resetDemo(false).then(function () { AXP.toast('되돌렸어요'); AXP.render(); }); }); };
    U.$('#empty', el).onclick = function () { AXP.confirm('훈련생·기록·제출물을 모두 지우고 빈 상태로 시작할까요?', '비우기').then(function (ok) { if (ok) DB.resetDemo(true).then(function () { AXP.toast('비웠어요'); AXP.render(); }); }); };
  });
})();
