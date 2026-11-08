/* AX Proof · 훈련생 화면 */
(function () {
  var AXP = window.AXP, U = AXP.U, DB = AXP.DB, D = AXP.D, esc = U.esc, h = AXP.h;
  var R = function (path, fn) { AXP.route('learner', path, fn); };

  function nextActions(me) {
    var out = [], cohort = D.cohort(), prj = D.myProjects(me.id).filter(function (p) { return !p.completedAt; })[0];
    var myTeam = me.teamId ? D.team(me.teamId) : null;
    if (!D.onboarded(me.id)) out.push(['AI 업무 활용 온보딩 마치기', '#/onboarding', '프로젝트 전에 업무에서 AI를 쓰는 방식을 익혀요']);
    if (!prj && D.onboarded(me.id)) out.push([(myTeam ? myTeam.name + ' 링커슈' : '링커슈') + ' 시작하기', '#/projects', '직무 탐구 → 이슈 탐구 → 실무자 인터뷰 순서로 시작해요']);
    if (prj) {
      var si = AXP.stageInfo(prj);
      out.push([AXP.KINDS_INFO[AXP.kindOf(prj)].name + ' · ' + si.name + ' 이어서 하기', '#/project/' + prj.id + '/' + prj.stage, prj.title]);
      var unanswered = 0;
      ['topic', 'plan', 'propose'].forEach(function (k) { ((prj.data[k] || {}).mentor || []).forEach(function (c) { if (!c.reply) unanswered++; }); });
      if (unanswered) out.push(['AI 사수 코멘트 ' + unanswered + '개에 답하기', '#/project/' + prj.id + '/' + prj.stage, '답한 내용은 판단 기록에 남아요']);
    }
    var subs = DB.where('submissions', function (s) { return s.userId === me.id; });
    DB.where('assignments', function (a) { return cohort && a.cohortId === cohort.id; }).forEach(function (a) {
      var done = subs.some(function (s) { return s.assignmentId === a.id; });
      var days = Math.ceil((new Date(a.due) - Date.now()) / 864e5);
      if (!done && days >= 0 && days <= 7) out.push([a.title + ' 제출 (D-' + days + ')', '#/submit', a.desc]);
    });
    var seen = U.ls.get('axp:seenReviews', []);
    var rv = DB.where('reviews', function (r) { return r.learnerId === me.id && r.status !== '요청' && seen.indexOf(r.id) < 0; });
    if (rv.length) out.push(['현직 멘토 리뷰 ' + rv.length + '건 확인', '#/log', '멘토가 확인한 판단은 포트폴리오에 표시돼요']);
    return out.slice(0, 5);
  }

  /* ================= 홈 ================= */
  R('#/home', function (el) {
    var me = D.me(), cohort = D.cohort(), mine = D.myProjects(me.id), prj = mine.filter(function (p) { return !p.completedAt; })[0] || mine[0], logs = D.logsOf(me.id);
    var c = prj ? D.case(prj.caseId) : null;
    var lvKey = prj ? (prj.transfer ? 'solo' : D.program().preceptor.stageMap[prj.stage]) : 'show';
    var persona = AXP.personaOf({ user: me, case: c });
    var acts = nextActions(me);
    var chl = DB.where('challenges', function (x) { return x.status === '모집 중'; })[0];
    var si = prj ? AXP.stageInfo(prj) : null, stIdx = si ? si.idx : -1;
    el.innerHTML = h.head('안녕하세요, ' + D.firstName(me.name) + ' 님', esc(cohort ? cohort.name + ' · ' + cohort.currentWeek + '주차' : '') + ' — 오늘도 AI 사수와 함께 한 걸음씩 가 봐요.') +
      '<div class="grid g-main-wide"><div class="stack-lg">' +
      '<div class="card"><div class="card-head"><h2>오늘 할 일</h2></div>' + (acts.length ? acts.map(function (a) { return '<a class="item click" style="display:block;text-decoration:none;color:inherit" href="' + a[1] + '"><b>' + esc(a[0]) + '</b><p class="small muted">' + esc(a[2]) + '</p></a>'; }).join('') : h.empty('지금은 할 일이 없어요.')) + '</div>' +
      (prj ? '<div class="card"><div class="card-head"><div><span class="badge ' + AXP.KINDS_INFO[AXP.kindOf(prj)].badge + '">' + esc(AXP.KINDS_INFO[AXP.kindOf(prj)].name) + '</span> <span class="badge ' + (prj.transfer ? 'violet' : 'gold') + '">' + esc(prj.transfer ? '전이 검증 미션' : c.source) + '</span><h2 class="mt8">' + esc(prj.title) + '</h2><p>' + esc(c.company) + ' · ' + esc(c.persona.title) + '</p></div><a class="btn" href="#/project/' + prj.id + '/' + prj.stage + '">이어서 하기</a></div>' +
        '<div class="stepper">' + (si ? si.list : []).map(function (s, i) { return '<button class="' + (i === stIdx ? 'on' : i < stIdx ? 'done' : '') + '" disabled style="opacity:1;cursor:default"><span class="n">' + (i + 1) + '</span>' + s.short + '</button>'; }).join('') + '</div>' +
        '<div class="mt16"><div class="small muted" style="margin-bottom:6px">AI 사수 개입 단계 (프리셉터십)</div>' + h.precept(lvKey) + '</div></div>' : '') +
      '<div class="card"><div class="card-head"><h2>프로그램 흐름 · ' + esc(cohort ? cohort.name : '') + '</h2><span class="small muted">카페·노션·구글폼에 흩어졌던 활동이 여기 한곳에 모여요</span></div><div class="stack">' +
        (cohort ? cohort.modules.map(function (m) { return '<div class="row" style="flex-wrap:nowrap;align-items:flex-start"><span class="badge" style="min-width:76px;justify-content:center">' + esc(m.weeks) + '</span><div><b>' + esc(m.title) + '</b><p class="small muted">' + esc(m.desc) + '</p></div></div>'; }).join('') : '') + '</div></div>' +
      '</div><div class="stack-lg">' +
      '<div class="card"><div class="persona-card"><div class="av">' + esc(persona.name.slice(-2)) + '</div><div><b>AI 사수 · ' + esc(persona.name) + '</b><span>' + esc(persona.title) + '</span></div></div><p class="small mt12">"답은 제가 드리지 않아요. 대신 현업에서 어떻게 생각하는지 옆에서 보여 드릴게요."</p><a class="btn soft sm mt12" href="#/mentor">AI 사수와 대화하기</a></div>' +
      '<div class="card"><div class="card-head"><h3>최근 판단 기록</h3><a class="small" href="#/log">전체 ' + logs.length + '개</a></div>' + (logs.length ? logs.slice(-3).reverse().map(function (l) { return '<div class="item"><div class="row">' + h.stageBadge(l.stage) + h.srcBadge(l.source) + '<span class="tiny muted">' + U.fmt(l.createdAt) + '</span></div><p class="small mt8">' + esc(U.short(l.text, 110)) + '</p></div>'; }).join('') : h.empty('일을 시작하면 자동으로 쌓여요.')) + '</div>' +
      (chl ? '<div class="card"><span class="badge gold">기업 챌린지 · ' + esc(chl.status) + '</span><h3 class="mt8">' + esc(chl.title) + '</h3><p class="small muted mt8">' + esc(chl.company) + ' · ' + esc(chl.period) + '</p><a class="btn ghost sm mt12" href="#/challenge">자세히 보기</a></div>' : '') +
      '</div></div>';
  });

  /* ================= 온보딩: AI 업무 활용 기초 ================= */
  var LESSONS = [
    { id: 'l1', title: '업무에서 AI를 쓰는 5가지 방식', concept: '현업에서 AI는 주로 ① 초안 ② 요약 ③ 분류 ④ 아이디어 확장 ⑤ 검토(빠진 것 찾기)에 쓰여요. 반대로 "최종 판단", "책임이 따르는 숫자", "고객에게 바로 나가는 말"은 사람이 쥐고 있어요. 무엇을 맡기고 무엇을 쥘지 정하는 것이 AI 협업의 첫 판단이에요.',
      demo: { label: 'AI 사수의 시연 · 운영팀 주간 보고서', text: '저라면 이렇게 나눠요.\n· AI에게: 지난주 VOC 200건을 유형별로 분류한 초안, 보고서 문장 다듬기\n· 내가: 분류 결과 20건 샘플 대조, 대표가 결정해야 할 것 3가지 고르기, 숫자 계산(시트 수식)\n이유: 분류는 틀려도 샘플로 잡을 수 있지만, "무엇을 결정해야 하는지"는 우리 팀 맥락을 아는 사람만 정할 수 있거든요.' },
      task: '당신은 카페 프랜차이즈 본사 신입이에요. 팀장님이 "지난달 가맹점 리뷰 1,000건을 보고 다음 달 개선 과제 3개를 정리해 와"라고 했어요. AI에게 맡길 일과 내가 할 일을 나눠 적고, 그렇게 나눈 이유를 쓰세요.',
      checklist: ['보고의 목적(무엇을 결정하려는지)을 적었다', '맡길 일과 조건(분량·범위)을 적었다', '결과를 어떤 형태로 받을지 정했다', '내가 직접 확인할 부분을 정했다'] },
    { id: 'l2', title: '좋은 요청 쓰기: 목적·조건·형식·검증', concept: 'AI의 답은 요청의 질을 넘지 못해요. 현업 시니어의 요청에는 늘 다섯 가지가 들어 있어요. 목적(왜), 조건(대상·기한·예산·분량), 형식(표·목록·단계), 검증(어떻게 확인할지), 보안(넣으면 안 되는 정보).',
      demo: { label: '나쁜 요청 → 좋은 요청', text: '✕ "신제품 마케팅 아이디어 줘"\n○ "20대 여성 대상 비건 립밤 런칭(예산 100만 원, 2주)에서 첫 주에 테스트할 마케팅 아이디어 5개를, 예상 비용·필요 인력·측정 지표를 표로 정리해 줘. 비용은 추정치면 \'추정\'이라고 표시해 줘."' },
      task: '동네 헬스장 운영자가 "6개월 이상 안 온 회원에게 보낼 복귀 안내 메시지를 만들고 싶다"고 해요. 회원 명단에는 이름·전화번호·마지막 방문일이 있어요. AI에게 보낼 요청문을 직접 써 보세요.',
      checklist: ['목적이 들어 있다', '조건(대상·분량·기한)이 들어 있다', '출력 형식을 정했다', '결과를 확인할 방법을 정했다', '개인정보를 넣지 않도록 처리했다'] },
    { id: 'l3', title: 'AI 결과 검증하기', concept: 'AI는 그럴듯한 숫자와 출처를 만들어 낼 수 있어요. 검증의 기본은 네 가지예요. ① 숫자는 출처를 확인하거나 직접 다시 센다 ② 분류는 샘플을 뽑아 대조한다 ③ 주장은 반례를 찾아본다 ④ 모르면 "확인 필요"로 남긴다.',
      demo: { label: 'AI 사수의 시연 · "업계 평균 해지율 12%"', text: 'AI가 "구독 커머스 업계 평균 해지율은 약 12%"라고 했어요. 저는 바로 쓰지 않아요.\n1) 출처가 있는지 묻는다 → 없다고 하면\n2) 우리 회사 데이터로 직접 계산할 수 있는지 본다\n3) 그래도 업계 숫자가 필요하면 공식 보고서를 찾고, 못 찾으면 보고서에서 그 숫자를 빼요. 틀린 숫자 하나가 보고서 전체 신뢰를 깎거든요.' },
      task: 'AI가 리뷰 300건을 "가격 불만 45%, 맛 불만 30%, 배송 불만 25%"로 분류해 줬어요. 이 결과를 보고서에 쓰기 전에 무엇을 어떻게 확인할지 순서대로 적어 보세요.',
      checklist: ['확인하려는 목적을 적었다', '샘플 크기 등 조건을 정했다', '확인 절차를 단계로 적었다', '틀렸을 때의 대응을 적었다'] },
    { id: 'l4', title: '보안·개인정보·책임', concept: '외부 AI에 넣은 정보는 회사 밖으로 나간 것과 같아요. 고객 이름·연락처·주소, 계약 조건, 미공개 실적은 넣기 전에 지우거나 바꿔요. 그리고 AI가 만든 결과물의 책임은 언제나 내게 있어요.',
      demo: { label: '익명화 예시', text: '원본: "김민지(010-1234-5678, 서울 마포구) 고객이 배송 지연으로 환불 요청"\n익명화: "고객 A(연락처 삭제, 서울) 배송 지연으로 환불 요청"\n→ 분석에 필요한 건 "지역 단위"와 "사유"뿐이에요. 필요 없는 정보는 처음부터 빼요.' },
      task: '고객 문의 엑셀(이름, 전화번호, 주소, 주문번호, 문의 내용, 처리 결과)을 AI로 유형 분류하려고 해요. AI에 넣기 전에 무엇을 지우거나 바꾸고 무엇을 남길지, 이유와 함께 적어 보세요.',
      checklist: ['분류라는 목적을 적었다', '남길 열(조건)을 정했다', '처리 방식을 단계로 적었다', '결과 검증 방법을 적었다', '개인정보 처리 방법을 적었다'] }
  ];
  AXP.LESSONS = LESSONS;
  R('#/onboarding', function (el) { onboarding(el, 0); });
  function onboarding(el, i) {
    var me = D.me(), prg = D.progress(me.id), done = prg.onboarding.done || [];
    var L = LESSONS[i], pr = (prg.onboarding.practice || {})[L.id] || {};
    el.innerHTML = h.head('AI 업무 활용 온보딩', '프로젝트 전에, 현업에서 AI를 어떻게 쓰는지 사례로 익혀요. 프리셉터 1단계 「보여주기」 — AI 사수가 먼저 시연하고 여러분이 따라 해요.', '<span class="badge green">' + done.length + ' / 4 완료</span>') +
      '<div class="grid" style="grid-template-columns:260px minmax(0,1fr)"><div class="lesson-nav">' + LESSONS.map(function (l, j) { return '<button data-l="' + j + '" class="' + (j === i ? 'on ' : '') + (done.indexOf(l.id) >= 0 ? 'done' : '') + '"><span class="n">' + (done.indexOf(l.id) >= 0 ? '✓' : j + 1) + '</span><span class="small">' + esc(l.title) + '</span></button>'; }).join('') + '</div>' +
      '<div class="stack-lg"><div class="card"><span class="badge">레슨 ' + (i + 1) + '</span><h2 class="mt8">' + esc(L.title) + '</h2><p class="mt12">' + esc(L.concept) + '</p><div class="demo-box mt16"><div class="lbl">' + esc(L.demo.label) + '</div><div class="pre small">' + esc(L.demo.text) + '</div></div></div>' +
      '<div class="card"><h3>실습</h3><p class="mt8">' + esc(L.task) + '</p><p class="tiny muted mt8">체크리스트: ' + esc(L.checklist.join(' · ')) + '</p><textarea id="lAns" rows="7" class="mt12" placeholder="직접 써 보세요. AI 사수가 체크리스트로 점검해 줘요.">' + esc(pr.answer || '') + '</textarea>' +
      '<div class="row mt12"><button class="btn" id="lCheck">AI 사수에게 점검받기</button><span class="small muted" id="lSt"></span></div><div id="lFb" class="mt12"></div></div></div></div>';
    U.$$('[data-l]', el).forEach(function (b) { b.onclick = function () { onboarding(el, Number(b.getAttribute('data-l'))); }; });
    if (pr.feedback) fb(pr.feedback);
    function fb(r) {
      U.$('#lFb', el).innerHTML = '<div class="coach"><b>◎ AI 사수 점검</b>' + (r.checks || []).map(function (c) { return '<div class="tip ' + (c.ok ? 'good' : 'warn') + '">' + (c.ok ? '✓ ' : '○ ') + esc(c.item) + ' — ' + esc(c.tip) + '</div>'; }).join('') + '<p class="mt12">' + esc(r.comment || '') + '</p></div>' +
        (i < 3 ? '<div class="row end mt12"><button class="btn ghost" id="lNext">다음 레슨 →</button></div>' : (D.onboarded(me.id) ? '<div class="note mt12">온보딩을 마쳤어요! 이제 <a href="#/projects">첫 프로젝트</a>를 시작할 수 있어요.</div>' : ''));
      var nb = U.$('#lNext', el); if (nb) nb.onclick = function () { onboarding(el, i + 1); };
    }
    U.$('#lCheck', el).onclick = function () {
      var a = U.$('#lAns', el).value.trim(); if (a.length < 20) return AXP.toast('조금 더 자세히 써 보세요', true);
      var b = this; b.disabled = true; U.$('#lSt', el).textContent = '점검 중…';
      AXP.AI.run('lesson_feedback', { task: L.task, checklist: L.checklist, answer: a }).then(function (r) {
        prg.onboarding.practice = prg.onboarding.practice || {}; prg.onboarding.practice[L.id] = { answer: a, feedback: r, at: U.now() };
        var first = done.indexOf(L.id) < 0;
        if (first) done.push(L.id); prg.onboarding.done = done;
        return DB.put('progress', prg).then(function () {
          var okN = (r.checks || []).filter(function (c) { return c.ok; }).length;
          if (first) D.addLog({ stage: 'onboarding', kind: '문제 정의', source: '온보딩 실습', text: '레슨 ' + (i + 1) + ' 「' + L.title + '」 실습 — 체크리스트 ' + okN + '/' + (r.checks || []).length + ' 충족.' });
          if (D.onboarded(me.id)) {
            var asg = DB.where('assignments', function (x) { return x.auto === 'onboarding' && x.cohortId === me.cohortId; })[0];
            if (asg && !DB.where('submissions', function (s) { return s.assignmentId === asg.id && s.userId === me.id; }).length) DB.put('submissions', { id: 'sub_onb_' + me.id, assignmentId: asg.id, userId: me.id, status: '완료', body: '온보딩 4개 레슨 완료', auto: true });
          }
          onboarding(el, i);
        });
      }).catch(function (e) { U.$('#lSt', el).textContent = e.message; b.disabled = false; });
    };
  }

  /* ================= 내 프로젝트 (링커슈 · 개인 · 팀) ================= */
  function stageInfo(p) {
    var st = AXP.stagesFor(p), idx = Math.max(0, st.findIndex(function (s) { return s.key === p.stage; }));
    return { list: st, idx: idx, name: st[idx].name, pct: Math.round((idx + (p.completedAt ? 1 : 0)) / st.length * 100) };
  }
  AXP.stageInfo = stageInfo;
  function projectItem(p) {
    var c = D.case(p.caseId) || {}, si = stageInfo(p), KI = AXP.KINDS_INFO[AXP.kindOf(p)];
    var team = AXP.isTeamProject(p) ? D.team(p.teamId) : null;
    return '<a class="item click" style="display:block;text-decoration:none;color:inherit" href="#/project/' + p.id + '/' + p.stage + '"><div class="row between"><div><div class="row"><span class="badge ' + KI.badge + '">' + esc(KI.name) + '</span>' +
      (team ? '<span class="badge violet">' + esc(team.name) + ' · ' + (p.members || []).length + '명</span>' : '') + (p.transfer ? '<span class="badge violet">전이 검증</span>' : '') + (p.challengeId ? '<span class="badge gold">기업 챌린지</span>' : '') + (p.fromLinkushu ? '<span class="badge blue">링커슈에서 이어받음</span>' : '') +
      '<span class="badge">' + esc(c.company || '') + '</span>' + (p.completedAt ? '<span class="badge green">완료</span>' : '') + '</div><h3 class="mt8">' + esc(p.title) + '</h3></div><span class="small muted">' + (si.idx + 1) + '/' + si.list.length + ' · ' + esc(si.name) + '</span></div><div class="bar mt12"><i style="width:' + si.pct + '%"></i></div></a>';
  }
  R('#/projects', function (el) {
    var me = D.me(), cohort = D.cohort(), list = D.myProjects(me.id);
    var gate = cohort && cohort.policy && cohort.policy.onboardingGate && !D.onboarded(me.id);
    var myTeam = me.teamId ? D.team(me.teamId) : null;
    var by = function (k) { return list.filter(function (p) { return AXP.kindOf(p) === k; }); };
    var lks = by('linkushu'), personals = by('personal'), teams = by('team');
    var lkDone = lks.filter(function (p) { return (p.reached || 0) >= 5; });
    var sec = function (k, items, actions) {
      var KI = AXP.KINDS_INFO[k];
      return '<div class="card"><div class="card-head"><div><h2><span class="badge ' + KI.badge + '">' + esc(KI.name) + '</span></h2><p>' + esc(KI.desc) + '</p></div>' + (gate ? '' : '<div class="row">' + actions + '</div>') + '</div>' +
        (items.length ? items.map(projectItem).join('') : h.empty('아직 없어요')) + '</div>';
    };
    el.innerHTML = h.head('내 프로젝트', '링커슈 → 개인 프로젝트 → 팀 프로젝트 순서로 이어져요. 모든 단계의 판단은 자동으로 기록돼요.') +
      (gate ? '<div class="note gold">이 기수는 <b>AI 업무 활용 온보딩</b>을 마쳐야 프로젝트를 시작할 수 있어요. <a href="#/onboarding">온보딩 하러 가기</a></div>' : '') +
      '<div class="stack-lg mt16">' +
      sec('linkushu', lks, '<button class="btn sm" id="newLk">+ ' + (myTeam ? esc(myTeam.name) + ' 링커슈' : '링커슈') + ' 시작</button>') +
      sec('personal', personals, (lkDone.length ? '<button class="btn sm" id="fromLk">링커슈 제안에서 이어 시작</button>' : '') + '<button class="btn sm ghost" id="newPs">Case 골라 시작</button>') +
      sec('team', teams, myTeam ? '<button class="btn sm" id="newTeam">+ ' + esc(myTeam.name) + ' 팀 프로젝트</button>' : '<span class="small muted">직무팀이 정해지면 시작할 수 있어요</span>') +
      '</div>';
    var b;
    if ((b = U.$('#newLk', el))) b.onclick = function () {
      var exist = myTeam && lks.filter(function (p) { return p.teamId === myTeam.id; })[0];
      if (exist) return AXP.confirm(myTeam.name + '의 링커슈가 이미 있어요. 그 프로젝트로 갈까요?', '이동').then(function (ok) { if (ok) AXP.go('#/project/' + exist.id + '/' + exist.stage); });
      newProject({ kind: 'linkushu' });
    };
    if ((b = U.$('#newPs', el))) b.onclick = function () { newProject({ kind: 'personal' }); };
    if ((b = U.$('#fromLk', el))) b.onclick = function () {
      if (lkDone.length === 1) return AXP.startPersonalFromLinkushu(lkDone[0]);
      var md = AXP.modal({ title: '어느 링커슈에서 이어 갈까요?', body: lkDone.map(function (p) { return '<button class="item click" data-lk="' + p.id + '" style="display:block;width:100%;text-align:left"><b>' + esc(p.title) + '</b><p class="small muted">' + esc(((p.data.propose || {}).secs || {}).problem || '') + '</p></button>'; }).join('') });
      U.$$('[data-lk]', md.body).forEach(function (x) { x.onclick = function () { md.close(); AXP.startPersonalFromLinkushu(DB.get('projects', x.getAttribute('data-lk'))); }; });
    };
    if ((b = U.$('#newTeam', el))) b.onclick = function () {
      var exist = teams.filter(function (p) { return p.teamId === myTeam.id && !p.completedAt; })[0];
      if (exist) return AXP.confirm('진행 중인 ' + myTeam.name + ' 팀 프로젝트가 있어요. 그 프로젝트로 갈까요?', '이동').then(function (ok) { if (ok) AXP.go('#/project/' + exist.id + '/' + exist.stage); });
      newProject({ kind: 'team' });
    };
  });
  // opts: { kind: 'linkushu'|'personal'|'team', caseId, challengeId }
  function newProject(opts) {
    opts = opts || {};
    var me = D.me(), kind = opts.kind || 'personal', KI = AXP.KINDS_INFO[kind];
    var myTeam = me.teamId ? D.team(me.teamId) : null;
    var teamMode = (kind === 'team' || kind === 'linkushu') && myTeam;
    var cases = DB.where('cases', function (c) { return c.status === '운영 중' && c.difficulty !== '검증' && (opts.caseId ? c.id === opts.caseId : c.difficulty !== '챌린지'); });
    var track = teamMode ? myTeam.track : me.track;
    cases.sort(function (a, b) { return (b.track === track) - (a.track === track) || (kind === 'team') * ((b.difficulty === '팀') - (a.difficulty === '팀')); });
    var md = AXP.modal({ title: '새 ' + KI.name + (teamMode ? ' · ' + myTeam.name : ''), sub: KI.desc + (teamMode ? ' — 팀원: ' + (myTeam.members || []).map(function (m) { return D.user(m).name; }).join(', ') : ''), wide: true,
      body: '<p class="small muted">Case는 가상의 회사와 실무자, 현장 이야기의 묶음이에요. 링커스 실무자 컨택 자료와 현업 지식으로 만들어졌어요.</p>' +
        cases.map(function (c, i) { return '<label class="item click" style="display:flex;gap:12px"><input type="radio" name="cs" value="' + esc(c.id) + '"' + (i === 0 ? ' checked' : '') + '><div><div class="row"><span class="badge">' + esc(c.track) + '</span><span class="badge gold">' + esc(c.source) + '</span>' + (c.track === track ? '<span class="badge green">' + (teamMode ? '우리 팀 직무' : '내 희망 직무') + '</span>' : '') + '</div><h3 class="mt8">' + esc(c.title) + '</h3><p class="small muted">' + esc(c.company) + ' · 인터뷰 대상 ' + esc(c.persona.title) + (c.origin ? ' · ' + esc(c.origin) : '') + '</p></div></label>'; }).join('') +
        '<div class="row end mt16"><button class="btn" id="npGo">시작하기</button></div>' });
    U.$('#npGo', md.body).onclick = function () {
      var cid = (U.$('input[name=cs]:checked', md.body) || {}).value, c = D.case(cid);
      var first = AXP.KINDS_INFO[kind].stages[0];
      var rec = { id: U.uid('prj'), kind: kind, userId: me.id, members: teamMode ? (myTeam.members || [me.id]).slice() : [me.id], teamId: teamMode ? myTeam.id : '', cohortId: me.cohortId, caseId: cid, challengeId: opts.challengeId || '',
        title: (kind === 'linkushu' ? '[링커슈' + (teamMode ? ' · ' + myTeam.name : '') + '] ' : kind === 'team' ? '[' + (myTeam ? myTeam.name : '팀') + '] ' : '') + c.company.replace(/\s*\(.*\)/, '') + (kind === 'linkushu' ? ' 직무·이슈 탐구' : ' 프로젝트'), mode: 'virtual', stage: first, reached: 0, data: {} };
      if (rec.members.indexOf(me.id) < 0) rec.members.push(me.id);
      DB.put('projects', rec).then(function (p) { md.close(); AXP.go('#/project/' + p.id + '/' + first); });
    };
  }

  /* ================= AI 사수 (전체 화면 채팅) ================= */
  R('#/mentor', function (el) { mentorPage(el, null); });
  R('#/mentor/:id', function (el, prm) { mentorPage(el, prm.id); });
  function mentorPage(el, chatId) {
    var me = D.me();
    var chats = DB.where('chats', function (c) { return c.userId === me.id; }).sort(function (a, b) { return (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''); });
    var modeName = { mentor: 'AI 사수', work: '업무용 AI', external: '외부' };
    el.innerHTML = h.head('AI 사수', 'AI 사수는 답 대신 생각할 길을 알려 주는 선배예요. 업무용 AI로 일을 맡기고, 외부(ChatGPT·Claude 등) 대화도 가져와 과정 기록에 포함할 수 있어요.',
      '<button class="btn" data-new="mentor">+ AI 사수와 대화</button><button class="btn ghost" data-new="work">+ 업무용 AI</button><button class="btn ghost" id="imp">외부 대화 가져오기</button>') +
      '<div class="grid" style="grid-template-columns:280px minmax(0,1fr);align-items:start"><div class="card" style="padding:12px;max-height:calc(100vh - 200px);overflow-y:auto"><div class="stack">' +
      (chats.length ? chats.map(function (c) { return '<a class="item click small" style="display:block;text-decoration:none;color:inherit;padding:10px 12px;' + (c.id === chatId ? 'border-color:var(--brand);background:var(--brand-soft-2)' : '') + '" href="#/mentor/' + c.id + '"><div class="row"><span class="badge ' + (c.mode === 'mentor' ? 'green' : 'blue') + '">' + esc(c.mode === 'external' ? c.source : modeName[c.mode]) + '</span><span class="tiny muted">' + U.fmt(c.updatedAt || c.createdAt) + '</span></div><div class="mt8">' + esc(c.title || '새 대화') + '</div></a>'; }).join('') : h.empty('아직 대화가 없어요')) +
      '</div></div><div class="card" style="height:calc(100vh - 200px);min-height:520px;display:flex;flex-direction:column" id="chatBox"></div></div>';
    var mode = U.ls.get('axp:newmode', 'mentor');
    var ctl = AXP.Chat.mount(U.$('#chatBox', el), { chatId: chatId, mode: chatId ? null : mode, onSave: function (c) { if (!chatId) { chatId = c.id; history.replaceState(null, '', '#/mentor/' + c.id); } } });
    U.$$('[data-new]', el).forEach(function (b) { b.onclick = function () { U.ls.set('axp:newmode', b.getAttribute('data-new')); if (location.hash === '#/mentor') ctl.reset(b.getAttribute('data-new')); else AXP.go('#/mentor'); }; });
    U.$('#imp', el).onclick = function () { AXP.Chat.importModal(null, function (c) { AXP.go('#/mentor/' + c.id); }); };
  }

  /* ================= 판단 기록 (Decision Log) ================= */
  R('#/log', function (el) {
    var me = D.me(), all = D.logsOf(me.id), prjs = D.myProjects(me.id);
    var f = U.ls.get('axp:logfilter', { p: '', s: '', src: '' });
    U.ls.set('axp:seenReviews', DB.where('reviews', function (r) { return r.learnerId === me.id && r.status !== '요청'; }).map(function (r) { return r.id; }));
    function render() {
      var logs = all.filter(function (l) { return (!f.p || l.projectId === f.p) && (!f.s || l.stage === f.s) && (!f.src || l.source === f.src); });
      var auto = all.filter(function (l) { return l.source !== '판단 카드'; }).length;
      var verified = all.filter(function (l) { return l.verifiedBy; }).length;
      var edited = all.filter(function (l) { return l.edited; }).length;
      var srcs = Array.from(new Set(all.map(function (l) { return l.source; })));
      el.innerHTML = h.head('판단 기록 (Decision Log)', '따로 쓰지 않아도 일한 흔적이 자동으로 쌓여요. 저장 시각은 서버가 찍고 원본은 잠겨요. 고칠 수는 있지만 "직접 수정"이 표시되고 원래 기록도 남아요.',
        '<button class="btn ghost" id="addCard">+ 판단 카드 직접 쓰기</button><button class="btn" id="mkDL">DL 제출본 만들기</button>') +
        '<div class="grid g4">' + h.stat('전체 기록', all.length, '자동 기록 ' + U.pct(auto, all.length) + '%') + h.stat('멘토 확인', verified, '현직자가 확인한 판단') + h.stat('직접 수정', edited, '원본과 함께 보관') + h.stat('AI 답 처리', all.filter(function (l) { return l.action; }).length, '쓴다·고친다·버린다·보류') + '</div>' +
        '<div class="card mt16"><div class="row"><select id="fP" style="width:auto"><option value="">모든 프로젝트</option>' + prjs.map(function (p) { return '<option value="' + p.id + '"' + (f.p === p.id ? ' selected' : '') + '>' + esc(p.title) + '</option>'; }).join('') + '</select>' +
        '<select id="fS" style="width:auto"><option value="">모든 단계</option>' + ['onboarding'].concat(Object.keys(AXP.STAGE_DEFS)).concat(['chat', 'external']).map(function (k) { return '<option value="' + k + '"' + (f.s === k ? ' selected' : '') + '>' + esc(AXP.STAGE_NAME[k]) + '</option>'; }).join('') + '</select>' +
        '<select id="fSrc" style="width:auto"><option value="">모든 출처</option>' + srcs.map(function (s) { return '<option' + (f.src === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select><span class="small muted">' + logs.length + '개</span></div>' +
        '<div class="mt16">' + AXP.timeline(logs, { editable: true }) + '</div></div>';
      U.$('#fP', el).onchange = function (e) { f.p = e.target.value; U.ls.set('axp:logfilter', f); render(); };
      U.$('#fS', el).onchange = function (e) { f.s = e.target.value; U.ls.set('axp:logfilter', f); render(); };
      U.$('#fSrc', el).onchange = function (e) { f.src = e.target.value; U.ls.set('axp:logfilter', f); render(); };
      AXP.bindTimeline(el, function () { all = D.logsOf(me.id); render(); });
      U.$('#addCard', el).onclick = function () { cardModal(function () { all = D.logsOf(me.id); render(); }); };
      U.$('#mkDL', el).onclick = function () { dlModal(f.p || (prjs[0] || {}).id); };
    }
    render();
  });
  function cardModal(done) {
    var prjs = D.myProjects();
    var md = AXP.modal({ title: '판단 카드', sub: '중요한 판단을 그 자리에서 15초 안에 남겨요. 저장하면 시각이 찍히고 원본이 잠겨요.',
      body: '<label class="lb">프로젝트</label><select id="cP"><option value="">(없음)</option>' + prjs.map(function (p) { return '<option value="' + p.id + '">' + esc(p.title) + '</option>'; }).join('') + '</select>' +
        '<label class="lb mt12">판단 유형</label><div class="chips" id="cK">' + AXP.KINDS.map(function (k, i) { return '<button type="button" class="chip" aria-pressed="' + (i === 0) + '">' + k + '</button>'; }).join('') + '</div>' +
        '<label class="lb mt12" for="cT">무엇을, 왜 판단했나요?</label><textarea id="cT" rows="3" placeholder="예: AI 분류에서 응대 불만 14건이 빠져 4분류로 수정"></textarea><div class="row end mt12"><button class="btn" id="cGo">저장</button></div>' });
    var kind = AXP.KINDS[0];
    U.$$('#cK .chip', md.body).forEach(function (b) { b.onclick = function () { kind = b.textContent; U.$$('#cK .chip', md.body).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
    U.$('#cGo', md.body).onclick = function () {
      var t = U.$('#cT', md.body).value.trim(); if (!t) return;
      var pid = U.$('#cP', md.body).value, p = pid ? DB.get('projects', pid) : null;
      D.addLog({ projectId: pid, stage: p ? p.stage : 'etc', kind: kind, source: '판단 카드', text: t }).then(function () { md.close(); AXP.toast('기록했어요'); if (done) done(); });
    };
  }
  function dlModal(pid) {
    var p = DB.get('projects', pid); var me = D.me();
    if (!p) return AXP.toast('프로젝트가 필요해요', true);
    var md = AXP.modal({ title: 'Decision Log 제출본', sub: '판단 기록을 링커스 DL 5칸 형식으로 묶어요. AI 정리 도우미가 기록 안에서만 초안을 쓰고, 고쳐서 제출해요.', wide: true, body: '<p class="muted">기록을 정리하고 있어요…</p>' });
    AXP.AI.run('dl_draft', { history: AXP.histText(p) }).then(function (r) {
      var F = [['decision', '결정'], ['reason', '이유와 근거'], ['ai', 'AI 활용과 검증'], ['result', '결과'], ['learn', '배운 점']];
      md.body.innerHTML = '<div class="note blue small">AI 초안이에요. [#번호]는 판단 기록 번호예요. 고치지 않고 내면 "AI 초안 그대로"로 표시돼요.</div>' + F.map(function (x) { return '<label class="lb mt12">' + x[1] + '</label><textarea data-f="' + x[0] + '" rows="3">' + esc(r[x[0]] || '') + '</textarea>'; }).join('') +
        '<div class="row end mt16"><button class="btn ghost" id="dlPrint">인쇄 · PDF</button><button class="btn" id="dlSub">제출함에 내기</button></div>';
      function body() { return F.map(function (x) { return '[' + x[1] + ']\n' + U.$('[data-f="' + x[0] + '"]', md.body).value; }).join('\n\n'); }
      var orig = F.map(function (x) { return '[' + x[1] + ']\n' + (r[x[0]] || ''); }).join('\n\n');
      U.$('#dlPrint', md.body).onclick = function () {
        var w = window.open('', '_blank'); if (!w) return AXP.toast('팝업이 막혀 있어요', true);
        w.document.write('<html><head><meta charset="utf-8"><title>Decision Log · ' + esc(me.name) + '</title><style>body{font-family:Pretendard,Malgun Gothic,sans-serif;max-width:760px;margin:40px auto;line-height:1.7;color:#1B2420}h1{font-size:22px}h2{font-size:15px;margin-top:22px;color:#0A4F37}pre{white-space:pre-wrap;font-family:inherit}.m{color:#66736C;font-size:13px}</style></head><body><h1>Decision Log · ' + esc(p.title) + '</h1><p class="m">' + esc(me.name) + ' · ' + esc((D.cohort() || {}).name || '') + ' · AX Proof 판단 기록 ' + D.logsOf(me.id, p.id).length + '개 기반</p>' +
          F.map(function (x) { return '<h2>' + x[1] + '</h2><pre>' + esc(U.$('[data-f="' + x[0] + '"]', md.body).value) + '</pre>'; }).join('') + '<h2>판단 기록 원본</h2>' + D.logsOf(me.id, p.id).map(function (l, i) { return '<p class="m">#' + (i + 1) + ' · ' + U.fmt(l.createdAt, true) + ' · ' + esc(l.source) + (l.edited ? ' · 직접 수정' : '') + (l.verifiedBy ? ' · 멘토 확인' : '') + '</p><pre>' + esc(l.text) + '</pre>'; }).join('') + '</body></html>');
        w.document.close(); setTimeout(function () { w.print(); }, 300);
      };
      U.$('#dlSub', md.body).onclick = function () {
        var asg = DB.where('assignments', function (a) { return a.auto === 'dl' && a.cohortId === p.cohortId; })[0];
        var b = body();
        DB.put('submissions', { id: U.uid('sub'), assignmentId: asg ? asg.id : '', userId: me.id, status: '제출', title: 'Decision Log · ' + p.title, body: b, aiDraft: true, aiUnchanged: b === orig, projectId: p.id })
          .then(function () { md.close(); AXP.toast('제출했어요'); });
      };
    }).catch(function (e) { md.body.innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; });
  }

  /* ================= 제출함 ================= */
  R('#/submit', function (el) {
    var me = D.me(), cohort = D.cohort();
    var asgs = DB.where('assignments', function (a) { return cohort && a.cohortId === cohort.id; }).sort(function (a, b) { return a.due.localeCompare(b.due); });
    var subs = DB.where('submissions', function (s) { return s.userId === me.id; });
    var go = { onboarding: '#/onboarding', contact_report: '#/projects', dl: '#/log', final: '#/projects' };
    el.innerHTML = h.head('제출함', '카페 게시판·구글폼에 내던 과제를 여기서 내요. 프로젝트에서 만든 컨택 보고서·DL·결과 보고는 자동으로 연결돼요.') +
      '<div class="stack">' + asgs.map(function (a) {
        var mine = subs.filter(function (s) { return s.assignmentId === a.id; });
        var days = Math.ceil((new Date(a.due) - Date.now()) / 864e5);
        var st = mine.length ? mine[mine.length - 1].status : (days < 0 ? '기한 지남' : '미제출');
        return '<div class="item"><div class="row between"><div><div class="row"><span class="badge">' + esc(a.type) + '</span><span class="badge ' + (mine.length ? 'green' : days < 0 ? 'red' : 'gold') + '">' + esc(st) + '</span><span class="tiny muted">마감 ' + esc(a.due) + (days >= 0 ? ' · D-' + days : '') + '</span></div><h3 class="mt8">' + esc(a.title) + '</h3><p class="small muted">' + esc(a.desc || '') + '</p></div>' +
          (a.auto ? '<a class="btn ghost sm" href="' + go[a.auto] + '">' + (a.auto === 'onboarding' ? '온보딩으로' : a.auto === 'dl' ? '판단 기록에서 만들기' : '프로젝트에서 만들기') + '</a>' : '<button class="btn sm" data-sub="' + a.id + '">' + (mine.length ? '다시 내기' : '제출하기') + '</button>') + '</div>' +
          mine.map(function (s) { return '<div class="tip mt8"><b>' + esc(s.title || '제출물') + '</b> · ' + U.fmt(s.createdAt) + (s.aiUnchanged ? ' <span class="badge gold">AI 초안 그대로</span>' : '') + (s.feedback ? '<div class="mt8" style="color:var(--brand-ink)">운영진 피드백 · ' + esc(s.feedback) + '</div>' : '') + '</div>'; }).join('') + '</div>';
      }).join('') + '</div>';
    U.$$('[data-sub]', el).forEach(function (b) {
      b.onclick = function () {
        var a = DB.get('assignments', b.getAttribute('data-sub'));
        var md = AXP.modal({ title: a.title, sub: a.desc, wide: true, body: '<label class="lb" for="sT">제목</label><input type="text" id="sT"><label class="lb mt12" for="sB">내용</label><textarea id="sB" rows="10"></textarea><label class="lb mt12" for="sL">링크 (선택)</label><input type="url" id="sL" placeholder="노션·구글 문서 링크"><label class="check mt12"><input type="checkbox" id="sKB"> 다음 기수 자료실(아카이브)에 공유해도 좋아요</label><div class="row end mt12"><button class="btn" id="sGo">제출</button></div>' });
        U.$('#sGo', md.body).onclick = function () {
          var t = U.$('#sT', md.body).value.trim(), bd = U.$('#sB', md.body).value.trim(); if (!t || !bd) return AXP.toast('제목과 내용을 적어 주세요', true);
          DB.put('submissions', { id: U.uid('sub'), assignmentId: a.id, userId: me.id, status: '제출', title: t, body: bd, link: U.$('#sL', md.body).value.trim(), shareOk: U.$('#sKB', md.body).checked })
            .then(function () { if (a.type === '링커슈') D.addLog({ stage: 'issue', kind: '문제 정의', source: '제출', text: '링커슈 제출: ' + t }); md.close(); AXP.toast('제출했어요'); AXP.render(); });
        };
      };
    });
  });

  /* ================= 실무자 컨택 (실제 현직자) ================= */
  R('#/contact', function (el) {
    var me = D.me(), q = (location.hash.split('?')[1] || ''), pre = (q.match(/project=([^&]+)/) || [])[1] || '';
    var tag = '';
    function render() {
      var ms = DB.where('mentors', function (m) { return m.contactOk && (!tag || (m.tags || []).indexOf(tag) >= 0 || m.industry === tag); });
      var mine = DB.where('contacts', function (c) { return c.learnerId === me.id; });
      var tags = Array.from(new Set(DB.all('mentors').reduce(function (a, m) { return a.concat(m.tags || []); }, [])));
      el.innerHTML = h.head('실무자 컨택', '링커스가 10년간 쌓은 현직자 네트워크(멘토 DB)에서 인터뷰를 요청해요. 요청 메시지는 AI 사수가 먼저 점검해 줘요. AI 실무자로 연습한 뒤 만나면 더 깊이 물을 수 있어요.', '<a class="btn soft" href="#/ob-review">OB에게 포트폴리오 리뷰 요청</a>') +
        (mine.length ? '<div class="card"><h3>내 컨택 요청</h3>' + mine.map(function (c) { var m = DB.get('mentors', c.mentorId) || {}; return '<div class="item mt8"><div class="row between"><b>' + esc(m.name) + ' · ' + esc(m.role) + '</b><span class="badge ' + (c.status === '요청' ? 'gold' : c.status === '거절' ? 'red' : 'green') + '">' + esc(c.status) + '</span></div><p class="small muted">' + esc(U.short(c.message, 100)) + (c.schedule ? ' · 일정 ' + esc(c.schedule) : '') + '</p></div>'; }).join('') + '</div>' : '') +
        '<div class="card mt16"><div class="chips"><button class="chip" data-tag="" aria-pressed="' + !tag + '">전체</button>' + tags.map(function (t) { return '<button class="chip" data-tag="' + esc(t) + '" aria-pressed="' + (tag === t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
        '<div class="grid g2 mt16">' + ms.map(function (m) { return '<div class="item"><div class="row between"><div><h3>' + esc(m.name) + ' <span class="small muted">· ' + esc(m.role) + ' ' + m.years + '년차</span></h3><p class="small muted">' + esc(m.company) + ' · ' + esc(m.industry) + '</p></div><span class="badge green">컨택 가능</span></div><div class="chips mt8">' + (m.tags || []).map(function (t) { return '<span class="badge">' + esc(t) + '</span>'; }).join('') + '</div><p class="tiny muted mt8">' + esc(m.note || '') + '</p><button class="btn sm mt12" data-req="' + m.id + '">인터뷰 요청</button></div>'; }).join('') + '</div></div>';
      U.$$('[data-tag]', el).forEach(function (b) { b.onclick = function () { tag = b.getAttribute('data-tag'); render(); }; });
      U.$$('[data-req]', el).forEach(function (b) { b.onclick = function () { request(DB.get('mentors', b.getAttribute('data-req'))); }; });
    }
    function request(m) {
      var prjs = D.myProjects(me.id);
      var md = AXP.modal({ title: m.name + ' 님께 인터뷰 요청', sub: m.role + ' · ' + m.company + ' · 연락 채널 ' + (m.channel || '플랫폼 메시지'), wide: true,
        body: '<label class="lb">연결할 프로젝트</label><select id="rP">' + prjs.map(function (p) { return '<option value="' + p.id + '"' + (p.id === pre ? ' selected' : '') + '>' + esc(p.title) + '</option>'; }).join('') + '</select>' +
          '<label class="lb mt12" for="rM">요청 메시지</label><textarea id="rM" rows="7" placeholder="자기소개, 왜 이분께 묻는지, 소요 시간, 질문 예시 1~2개"></textarea><div class="row mt12"><button class="btn ghost sm" id="rChk">AI 사수에게 메시지 점검받기</button></div><div id="rTips" class="mt8"></div>' +
          '<div class="row end mt16"><button class="btn" id="rGo">요청 보내기</button></div>' });
      U.$('#rChk', md.body).onclick = function () {
        AXP.AI.run('outreach_review', { to: m.role + ' (' + m.industry + ')', message: U.$('#rM', md.body).value }).then(function (r) {
          U.$('#rTips', md.body).innerHTML = '<div class="coach"><b>◎ AI 사수</b>' + (r.tips || []).map(function (t) { return '<div class="tip">' + esc(t) + '</div>'; }).join('') + '</div>';
        });
      };
      U.$('#rGo', md.body).onclick = function () {
        var msg = U.$('#rM', md.body).value.trim(); if (msg.length < 30) return AXP.toast('메시지를 조금 더 구체적으로 써 주세요', true);
        var pid = U.$('#rP', md.body).value;
        DB.put('contacts', { id: U.uid('ctc'), learnerId: me.id, mentorId: m.id, projectId: pid, status: '요청', message: msg }).then(function () {
          var p = DB.get('projects', pid); if (p) { p.data = p.data || {}; p.data.talk = p.data.talk || {}; p.data.talk.mode = 'real'; DB.put('projects', p); }
          D.addLog({ projectId: pid, stage: 'talk', kind: '실행 판단', source: '실제 인터뷰', text: m.role + '(' + m.industry + ')에게 인터뷰 요청. 이유: ' + U.short(msg, 120) });
          md.close(); AXP.toast('요청을 보냈어요'); render();
        });
      };
    }
    render();
  });

  /* ================= 기업 챌린지 ================= */
  R('#/challenge', function (el) {
    var me = D.me();
    var list = DB.all('challenges');
    el.innerHTML = h.head('기업 챌린지', '기업이 낸 실제 과제를 AI 사수와 함께 수행해요. 동의한 경우에만 결과와 판단 과정이 기업에 전달되고, 우수 수행자는 추천돼요.') +
      '<div class="stack">' + (list.length ? list.map(function (c) {
        var prj = DB.where('projects', function (p) { return p.challengeId === c.id && p.userId === me.id; })[0];
        var joined = !!prj;
        var count = AXP.challengeParticipants(c).length;
        return '<div class="card"><div class="row between"><div><div class="row"><span class="badge gold">' + esc(c.status) + '</span><span class="badge">' + esc(c.company) + '</span></div><h2 class="mt8">' + esc(c.title) + '</h2></div>' +
          (prj ? '<a class="btn" href="#/project/' + prj.id + '/' + prj.stage + '">이어서 하기</a>' : '<button class="btn" data-join="' + c.id + '">참여하기</button>') + '</div>' +
          '<p class="mt12">' + esc(c.brief) + '</p><dl class="kv mt12"><dt>기간</dt><dd>' + esc(c.period) + '</dd><dt>혜택</dt><dd>' + esc(c.reward || '-') + '</dd><dt>참여</dt><dd>' + count + '명' + (joined ? ' · 나도 참여 중' : '') + '</dd></dl></div>';
      }).join('') : h.empty('지금 열린 챌린지가 없어요.')) + '</div>';
    U.$$('[data-join]', el).forEach(function (b) {
      b.onclick = function () {
        var c = DB.get('challenges', b.getAttribute('data-join'));
        var md = AXP.modal({ title: '챌린지 참여', sub: c.title, body: '<label class="check"><input type="checkbox" id="cs1"> 과제 결과물과 판단 기록(대표 판단·Readiness 피드백)을 ' + esc(c.company) + '에 공유하는 데 동의합니다. 개인 연락처는 우수 수행자로 선정되고 내가 수락할 때만 전달됩니다.</label><div class="row end mt16"><button class="btn" id="csGo">동의하고 시작</button></div>' });
        U.$('#csGo', md.body).onclick = function () {
          if (!U.$('#cs1', md.body).checked) return AXP.toast('동의가 필요해요', true);
          DB.put('projects', { id: U.uid('prj'), kind: 'personal', userId: me.id, members: [me.id], cohortId: me.cohortId, caseId: c.caseId, challengeId: c.id, challengeConsentAt: U.now(), title: '[챌린지] ' + c.title, mode: 'virtual', stage: 'prep', reached: 0, data: {} })
            .then(function (p) { md.close(); AXP.go('#/project/' + p.id + '/prep'); });
        };
      };
    });
  });

  // 챌린지 참여자 = 운영진이 등록한 참여자 + 동의하고 프로젝트를 시작한 훈련생
  AXP.challengeParticipants = function (c) {
    var ids = (c.participants || []).slice();
    DB.where('projects', function (p) { return p.challengeId === c.id; }).forEach(function (p) { if (ids.indexOf(p.userId) < 0) ids.push(p.userId); });
    return ids;
  };

  /* ================= 자료실 ================= */
  function library(el) {
    var tab = U.ls.get('axp:libtab', 'archive'), q = '';
    function render() {
      var arc = DB.where('archive', function (a) { return a.useInKB !== false || D.me().role !== 'learner'; });
      var kb = DB.where('knowledge', function (k) { return k.status === '승인' || k.status === '자동 반영'; });
      var cases = DB.where('cases', function (c) { return c.status === '운영 중'; });
      var match = function (s) { return !q || String(s).toLowerCase().indexOf(q.toLowerCase()) >= 0; };
      var body = tab === 'archive' ? arc.filter(function (a) { return match(a.title + a.body + (a.tags || []).join(' ')); }).map(function (a) { return '<div class="item click" data-arc="' + a.id + '"><div class="row"><span class="badge">' + esc(a.type) + '</span><span class="tiny muted">' + esc(a.cohort) + ' · ' + esc(a.author) + ' · 출처 ' + esc(a.source) + '</span></div><h3 class="mt8">' + esc(a.title) + '</h3><p class="small muted">' + esc(U.short(a.body, 140)) + '</p></div>'; }).join('')
        : tab === 'kb' ? kb.filter(function (k) { return match(k.title + JSON.stringify(k.extracted)); }).map(function (k) { var e = k.extracted || {}; return '<div class="item"><div class="row"><span class="badge blue">' + esc(k.sourceType) + '</span><span class="badge">' + esc(e.role || '') + '</span></div><h3 class="mt8">' + esc(k.title) + '</h3><p class="small mt8"><b>업무</b> ' + esc((e.tasks || []).join(', ')) + '</p><p class="small"><b>현업 판단 기준</b> ' + esc((e.criteria || []).join(', ') || '-') + '</p><p class="small"><b>도구</b> ' + esc((e.tools || []).join(', ') || '-') + '</p></div>'; }).join('')
        : cases.filter(function (c) { return match(c.title + c.industry); }).map(function (c) { return '<div class="item"><div class="row"><span class="badge">' + esc(c.track) + '</span><span class="badge gold">' + esc(c.source) + '</span><span class="badge">' + esc(c.difficulty) + '</span></div><h3 class="mt8">' + esc(c.title) + '</h3><p class="small muted">' + esc(c.company) + ' · ' + esc(c.persona.title) + ' ' + esc(c.persona.name) + '</p></div>'; }).join('');
      el.innerHTML = h.head('자료실', '링커스 10년의 자료(링커슈·컨택 보고서·인터뷰 설계)와 직무 지식, Case를 한곳에서 찾아요.') +
        '<div class="card"><div class="row between"><div class="seg"><button data-tab="archive" aria-pressed="' + (tab === 'archive') + '">링커스 아카이브</button><button data-tab="kb" aria-pressed="' + (tab === 'kb') + '">직무 지식</button><button data-tab="cases" aria-pressed="' + (tab === 'cases') + '">Case</button></div><input type="search" id="lq" placeholder="검색" style="width:240px" value="' + esc(q) + '"></div><div class="mt16">' + (body || h.empty('결과가 없어요')) + '</div></div>';
      U.$$('[data-tab]', el).forEach(function (b) { b.onclick = function () { tab = b.getAttribute('data-tab'); U.ls.set('axp:libtab', tab); render(); }; });
      var qi = U.$('#lq', el); qi.oninput = U.debounce(function () { q = qi.value; render(); var n = U.$('#lq', el); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250);
      U.$$('[data-arc]', el).forEach(function (b) { b.onclick = function () { var a = DB.get('archive', b.getAttribute('data-arc')); AXP.modal({ title: a.title, sub: a.type + ' · ' + a.cohort + ' · ' + a.author, wide: true, body: '<div class="pre">' + esc(a.body) + '</div>' }); }; });
    }
    render();
  }
  AXP.library = library;
  R('#/library', library);

  /* ================= 포트폴리오 ================= */
  R('#/portfolio', function (el) {
    var me = D.me();
    var pf = DB.where('portfolios', function (x) { return x.userId === me.id; })[0] || { id: U.uid('pf'), userId: me.id, public: false, headline: '', projectIds: D.myProjects(me.id).map(function (p) { return p.id; }).slice(0, 2), picks: [] };
    var save = U.debounce(function () { DB.put('portfolios', pf).then(function (x) { pf = x; }); }, 500);
    function render() {
      var prjs = D.myProjects(me.id), logs = D.logsOf(me.id).filter(function (l) { return !l.excludedFromPortfolio; });
      var automatic = logs.filter(function (l) { return l.origin === 'chat-auto' || l.source === '공유시간 회고' || l.source === 'OB 멘토 리뷰 회고'; });
      var reviews = DB.where('reviews', function (r) { return r.learnerId === me.id && r.rubric; });
      var ready = prjs.map(function (p) { return AXP.readinessOf(p, me.id); }).filter(Boolean)[0];
      var link = location.href.split('#')[0] + '#/p/' + pf.id;
      el.innerHTML = h.head('내 포트폴리오', '수료할 때 완성되는 나만의 실무 포트폴리오예요. 결과물만이 아니라 <b>판단 과정</b>과 <b>현직자 확인</b>이 함께 담겨, 자소서로는 안 보이던 역량을 보여 줘요.',
        '<a class="btn ghost" href="#/p/' + pf.id + '" target="_blank">미리보기</a><button class="btn" id="share">' + (pf.public ? '공유 중 · 설정' : '공유 링크 만들기') + '</button>') +
        '<div class="grid g-main-wide"><div class="stack-lg">' +
        '<div class="card evidence-inbox"><div class="row between"><span class="badge green">내 판단 자동 수집함</span><b>' + automatic.length + '개</b></div><h2 class="mt12">대화에서 한 선택이, 내 경험으로 쌓입니다.</h2><p class="small muted mt8">직접 밝힌 선택과 이유, 공유시간과 OB 조언 뒤에 바꾼 판단이 자동으로 모여요. 내 원문을 확인하고 공개할 대표 판단만 골라 주세요.</p>' +
        (automatic.length ? automatic.slice(-5).reverse().map(function (l) { return '<div class="evidence-item mt12"><p class="pre">“' + esc(l.userQuote || l.text) + '”</p><div class="row between mt8"><span class="tiny muted">' + esc(l.source) + ' · ' + (l.detection === 'rule-demo' ? '데모 탐지 · ' : '') + U.fmt(l.createdAt, true) + '</span><div class="row">' + (l.chatId ? '<a class="small" href="#/mentor/' + esc(l.chatId) + '">원래 대화</a>' : (l.source === 'OB 멘토 리뷰 회고' ? '<a class="small" href="#/ob-review/' + esc(l.ref) + '">멘토 리뷰</a>' : '<a class="small" href="#/sharing">공유시간</a>')) + '<button class="linkbtn small" data-hide-evidence="' + esc(l.id) + '">내 판단이 아니에요</button></div></div></div>'; }).join('') : '<div class="note mt16">예: “근거 원문을 확인할 수 없어서 이 숫자는 쓰지 않기로 했어요.”처럼 선택과 이유를 말해 보세요. 일반 질문이나 AI의 답변은 내 판단으로 기록하지 않습니다.</div>') +
        '<div class="row mt16"><a class="btn soft sm" href="#/mentor">AI 사수와 대화하기</a><a class="btn ghost sm" href="#/sharing">공유시간 회고하기</a></div></div>' +
        '<div class="card"><label class="lb" for="hl">한 줄 소개</label><input type="text" id="hl" value="' + esc(pf.headline || '') + '" placeholder="예: AI 결과를 숫자로 검증하는 운영 기획자"><label class="lb mt12">담을 프로젝트</label><div class="chips">' + prjs.map(function (p) { return '<button class="chip" data-pp="' + p.id + '" aria-pressed="' + (pf.projectIds.indexOf(p.id) >= 0) + '">' + esc(p.title) + '</button>'; }).join('') + '</div></div>' +
        '<div class="card"><div class="card-head"><div><h2>대표 판단 고르기</h2><p>면접에서 "왜 그렇게 하셨어요?"에 답할 장면 3개를 골라요. 멘토 확인이 붙은 판단이 신뢰도가 높아요.</p></div><span class="badge green">' + pf.picks.length + ' / 3</span></div>' + AXP.timeline(logs.slice().reverse(), { pick: true, picked: pf.picks }) + '</div>' +
        '</div><div class="stack-lg">' +
        (ready ? AXP.readinessCard(ready, { title: 'AI Work Readiness' }) : '<div class="card"><h3>AI Work Readiness</h3><p class="small muted mt8">프로젝트 디펜스를 마치면 여기에 피드백이 담겨요.</p></div>') +
        '<div class="card"><h3>현직 멘토 평가</h3>' + (reviews.length ? reviews.map(function (r) { return '<div class="item mt8"><div class="row between"><b class="small">' + esc(r.mentorName || '현직 멘토') + '</b><span class="tiny muted">' + esc(AXP.STAGE_NAME[r.stage] || '') + '</span></div>' + AXP.COMPETENCIES.map(function (k) { return '<div class="hbar"><span class="small">' + esc(k) + '</span>' + h.lv(r.rubric[k] || 0, true) + '<span class="tiny muted">' + (r.rubric[k] || '-') + '</span></div>'; }).join('') + '</div>'; }).join('') : '<p class="small muted mt8">아직 없어요.</p>') + '</div>' +
        '<div class="card" id="obPortfolio"></div>' +
        '<div class="card"><h3>면접 사례 카드</h3><p class="small muted mt8">자소서를 대신 써 주지 않아요. 고른 판단마다 예상 질문과 근거만 정리해 줘요.</p><button class="btn soft sm mt12" id="cards">사례 카드 만들기</button><div id="cardBox" class="mt12">' + cardsHTML(pf.cards) + '</div></div>' +
        '</div></div>';
      if (AXP.OB) AXP.OB.mountPortfolio(U.$('#obPortfolio', el));
      U.$('#hl', el).oninput = function (e) { pf.headline = e.target.value; save(); };
      U.$$('[data-hide-evidence]', el).forEach(function (b) { b.onclick = function () { var l = DB.get('logs', b.getAttribute('data-hide-evidence')); l.excludedFromPortfolio = true; pf.picks = pf.picks.filter(function (id) { return id !== l.id; }); DB.put('logs', l).then(function () { return DB.put('portfolios', pf); }).then(function (x) { pf = x; render(); AXP.toast('자동 수집함에서 제외했어요. 원문은 판단 기록에 보관됩니다.'); }); }; });
      U.$$('[data-pp]', el).forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-pp'), k = pf.projectIds.indexOf(id); if (k >= 0) pf.projectIds.splice(k, 1); else pf.projectIds.push(id); save(); render(); }; });
      U.$$('[data-pick]', el).forEach(function (cb) {
        cb.onchange = function () {
          var id = cb.getAttribute('data-pick');
          if (cb.checked) { if (pf.picks.length >= 3) { cb.checked = false; return AXP.toast('대표 판단은 3개까지 고를 수 있어요', true); } pf.picks.push(id); } else pf.picks = pf.picks.filter(function (x) { return x !== id; });
          save(); var b = el.querySelector('.card-head .badge.green'); if (b) b.textContent = pf.picks.length + ' / 3';
        };
      });
      U.$('#cards', el).onclick = function () {
        var list = pf.picks.map(function (id) { return DB.get('logs', id); }).filter(Boolean);
        if (!list.length) return AXP.toast('대표 판단을 먼저 골라 주세요', true);
        AXP.AI.run('interview_cards', { list: list, picks: list.map(function (l) { return '- [' + l.kind + '] ' + l.text; }).join('\n') }).then(function (r) { pf.cards = r.cards || []; save(); U.$('#cardBox', el).innerHTML = cardsHTML(pf.cards); });
      };
      U.$('#share', el).onclick = function () {
        var md = AXP.modal({ title: '포트폴리오 공유', sub: '기본은 비공개예요. 내가 정한 기간 동안만 링크로 열리고, 언제든 끌 수 있어요.',
          body: '<label class="check"><input type="checkbox" id="pub"' + (pf.public ? ' checked' : '') + '> 링크가 있는 사람에게 공개</label><label class="lb mt12" for="exp">공유 종료일</label><input type="date" id="exp" value="' + esc((pf.expiresAt || '').slice(0, 10)) + '">' +
            '<label class="lb mt12">공유 링크</label><div class="row" style="flex-wrap:nowrap"><input type="text" readonly value="' + esc(link) + '"><button class="btn ghost sm" id="cp">복사</button></div>' + (!AXP.Mode.server ? '<p class="tiny muted mt8">데모 모드에서는 이 브라우저에서만 열려요. 서버로 배포하면 누구나 링크로 볼 수 있어요.</p>' : '') + '<div class="row end mt16"><button class="btn" id="pfSave">저장</button></div>' });
        U.$('#cp', md.body).onclick = function () { U.copy(link); };
        U.$('#pfSave', md.body).onclick = function () { pf.public = U.$('#pub', md.body).checked; pf.expiresAt = U.$('#exp', md.body).value ? new Date(U.$('#exp', md.body).value + 'T23:59:59').toISOString() : ''; DB.put('portfolios', pf).then(function (x) { pf = x; md.close(); render(); AXP.toast(pf.public ? '공유를 켰어요' : '비공개로 바꿨어요'); }); };
      };
    }
    function cardsHTML(cards) { return (cards || []).map(function (c) { return '<div class="item mt8"><b class="small">Q. ' + esc(c.q) + '</b><p class="tiny muted mt8">근거 · ' + esc(c.evidence) + '</p><p class="tiny mt8" style="color:var(--brand-ink)">' + esc(c.point) + '</p></div>'; }).join(''); }
    render();
  });

  /* ================= 공개 포트폴리오 (로그인 없이) ================= */
  AXP.publicPortfolio = function (el, id) {
    el.innerHTML = '<p class="muted">불러오는 중…</p>';
    var p = AXP.Mode.server ? AXP.api('api/public?portfolio=' + encodeURIComponent(id)) : DB.load().then(function () {
      var pf = DB.get('portfolios', id); if (!pf) throw new Error('포트폴리오를 찾을 수 없어요');
      var u = DB.get('users', pf.userId) || {}, cases = DB.all('cases');
      return { portfolio: pf, user: { name: u.name, track: u.track, bio: u.bio }, cohort: D.cohort(u.cohortId),
        projects: DB.where('projects', function (x) { return pf.projectIds.indexOf(x.id) >= 0; }).map(function (x) { var c = cases.find(function (y) { return y.id === x.caseId; }) || {}; return { id: x.id, title: x.title, caseTitle: c.title, company: c.company, stage: x.stage, topic: x.data && x.data.topic ? x.data.topic.pick : '', final: x.data && x.data.final ? { report: x.data.final.report, readiness: AXP.readinessOf(x, pf.userId), links: x.data.final.links } : null, mode: x.mode, kind: AXP.kindOf(x) }; }),
        logs: DB.where('logs', function (l) { return l.userId === pf.userId && !l.excludedFromPortfolio && pf.picks.indexOf(l.id) >= 0; }).map(function (l) { return Object.assign({}, l, { picked: true }); }),
        reviews: DB.where('reviews', function (r) { return r.learnerId === pf.userId; }),
        mentorFeedback: window.AXP_OB_RULES ? window.AXP_OB_RULES.publicFeedback(DB.all('mentorReviews'), pf.userId) : [] };
    });
    p.then(function (j) {
      var pf = j.portfolio, picks = j.logs.filter(function (l) { return l.picked; });
      var ready = (j.projects.map(function (x) { return x.final && x.final.readiness; }).filter(Boolean)).slice(-1)[0];
      var verified = j.logs.filter(function (l) { return l.verifiedBy; }).length;
      var rubrics = j.reviews.filter(function (r) { return r.rubric; });
      el.innerHTML = '<div class="pf"><div class="pf-hero"><div class="row between"><span class="badge" style="background:rgba(255,255,255,.12);color:#fff">AX Proof 실무 포트폴리오</span><span class="small" style="color:#8FB3A3">' + esc(j.cohort ? j.cohort.org + ' · ' + j.cohort.name : '') + '</span></div><h1 class="mt16">' + esc(j.user ? j.user.name : '') + '</h1><p>' + esc(pf.headline || '') + '</p><p class="small">' + esc(j.user && j.user.track ? '희망 직무 · ' + j.user.track : '') + '</p></div>' +
        '<div class="grid g3 mt16">' + h.stat('판단 기록', j.logs.length, '자동 수집 · 서버 시각') + h.stat('현직자 확인', verified, '멘토가 확인한 판단') + h.stat('프로젝트', j.projects.length, j.projects.filter(function (x) { return x.final && x.final.readiness; }).length + '개 디펜스 완료') + '</div>' +
        j.projects.map(function (x) { var rp = (x.final && x.final.report) || {}; return '<div class="card mt16"><span class="badge">' + esc(x.company || '') + '</span><h2 class="mt8">' + esc(x.title) + '</h2><p class="small muted">' + esc(x.caseTitle || '') + ' · ' + (x.mode === 'real' ? '실제 현직자 인터뷰' : 'AI 실무자 인터뷰') + '</p>' + (rp.sum ? '<p class="mt12">' + esc(rp.sum) + '</p>' : x.topic ? '<p class="mt12">주제 · ' + esc(x.topic) + '</p>' : '') + (rp.verify ? '<p class="small mt8"><b>검증</b> · ' + esc(rp.verify) + '</p>' : '') + ((x.final && x.final.links) || []).map(function (l) { return '<p class="small mt8"><a href="' + esc(l) + '" target="_blank" rel="noopener">' + esc(l) + '</a></p>'; }).join('') + '</div>'; }).join('') +
        '<div class="card mt16"><h2>대표 판단</h2><p class="small muted mt8">그 순간에 남긴 기록 원본이에요. 고친 기록은 원래 기록과 함께 보여요.</p><div class="mt16">' + (picks.length ? AXP.timeline(picks) : h.empty('대표 판단이 아직 없어요')) + '</div></div>' +
        (ready ? AXP.readinessCard(ready, { title: 'AI Work Readiness 피드백', showInterview: true }) : '') +
        (rubrics.length ? '<div class="card mt16"><h2>현직 멘토 평가</h2>' + rubrics.map(function (r) { return '<div class="item mt12"><b class="small">' + esc(r.mentorName || '현직 멘토') + '</b>' + AXP.COMPETENCIES.map(function (k) { return '<div class="hbar"><span class="small">' + esc(k) + '</span>' + h.lv(r.rubric[k] || 0, true) + '<span class="tiny muted">' + (r.rubric[k] || '-') + '</span></div>'; }).join('') + '</div>'; }).join('') + '</div>' : '') +
        (AXP.OB && (j.mentorFeedback || []).length ? '<section class="card mt16"><h2>OB·YB 멘토 조언</h2>' + AXP.OB.feedbackHTML(j.mentorFeedback) + '<p class="tiny muted mt16">공개에 동의한 자료 리뷰입니다. 실무 수행이나 역량 수준을 인증하지 않습니다.</p></section>' : '') +
        '<details class="card mt16"><summary><b>전체 판단 타임라인 (' + j.logs.length + ')</b></summary><div class="mt16">' + AXP.timeline(j.logs) + '</div></details>' +
        '<p class="tiny muted mt24" style="text-align:center">AI가 점수나 합격을 정하지 않습니다. 판단의 근거와 확인 기록만 보여 줍니다. · AX Proof</p></div>';
    }).catch(function (e) { el.innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; });
  };
})();
