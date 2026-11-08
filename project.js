/* AX Proof · 프로젝트 워크스페이스
   링커슈:   직무 탐구 → 이슈 탐구 → 인터뷰 준비 → 실무자 인터뷰 → 인사이트 → AI 프로젝트 제안 → 발표·디펜스
   개인·팀:  인터뷰 준비 → 실무자 인터뷰(AI 실무자 / 실제 현직자) → 인사이트 → 주제 선정 → 기획안 → 수행 → 결과 보고·디펜스
   모든 단계의 행동은 판단 기록으로 자동 정리됩니다. 직무팀 프로젝트는 팀원마다 판단·디펜스가 따로 남습니다. */
(function () {
  var AXP = window.AXP, U = AXP.U, DB = AXP.DB, D = AXP.D, esc = U.esc, h = AXP.h;
  var ALL_STAGE_KEYS = Object.keys(AXP.STAGE_DEFS);
  // 링커슈 Ⅲ. AI 프로젝트 제안 (링커슈 보고서 양식)
  var PROPOSE = [
    ['problem', '문제 정의', '이슈 탐구와 실무자 인터뷰에서 도출한 문제 중, AI로 해결할 문제 하나를 정의'],
    ['overview', '프로젝트 개요 · 방향성과 핵심 아이디어', '프로젝트의 방향성과 핵심 아이디어'],
    ['how', '활용할 데이터 · AI 방식 · 핵심 기능과 사용 흐름', '데이터, AI 방식(생성형·분류·예측·자동화 등), 핵심 기능, 사용 흐름'],
    ['effect', '기대 효과', '해소되는 병목과 정성적·정량적 효과'],
    ['risk', '실현가능성 및 리스크', '데이터 확보, 기술 난이도, 현업 도입 장벽 등 제약과 검토할 사항']
  ];
  var LK_FINAL = [
    ['sum', '발표 요약', '무엇을 발견했고 어떤 AI 프로젝트를 제안했나'],
    ['slides', '발표 자료 링크', '구글 슬라이드·노션 등'],
    ['qna', '받은 질문과 내 답', '발표에서 받은 질문과 어떻게 답했는지'],
    ['learn', '배운 점과 다음에 할 것', '개인 프로젝트로 이어 갈 부분']
  ];
  var ISSUE_CRITERIA = ['해당 직무의 업무 방식이나 기업의 전략적 의사결정에 직접 영향을 미치는 이슈', '산업·시장 구조, 신기술, 정책 변화 등을 반영한 이슈', '개선 아이디어를 제안하거나 업무에 적용할 인사이트를 도출할 수 있는 이슈', '관련 뉴스 기사로 근거를 제시할 수 있는 이슈'];

  var PSECS = [
    ['bg', '문제와 배경', '인터뷰에서 확인한 문제와 그 근거'],
    ['goal', '목표와 성공 기준', '4주 뒤 무엇을 보면 성공인가 (숫자로)'],
    ['how', '해결 방안 (AI 활용 방식)', '어떤 AI를, 어떤 단계로, 어떻게 쓰고 어떻게 검증할 것인가'],
    ['alt', '검토한 대안과 선택 이유', '다른 방법과 그걸 고르지 않은 이유'],
    ['risk', '가정과 리스크', '틀릴 수 있는 가정, 개인정보 등 위험과 대응'],
    ['plan', '4주 일정', '1주차 ~ 4주차 마일스톤']
  ];
  var RSECS = [
    ['sum', '요약', '무엇을 했고 무엇이 달라졌나'],
    ['out', '결과물', '최종 결과물 설명 (링크는 아래에)'],
    ['diff', '계획 대비 달라진 점과 이유', '기획안과 실제가 달라진 곳'],
    ['verify', '검증 방법과 결과', 'AI 결과가 맞는지 어떻게 확인했나'],
    ['learn', '배운 점과 다음에 할 것', '']
  ];
  var FRAMES = [
    ['경험형', '최근에 ___ 했던 날을 처음부터 말씀해 주시겠어요?'],
    ['판단형', '그때 다른 선택지도 있었을 텐데, 왜 ___ 쪽으로 정하셨어요?'],
    ['수치형', '___ 는 일주일에 몇 번 / 몇 시간 정도 하세요?'],
    ['반례', '___ 방식이 통하지 않았던 때가 있었나요?'],
    ['제약', '___ 할 때 꼭 지켜야 하는 규칙이나 조건이 있나요?'],
    ['마무리', '제가 꼭 여쭤봤어야 하는데 안 여쭤본 게 있을까요?']
  ];
  var ISSUE_FRAME = ['이슈 검증', '기사에서는 ___ 라고 하던데, 현장에서는 실제로 어떻게 느끼세요?'];

  function data(p) { p.data = p.data || {}; ALL_STAGE_KEYS.forEach(function (k) { p.data[k] = p.data[k] || {}; }); return p.data; }
  function jobText(d) { var j = d.job || {}; return [j.roles, j.skills, j.future].filter(Boolean).join(' / '); }
  function issueText(d) { var i = d.issue || {}; return [i.keyword, i.define, i.background].filter(Boolean).join(' / '); }
  function transcript(p, c) {
    var t = data(p).talk;
    if (t.mode === 'real') return '[실제 인터뷰 메모]\n' + (t.realNotes || '') + '\n' + (t.qnotes || []).map(function (n, i) { return n ? 'Q' + (i + 1) + ' 메모: ' + n : ''; }).filter(Boolean).join('\n');
    return (t.turns || []).map(function (x) { return (x.role === 'assistant' ? c.persona.name + ': ' : '기획자: ') + x.content; }).join('\n');
  }
  AXP.projectTranscript = transcript;
  // 디펜스·피드백은 '내' 판단 기록으로 (팀 프로젝트에서도 본인 것만)
  function histText(p, uid) {
    return D.logsOf(uid || (D.me() || {}).id || p.userId, p.id).map(function (l, i) { return '#' + (i + 1) + ' [' + (AXP.STAGE_NAME[l.stage] || l.stage) + '·' + l.kind + '·' + l.source + (l.edited ? '·직접 수정' : '') + '] ' + l.text; }).join('\n').slice(-9000);
  }
  AXP.histText = histText;

  AXP.route('learner', '#/project/:id', function (el, prm) { workspace(el, prm.id, null); });
  AXP.route('learner', '#/project/:id/:stage', function (el, prm) { workspace(el, prm.id, prm.stage); });

  function workspace(el, id, stageKey) {
    var p = DB.get('projects', id);
    if (!p) { el.innerHTML = h.empty('프로젝트를 찾을 수 없어요.'); return; }
    // 직무팀 프로젝트는 열 때마다 서버 최신본을 받아 팀원이 고친 내용을 반영
    if (AXP.Mode.server && AXP.isTeamProject(p) && !el.__fresh) {
      el.__fresh = true;
      el.innerHTML = '<p class="muted">팀의 최신 내용을 불러오는 중…</p>';
      Promise.all([AXP.api('api/store?col=projects&id=' + encodeURIComponent(id)), AXP.api('api/store?col=logs')]).then(function (r) {
        var list = DB.data.projects, k = list.findIndex(function (x) { return x.id === id; }); if (k >= 0) list[k] = r[0].data;
        DB.data.logs = r[1].data;
      }).catch(function () { }).then(function () { workspace(el, id, stageKey); el.__fresh = false; });
      return;
    }
    var STAGES = AXP.stagesFor(p), ORDER = STAGES.map(function (s) { return s.key; });
    var kind = AXP.kindOf(p), KI = AXP.KINDS_INFO[kind], team = AXP.isTeamProject(p);
    var c = D.case(p.caseId), d = data(p), cohort = D.cohort(), me = D.me();
    var stage = stageKey && ORDER.indexOf(stageKey) >= 0 ? stageKey : (ORDER.indexOf(p.stage) >= 0 ? p.stage : ORDER[0]);
    if (ORDER.indexOf(stage) > (p.reached || 0)) stage = ORDER[p.reached || 0];
    var idx = ORDER.indexOf(stage);
    var mineF = AXP.finalOf(p, me.id);
    var lvKey = p.transfer ? 'solo' : (D.program().preceptor.stageMap[stage] || 'together');
    // 저장할 때는 '바뀐 단계'만 표시해서 보냄 → 팀원이 다른 단계를 고쳐도 덮어쓰지 않음
    var snap = {}; ALL_STAGE_KEYS.forEach(function (k) { snap[k] = JSON.stringify(d[k] || {}); });
    function touched() { var t = ALL_STAGE_KEYS.filter(function (k) { return JSON.stringify(d[k] || {}) !== snap[k]; }); t.forEach(function (k) { snap[k] = JSON.stringify(d[k] || {}); }); return t; }
    function persist() { p.updatedAt = U.now(); p._touch = touched(); return DB.put('projects', p).then(function (x) { delete p._touch; p.createdAt = x.createdAt; p.updatedAt = x.updatedAt; return p; }); }
    var saveSoon = U.debounce(function () { persist(); }, 700);
    function advance(next) {
      var ni = ORDER.indexOf(next);
      p.stage = next; p.reached = Math.max(p.reached || 0, ni);
      return persist().then(function () { AXP.go('#/project/' + p.id + '/' + next); });
    }
    var teamObj = p.teamId ? D.team(p.teamId) : null;
    var sub = '<span class="badge ' + KI.badge + '">' + esc(KI.name) + '</span> ' + (team ? '<span class="badge violet">' + esc(teamObj ? teamObj.name : '팀') + ' · ' + (p.members || []).map(function (m) { return esc(D.user(m).name); }).join(', ') + '</span> ' : '') +
      esc(c.company) + ' · ' + esc(c.persona.title) + ' ' + esc(c.persona.name) + ' · ' + (p.transfer ? '<span class="badge violet">전이 검증 미션 · 코칭 없음</span>' : (d.talk.mode === 'real' ? '<span class="badge green">실제 현직자 인터뷰</span>' : '<span class="badge gold">AI 실무자 인터뷰</span>'));

    el.innerHTML = h.head(p.title, sub,
      (kind === 'linkushu' ? '<button class="btn ghost sm" id="lkReport">링커슈 보고서 보기</button>' : '') + '<a class="btn ghost sm" href="#/log">판단 기록 전체</a>', '<a href="#/projects">내 프로젝트</a> › ' + esc(c.title)) +
      '<div class="stepper no-print">' + STAGES.map(function (s, i) {
        var cls = s.key === stage ? 'on' : i <= (p.reached || 0) ? 'done' : '';
        return '<button data-step="' + s.key + '" class="' + cls + '"' + (i > (p.reached || 0) ? ' disabled' : '') + '><span class="n">' + (i + 1) + '</span>' + s.name + '</button>';
      }).join('') + '</div>' +
      '<div class="card soft mt12 no-print"><div class="row between"><div class="small"><b>프리셉터 단계</b> <span class="muted">· AI 사수가 이 단계에서 개입하는 정도</span></div><span class="small muted">' + esc(AXP.levelOf({ level: lvKey }).desc) + '</span></div><div class="mt8">' + h.precept(lvKey) + '</div></div>' +
      '<div class="grid g-main mt16"><div id="stageBox" class="stack-lg"></div><div class="panel no-print" id="panelBox"></div></div>';
    U.$$('[data-step]', el).forEach(function (b) { b.onclick = function () { AXP.go('#/project/' + p.id + '/' + b.getAttribute('data-step')); }; });

    var lkb = U.$('#lkReport', el); if (lkb) lkb.onclick = function () { AXP.linkushuReportModal(p); };
    var box = U.$('#stageBox', el);
    var R = { job: job, issue: issue, prep: prep, talk: talk, insight: insight, topic: topic, propose: propose, plan: plan, run: run, final: fin };
    R[stage]();
    panel();
    function nextOf(k) { return ORDER[ORDER.indexOf(k) + 1]; }

    /* ---------- 오른쪽 패널: AI 사수 · 업무용 AI · 판단 기록 ---------- */
    function panel(tab) {
      var pb = U.$('#panelBox', el);
      if (AXP.inDefense(p, me.id)) { pb.innerHTML = '<div class="card"><h3>디펜스 진행 중</h3><p class="muted mt8">AI 사수와 업무용 AI가 꺼져 있어요. 내 기록과 내 말로 답하세요.</p></div>'; return; }
      tab = tab || (stage === 'plan' || stage === 'run' || stage === 'propose' ? 'work' : 'mentor');
      pb.innerHTML = '<div class="panel-tabs"><button data-tab="mentor">AI 사수</button><button data-tab="work">업무용 AI</button><button data-tab="log">' + (team ? '팀 기록' : '판단 기록') + '</button></div><div class="card" style="flex:1;min-height:0" id="panelBody"></div>';
      U.$$('[data-tab]', pb).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-tab') === tab); b.onclick = function () { panel(b.getAttribute('data-tab')); }; });
      var body = U.$('#panelBody', pb);
      if (tab === 'log') {
        var logs = team ? DB.where('logs', function (l) { return l.projectId === p.id; }).sort(function (a, b) { return (a.createdAt || '').localeCompare(b.createdAt || ''); }) : D.logsOf(me.id, p.id);
        body.style.overflowY = 'auto';
        var contrib = team ? '<div class="table-wrap mt12"><table class="t compact"><thead><tr><th>팀원</th>' + AXP.KINDS.map(function (k) { return '<th title="' + esc(k) + '">' + esc(k.split(' ')[0].slice(0, 2)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          (p.members || []).map(function (m) { return '<tr><td style="white-space:nowrap"><b>' + esc(D.user(m).name) + '</b></td>' + AXP.KINDS.map(function (k) { var n = logs.filter(function (l) { return l.userId === m && l.kind === k; }).length; return '<td>' + (n ? '<span class="badge green">' + n + '</span>' : '<span class="muted">-</span>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '';
        body.innerHTML = '<div class="row between"><h3>' + (team ? '팀 판단 기록 · 기여' : '이 프로젝트의 판단 기록') + '</h3><span class="badge green">' + logs.length + '개</span></div><p class="small muted mt8">' + (team ? '같은 프로젝트라도 판단은 팀원마다 따로 남아요. 내 기록만 고칠 수 있어요.' : '따로 쓰지 않아도 일한 흔적이 자동으로 쌓여요. 틀린 내용은 고칠 수 있고, 고친 기록엔 "직접 수정"이 표시돼요.') + '</p>' + contrib +
          '<div class="mt12">' + AXP.timeline(logs.slice().reverse(), { editable: true, author: team, me: me.id }) + '</div>';
        AXP.bindTimeline(body, function () { panel('log'); });
        return;
      }
      var chats = DB.where('chats', function (x) { return x.projectId === p.id && x.mode === tab; }).sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); });
      AXP.Chat.mount(body, {
        chatId: chats[0] && (Date.now() - new Date(chats[0].updatedAt || 0)) < 864e5 * 2 ? chats[0].id : null, mode: tab, projectId: p.id, compact: true,
        insertTargets: function () { return stage === 'plan' ? PSECS.map(function (s) { return [s[0], '기획안 · ' + s[1]]; }) : stage === 'propose' ? PROPOSE.map(function (s) { return [s[0], '제안 · ' + s[1]]; }) : stage === 'run' ? [['wOut', (d.run.week || 1) + '주차 결과물']] : stage === 'final' ? finalSecs().map(function (s) { return [s[0], '보고서 · ' + s[1]]; }) : []; },
        onInsert: function (key, text) {
          if (stage === 'plan' || stage === 'propose') { var sp = d[stage]; sp.secs = sp.secs || {}; sp.secs[key] = (sp.secs[key] ? sp.secs[key] + '\n' : '') + text; sp.aiInserts = (sp.aiInserts || []).concat([{ sec: key, text: text }]); var ta = U.$('#pl-' + key, el); if (ta) ta.value = sp.secs[key]; }
          if (stage === 'run') { var w = wk(); w.out = (w.out ? w.out + '\n' : '') + text; w.ai = (w.ai || []).concat([text]); var o = U.$('#wOut', el); if (o) o.value = w.out; }
          if (stage === 'final') { d.final.report = d.final.report || {}; d.final.report[key] = (d.final.report[key] ? d.final.report[key] + '\n' : '') + text; d.final.aiInserts = (d.final.aiInserts || []).concat([{ sec: key, text: text }]); var r = U.$('#rp-' + key, el); if (r) r.value = d.final.report[key]; }
          persist(); AXP.toast('문서에 넣었어요. 고쳐서 쓰면 수정 여부가 기록돼요');
        },
        onLog: function () { }
      });
    }

    /* ---------- 공용: 멘토 코멘트 답하기 ---------- */
    function mentorBox(target, title, comments, stageName) {
      target.innerHTML = '<div class="coach"><b>◎ ' + esc(title) + '</b>' + comments.map(function (cm, i) {
        return '<div class="cmt">' + (cm.target || cm.quote ? '<div class="tiny muted">' + esc(cm.target || '') + (cm.quote ? ' · "' + esc(cm.quote) + '"' : '') + '</div>' : '') + '<p>' + esc(cm.comment) + '</p>' + (cm.source ? '<p class="tiny muted">인터뷰에서: "' + esc(cm.source) + '"</p>' : '') +
          (cm.reply ? '<div class="tip good">내 답 · ' + esc(cm.reply) + '</div>' : '<textarea rows="2" class="mt8" data-rep="' + i + '" placeholder="답하거나, 위 내용을 고친 뒤 무엇을 바꿨는지 적어 주세요 (붙여넣기 불가)"></textarea><div class="row end mt8"><button class="btn sm" data-send="' + i + '">답하기</button></div>') + '</div>';
      }).join('') + '</div>';
      U.$$('[data-rep]', target).forEach(function (ta) { ta.addEventListener('paste', function (e) { e.preventDefault(); AXP.toast('멘토 질문에는 직접 입력해 주세요'); }); });
      U.$$('[data-send]', target).forEach(function (b) {
        b.onclick = function () {
          var i = Number(b.getAttribute('data-send')), v = U.$('[data-rep="' + i + '"]', target).value.trim(); if (!v) return;
          comments[i].reply = v; comments[i].repliedAt = U.now();
          D.addLog({ projectId: p.id, stage: stageName, kind: '대안 선택', source: '멘토 대화', text: '사수: ' + comments[i].comment + '\n나: ' + v });
          persist().then(function () { mentorBox(target, title, comments, stageName); AXP.toast('답한 내용이 판단 기록에 남았어요'); });
        };
      });
    }

    /* ================= 1. 인터뷰 준비 ================= */
    function prep() {
      var s = d.prep; s.questions = s.questions && s.questions.length ? s.questions : ['', '', ''];
      var kb = DB.where('knowledge', function (k) { return (k.caseIds || []).indexOf(c.id) >= 0 && (k.status === '승인' || k.status === '자동 반영'); });
      var arc = DB.where('archive', function (a) { return a.useInKB && a.type !== '세션 자료'; }).slice(0, 3);
      var frames = kind === 'linkushu' ? FRAMES.slice(0, 1).concat([ISSUE_FRAME]).concat(FRAMES.slice(1)) : FRAMES;
      var lkBox = kind === 'linkushu' ? '<div class="note blue"><b>인터뷰 전에 조사한 것</b> — 이미 아는 건 묻지 말고, 현장에서 <b>확인</b>할 거리로 바꾸세요.<div class="small mt8"><b>직무 탐구</b> · ' + esc(U.short(jobText(d), 160) || '(비어 있음)') + '</div><div class="small mt8"><b>선정한 이슈</b> · ' + esc(d.issue.keyword || '(비어 있음)') + '</div>' + ((d.issue.verify || []).length ? '<div class="small mt8"><b>인터뷰에서 확인할 주제</b> · ' + esc(d.issue.verify.join(' / ')) + '</div>' : '') + '</div>' : '';
      box.innerHTML = lkBox +
        '<div class="card"><div class="card-head"><div><span class="badge gold">CASE · ' + esc(c.source) + '</span><h2 class="mt8">' + esc(c.title) + '</h2></div></div>' +
        '<dl class="kv"><dt>회사</dt><dd>' + esc(c.company) + ' · ' + esc(c.industry) + '</dd><dt>인터뷰 대상</dt><dd>' + esc(c.persona.title) + ' ' + esc(c.persona.name) + ' (' + esc(c.persona.career) + ')</dd><dt>할 일</dt><dd>' + (kind === 'linkushu' ? '조사한 직무·이슈를 현장에서 확인하고, 반복·소모·비효율이 있는 곳에서 AI로 풀 문제를 찾아 제안해요.' : '현장을 이해하고, 반복·소모·비효율이 있는 곳을 찾아 4주 동안 수행할 AI 프로젝트 주제를 정해요.') + '</dd></dl></div>' +
        '<div class="card"><h2>1. 왜 이 인터뷰를 하나요?</h2><p class="muted small mt8">목적 없이 묻는 인터뷰는 인터넷 검색과 다를 바 없어요. 끝났을 때 무엇을 <b>알게 되고</b>, 그래서 무엇을 <b>결정할 수 있는지</b> 적어 보세요.</p>' +
        '<textarea id="pGoal" rows="3" class="mt12" placeholder="이 인터뷰가 끝나면 나는 ___을 알게 되고, 그래서 ___을 결정할 수 있다">' + esc(s.goal || '') + '</textarea></div>' +
        '<div class="card"><h2>2. 사전 리서치 — 검색으로 알 수 있는 건 먼저</h2><p class="muted small mt8">회사 규모·사업·직무 소개처럼 검색과 채용공고로 알 수 있는 건 여기서 정리하고, 인터뷰 시간은 이분만 답할 수 있는 <b>경험과 판단</b>에 쓰세요.</p>' +
        (kb.length || arc.length ? '<div class="note blue mt12"><b>플랫폼 지식 베이스에서 찾은 자료</b><ul style="margin:6px 0 0;padding-left:18px">' + kb.map(function (k) { return '<li>(' + esc(k.sourceType) + ') ' + esc(k.title) + ' — 업무: ' + esc((k.extracted.tasks || []).join(', ')) + '</li>'; }).join('') + arc.map(function (a) { return '<li>(' + esc(a.type) + ') <a href="#/library">' + esc(a.title) + '</a></li>'; }).join('') + '</ul></div>' : '') +
        '<textarea id="pResearch" rows="4" class="mt12" placeholder="예: 채용공고에서 이 직무의 주요 업무는 CS 운영·VOC 분석·리포팅으로 나옴">' + esc(s.research || '') + '</textarea></div>' +
        '<div class="card"><div class="card-head"><div><h2>3. 질문지</h2><p>직접 질문을 쓰거나, 목표와 조사 내용을 바탕으로 AI와 초안을 만들어 보세요.</p></div><span class="badge" id="qCount">' + s.questions.filter(function (q) { return q.trim(); }).length + '개</span></div>' +
        '<div class="note small"><span data-ai-status class="badge ' + AXP.AI.label().cls + '">' + esc(AXP.AI.label().text) + '</span> 질문 초안·검토를 포함한 모든 AI 도구가 같은 연결을 사용해요.</div>' +
        '<div class="row mt12"><button class="btn soft sm" id="generateQ">AI로 질문 초안 생성</button><span class="tiny muted">기존 질문은 그대로 두고, 필요한 질문만 골라 추가해요.</span></div><div id="qDraftNotice" class="mt8" aria-live="polite"></div><div id="qDraft" class="mt12"></div>' +
        '<p class="tiny muted mt16">직접 시작하고 싶다면 아래 기본 질문 틀을 활용하세요.</p>' +
        '<div class="chips">' + frames.map(function (f, i) { return '<button class="chip" data-frame="' + i + '" title="' + esc(f[1]) + '">+ ' + f[0] + '</button>'; }).join('') + '</div>' +
        '<div id="qList" class="stack mt12"></div><div class="row mt12"><button class="btn ghost sm" id="addQ">+ 질문 추가</button><button class="btn soft sm" id="reviewQ">코치에게 질문지 검토받기</button></div><div id="qCoach" class="mt12"></div></div>' +
        '<div class="card"><h2>4. 인터뷰 방식</h2><p class="muted small mt8">AI 실무자와 먼저 연습하고, 현직자를 실제로 만나도 좋아요. 두 방식 모두 같은 흐름으로 이어져요.</p>' +
        '<div class="grid g2 mt12"><button class="item click" data-mode="virtual" style="text-align:left"><h3>AI 실무자 인터뷰</h3><p class="small muted">' + esc(c.persona.name) + ' ' + esc(c.persona.title) + '(가상)와 바로 대화해요. 물은 것에만 답하고, 중요한 정보는 제대로 물어야 나와요.</p></button>' +
        '<button class="item click" data-mode="real" style="text-align:left"><h3>실제 현직자 인터뷰</h3><p class="small muted">멘토 DB에서 현직자에게 컨택을 요청하고, 인터뷰 메모를 올려 같은 흐름으로 이어가요.</p></button></div>' +
        '<div class="row end mt16"><button class="btn" id="toTalk">인터뷰 시작 →</button></div></div>';
      var mode = d.talk.mode || 'virtual';
      function markMode() { U.$$('[data-mode]', box).forEach(function (b) { b.style.borderColor = b.getAttribute('data-mode') === mode ? 'var(--brand)' : ''; b.style.background = b.getAttribute('data-mode') === mode ? 'var(--brand-soft-2)' : ''; }); }
      markMode();
      U.$$('[data-mode]', box).forEach(function (b) { b.onclick = function () { mode = b.getAttribute('data-mode'); markMode(); }; });
      U.$('#pGoal', box).oninput = function (e) { s.goal = e.target.value; saveSoon(); };
      U.$('#pResearch', box).oninput = function (e) { s.research = e.target.value; saveSoon(); };
      function renderQs() {
        var tips = s.tips || [];
        U.$('#qCount', box).textContent = s.questions.filter(function (q) { return q.trim(); }).length + '개';
        U.$('#qList', box).innerHTML = s.questions.map(function (q, i) {
          var t = tips.find(function (x) { return Number(x.i) === i; });
          var good = t && /경험형|판단형|수치형|이슈검증형/.test(t.type) && !t.searchable;
          return '<div><div class="row" style="flex-wrap:nowrap"><span class="muted small" style="width:18px">' + (i + 1) + '</span><input type="text" data-q="' + i + '" value="' + esc(q) + '" placeholder="' + (i === 0 ? '예: 최근에 가장 바빴던 하루를 처음부터 말씀해 주시겠어요?' : '질문') + '"><button class="btn ghost sm" data-delq="' + i + '" aria-label="삭제">×</button></div>' +
            (t ? '<div class="tip ' + (t.searchable ? 'bad' : good ? 'good' : 'warn') + '" style="margin-left:26px"><b>[' + esc(t.area || '') + ' · ' + esc(t.type || '') + (t.searchable ? ' · 검색 가능' : '') + ']</b> ' + esc(t.tip || '') + '</div>' : '') + '</div>';
        }).join('');
        U.$$('[data-q]', box).forEach(function (inp) { inp.oninput = function () { s.questions[Number(inp.getAttribute('data-q'))] = inp.value; saveSoon(); }; });
        U.$$('[data-delq]', box).forEach(function (b) { b.onclick = function () { s.questions.splice(Number(b.getAttribute('data-delq')), 1); if (!s.questions.length) s.questions.push(''); s.tips = null; renderQs(); saveSoon(); }; });
      }
      renderQs();
      function questionContext() { return { projectId: p.id, case: c, goal: s.goal, research: s.research, questions: s.questions.slice(), job: kind === 'linkushu' ? jobText(d) : '', issue: kind === 'linkushu' ? issueText(d) : '' }; }
      function renderDraft() {
        var draft = s.aiQuestionDraft, dest = U.$('#qDraft', box);
        if (!draft) { dest.innerHTML = ''; return; }
        var live = draft._ai && draft._ai.mode === 'model';
        dest.innerHTML = '<div class="coach"><div class="row between"><b>질문 초안</b><span class="badge ' + (live ? 'green' : 'gold') + '">' + (live ? '실제 AI 생성' : '데모 예시') + '</span></div>' +
          '<p class="small mt8">' + esc(draft.note) + '</p><p class="tiny muted">생성에 사용한 목표: ' + esc(draft.goal || '') + '</p><div class="stack mt12">' + draft.items.map(function (q, i) {
            return '<div class="item"><label class="row" style="align-items:flex-start"><input type="checkbox" data-draft-q="' + i + '" style="width:auto;margin-top:4px"' + (q.applied ? ' disabled' : '') + '><span><b>' + esc(q.question) + '</b>' + (q.applied ? ' <span class="badge">추가됨</span>' : '') + '<span class="tiny muted"> · ' + esc(q.area) + '</span></span></label><p class="small mt8">확인하려는 것: ' + esc(q.why) + '</p><p class="tiny muted">후속 질문: ' + esc(q.followup) + '</p></div>';
          }).join('') + '</div><label class="lb mt12" for="qDraftReason">이 질문들을 고른 이유</label><textarea id="qDraftReason" rows="2" placeholder="예: 실제로 시간을 많이 쓰는 업무와 개인정보 제약을 먼저 확인해야 주제를 정할 수 있어서">' + esc(s.aiQuestionReason || '') + '</textarea><p class="tiny muted mt8">초안 자체는 내 판단으로 기록하지 않아요. 직접 고른 이유를 판단 기록에 남겨요.</p><button class="btn sm mt8" id="applyDraftQ">선택한 질문 추가 · 판단 기록 남기기</button></div>';
        U.$('#qDraftReason', dest).oninput = function () { s.aiQuestionReason = this.value; saveSoon(); };
        U.$('#applyDraftQ', dest).onclick = function () {
          var selected = U.$$('[data-draft-q]', dest).filter(function (el) { return el.checked && !el.disabled; }).map(function (el) { return draft.items[Number(el.getAttribute('data-draft-q'))]; });
          if (!selected.length) return AXP.toast('추가할 질문을 먼저 골라 주세요', true);
          var reason = U.$('#qDraftReason', dest).value.trim();
          if (!reason) { U.$('#qDraftReason', dest).focus(); return AXP.toast('질문을 고른 이유를 적어 주세요', true); }
          var unique = selected.filter(function (q) { return !s.questions.some(function (old) { return old.replace(/\s/g, '') === q.question.replace(/\s/g, ''); }); });
          if (!unique.length) return AXP.toast('이미 질문지에 있는 질문이에요', true);
          var b = this; b.disabled = true;
          return D.addLog({ projectId: p.id, stage: 'prep', kind: '문제 정의', source: 'AI 질문 초안 선택', action: '쓴다', text: '질문 초안 중 ' + unique.length + '개를 선택했습니다.\n내 선택 이유: ' + reason, aiMessage: unique.map(function (q) { return q.question; }).join('\n') }).then(function () {
            unique.forEach(function (q) { var empty = s.questions.findIndex(function (old) { return !old.trim(); }); if (empty >= 0) s.questions[empty] = q.question; else s.questions.push(q.question); q.applied = true; });
            s.aiQuestionReason = ''; s.tips = null; s.review = null; s.reviewSnap = null;
            return persist();
          })
            .then(function () { renderQs(); renderDraft(); U.$('#qCoach', box).innerHTML = ''; AXP.toast('질문지에 추가하고 선택 이유를 기록했어요'); })
            .catch(function (e) { s.aiQuestionReason = reason; renderQs(); renderDraft(); AXP.toast(e.message, true); });
        };
      }
      renderDraft();
      U.$('#generateQ', box).onclick = function () {
        if (!s.goal || !s.goal.trim()) { U.$('#pGoal', box).focus(); return AXP.toast('질문 초안에 사용할 인터뷰 목표를 먼저 적어 주세요', true); }
        var b = this, ctx = questionContext(); b.disabled = true;
        U.$('#qDraftNotice', box).innerHTML = '<p class="muted small">목표와 조사 내용을 바탕으로 질문을 만들고 있어요…</p>';
        return AXP.AI.run('q_generate', ctx).then(function (r) {
          s.aiQuestionDraft = Object.assign({}, r, { goal: ctx.goal });
          return persist().then(function () { renderDraft(); U.$('#qDraftNotice', box).innerHTML = ''; });
        }).catch(function (e) { U.$('#qDraftNotice', box).innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; }).then(function () { b.disabled = false; });
      };
      if (s.review) coachOut(s.review);
      U.$$('[data-frame]', box).forEach(function (b) { b.onclick = function () { var f = frames[Number(b.getAttribute('data-frame'))]; var empty = s.questions.findIndex(function (q) { return !q.trim(); }); if (empty >= 0) s.questions[empty] = f[1]; else s.questions.push(f[1]); renderQs(); saveSoon(); var inp = U.$('[data-q="' + (empty >= 0 ? empty : s.questions.length - 1) + '"]', box); inp.focus(); inp.setSelectionRange(inp.value.indexOf('___'), inp.value.indexOf('___') + 3); }; });
      U.$('#addQ', box).onclick = function () { s.questions.push(''); renderQs(); };
      function coachOut(r) {
        U.$('#qCoach', box).innerHTML = '<div class="coach"><b>◎ 인터뷰 코치</b><p>' + esc(r.goal || '') + '</p>' + ((r.missing || []).length ? '<p class="mt8">아직 다루지 않은 영역: <b>' + esc(r.missing.join(', ')) + '</b>. 과제를 정하려면 이쪽도 들어 두면 좋아요.</p>' : '<p class="mt8">영역이 고르게 들어 있어요.</p>') +
          '<p class="tiny muted mt8">검색·조사로 알 수 있음 ' + (r.items || []).filter(function (x) { return x.searchable; }).length + '개 · 좋은 질문(경험·판단·수치) ' + (r.items || []).filter(function (x) { return /경험형|판단형|수치형|이슈검증형/.test(x.type) && !x.searchable; }).length + '개</p></div>';
      }
      U.$('#reviewQ', box).onclick = function () {
        var qs = s.questions.filter(function (q) { return q.trim(); }); if (!qs.length) return AXP.toast('질문을 먼저 적어 주세요', true);
        var b = this; b.disabled = true; U.$('#qCoach', box).innerHTML = '<p class="muted small">코치가 질문지를 보고 있어요…</p>';
        AXP.AI.run('q_review', questionContext()).then(function (r) {
          s.tips = r.items || []; s.review = r; s.reviewSnap = s.questions.slice(); s.reviewCount = (s.reviewCount || 0) + 1; renderQs(); coachOut(r); persist();
        }).catch(function (e) { U.$('#qCoach', box).innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; }).then(function () { b.disabled = false; });
      };
      U.$('#toTalk', box).onclick = function () {
        var qs = s.questions.filter(function (q) { return q.trim(); });
        if (!s.goal || !s.goal.trim()) { U.$('#pGoal', box).focus(); return AXP.toast('인터뷰 목적을 먼저 적어 주세요', true); }
        if (!qs.length) return AXP.toast('질문을 하나 이상 준비해 주세요', true);
        var txt = '인터뷰 목표: ' + s.goal.trim() + '\n질문 ' + qs.length + '개 준비';
        if (s.reviewSnap) {
          var changed = s.questions.filter(function (q, i) { return (s.reviewSnap[i] || '').trim() && q.trim() !== (s.reviewSnap[i] || '').trim(); }).length;
          var searchable = (s.tips || []).filter(function (t) { return t.searchable; }).length;
          txt += '. 코치 검토 뒤 ' + changed + '개를 고침' + (searchable ? ' (검색 가능 질문 ' + searchable + '개 지적받음)' : '') + '.';
        } else txt += '. 코치 검토 없이 시작.';
        if (s.research && s.research.trim()) txt += '\n사전 리서치: ' + U.short(s.research.trim(), 120);
        d.talk.mode = mode; d.talk.turns = d.talk.turns || [{ role: 'assistant', content: c.persona.greeting }];
        D.addLog({ projectId: p.id, stage: 'prep', kind: '문제 정의', source: '문서 작성', text: txt });
        advance('talk');
      };
    }

    /* ================= 2. 인터뷰 ================= */
    function talk() {
      var t = d.talk; t.mode = t.mode || 'virtual'; t.hit = t.hit || []; t.turns = t.turns || [{ role: 'assistant', content: c.persona.greeting }];
      var maxQ = (cohort && cohort.policy && cohort.policy.maxInterviewQuestions) || 15;
      var used = t.turns.filter(function (x) { return x.role === 'user'; }).length;
      var qs = (d.prep.questions || []).filter(function (q) { return q.trim(); });
      var head = '<div class="card"><div class="row between"><div class="seg"><button data-tm="virtual" aria-pressed="' + (t.mode === 'virtual') + '">AI 실무자 인터뷰</button><button data-tm="real" aria-pressed="' + (t.mode === 'real') + '">실제 현직자 인터뷰</button></div>' +
        '<button class="btn" id="toInsight">인터뷰 마치기 →</button></div></div>';
      if (t.mode === 'virtual') {
        box.innerHTML = head + '<div class="card"><div class="chat-top"><div class="persona-card"><div class="av gold">' + esc(c.persona.name.slice(-2)) + '</div><div><b>' + esc(c.persona.name) + ' ' + esc(c.persona.title) + ' <span class="badge gold">AI 실무자 · 가상</span></b><span>' + esc(c.company) + ' · ' + esc(c.persona.career) + '</span></div></div><span class="badge" id="qLeft">남은 질문 ' + (maxQ - used) + '</span></div>' +
          '<div class="chat-log" id="pLog" style="max-height:460px"></div><form class="composer mt12" id="askForm"><textarea rows="1" id="askQ" placeholder="질문하기 (Enter 전송)" aria-label="질문"></textarea><button class="btn" type="submit" id="askBtn">보내기</button></form></div>' +
          '<div class="grid g2"><div class="card"><h3>인터뷰 코치 · 다룬 영역</h3><div class="areas mt12" id="areas"></div><p class="small mt12" id="nudge"></p></div>' +
          '<div class="card"><h3>내 질문지</h3><p class="tiny muted">누르면 입력창에 들어가요</p><div class="stack mt8">' + qs.map(function (q, i) { return '<button class="item click small" style="text-align:left;padding:8px 12px" data-useq="' + i + '">' + esc(q) + '</button>'; }).join('') + '</div></div></div>' +
          '<div class="card"><label class="lb" for="memo">인터뷰 메모 <span class="hint">나만 보는 메모</span></label><textarea id="memo" rows="3">' + esc(t.memo || '') + '</textarea></div>';
        var log = U.$('#pLog', box);
        function bubbles() {
          log.innerHTML = t.turns.map(function (x) { return x.role === 'assistant' ? '<div class="msg ai persona"><span class="who">' + esc(c.persona.name) + ' ' + esc(c.persona.title) + '</span>' + esc(x.content) + '</div>' : '<div class="msg me"><span class="who">나</span>' + esc(x.content) + '</div>'; }).join('');
          log.scrollTop = log.scrollHeight;
        }
        function areas() {
          U.$('#areas', box).innerHTML = AXP.AREAS.map(function (a) { return '<span class="area' + (t.hit.indexOf(a) >= 0 ? ' hit' : '') + '">' + a + '</span>'; }).join('');
          var n = t.turns.filter(function (x) { return x.role === 'user'; }).length, miss = AXP.AREAS.filter(function (a) { return t.hit.indexOf(a) < 0; });
          U.$('#nudge', box).textContent = n >= 4 && miss.length ? '아직 묻지 않은 영역: ' + miss.slice(0, 2).join(', ') + '. 과제를 정하려면 이쪽도 들어 두면 좋아요.' : n === 0 ? '질문지 순서대로 시작해도 되고, 대화 흐름을 따라가도 괜찮아요.' : '흥미로운 이야기가 나오면 "예를 들면요?", "그때 왜 그렇게 하셨어요?"로 더 파고들어 보세요.';
        }
        bubbles(); areas();
        var ta = U.$('#askQ', box);
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); U.$('#askForm', box).requestSubmit(); } });
        U.$$('[data-useq]', box).forEach(function (b) { b.onclick = function () { ta.value = qs[Number(b.getAttribute('data-useq'))]; ta.focus(); }; });
        U.$('#memo', box).oninput = function (e) { t.memo = e.target.value; saveSoon(); };
        var busy = false;
        U.$('#askForm', box).onsubmit = function (e) {
          e.preventDefault();
          var q = ta.value.trim(); var n = t.turns.filter(function (x) { return x.role === 'user'; }).length;
          if (!q || busy) return; if (n >= maxQ) return AXP.toast('질문 수를 다 썼어요. 인터뷰를 마치고 정리해 보세요', true);
          busy = true; ta.value = ''; t.turns.push({ role: 'user', content: q }); bubbles();
          log.insertAdjacentHTML('beforeend', '<div class="msg ai persona" id="pend"><span class="typing"><i></i><i></i><i></i></span></div>'); log.scrollTop = log.scrollHeight;
          AXP.AI.run('persona', { case: c, messages: t.turns.map(function (x) { return { role: x.role, content: x.content }; }) }).then(function (r) {
            var reply = String((r && r.reply) || (typeof r === 'string' ? r : '') || '음, 다시 한번 물어봐 주실래요?').trim();
            t.turns.push({ role: 'assistant', content: reply });
            ((r && r.areas) || []).forEach(function (a) { if (AXP.AREAS.indexOf(a) >= 0 && t.hit.indexOf(a) < 0) t.hit.push(a); });
            persist();
          }).catch(function (err) { t.turns.pop(); AXP.toast(err.message, true); }).then(function () {
            busy = false; bubbles(); areas(); U.$('#qLeft', box).textContent = '남은 질문 ' + (maxQ - t.turns.filter(function (x) { return x.role === 'user'; }).length); ta.focus();
          });
        };
      } else {
        var contacts = DB.where('contacts', function (x) { return x.projectId === p.id; });
        t.qnotes = t.qnotes || [];
        box.innerHTML = head +
          '<div class="card"><h2>① 현직자 컨택</h2><p class="muted small mt8">멘토 DB에서 이 주제에 맞는 현직자에게 30분 인터뷰를 요청해요. 요청 메시지는 AI 사수가 점검해 줘요.</p>' +
          (contacts.length ? contacts.map(function (x) { var m = DB.get('mentors', x.mentorId) || {}; return '<div class="item mt12"><div class="row between"><b>' + esc(m.name || '') + ' · ' + esc(m.role || '') + ' (' + esc(m.company || '') + ')</b><span class="badge ' + (x.status === '완료' || x.status === '수락' ? 'green' : x.status === '거절' ? 'red' : 'gold') + '">' + esc(x.status) + '</span></div>' + (x.schedule ? '<p class="small muted">일정 ' + esc(x.schedule) + '</p>' : '') + '</div>'; }).join('') : '') +
          '<div class="row mt12"><a class="btn ghost sm" href="#/contact?project=' + esc(p.id) + '">멘토 DB에서 컨택 요청하기</a></div></div>' +
          '<div class="card"><h2>② 인터뷰 진행 가이드</h2><p class="muted small mt8">질문마다 들은 내용을 짧게 적어 두세요. 대화 중 새로 떠오른 질문도 적어요.</p><div class="stack mt12">' +
          qs.map(function (q, i) { return '<div><div class="small"><b>Q' + (i + 1) + '.</b> ' + esc(q) + '</div><input type="text" class="mt8" data-qn="' + i + '" value="' + esc(t.qnotes[i] || '') + '" placeholder="들은 내용 메모"></div>'; }).join('') + '</div></div>' +
          '<div class="card"><h2>③ 인터뷰 메모 · 녹취 요약</h2><p class="muted small mt8">녹취를 AI로 요약했다면 그대로 붙여넣어도 돼요. 실무자의 말은 따옴표로 남겨 두면 인사이트 정리에서 근거로 쓰여요.</p>' +
          '<textarea id="realNotes" rows="8" class="mt12">' + esc(t.realNotes || '') + '</textarea>' +
          '<label class="lb mt12">이번 인터뷰에서 다룬 영역</label><div class="chips">' + AXP.AREAS.map(function (a) { return '<button class="chip" data-ar="' + esc(a) + '" aria-pressed="' + (t.hit.indexOf(a) >= 0) + '">' + a + '</button>'; }).join('') + '</div>' +
          '<label class="check mt16"><input type="checkbox" id="consent"' + (t.consent ? ' checked' : '') + '> 현직자에게 인터뷰 내용을 익명화해 링커스 지식 베이스(AI 실무자·Case 제작)에 활용하는 데 동의를 받았어요</label></div>';
        U.$$('[data-qn]', box).forEach(function (inp) { inp.oninput = function () { t.qnotes[Number(inp.getAttribute('data-qn'))] = inp.value; saveSoon(); }; });
        U.$('#realNotes', box).oninput = function (e) { t.realNotes = e.target.value; saveSoon(); };
        U.$('#consent', box).onchange = function (e) { t.consent = e.target.checked; saveSoon(); };
        U.$$('[data-ar]', box).forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-ar'), k = t.hit.indexOf(a); if (k >= 0) t.hit.splice(k, 1); else t.hit.push(a); b.setAttribute('aria-pressed', k < 0); saveSoon(); }; });
      }
      U.$$('[data-tm]', box).forEach(function (b) { b.onclick = function () { t.mode = b.getAttribute('data-tm'); persist().then(talk); }; });
      U.$('#toInsight', box).onclick = function () {
        if (t.mode === 'real' && !(t.realNotes || '').trim() && !(t.qnotes || []).some(Boolean)) return AXP.toast('인터뷰 메모를 먼저 올려 주세요', true);
        var miss = AXP.AREAS.filter(function (a) { return t.hit.indexOf(a) < 0; });
        var txt;
        if (t.mode === 'virtual') {
          var asked = t.turns.filter(function (x) { return x.role === 'user'; });
          var fromSheet = asked.filter(function (x) { return qs.some(function (q) { return q.trim() === x.content.trim(); }); }).length;
          txt = '질문 ' + asked.length + '개 (질문지 그대로 ' + fromSheet + '개, 대화 중 새로 ' + (asked.length - fromSheet) + '개). 다룬 영역: ' + (t.hit.join(', ') || '없음') + (miss.length ? '. 묻지 않은 영역: ' + miss.join(', ') : '') + '.';
        } else txt = '실제 현직자 인터뷰 메모 ' + ((t.realNotes || '').length) + '자, 질문별 메모 ' + (t.qnotes || []).filter(Boolean).length + '개를 올림. 다룬 영역: ' + (t.hit.join(', ') || '표시 안 함') + (t.consent ? '. 지식 베이스 활용 동의 받음.' : '.');
        D.addLog({ projectId: p.id, stage: 'talk', kind: '문제 정의', source: t.mode === 'real' ? '실제 인터뷰' : '인터뷰', text: txt });
        advance('insight');
      };
    }

    /* ================= 3. 인사이트 정리 ================= */
    function insight() {
      var s = d.insight; s.pains = s.pains && s.pains.length ? s.pains : [{ text: '', kind: '사실' }];
      box.innerHTML = '<div class="card"><h2>인사이트 정리</h2><p class="muted small mt8">인터뷰에서 발견한 pain point(반복·소모·비효율)나 아이디어를 직접 적고, <b>사실·의견·추정</b>을 구분하세요. 코치는 인터뷰에서 근거를 찾아 줄 뿐 대신 정리하지 않아요.</p>' +
        '<div id="pList" class="stack mt16"></div><div class="row mt12"><button class="btn ghost sm" id="addP">+ 발견 추가</button><button class="btn soft sm" id="reviewP">코치에게 근거 확인받기</button><button class="btn ghost sm" id="showTr">인터뷰 기록 보기</button></div><div id="pCoach" class="mt12"></div></div>' +
        '<div class="card"><h2>현직자의 판단 기준</h2><p class="muted small mt8">시니어 인터뷰의 핵심은 "무엇을 했나"보다 "<b>무엇을 기준으로 판단하나</b>"예요. 실무자가 우선순위를 정하거나 무언가를 포기할 때 쓰는 기준을 적어 보세요.</p>' +
        '<textarea id="criteria" rows="3" class="mt12" placeholder="예: 고객에게 직접 나가는 일은 실수 비용이 커서 마지막에 자동화한다">' + esc(s.criteria || '') + '</textarea></div>' +
        '<div class="card"><div class="card-head"><div><h2>컨택 보고서</h2><p>인터뷰 목적·발견·판단 기준을 시니어 수준의 보고서로 묶어요. 제출함에 바로 낼 수 있어요.</p></div><button class="btn soft sm" id="mkReport">보고서 초안 만들기</button></div><div id="reportBox">' + (s.report ? reportHTML(s.report) : '<p class="small muted">아직 초안이 없어요.</p>') + '</div></div>' +
        '<div class="row end"><button class="btn" id="toTopic">주제 선정으로 →</button></div>';
      function renderPains() {
        var rv = s.review || [];
        U.$('#pList', box).innerHTML = s.pains.map(function (x, i) {
          var r = rv.find(function (y) { return Number(y.i) === i; });
          return '<div class="item"><div class="row" style="flex-wrap:nowrap"><input type="text" data-pt="' + i + '" value="' + esc(x.text) + '" placeholder="예: 주간 해지 리포트를 만드는 데 매주 3시간이 든다"><select data-pk="' + i + '" style="width:96px">' + ['사실', '의견', '추정'].map(function (k) { return '<option' + (x.kind === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select><button class="btn ghost sm" data-pd="' + i + '">×</button></div>' +
            (r ? (r.evidence ? '<div class="tip good">근거 · "' + esc(r.evidence) + '"</div>' : '<div class="tip bad">인터뷰에서 근거를 찾지 못했어요.</div>') + (r.kind && r.kind !== x.kind ? '<div class="tip warn">코치 의견: \'' + esc(r.kind) + '\'에 가까워 보여요. ' + esc(r.note || '') + '</div>' : r.note ? '<p class="tiny muted mt8">' + esc(r.note) + '</p>' : '') : '') + '</div>';
        }).join('');
        U.$$('[data-pt]', box).forEach(function (inp) { inp.oninput = function () { s.pains[Number(inp.getAttribute('data-pt'))].text = inp.value; saveSoon(); }; });
        U.$$('[data-pk]', box).forEach(function (sel) { sel.onchange = function () { s.pains[Number(sel.getAttribute('data-pk'))].kind = sel.value; saveSoon(); }; });
        U.$$('[data-pd]', box).forEach(function (b) { b.onclick = function () { s.pains.splice(Number(b.getAttribute('data-pd')), 1); if (!s.pains.length) s.pains.push({ text: '', kind: '사실' }); s.review = null; renderPains(); saveSoon(); }; });
      }
      renderPains();
      U.$('#criteria', box).oninput = function (e) { s.criteria = e.target.value; saveSoon(); };
      U.$('#addP', box).onclick = function () { s.pains.push({ text: '', kind: '사실' }); renderPains(); };
      U.$('#showTr', box).onclick = function () { AXP.modal({ title: '인터뷰 기록', wide: true, body: '<div class="pre small">' + esc(transcript(p, c)) + '</div>' }); };
      U.$('#reviewP', box).onclick = function () {
        if (!s.pains.some(function (x) { return x.text.trim(); })) return AXP.toast('발견을 먼저 적어 주세요', true);
        var b = this; b.disabled = true; U.$('#pCoach', box).innerHTML = '<p class="small muted">코치가 인터뷰에서 근거를 찾고 있어요…</p>';
        AXP.AI.run('insight_review', { transcript: transcript(p, c), pains: s.pains }).then(function (r) {
          s.review = r.items || []; s.reviewSnap = s.pains.map(function (x) { return Object.assign({}, x); });
          s.pains.forEach(function (x, i) { var y = s.review.find(function (z) { return Number(z.i) === i; }); if (y) x.evidence = y.evidence || ''; });
          renderPains(); persist();
          var noEv = s.review.filter(function (x) { return !String(x.evidence || '').trim(); }).length;
          U.$('#pCoach', box).innerHTML = '<div class="coach"><b>◎ 인터뷰 코치</b><p>' + (noEv ? '근거를 못 찾은 발견이 ' + noEv + '개 있어요. 추정이라면 그렇게 표시해 두세요. ' : '모든 발견에 근거가 있어요. ') + ((r.untouched || []).length ? '인터뷰에서 나왔지만 정리에 없는 영역: ' + esc(r.untouched.join(', ')) + '.' : '') + '</p></div>';
        }).catch(function (e) { U.$('#pCoach', box).innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; }).then(function () { b.disabled = false; });
      };
      function reportHTML(r) {
        return '<div class="stack"><dl class="kv"><dt>목적</dt><dd>' + esc(r.purpose) + '</dd><dt>요약</dt><dd>' + esc(r.summary) + '</dd></dl>' +
          '<div><b class="small">발견</b>' + (r.findings || []).map(function (f) { return '<div class="tip"><span class="badge">' + esc(f.kind) + '</span> ' + esc(f.text) + (f.quote ? ' <span class="muted">— "' + esc(f.quote) + '"</span>' : '') + '</div>'; }).join('') + '</div>' +
          '<div><b class="small">현직자의 판단 기준</b><ul style="margin:4px 0;padding-left:18px">' + (r.criteria || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
          '<div><b class="small">다음 인터뷰에서 더 물어볼 것</b><ul style="margin:4px 0;padding-left:18px">' + (r.gaps || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
          '<div class="row"><button class="btn sm" id="subReport">제출함에 내기</button>' + (d.talk.mode === 'real' && d.talk.consent ? '<button class="btn sm ghost" id="toKB">지식 베이스로 보내기 (운영진 검수)</button>' : '') + '<span class="tiny muted">AI 초안은 고쳐서 내세요. AI가 쓴 부분은 제출본에 표시돼요.</span></div></div>';
      }
      function bindReport() {
        var sb = U.$('#subReport', box);
        if (sb) sb.onclick = function () {
          var asg = DB.where('assignments', function (a) { return a.cohortId === p.cohortId && a.auto === 'contact_report'; })[0];
          var r = s.report;
          var body = '[목적] ' + r.purpose + '\n[요약] ' + r.summary + '\n[발견]\n' + (r.findings || []).map(function (f) { return '- (' + f.kind + ') ' + f.text + (f.quote ? ' — "' + f.quote + '"' : ''); }).join('\n') + '\n[판단 기준]\n' + (r.criteria || []).map(function (x) { return '- ' + x; }).join('\n') + '\n[추가 질문]\n' + (r.gaps || []).map(function (x) { return '- ' + x; }).join('\n');
          editSubmit(asg, '컨택 보고서 · ' + c.company + ' ' + c.persona.title, body, 'contact_report');
        };
        var kb = U.$('#toKB', box);
        if (kb) kb.onclick = function () {
          DB.put('knowledge', { id: U.uid('kn'), sourceType: '컨택 보고서', title: '[' + D.me().name + '] ' + c.persona.title + ' 인터뷰', status: '검수 대기', confidence: 0.75, auto: false, extracted: { role: c.persona.title, tasks: [], pains: (s.report.findings || []).map(function (f) { return f.text; }), criteria: s.report.criteria || [], tools: [] }, caseIds: [c.id], from: { projectId: p.id, userId: p.userId } })
            .then(function () { AXP.toast('운영진 검수 대기로 보냈어요'); });
        };
      }
      bindReport();
      U.$('#mkReport', box).onclick = function () {
        var b = this; b.disabled = true; U.$('#reportBox', box).innerHTML = '<p class="small muted">보고서 초안을 만들고 있어요…</p>';
        AXP.AI.run('contact_report', { goal: d.prep.goal, transcript: transcript(p, c), pains: s.pains.filter(function (x) { return x.text.trim(); }) }).then(function (r) {
          s.report = r; s.reportAI = true; persist(); U.$('#reportBox', box).innerHTML = reportHTML(r); bindReport();
        }).catch(function (e) { U.$('#reportBox', box).innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; }).then(function () { b.disabled = false; });
      };
      U.$('#toTopic', box).onclick = function () {
        var ps = s.pains.filter(function (x) { return x.text.trim(); }); if (!ps.length) return AXP.toast('발견을 하나 이상 적어 주세요', true);
        var counts = ['사실', '의견', '추정'].map(function (k) { return k + ' ' + ps.filter(function (x) { return x.kind === k; }).length; }).join(', ');
        var txt = '발견 ' + ps.length + '개 정리 (' + counts + ').';
        if (s.reviewSnap && s.review) {
          var kindChanged = s.pains.filter(function (x, i) { return s.reviewSnap[i] && x.text.trim() && x.kind !== s.reviewSnap[i].kind; }).length;
          txt += ' 코치 근거 확인: 근거 없음 ' + s.review.filter(function (x) { return !String(x.evidence || '').trim(); }).length + '개' + (kindChanged ? ', 확인 뒤 성격을 바꾼 것 ' + kindChanged + '개' : '') + '.';
        }
        if (s.criteria) txt += '\n현직자의 판단 기준: ' + s.criteria.trim();
        txt += '\n' + ps.map(function (x) { return '· (' + x.kind + ') ' + x.text.trim(); }).join('\n');
        D.addLog({ projectId: p.id, stage: 'insight', kind: 'AI 검증', source: '코치 근거 확인', text: txt });
        advance(nextOf('insight'));
      };
    }

    /* ================= 4. 주제 선정 ================= */
    function topic() {
      var s = d.topic; var pains = (d.insight.pains || []).filter(function (x) { return x.text.trim(); });
      s.cands = s.cands || [];
      pains.forEach(function (x) { if (!s.cands.find(function (y) { return y.text === x.text.trim(); })) s.cands.push({ text: x.text.trim(), on: false, pick: false, fit: 0, impact: 0, doable: 0 }); });
      s.cands = s.cands.filter(function (y) { return pains.some(function (x) { return x.text.trim() === y.text; }) || y.on; });
      var CRIT = [['fit', 'AI로 풀기 좋은가'], ['impact', '효과가 큰가'], ['doable', '4주 안에 가능한가']];
      box.innerHTML = '<div class="card"><h2>AI 프로젝트 주제 선정</h2><p class="muted small mt8">발견 중 2~3개를 후보로 골라 비교하고, 하나를 주제로 정하세요. <b>무엇을 버렸는지</b>가 판단의 절반이에요.</p><div id="cands" class="stack mt16"></div></div>' +
        '<div class="card"><label class="lb" for="why">이 주제를 고른 이유</label><textarea id="why" rows="3">' + esc(s.why || '') + '</textarea><label class="lb mt12" for="drop">버린 후보와 이유</label><textarea id="drop" rows="3">' + esc(s.drop || '') + '</textarea>' +
        '<div class="row mt12"><button class="btn soft" id="reviewT">AI 사수 리뷰 받기</button><button class="btn ghost" id="askHuman">현직 멘토에게 리뷰 요청</button><span class="small muted" id="tStatus"></span></div><div id="tMentor" class="mt12"></div></div>' +
        '<div class="row end"><button class="btn" id="toPlan">기획안 쓰기 →</button></div>';
      function renderCands() {
        U.$('#cands', box).innerHTML = s.cands.map(function (x, i) {
          return '<div class="item" style="' + (x.pick ? 'border-color:var(--brand);background:var(--brand-soft-2)' : '') + '"><div class="row between"><b>' + esc(x.text) + '</b><div class="seg"><button data-on="' + i + '" aria-pressed="' + !!x.on + '">' + (x.on ? '후보 ✓' : '후보로') + '</button>' + (x.on ? '<button data-pick="' + i + '" aria-pressed="' + !!x.pick + '">' + (x.pick ? '주제 ✓' : '주제로') + '</button>' : '') + '</div></div>' +
            (x.on ? '<div class="grid g3 mt12">' + CRIT.map(function (cr) { return '<div><div class="tiny muted">' + cr[1] + '</div><div class="seg mt8">' + [[1, '낮음'], [2, '중간'], [3, '높음']].map(function (v) { return '<button data-rate="' + i + ':' + cr[0] + ':' + v[0] + '" aria-pressed="' + (x[cr[0]] === v[0]) + '">' + v[1] + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>' : '') + '</div>';
        }).join('') || h.empty('인사이트 단계에서 발견을 먼저 적어 주세요.');
        U.$$('[data-on]', box).forEach(function (b) { b.onclick = function () { var x = s.cands[Number(b.getAttribute('data-on'))]; x.on = !x.on; if (!x.on) x.pick = false; renderCands(); saveSoon(); }; });
        U.$$('[data-pick]', box).forEach(function (b) { b.onclick = function () { s.cands.forEach(function (y) { y.pick = false; }); s.cands[Number(b.getAttribute('data-pick'))].pick = true; renderCands(); saveSoon(); }; });
        U.$$('[data-rate]', box).forEach(function (b) { b.onclick = function () { var a = b.getAttribute('data-rate').split(':'); s.cands[Number(a[0])][a[1]] = Number(a[2]); renderCands(); saveSoon(); }; });
      }
      renderCands();
      U.$('#why', box).oninput = function (e) { s.why = e.target.value; saveSoon(); };
      U.$('#drop', box).oninput = function (e) { s.drop = e.target.value; saveSoon(); };
      if (s.mentor) mentorBox(U.$('#tMentor', box), 'AI 사수 리뷰', s.mentor, 'topic');
      var lbl = function (n) { return ['미정', '낮음', '중간', '높음'][n] || '미정'; };
      function table() { return s.cands.filter(function (x) { return x.on; }).map(function (x) { return (x.pick ? '[주제] ' : '[후보] ') + x.text + ' / AI 적합 ' + lbl(x.fit) + ', 효과 ' + lbl(x.impact) + ', 4주 가능 ' + lbl(x.doable); }).join('\n'); }
      function valid() {
        var on = s.cands.filter(function (x) { return x.on; }), pick = on.find(function (x) { return x.pick; });
        if (on.length < 2 || !pick) { U.$('#tStatus', box).textContent = '후보를 2개 이상 고르고, 그중 하나를 주제로 정해 주세요.'; return false; }
        if (!(s.why || '').trim()) { U.$('#why', box).focus(); return false; }
        return true;
      }
      U.$('#reviewT', box).onclick = function () {
        if (!valid()) return;
        var b = this; b.disabled = true; U.$('#tStatus', box).textContent = 'AI 사수가 주제 선정을 읽고 있어요…';
        if (!s.loggedPick || s.loggedPick !== table() + s.why + s.drop) {
          D.addLog({ projectId: p.id, stage: 'topic', kind: '대안 선택', source: '문서 작성', text: '후보 ' + s.cands.filter(function (x) { return x.on; }).length + '개 비교 뒤 주제 선택.\n' + table() + '\n고른 이유: ' + s.why.trim() + '\n버린 후보: ' + ((s.drop || '').trim() || '(적지 않음)') });
          s.loggedPick = table() + s.why + s.drop;
        }
        AXP.AI.run('topic_review', { transcript: transcript(p, c), table: table(), why: s.why, drop: s.drop }).then(function (r) {
          s.mentor = (r.comments || []).slice(0, 2); s.pick = (s.cands.find(function (x) { return x.pick; }) || {}).text; persist();
          mentorBox(U.$('#tMentor', box), 'AI 사수 리뷰', s.mentor, 'topic'); U.$('#tStatus', box).textContent = '답한 내용은 판단 기록에 남아요.';
        }).catch(function (e) { U.$('#tStatus', box).textContent = e.message; }).then(function () { b.disabled = false; });
      };
      U.$('#askHuman', box).onclick = function () { requestReview('topic'); };
      U.$('#toPlan', box).onclick = function () {
        if (!valid()) return;
        s.pick = (s.cands.find(function (x) { return x.pick; }) || {}).text;
        if (!s.loggedPick) D.addLog({ projectId: p.id, stage: 'topic', kind: '대안 선택', source: '문서 작성', text: '주제 선택: ' + s.pick + '\n고른 이유: ' + s.why.trim() + '\n버린 후보: ' + ((s.drop || '').trim() || '(적지 않음)') });
        d.plan.secs = d.plan.secs || {};
        if (!d.plan.secs.bg) { var ev = (d.insight.pains || []).find(function (x) { return x.text.trim() === s.pick; }); d.plan.secs.bg = s.pick + (ev && ev.evidence ? '\n근거: "' + ev.evidence + '"' : ''); d.plan.secs.alt = s.drop || ''; }
        p.title = s.pick ? c.company.replace(/\s*\(가상\)/, '') + ' · ' + s.pick : p.title;
        advance('plan');
      };
    }

    function requestReview(stageName) {
      var exists = DB.where('reviews', function (r) { return r.projectId === p.id && r.stage === stageName && r.status === '요청'; })[0];
      if (exists) return AXP.toast('이미 리뷰를 요청했어요. 멘토가 확인하면 알려 드려요');
      DB.put('reviews', { id: U.uid('rev'), projectId: p.id, learnerId: me.id, mentorId: '', mentorName: '', stage: stageName, status: '요청', comments: [], rubric: null, verified: false })
        .then(function () { AXP.toast('현직 멘토에게 리뷰를 요청했어요'); });
    }

    /* ================= 5. 기획안 ================= */
    function plan() {
      var s = d.plan; s.secs = s.secs || {}; s.ver = s.ver || 0;
      var gate = cohort && cohort.policy && cohort.policy.mentorApprovalGate;
      var approved = DB.where('reviews', function (r) { return r.projectId === p.id && r.stage === 'plan' && r.approved; }).length > 0;
      box.innerHTML = '<div class="card"><div class="card-head"><div><h2>프로젝트 기획안 <span class="badge">v' + s.ver + '</span></h2><p>실무 기획안 양식이에요. 업무용 AI의 답을 원하는 섹션에 넣고, 고쳐서 완성하세요. 저장할 때마다 버전과 AI 원문 수정 여부가 기록돼요.</p></div></div>' +
        PSECS.map(function (x) { return '<div class="field"><label class="lb" for="pl-' + x[0] + '">' + x[1] + '</label><textarea id="pl-' + x[0] + '" rows="' + (x[0] === 'plan' ? 4 : 3) + '" placeholder="' + esc(x[2]) + '">' + esc(s.secs[x[0]] || '') + '</textarea></div>'; }).join('') +
        '<div class="row mt16"><button class="btn ghost" id="savePlan">저장 (버전 남기기)</button><button class="btn soft" id="reviewPlan">AI 사수 리뷰 받기</button><button class="btn ghost" id="askHuman2">현직 멘토에게 리뷰 요청</button><span class="small muted" id="pStatus"></span></div><div id="planMentor" class="mt12"></div></div>' +
        (gate && !approved ? '<div class="note gold">이 기수는 <b>기획안 멘토 승인</b> 후 수행 단계가 열려요. 현직 멘토에게 리뷰를 요청하세요.</div>' : '') +
        '<div class="row end"><button class="btn" id="toRun"' + (gate && !approved ? ' disabled' : '') + '>수행 시작 →</button></div>';
      PSECS.forEach(function (x) { U.$('#pl-' + x[0], box).oninput = function (e) { s.secs[x[0]] = e.target.value; saveSoon(); }; });
      if (s.mentor) mentorBox(U.$('#planMentor', box), 'AI 사수 리뷰 · 기획안', s.mentor, 'plan');
      U.$('#savePlan', box).onclick = function () {
        var prev = s.snap || {};
        var changed = PSECS.filter(function (x) { return (s.secs[x[0]] || '').trim() !== (prev[x[0]] || '').trim(); }).map(function (x) { return x[1]; });
        if (!changed.length) { U.$('#pStatus', box).textContent = '바뀐 내용이 없어요.'; return; }
        var ins = (s.aiInserts || []).filter(function (a) { return a.text; });
        var kept = ins.filter(function (a) { return (s.secs[a.sec] || '').indexOf(a.text) >= 0; }).length;
        s.ver++; s.snap = Object.assign({}, s.secs); s.versions = (s.versions || []).concat([{ v: s.ver, at: U.now(), secs: Object.assign({}, s.secs) }]).slice(-10);
        D.addLog({ projectId: p.id, stage: 'plan', kind: '실행 판단', source: '문서 작성', text: '기획안 v' + s.ver + ' 저장. 바뀐 섹션: ' + changed.join(', ') + '.' + (ins.length ? '\nAI 원문 ' + ins.length + '개 중 그대로 둔 것 ' + kept + '개, 고치거나 뺀 것 ' + (ins.length - kept) + '개.' : '') });
        persist().then(function () { plan(); AXP.toast('v' + s.ver + '로 저장했어요'); });
      };
      U.$('#reviewPlan', box).onclick = function () {
        var b = this; b.disabled = true; U.$('#pStatus', box).textContent = 'AI 사수가 기획안을 읽고 있어요…';
        AXP.AI.run('plan_review', { transcript: transcript(p, c), planText: PSECS.map(function (x) { return x[1] + ': ' + ((s.secs[x[0]] || '').trim() || '(비어 있음)'); }).join('\n') }).then(function (r) {
          s.mentor = (r.comments || []).slice(0, 3); persist(); mentorBox(U.$('#planMentor', box), 'AI 사수 리뷰 · 기획안', s.mentor, 'plan'); U.$('#pStatus', box).textContent = '코멘트에 답하고, 고쳤다면 다시 저장하세요.';
        }).catch(function (e) { U.$('#pStatus', box).textContent = e.message; }).then(function () { b.disabled = false; });
      };
      U.$('#askHuman2', box).onclick = function () { requestReview('plan'); };
      U.$('#toRun', box).onclick = function () {
        if (!s.ver) { U.$('#pStatus', box).textContent = '기획안을 한 번 이상 저장해 주세요.'; return; }
        d.run.week = d.run.week || 1; advance('run');
      };
    }

    /* ================= 6. 수행 · 주간 체크인 ================= */
    function wk() { d.run.weeks = d.run.weeks || {}; var w = d.run.week || 1; return (d.run.weeks[w] = d.run.weeks[w] || {}); }
    function run() {
      var s = d.run; s.week = s.week || 1; var w = wk();
      var ev = (c.events || []).find(function (e) { return Number(e.week) === s.week; });
      box.innerHTML = '<div class="card"><div class="card-head"><div><h2>프로젝트 수행</h2><p>실제로는 한 주씩 진행해요. 매주 결과물과 한 일을 올리면 AI 사수가 체크인해요.</p></div><div class="seg">' +
        [1, 2, 3, 4].map(function (n) { return '<button data-wk="' + n + '" aria-pressed="' + (s.week === n) + '"' + (n > s.week && !(s.weeks[n - 1] || {}).checked ? ' disabled' : '') + '>' + n + '주차</button>'; }).join('') + '</div></div>' +
        (ev ? '<div class="note gold"><b>' + esc(c.persona.name) + ' ' + esc(c.persona.title) + '의 메시지</b><p class="mt8">"' + esc(ev.text) + '"</p><textarea id="evResp" rows="2" class="mt12" placeholder="계획을 어떻게 바꿀지 답하세요">' + esc(w.ev || '') + '</textarea></div>' : '') +
        '<div class="field mt12"><label class="lb" for="wOut">이번 주 결과물 <span class="hint">링크, 파일명, 또는 내용</span></label><textarea id="wOut" rows="4">' + esc(w.out || '') + '</textarea></div>' +
        '<div class="field"><label class="lb" for="wDid">이번 주에 한 일과 AI를 쓴 방식</label><textarea id="wDid" rows="3" placeholder="무엇을 AI에게 맡겼고, 결과를 어떻게 확인했나요?">' + esc(w.did || '') + '</textarea></div>' +
        '<div class="row mt12"><button class="btn soft" id="checkin">주간 체크인 제출</button><span class="small muted" id="rStatus"></span></div><div id="weekMentor" class="mt12"></div></div>' +
        '<div class="row end"><button class="btn" id="nextWeek">' + (s.week < 4 ? '다음 주로 →' : '결과 보고 쓰기 →') + '</button></div>';
      U.$$('[data-wk]', box).forEach(function (b) { b.onclick = function () { s.week = Number(b.getAttribute('data-wk')); persist().then(run); }; });
      U.$('#wOut', box).oninput = function (e) { w.out = e.target.value; saveSoon(); };
      U.$('#wDid', box).oninput = function (e) { w.did = e.target.value; saveSoon(); };
      if (ev) U.$('#evResp', box).oninput = function (e) { w.ev = e.target.value; saveSoon(); };
      if (w.mentor) weekMentor(w.mentor);
      function weekMentor(r) {
        var mb = U.$('#weekMentor', box);
        mb.innerHTML = '<div class="coach"><b>◎ AI 사수 · ' + s.week + '주차</b><p>' + esc(r.feedback || '') + '</p>' + (r.ai_use ? '<p class="mt8"><b>AI 활용 리뷰</b> · ' + esc(r.ai_use) + '</p>' : '') +
          (r.question ? '<div class="cmt"><p>' + esc(r.question) + '</p>' + (r.reply ? '<div class="tip good">내 답 · ' + esc(r.reply) + '</div>' : '<textarea rows="2" class="mt8" id="wq" placeholder="직접 입력 (붙여넣기 불가)"></textarea><div class="row end mt8"><button class="btn sm" id="wqSend">답하기</button></div>') + '</div>' : '') + '</div>';
        var ta = U.$('#wq', mb); if (ta) { ta.addEventListener('paste', function (e) { e.preventDefault(); AXP.toast('직접 입력해 주세요'); }); }
        var bt = U.$('#wqSend', mb); if (bt) bt.onclick = function () {
          var v = ta.value.trim(); if (!v) return; r.reply = v;
          D.addLog({ projectId: p.id, stage: 'run', kind: ev ? '방향 전환' : '실행 판단', source: '멘토 대화', text: s.week + '주차 사수: ' + r.question + '\n나: ' + v });
          persist().then(function () { weekMentor(r); });
        };
      }
      U.$('#checkin', box).onclick = function () {
        if (!(w.did || '').trim()) { U.$('#wDid', box).focus(); return; }
        if (ev && !(w.ev || '').trim()) { U.$('#evResp', box).focus(); return AXP.toast('팀장님 메시지에 먼저 답해 주세요', true); }
        var ai = w.ai || [], kept = ai.filter(function (x) { return (w.out || '').indexOf(x) >= 0; }).length;
        D.addLog({ projectId: p.id, stage: 'run', kind: ev ? '방향 전환' : 'AI 검증', source: '주간 체크인', text: s.week + '주차 체크인.\n한 일: ' + w.did.trim() + (ai.length ? '\nAI 원문 ' + ai.length + '개 중 그대로 둔 것 ' + kept + '개.' : '') + (ev ? '\n조건 변경 대응: ' + w.ev.trim() : '') });
        var b = this; b.disabled = true; U.$('#rStatus', box).textContent = 'AI 사수가 이번 주 작업을 보고 있어요…';
        AXP.AI.run('checkin', { week: s.week, topic: d.topic.pick || p.title, schedule: (d.plan.secs || {}).plan, out: w.out, did: w.did, event: ev ? ev.text : '', eventResp: w.ev }).then(function (r) {
          w.mentor = r; w.checked = true; persist(); weekMentor(r); U.$('#rStatus', box).textContent = '';
        }).catch(function (e) { U.$('#rStatus', box).textContent = e.message; }).then(function () { b.disabled = false; });
      };
      U.$('#nextWeek', box).onclick = function () {
        if (!w.checked) { U.$('#rStatus', box).textContent = '이번 주 체크인을 먼저 제출해 주세요.'; return; }
        if (s.week < 4) { s.week++; persist().then(run); return; }
        advance('final');
      };
    }

    /* ================= 링커슈 Ⅰ. 직무 탐구 (인터뷰 전) ================= */
    function job() {
      var s = d.job;
      var kb = DB.where('knowledge', function (k) { return (k.status === '승인' || k.status === '자동 반영') && ((k.caseIds || []).indexOf(c.id) >= 0); });
      box.innerHTML = '<div class="card"><span class="badge blue">링커슈 보고서 Ⅰ · 인터뷰 전 작성</span><h2 class="mt8">직무 탐구 — ' + esc(c.track) + '</h2><p class="muted small mt8">인터뷰 전에 이 직무를 먼저 이해해요. 여기서 조사한 내용은 인터뷰에서 <b>다시 묻지 않고</b>, 현장에서 맞는지 <b>확인</b>할 재료가 돼요.</p>' +
        (kb.length ? '<div class="note blue mt12"><b>지식 베이스 · 이 직무의 채용공고·컨택 보고서에서 추출</b>' + kb.map(function (k) { var e = k.extracted || {}; return '<div class="small mt8">(' + esc(k.sourceType) + ') 업무: ' + esc((e.tasks || []).join(', ')) + (e.tools && e.tools.length ? ' · 도구: ' + esc(e.tools.join(', ')) : '') + '</div>'; }).join('') + '</div>' : '') +
        [['roles', '세부 역할 및 업무', '해당 직무를 세부 업무로 나누고, 각 업무의 구체적인 내용을 작성해 주세요.', 5], ['skills', '필요 역량 및 지식', '직무에 필요한 역량(소프트 스킬)과 전문 지식(하드 스킬)을 구분해 작성해 주세요.', 4], ['future', '미래 전망', '시장 규모, 기술 트렌드, 사회적 변화에 따른 변화를 중심으로 향후 전망을 작성해 주세요.', 4]]
          .map(function (x) { return '<div class="field mt12"><label class="lb" for="jb-' + x[0] + '">' + x[1] + '</label><textarea id="jb-' + x[0] + '" rows="' + x[3] + '" placeholder="' + esc(x[2]) + '">' + esc(s[x[0]] || '') + '</textarea></div>'; }).join('') +
        '<div class="row mt12"><button class="btn soft sm" id="jbCheck">AI 사수에게 점검받기</button><span class="small muted" id="jbSt"></span></div><div id="jbFb" class="mt12"></div></div>' +
        '<div class="row end"><button class="btn" id="toIssue">이슈 탐구로 →</button></div>';
      ['roles', 'skills', 'future'].forEach(function (k) { U.$('#jb-' + k, box).oninput = function (e) { s[k] = e.target.value; saveSoon(); }; });
      if (s.review) exploreFb(U.$('#jbFb', box), s.review);
      U.$('#jbCheck', box).onclick = function () {
        if (!jobText(d)) return AXP.toast('먼저 작성해 주세요', true);
        var b = this; b.disabled = true; U.$('#jbSt', box).textContent = '점검 중…';
        AXP.AI.run('explore_review', { part: 'job', track: c.track, text: '세부 역할 및 업무: ' + (s.roles || '') + '\n필요 역량: ' + (s.skills || '') + '\n미래 전망: ' + (s.future || '') }).then(function (r) {
          s.review = r; s.reviewed = true; persist(); exploreFb(U.$('#jbFb', box), r); U.$('#jbSt', box).textContent = '';
        }).catch(function (e) { U.$('#jbSt', box).textContent = e.message; }).then(function () { b.disabled = false; });
      };
      U.$('#toIssue', box).onclick = function () {
        if (!(s.roles || '').trim()) { U.$('#jb-roles', box).focus(); return AXP.toast('세부 역할 및 업무를 적어 주세요', true); }
        var okN = s.review ? (s.review.checks || []).filter(function (x) { return x.ok; }).length : null;
        D.addLog({ projectId: p.id, stage: 'job', kind: '문제 정의', source: '문서 작성', text: '직무 탐구 작성 (' + c.track + '). 세부 업무 ' + (s.roles || '').split('\n').filter(Boolean).length + '개.' + (okN !== null ? ' AI 사수 점검 ' + okN + '/' + (s.review.checks || []).length + ' 충족.' : ' 점검 없이 진행.') });
        advance('issue');
      };
    }
    function exploreFb(target, r) {
      target.innerHTML = '<div class="coach"><b>◎ AI 사수 점검</b>' + (r.checks || []).map(function (x) { return '<div class="tip ' + (x.ok ? 'good' : 'warn') + '">' + (x.ok ? '✓ ' : '○ ') + esc(x.item) + ' — ' + esc(x.tip) + '</div>'; }).join('') +
        ((r.verify || []).length ? '<p class="small mt12"><b>인터뷰에서 확인해 볼 것</b> · ' + esc(r.verify.join(' / ')) + '</p>' : '') + (r.comment ? '<p class="small mt8">' + esc(r.comment) + '</p>' : '') + '</div>';
    }

    /* ================= 링커슈 Ⅱ. 이슈 탐구 (인터뷰 전) ================= */
    function issue() {
      var s = d.issue; s.criteria = s.criteria || [false, false, false, false];
      box.innerHTML = '<div class="card"><span class="badge blue">링커슈 보고서 Ⅱ · 인터뷰 전 작성</span><h2 class="mt8">이슈 탐구</h2><p class="muted small mt8">직무·산업 전반 또는 특정 기업과 관련된 이슈 하나를 골라요. 인터뷰에서 "현장에서도 그런가요?"로 확인할 거예요.</p>' +
        '<div class="field mt12"><label class="lb" for="is-keyword">선정한 이슈 <span class="hint">핵심 키워드</span></label><input type="text" id="is-keyword" value="' + esc(s.keyword || '') + '" placeholder="예: 생성형 AI 확산과 사내 교육 효과 측정의 데이터화"></div>' +
        '<div class="field"><label class="lb" for="is-links">참고한 기사 링크·출처 <span class="hint">필수 · 줄마다 하나</span></label><textarea id="is-links" rows="2">' + esc(s.links || '') + '</textarea></div>' +
        '<div class="field"><label class="lb">이슈 선정 기준 자가 점검</label>' + ISSUE_CRITERIA.map(function (t, i) { return '<label class="check mt8"><input type="checkbox" data-cr="' + i + '"' + (s.criteria[i] ? ' checked' : '') + '> (' + (i + 1) + ') ' + esc(t) + '</label>'; }).join('') + '</div>' +
        '<div class="field"><label class="lb" for="is-alt">검토했지만 고르지 않은 이슈와 이유 <span class="hint">판단 기록으로 남아요</span></label><textarea id="is-alt" rows="2">' + esc(s.alt || '') + '</textarea></div></div>' +
        '<div class="card"><h3>이슈 설명</h3><div class="field mt12"><label class="lb" for="is-define">1. 이슈의 핵심 정의</label><textarea id="is-define" rows="3">' + esc(s.define || '') + '</textarea></div><div class="field"><label class="lb" for="is-background">2. 이슈가 대두된 배경</label><textarea id="is-background" rows="3">' + esc(s.background || '') + '</textarea></div>' +
        '<h3 class="mt16">이슈 분석</h3><div class="field mt12"><label class="lb" for="is-cases">1. 이슈와 관련된 사례</label><textarea id="is-cases" rows="3">' + esc(s.cases || '') + '</textarea></div><div class="field"><label class="lb" for="is-trend">2. 관련 산업계 동향</label><textarea id="is-trend" rows="3">' + esc(s.trend || '') + '</textarea></div>' +
        '<div class="row mt12"><button class="btn soft sm" id="isCheck">AI 사수에게 점검받기</button><span class="small muted" id="isSt"></span></div><div id="isFb" class="mt12"></div></div>' +
        '<div class="row end"><button class="btn" id="toPrep">인터뷰 준비로 →</button></div>';
      ['keyword', 'links', 'alt', 'define', 'background', 'cases', 'trend'].forEach(function (k) { U.$('#is-' + k, box).oninput = function (e) { s[k] = e.target.value; saveSoon(); }; });
      U.$$('[data-cr]', box).forEach(function (cb) { cb.onchange = function () { s.criteria[Number(cb.getAttribute('data-cr'))] = cb.checked; saveSoon(); }; });
      if (s.review) exploreFb(U.$('#isFb', box), s.review);
      U.$('#isCheck', box).onclick = function () {
        if (!(s.keyword || '').trim()) return AXP.toast('이슈를 먼저 적어 주세요', true);
        var b = this; b.disabled = true; U.$('#isSt', box).textContent = '점검 중…';
        AXP.AI.run('explore_review', { part: 'issue', track: c.track, text: '이슈: ' + s.keyword + '\n출처: ' + (s.links || '') + '\n핵심: ' + (s.define || '') + '\n배경: ' + (s.background || '') + '\n사례: ' + (s.cases || '') + '\n동향: ' + (s.trend || '') }).then(function (r) {
          s.review = r; s.verify = r.verify || []; s.reviewed = true; persist(); exploreFb(U.$('#isFb', box), r); U.$('#isSt', box).textContent = '';
        }).catch(function (e) { U.$('#isSt', box).textContent = e.message; }).then(function () { b.disabled = false; });
      };
      U.$('#toPrep', box).onclick = function () {
        if (!(s.keyword || '').trim()) { U.$('#is-keyword', box).focus(); return; }
        if (!(s.links || '').trim()) { U.$('#is-links', box).focus(); return AXP.toast('근거 기사 출처를 적어 주세요', true); }
        var met = s.criteria.filter(Boolean).length;
        D.addLog({ projectId: p.id, stage: 'issue', kind: '대안 선택', source: '문서 작성', text: '이슈 선정: ' + s.keyword.trim() + '. 선정 기준 ' + met + '/4 충족.' + ((s.alt || '').trim() ? '\n고르지 않은 이슈: ' + s.alt.trim() : '') + ((s.verify || []).length ? '\n인터뷰에서 확인할 것: ' + s.verify.join(', ') : '') });
        advance('prep');
      };
    }

    /* ================= 링커슈 Ⅲ. AI 프로젝트 제안 (인터뷰 후) ================= */
    function propose() {
      var s = d.propose; s.secs = s.secs || {}; s.ver = s.ver || 0;
      var pains = (d.insight.pains || []).filter(function (x) { return x.text.trim(); });
      box.innerHTML = '<div class="card"><span class="badge blue">링커슈 보고서 Ⅲ · 인터뷰 후 작성</span><h2 class="mt8">AI 프로젝트 제안 <span class="badge">v' + s.ver + '</span></h2><p class="muted small mt8">컨택 보고서에서 정리한 현업의 병목을 바탕으로 하나의 AI 프로젝트로 구체화해요. 업무용 AI의 답을 섹션에 넣고 고쳐 쓸 수 있어요.</p>' +
        (pains.length ? '<div class="note mt12"><b>인터뷰에서 찾은 병목</b>' + pains.map(function (x) { return '<div class="small mt8"><span class="badge">' + esc(x.kind) + '</span> ' + esc(x.text) + '</div>'; }).join('') + '</div>' : '') +
        PROPOSE.map(function (x) { return '<div class="field mt12"><label class="lb" for="pl-' + x[0] + '">' + x[1] + '</label><textarea id="pl-' + x[0] + '" rows="' + (x[0] === 'how' ? 4 : 3) + '" placeholder="' + esc(x[2]) + '">' + esc(s.secs[x[0]] || '') + '</textarea></div>'; }).join('') +
        '<div class="field"><label class="lb" for="pl-drop">버린 문제 후보와 이유</label><textarea id="pl-drop" rows="2">' + esc(s.drop || '') + '</textarea></div>' +
        '<div class="row mt16"><button class="btn ghost" id="savePr">저장 (버전 남기기)</button><button class="btn soft" id="reviewPr">AI 사수 리뷰 받기</button><button class="btn ghost" id="askHumanPr">현직 멘토에게 리뷰 요청</button><button class="btn ghost" id="lkView">링커슈 보고서 미리보기</button><span class="small muted" id="prSt"></span></div><div id="prMentor" class="mt12"></div></div>' +
        '<div class="row end"><button class="btn" id="toPresent">발표 준비로 →</button></div>';
      PROPOSE.forEach(function (x) { U.$('#pl-' + x[0], box).oninput = function (e) { s.secs[x[0]] = e.target.value; saveSoon(); }; });
      U.$('#pl-drop', box).oninput = function (e) { s.drop = e.target.value; saveSoon(); };
      if (s.mentor) mentorBox(U.$('#prMentor', box), 'AI 사수 리뷰 · AI 프로젝트 제안', s.mentor, 'propose');
      U.$('#lkView', box).onclick = function () { AXP.linkushuReportModal(p); };
      U.$('#savePr', box).onclick = function () {
        var prev = s.snap || {};
        var changed = PROPOSE.filter(function (x) { return (s.secs[x[0]] || '').trim() !== (prev[x[0]] || '').trim(); }).map(function (x) { return x[1]; });
        if (!changed.length) { U.$('#prSt', box).textContent = '바뀐 내용이 없어요.'; return; }
        var ins = (s.aiInserts || []).filter(function (a) { return a.text; }), kept = ins.filter(function (a) { return (s.secs[a.sec] || '').indexOf(a.text) >= 0; }).length;
        s.ver++; s.snap = Object.assign({}, s.secs);
        D.addLog({ projectId: p.id, stage: 'propose', kind: '대안 선택', source: '문서 작성', text: 'AI 프로젝트 제안 v' + s.ver + ' 저장. 바뀐 섹션: ' + changed.join(', ') + '.' + ((s.drop || '').trim() ? '\n버린 후보: ' + s.drop.trim() : '') + (ins.length ? '\nAI 원문 ' + ins.length + '개 중 그대로 둔 것 ' + kept + '개.' : '') });
        persist().then(function () { propose(); AXP.toast('v' + s.ver + '로 저장했어요'); });
      };
      U.$('#reviewPr', box).onclick = function () {
        var b = this; b.disabled = true; U.$('#prSt', box).textContent = 'AI 사수가 제안서를 읽고 있어요…';
        AXP.AI.run('plan_review', { transcript: transcript(p, c), planText: PROPOSE.map(function (x) { return x[1] + ': ' + ((s.secs[x[0]] || '').trim() || '(비어 있음)'); }).join('\n') }).then(function (r) {
          s.mentor = (r.comments || []).slice(0, 3); persist(); mentorBox(U.$('#prMentor', box), 'AI 사수 리뷰 · AI 프로젝트 제안', s.mentor, 'propose'); U.$('#prSt', box).textContent = '코멘트에 답하고, 고쳤다면 다시 저장하세요.';
        }).catch(function (e) { U.$('#prSt', box).textContent = e.message; }).then(function () { b.disabled = false; });
      };
      U.$('#askHumanPr', box).onclick = function () { requestReview('propose'); };
      U.$('#toPresent', box).onclick = function () {
        if (!(s.secs.problem || '').trim()) { U.$('#pl-problem', box).focus(); return AXP.toast('문제 정의를 적어 주세요', true); }
        if (!s.ver) { U.$('#prSt', box).textContent = '한 번 이상 저장해 주세요.'; return; }
        advance('final');
      };
    }

    /* ================= 마지막: 결과 보고(발표) · 디펜스 — 팀 프로젝트는 팀원별 ================= */
    function finalSecs() { return kind === 'linkushu' ? LK_FINAL : RSECS; }
    function fin() {
      var s = d.final; s.report = s.report || {};
      var mine = AXP.finalOf(p, me.id), SECS = finalSecs();
      if (mine.readiness) return showReport();
      if (mine.defense && mine.defense.questions && !mine.defense.done) return defense();
      var submitted = team && s.submittedAt;
      box.innerHTML = '<div class="card"><h2>' + (kind === 'linkushu' ? '발표 · 결과 정리' : '결과 보고서') + '</h2><p class="muted small mt8">' + (team ? '보고서는 팀이 함께 쓰고, <b>디펜스는 팀원마다 따로</b> 해요. ' : '') + '오른쪽 판단 기록을 보면서 쓰면 쉬워요. 이번 단계는 프리셉터 「맡기기」 — AI 사수는 코칭하지 않아요.</p>' +
        (submitted ? '<div class="note mt12">' + esc(D.user(s.submittedBy).name) + ' 님이 ' + U.fmt(s.submittedAt) + '에 보고서를 제출했어요. 이제 내 디펜스를 시작하세요.</div>' : '') +
        SECS.map(function (x) { return '<div class="field mt12"><label class="lb" for="rp-' + x[0] + '">' + x[1] + '</label><textarea id="rp-' + x[0] + '" rows="3" placeholder="' + esc(x[2]) + '"' + (submitted ? ' readonly' : '') + '>' + esc(s.report[x[0]] || '') + '</textarea></div>'; }).join('') +
        (kind === 'linkushu' ? '' : '<div class="field"><label class="lb" for="links">결과물 링크 <span class="hint">구글 시트·노션·깃허브 등, 줄마다 하나</span></label><textarea id="links" rows="2">' + esc((s.links || []).join('\n')) + '</textarea></div>') +
        '<div class="note mt16"><b>' + (submitted ? '디펜스를 시작하면' : '제출하면') + '</b> AI 사수와 업무용 AI가 꺼지고, 내 판단 기록을 근거로 만든 꼬리질문에 <b>내 말로</b> 답하는 디펜스가 시작돼요. 붙여넣기는 막혀요.</div>' +
        '<div class="row end mt16">' + (kind === 'linkushu' ? '<button class="btn ghost" id="lkView2">링커슈 보고서 보기</button>' : '') + '<button class="btn" id="submitReport">' + (submitted ? '내 디펜스 시작' : (kind === 'linkushu' ? '발표 내용 제출 · 디펜스 시작' : '보고서 제출 · 디펜스 시작')) + '</button></div></div>';
      SECS.forEach(function (x) { U.$('#rp-' + x[0], box).oninput = function (e) { s.report[x[0]] = e.target.value; saveSoon(); }; });
      var lk = U.$('#links', box); if (lk) lk.oninput = function (e) { s.links = e.target.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); saveSoon(); };
      var lv = U.$('#lkView2', box); if (lv) lv.onclick = function () { AXP.linkushuReportModal(p); };
      U.$('#submitReport', box).onclick = function () {
        if (!(s.report.sum || '').trim()) { U.$('#rp-sum', box).focus(); return; }
        if (kind === 'linkushu' && s.report.slides) s.links = [s.report.slides.trim()];
        var b = this; b.disabled = true; b.textContent = '디펜스 질문을 준비하고 있어요…';
        var ins = (s.aiInserts || []), kept = ins.filter(function (a) { return (s.report[a.sec] || '').indexOf(a.text) >= 0; }).length;
        var pre = submitted ? Promise.resolve() : D.addLog({ projectId: p.id, stage: 'final', kind: '실행 판단', source: '문서 작성', text: (kind === 'linkushu' ? '링커슈 발표 내용 제출.' : '결과 보고서 제출.') + (ins.length ? ' AI 원문 ' + ins.length + '개 중 그대로 둔 것 ' + kept + '개.' : '') + '\n' + SECS.map(function (x) { return x[1] + ': ' + U.short((s.report[x[0]] || '').trim() || '(비어 있음)', 160); }).join('\n') });
        pre.then(function () {
          return AXP.AI.run('defense_q', { history: histText(p, me.id), report: SECS.map(function (x) { return x[1] + ': ' + (s.report[x[0]] || ''); }).join('\n') });
        }).then(function (r) {
          mine.defense = { questions: (r.questions || []).slice(0, 3), answers: [], startedAt: U.now() };
          if (!s.submittedAt) { s.submittedAt = U.now(); s.submittedBy = me.id; }
          return persist();
        }).then(function () { panel(); defense(); }).catch(function (e) { AXP.toast(e.message, true); b.disabled = false; b.textContent = '다시 시도'; });
      };
    }
    function defense() {
      var df = AXP.finalOf(p, me.id).defense;
      var shown = {};
      box.innerHTML = '<div class="card"><div class="row between"><h2>디펜스' + (team ? ' · ' + esc(me.name) : '') + '</h2><span class="badge violet">AI 사용 불가 · 붙여넣기 불가</span></div><p class="muted small mt8">내 판단 기록을 근거로 만든 질문이에요. 기록을 떠올리며 내 말로 답하세요. 답을 시작한 시각과 걸린 시간이 함께 남아요.</p>' +
        df.questions.map(function (q, i) { return '<div class="field mt16"><label class="lb" for="df' + i + '">Q' + (i + 1) + '. ' + esc(q) + '</label><textarea id="df' + i + '" rows="4">' + esc((df.answers[i] || {}).a || '') + '</textarea></div>'; }).join('') +
        '<div class="row end mt16"><button class="btn" id="dfSubmit">디펜스 제출</button></div><p class="small muted" id="dfStatus"></p></div>';
      df.questions.forEach(function (q, i) {
        var ta = U.$('#df' + i, box);
        ta.addEventListener('paste', function (e) { e.preventDefault(); AXP.toast('디펜스 답변은 직접 입력해 주세요', true); });
        ta.addEventListener('focus', function () { if (!shown[i]) shown[i] = Date.now(); });
      });
      U.$('#dfSubmit', box).onclick = function () {
        var ans = df.questions.map(function (q, i) { var v = U.$('#df' + i, box).value.trim(); return { q: q, a: v, sec: shown[i] ? Math.round((Date.now() - shown[i]) / 1000) : null }; });
        if (ans.some(function (x) { return !x.a; })) { U.$('#dfStatus', box).textContent = '모든 질문에 답해 주세요.'; return; }
        df.answers = ans; df.done = true; df.doneAt = U.now();
        var b = this; b.disabled = true; U.$('#dfStatus', box).textContent = 'AI Work Readiness 피드백을 만들고 있어요…';
        Promise.all(ans.map(function (x) { return D.addLog({ projectId: p.id, stage: 'final', kind: '실행 판단', source: '디펜스', text: 'Q: ' + x.q + '\nA: ' + x.a + (x.sec ? '\n(답변 시간 ' + x.sec + '초)' : '') }); }))
          .then(function () { return persist(); })
          .then(function () { return AXP.AI.run('readiness', { projectId: p.id, history: histText(p, me.id) }); })
          .then(function (r) {
            var mine = AXP.finalOf(p, me.id); mine.readiness = r; mine.readinessAt = U.now();
            if (!team) p.completedAt = U.now();
            else if ((p.members || []).every(function (m) { return d.final.byUser && d.final.byUser[m] && d.final.byUser[m].readiness; })) p.completedAt = U.now();
            var autoKey = kind === 'linkushu' ? 'linkushu' : kind === 'team' ? 'team_final' : 'final';
            var asg = DB.where('assignments', function (a) { return a.cohortId === p.cohortId && a.auto === autoKey; })[0];
            var body = kind === 'linkushu' ? AXP.linkushuReportText(p) : finalSecs().map(function (x) { return '[' + x[1] + '] ' + (d.final.report[x[0]] || ''); }).join('\n');
            if (asg) DB.put('submissions', { id: 'sub_final_' + p.id + '_' + me.id, assignmentId: asg.id, userId: me.id, status: '제출', title: p.title + (kind === 'linkushu' ? ' · 보고서·발표' : ' 결과 보고'), body: body, projectId: p.id, auto: true });
            return persist();
          }).then(function () { panel(); showReport(); AXP.toast('디펜스를 마쳤어요. 포트폴리오에 반영돼요'); })
          .catch(function (e) { U.$('#dfStatus', box).textContent = e.message; b.disabled = false; });
      };
    }
    function showReport() {
      var r = AXP.finalOf(p, me.id).readiness;
      var hasPersonal = kind === 'linkushu' && DB.where('projects', function (x) { return x.fromLinkushu === p.id && x.userId === me.id; })[0];
      box.innerHTML = AXP.readinessCard(r, { title: 'AI Work Readiness 피드백' + (team ? ' · ' + me.name : '') }) +
        '<div class="card"><h3>다음 단계</h3><div class="grid g2 mt12">' +
        (kind === 'linkushu'
          ? (hasPersonal ? '<a class="item click" href="#/project/' + hasPersonal.id + '/' + hasPersonal.stage + '" style="text-decoration:none;color:inherit"><h3>개인 프로젝트 이어서 하기</h3><p class="small muted">' + esc(hasPersonal.title) + '</p></a>' : '<button class="item click" id="toPersonal" style="text-align:left"><h3>이 제안으로 개인 프로젝트 시작</h3><p class="small muted">인터뷰·인사이트를 그대로 가져오고, 주제 선정부터 4주 동안 직접 만들어요.</p></button>')
          : '<a class="item click" href="#/portfolio" style="text-decoration:none;color:inherit"><h3>포트폴리오에 담기</h3><p class="small muted">대표 판단 3개를 고르고 공유 링크를 만들어요.</p></a>') +
        (kind !== 'linkushu' && c.parallelCaseId && !p.transfer ? '<button class="item click" id="transfer" style="text-align:left"><h3>전이 검증 미션</h3><p class="small muted">다른 회사 상황에서 코칭 없이 해 보며, 피드백을 스스로 챙기는지 확인해요.</p></button>' : '<a class="item click" href="#/submit" style="text-decoration:none;color:inherit"><h3>제출함 확인</h3><p class="small muted">' + (kind === 'linkushu' ? '링커슈 보고서·발표가' : '결과 보고가') + ' 제출함에 자동으로 들어갔어요.</p></a>') +
        '</div></div>';
      var tb = U.$('#transfer', box);
      if (tb) tb.onclick = function () {
        var pc = D.case(c.parallelCaseId);
        DB.put('projects', { id: U.uid('prj'), kind: 'personal', userId: me.id, members: [me.id], cohortId: p.cohortId, caseId: pc.id, title: '[전이 검증] ' + pc.company, mode: 'virtual', transfer: true, fromProjectId: p.id, focus: ((r && r.improve) || []).slice(0, 2), stage: 'prep', reached: 0, data: {} })
          .then(function (np) { AXP.toast('코칭 없는 미션을 시작해요'); AXP.go('#/project/' + np.id + '/prep'); });
      };
      var tp = U.$('#toPersonal', box);
      if (tp) tp.onclick = function () { AXP.startPersonalFromLinkushu(p); };
    }
  }


  /* ---------- 링커슈 보고서 (20기 양식 그대로 자동 완성) ---------- */
  function lkData(p) { var d = p.data || {}; return { job: d.job || {}, issue: d.issue || {}, propose: (d.propose || {}).secs || {}, final: d.final || {} }; }
  AXP.linkushuReportText = function (p) {
    var x = lkData(p), c = D.case(p.caseId) || {}, t = p.teamId ? D.team(p.teamId) : null;
    return ['[링커슈] 직무/산업 이슈 보고서', '직무: ' + (c.track || ''), '팀명: ' + (t ? t.name : '-'), '팀원: ' + (p.members || []).map(function (m) { return D.user(m).name; }).join(', '),
      '', 'Ⅰ. 직무 탐구 (인터뷰 전)', '[세부 역할 및 업무] ' + (x.job.roles || ''), '[필요 역량 및 지식] ' + (x.job.skills || ''), '[미래 전망] ' + (x.job.future || ''),
      '', 'Ⅱ. 이슈 탐구 (인터뷰 전)', '[선정한 이슈] ' + (x.issue.keyword || ''), '[참고 기사] ' + (x.issue.links || ''), '[이슈 설명] 1. ' + (x.issue.define || '') + ' 2. ' + (x.issue.background || ''), '[이슈 분석] 1. ' + (x.issue.cases || '') + ' 2. ' + (x.issue.trend || ''),
      '', 'Ⅲ. AI 프로젝트 제안 (인터뷰 후)', '[문제 정의] ' + (x.propose.problem || ''), '[프로젝트 개요] ' + (x.propose.overview || ''), '[데이터·AI 방식·기능·흐름] ' + (x.propose.how || ''), '[기대 효과] ' + (x.propose.effect || ''), '[실현가능성 및 리스크] ' + (x.propose.risk || ''),
      '', '[발표] ' + ((x.final.report || {}).sum || '') + ((x.final.report || {}).slides ? ' · ' + x.final.report.slides : '')].join('\n');
  };
  AXP.linkushuReportModal = function (p) {
    var x = lkData(p), c = D.case(p.caseId) || {}, t = p.teamId ? D.team(p.teamId) : null;
    var row = function (k, v, hint) { return '<tr><th style="width:150px;vertical-align:top">' + esc(k) + '</th><td class="pre">' + (v ? esc(v) : '<span class="muted">' + esc(hint || '아직 작성 전') + '</span>') + '</td></tr>'; };
    var html = '<div id="lkRep"><h2 style="text-align:center">[링커슈] 직무/산업 이슈 보고서</h2><table class="t mt12"><tbody>' + row('직무', c.track) + row('팀명', t ? t.name : '') + row('팀원(역할)', (p.members || []).map(function (m) { return D.user(m).name; }).join(', ')) + '</tbody></table>' +
      '<h3 class="mt16">Ⅰ. 직무 탐구 (인터뷰 전 작성)</h3><table class="t"><tbody>' + row('세부 역할 및 업무', x.job.roles) + row('필요 역량 및 지식', x.job.skills) + row('미래 전망', x.job.future) + '</tbody></table>' +
      '<h3 class="mt16">Ⅱ. 이슈 탐구 (인터뷰 전 작성)</h3><table class="t"><tbody>' + row('선정한 이슈', (x.issue.keyword || '') + (x.issue.links ? '\n※ 출처: ' + x.issue.links : '')) + row('이슈 설명', (x.issue.define ? '1. ' + x.issue.define : '') + (x.issue.background ? '\n2. ' + x.issue.background : '')) + row('이슈 분석', (x.issue.cases ? '1. ' + x.issue.cases : '') + (x.issue.trend ? '\n2. ' + x.issue.trend : '')) + '</tbody></table>' +
      '<h3 class="mt16">Ⅲ. AI 프로젝트 제안 (인터뷰 후 작성)</h3><table class="t"><tbody>' + row('문제 정의', x.propose.problem) + row('프로젝트 개요', x.propose.overview) + row('데이터 · AI 방식', x.propose.how) + row('기대 효과', x.propose.effect) + row('실현가능성 및 리스크', x.propose.risk) + '</tbody></table>' +
      '<p class="tiny muted mt12">AX Proof가 링커슈 프로젝트의 작성 내용으로 자동 완성한 보고서예요. 각 칸의 판단 과정은 판단 기록에 남아 있어요.</p></div>';
    var m = AXP.modal({ title: '링커슈 보고서', sub: '20기 링커슈 보고서 양식으로 자동 정리했어요.', wide: true, body: html + '<div class="row end mt12"><button class="btn ghost" id="lkCopy">텍스트 복사</button><button class="btn" id="lkPrint">인쇄 · PDF</button></div>' });
    U.$('#lkCopy', m.body).onclick = function () { U.copy(AXP.linkushuReportText(p)); };
    U.$('#lkPrint', m.body).onclick = function () {
      var w = window.open('', '_blank'); if (!w) return AXP.toast('팝업이 막혀 있어요', true);
      w.document.write('<html><head><meta charset="utf-8"><title>링커슈 보고서</title><style>body{font-family:Pretendard,Malgun Gothic,sans-serif;max-width:820px;margin:32px auto;line-height:1.7;color:#1B2420}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ccc;padding:8px 10px;text-align:left;font-size:14px;white-space:pre-wrap}th{background:#f3f3f0;width:150px}h2{text-align:center}.muted,.tiny{color:#777;font-size:12px}</style></head><body>' + U.$('#lkRep', m.body).innerHTML + '</body></html>');
      w.document.close(); setTimeout(function () { w.print(); }, 300);
    };
  };
  // 링커슈 제안을 이어받아 개인 프로젝트 시작: 인터뷰·인사이트는 가져오고 주제 선정부터
  AXP.startPersonalFromLinkushu = function (lk) {
    var me = D.me(), d = lk.data || {}, pr = (d.propose || {}).secs || {};
    var copy = function (o) { return JSON.parse(JSON.stringify(o || {})); };
    var pains = ((d.insight || {}).pains || []).filter(function (x) { return x.text && x.text.trim(); });
    var data = { prep: copy(d.prep), talk: copy(d.talk), insight: copy(d.insight),
      topic: { cands: pains.map(function (x, i) { return { text: x.text.trim(), on: i < 2, pick: false, fit: 0, impact: 0, doable: 0 }; }), why: '', drop: (d.propose || {}).drop || '', fromLinkushu: true, proposal: pr.problem || '' },
      plan: { secs: { bg: pr.problem || '', how: pr.how || '', risk: pr.risk || '', goal: pr.effect ? '기대 효과(링커슈 제안): ' + pr.effect : '' } } };
    return DB.put('projects', { id: U.uid('prj'), kind: 'personal', fromLinkushu: lk.id, userId: me.id, members: [me.id], cohortId: me.cohortId, caseId: lk.caseId, title: (pr.overview ? U.short(pr.overview, 28) : '개인 프로젝트'), mode: (d.talk || {}).mode || 'virtual', stage: 'topic', reached: 3, data: data })
      .then(function (np) {
        D.addLog({ projectId: np.id, stage: 'topic', kind: '문제 정의', source: '문서 작성', text: '링커슈 제안을 이어받아 개인 프로젝트 시작. 가져온 것: 인터뷰 준비·인터뷰 기록·인사이트(발견 ' + pains.length + '개). 주제 선정부터 다시 판단.' });
        AXP.toast('링커슈에서 이어받았어요. 주제 선정부터 해요'); AXP.go('#/project/' + np.id + '/topic');
      });
  };

  // 제출함에 내기 (편집 후 제출)
  function editSubmit(asg, title, body, kind) {
    var me = D.me();
    var md = AXP.modal({ title: '제출하기' + (asg ? ' · ' + asg.title : ''), sub: 'AI가 정리한 초안이에요. 내 말로 고쳐서 내세요. 고친 정도가 함께 기록돼요.', wide: true,
      body: '<label class="lb" for="sbT">제목</label><input type="text" id="sbT" value="' + esc(title) + '"><label class="lb mt12" for="sbB">내용</label><textarea id="sbB" rows="14">' + esc(body) + '</textarea><div class="row end mt12"><button class="btn" id="sbGo">제출</button></div>' });
    U.$('#sbGo', md.body).onclick = function () {
      var b = U.$('#sbB', md.body).value;
      var same = b.trim() === body.trim();
      DB.put('submissions', { id: U.uid('sub'), assignmentId: asg ? asg.id : '', userId: me.id, status: '제출', title: U.$('#sbT', md.body).value, body: b, aiDraft: true, aiUnchanged: same, kind: kind })
        .then(function () { md.close(); AXP.toast('제출했어요' + (same ? ' (AI 초안 그대로 제출로 표시돼요)' : '')); });
    };
  }
  AXP.editSubmit = editSubmit;

  // Readiness 카드 (훈련생·멘토·운영진·공개 포트폴리오 공용)
  AXP.readinessCard = function (r, opts) {
    opts = opts || {};
    if (!r) return '';
    var lv = r.levels || {};
    return '<div class="card"><div class="card-head"><div><h2>' + esc(opts.title || 'AI Work Readiness') + '</h2><p>사람 검토자 채점과의 일치가 확인되기 전까지는 \'평가\'가 아니라 \'피드백\'이에요. 모든 판단은 기록에 근거해요.</p></div>' +
      (r.delegation ? '<span class="badge ' + (/독립/.test(r.delegation.level) ? 'green' : /리더/.test(r.delegation.level) ? 'blue' : 'gold') + '">업무 위임 수준 · ' + esc(r.delegation.level) + '</span>' : '') + '</div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">' + AXP.COMPETENCIES.map(function (k) { var v = Math.max(0, Math.min(4, Number(lv[k]) || 0)); return '<div class="item"><div class="row between" style="flex-wrap:nowrap"><b class="small">' + esc(k) + '</b><span class="small muted">Lv.' + (v || '—') + '</span></div><div class="mt8">' + AXP.h.lv(v) + '</div></div>'; }).join('') + '</div>' +
      (r.delegation && r.delegation.why ? '<p class="small muted mt12">' + esc(r.delegation.why) + '</p>' : '') +
      ((r.scenes || []).length ? '<h3 class="mt16">대표 판단 장면</h3>' + r.scenes.map(function (x) { return '<div class="tip good">' + esc(x) + '</div>'; }).join('') : '') +
      '<div class="grid g2 mt16"><div><h3>좋았던 점</h3>' + (r.strengths || []).map(function (x) { return '<p class="small mt8">· ' + esc(x) + '</p>'; }).join('') + '</div><div><h3>개선할 점</h3>' + (r.improve || []).map(function (x) { return '<p class="small mt8">· ' + esc(x) + '</p>'; }).join('') + '</div></div>' +
      (r.next ? '<div class="note mt16"><b>다음 프로젝트에서</b> · ' + esc(r.next) + '</div>' : '') +
      (opts.showInterview && (r.interview || []).length ? '<h3 class="mt16">면접에서 확인할 질문</h3>' + r.interview.map(function (x) { return '<p class="small mt8">· ' + esc(x) + '</p>'; }).join('') : '') + '</div>';
  };
})();
