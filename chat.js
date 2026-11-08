/* AX Proof · 채팅 컴포넌트
   - AI 사수(멘토) 대화: 프리셉터 단계에 맞춰 개입 수준이 달라짐
   - 업무용 AI(작업대): AI 답마다 쓴다·고친다·버린다·보류 → 판단 기록 자동 생성
   - 외부 대화 가져오기: ChatGPT·Claude 등에서 나눈 대화를 붙여넣어 과정 기록·평가에 포함 */
(function () {
  var AXP = window.AXP, U = AXP.U, DB = AXP.DB, D = AXP.D, esc = U.esc;
  var Chat = AXP.Chat = {};

  var MODE = {
    mentor: { label: 'AI 사수', cls: 'mentor', av: '', task: 'mentor_chat', hint: '막힌 지점이나 고민을 말해 보세요. 사수는 답 대신 생각할 길을 알려 줘요.' },
    work: { label: '업무용 AI', cls: 'work', av: 'blue', task: 'work_chat', hint: '업무용 AI에게 일을 맡겨 보세요. 답마다 쓸지·고칠지·버릴지 판단하면 기록이 남아요.' },
    external: { label: '외부 대화', cls: 'work', av: 'blue', task: null, hint: '' }
  };

  function ctxFor(projectId, chat) {
    var me = D.me(), p = projectId ? DB.get('projects', projectId) : D.myProjects()[0];
    var c = p ? D.case(p.caseId) : null;
    return { user: me, project: p, case: c, stage: p ? p.stage : 'onboarding', level: p && (p.transfer || AXP.inDefense(p, me.id)) ? 'solo' : undefined, topic: p && p.data && p.data.topic ? p.data.topic.pick : '', logs: D.logsOf(me.id, p ? p.id : null), messages: [] };
  }
  Chat.ctxFor = ctxFor;

  // 외부 대화 텍스트 → 메시지 배열
  Chat.parseTranscript = function (raw) {
    var lines = String(raw || '').replace(/\r/g, '').split('\n');
    var userRe = /^\s*(나|사용자|user|you|you said|human|훈련생|me|질문)\s*[:：]?\s*$/i;
    var userInline = /^\s*(나|사용자|user|you|human|훈련생|me|질문)\s*[:：]\s*(.+)$/i;
    var aiRe = /^\s*(chatgpt|gpt|claude|gemini|copilot|assistant|ai|chatgpt said|claude said|답변|어시스턴트)\s*[:：]?\s*$/i;
    var aiInline = /^\s*(chatgpt|gpt|claude|gemini|copilot|assistant|ai|답변|어시스턴트)\s*[:：]\s*(.+)$/i;
    var out = [], cur = null;
    lines.forEach(function (ln) {
      var m;
      if (/^\s*you said\s*:?\s*$/i.test(ln) || userRe.test(ln)) { cur = { role: 'user', content: '' }; out.push(cur); return; }
      if (/^\s*(chatgpt|claude|gemini) said\s*:?\s*$/i.test(ln) || aiRe.test(ln)) { cur = { role: 'assistant', content: '' }; out.push(cur); return; }
      if ((m = ln.match(userInline))) { cur = { role: 'user', content: m[2] }; out.push(cur); return; }
      if ((m = ln.match(aiInline))) { cur = { role: 'assistant', content: m[2] }; out.push(cur); return; }
      if (!cur) { cur = { role: 'user', content: '' }; out.push(cur); }
      cur.content += (cur.content ? '\n' : '') + ln;
    });
    out = out.map(function (m) { return { role: m.role, content: m.content.trim() }; }).filter(function (m) { return m.content; });
    if (out.length <= 1) return [{ role: 'assistant', content: String(raw).trim() }];
    return out;
  };
  Chat.transcriptText = function (chat, persona) {
    return (chat.messages || []).map(function (m) { return (m.role === 'user' ? '나: ' : (persona || 'AI') + ': ') + m.content; }).join('\n');
  };

  /**
   * opts: { chatId, mode, projectId, compact, onLog }
   */
  Chat.mount = function (el, opts) {
    opts = opts || {};
    var me = D.me();
    var chat = opts.chatId ? DB.get('chats', opts.chatId) : null;
    var mode = chat ? chat.mode : (opts.mode || 'mentor');
    var busy = false;
    var persona = AXP.personaOf(ctxFor(opts.projectId));

    function newChat() {
      return { id: U.uid('cht'), userId: me.id, projectId: opts.projectId || ((D.myProjects()[0] || {}).id || ''), mode: mode, title: '', messages: [] };
    }
    if (!chat) chat = newChat();

    function head() {
      var M = MODE[mode];
      var ctx = ctxFor(chat.projectId);
      var lv = AXP.levelOf({ stage: ctx.stage, level: ctx.level });
      var who = mode === 'mentor' ? '<div class="persona-card"><div class="av">' + esc(persona.name.slice(-2)) + '</div><div><b>AI 사수 · ' + esc(persona.name) + '</b><span>' + esc(persona.title) + ' · 지금 단계 「' + esc(lv.name) + '」</span></div></div>' :
        mode === 'work' ? '<div class="persona-card"><div class="av blue">AI</div><div><b>업무용 AI</b><span>답마다 쓴다·고친다·버린다·보류로 판단을 남겨요</span></div></div>' :
        '<div class="persona-card"><div class="av blue">↧</div><div><b>외부 대화 · ' + esc(chat.source || '') + '</b><span>붙여넣은 대화 · 판단을 표시하면 기록에 남아요</span></div></div>';
      var h = AXP.Mode.health, both = AXP.AI.isLive() && h.ai.anthropic && h.ai.openai;
      var model = both && mode !== 'external' ? '<select data-provider style="width:auto;padding:5px 8px;font-size:13px"><option value="anthropic">Claude</option><option value="openai">GPT</option></select>' : '<span data-ai-status class="badge ' + AXP.AI.label().cls + '" title="' + esc(AXP.AI.label().title) + '">' + esc(AXP.AI.label().text) + '</span>';
      return '<div class="chat-top">' + who + '<div class="row">' + model +
        (chat.capture && chat.capture.status === 'pending' ? '<button class="btn sm ghost" data-retry>자동 기록 재시도</button>' : '') +
        (chat.messages.length ? '<button class="btn sm ghost" data-extract title="대화에서 판단의 순간을 찾아 기록 후보로 보여 줘요">판단 후보 찾기</button>' : '') +
        (opts.compact ? '' : '<button class="btn sm ghost" data-copy title="대화 내용을 복사합니다">복사</button>') + '</div></div>';
    }
    function msgHTML(m, i) {
      if (m.role === 'user') return '<div class="msg me"><span class="who">나 · ' + U.fmt(m.t, true) + '</span>' + esc(m.content) + (DB.where('logs', function (l) { return l.chatId === chat.id && l.messageIndex === i; }).length ? '<a class="evidence-saved" href="#/portfolio">✓ 내 판단이 포트폴리오에 자동 저장됐어요</a>' : '') + '</div>';
      var M = MODE[mode];
      var who = mode === 'mentor' ? 'AI 사수 ' + persona.name : mode === 'work' ? '업무용 AI' : (chat.source || 'AI');
      var acts = '';
      if (mode !== 'mentor') {
        if (m.decision) acts = '<div class="logged">판단 기록됨 · <b>' + esc(m.decision.action) + '</b> — ' + esc(U.short(m.decision.reason, 80)) + '</div>';
        else if (m.content && i > 0 || mode === 'external') acts = '<div class="acts">' + AXP.ACTIONS.map(function (a) { return '<button class="chip" data-act="' + a + '" data-i="' + i + '">' + a + '</button>'; }).join('') + '<button class="chip" data-copymsg="' + i + '">복사</button></div>';
        var targets = mode === 'work' && opts.insertTargets ? opts.insertTargets() : null;
        if (targets && targets.length && m.content) acts += '<div class="acts"><select data-tgt="' + i + '" style="width:auto;padding:3px 8px;font-size:12.5px">' + targets.map(function (t) { return '<option value="' + esc(t[0]) + '">' + esc(t[1]) + '</option>'; }).join('') + '</select><button class="chip" data-ins="' + i + '">' + (m.inserted ? '다시 넣기' : '문서에 넣기') + '</button></div>';
      }
      return '<div class="msg ai ' + M.cls + '"><span class="who">' + esc(who) + (m.t ? ' · ' + U.fmt(m.t, true) : '') + '</span><span data-body>' + esc(m.content) + '</span>' + acts + '</div>';
    }
    function render() {
      var M = MODE[mode];
      el.innerHTML = '<div class="chat">' + head() + '<div class="capture-note">선택과 이유가 드러난 내 말은 비공개 포트폴리오에 자동으로 쌓여요. 공개할 기록은 직접 고릅니다.</div><div class="chat-log" id="log_' + chat.id + '">' +
        (chat.messages.length ? '' : '<div class="msg sys">' + esc(M.hint || '') + '</div>') +
        chat.messages.map(msgHTML).join('') + '</div>' +
        (mode === 'external' ? '' : '<form class="composer" data-form><textarea rows="1" placeholder="' + (mode === 'mentor' ? (opts.compact ? 'AI 사수에게 묻기' : 'AI 사수에게 물어보기 (Enter 전송, Shift+Enter 줄바꿈)') : '업무용 AI에게 요청하기') + '" aria-label="메시지"></textarea><button class="btn" type="submit">보내기</button></form>') + '</div>';
      bind();
      var log = el.querySelector('.chat-log'); log.scrollTop = log.scrollHeight;
    }
    function save() {
      if (!chat.messages.length) return Promise.resolve();
      if (!chat.title) chat.title = U.short((chat.messages.find(function (m) { return m.role === 'user'; }) || chat.messages[0]).content, 30);
      return DB.put('chats', chat).then(function (c) { chat = c; return AXP.Mode.server ? null : AXP.Evidence.demo(chat); }).then(function () { if (opts.onSave) opts.onSave(chat); });
    }
    function bind() {
      var f = el.querySelector('[data-form]');
      if (f) {
        var ta = f.querySelector('textarea');
        ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(180, ta.scrollHeight) + 'px'; });
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); f.requestSubmit(); } });
        f.onsubmit = function (e) { e.preventDefault(); send(ta.value.trim()); };
      }
      var sel = el.querySelector('[data-provider]');
      if (sel) { sel.value = AXP.AI.provider() || (DB.get('settings', 'ai') || {}).provider || 'openai'; sel.onchange = function () { U.ls.set('axp:provider', sel.value); }; }
      var cp = el.querySelector('[data-copy]'); if (cp) cp.onclick = function () { U.copy(Chat.transcriptText(chat, mode === 'mentor' ? 'AI 사수' : 'AI')); };
      var ex = el.querySelector('[data-extract]'); if (ex) ex.onclick = function () { extract(); };
      var retry = el.querySelector('[data-retry]'); if (retry) retry.onclick = function () { retry.disabled = true; AXP.Evidence.retry(chat.id).then(function (c) { chat = c; render(); }).catch(function (e) { AXP.toast(e.message, true); retry.disabled = false; }); };
      U.$$('[data-act]', el).forEach(function (b) { b.onclick = function () { decide(Number(b.getAttribute('data-i')), b.getAttribute('data-act')); }; });
      U.$$('[data-copymsg]', el).forEach(function (b) { b.onclick = function () { U.copy(chat.messages[Number(b.getAttribute('data-copymsg'))].content); }; });
      U.$$('[data-ins]', el).forEach(function (b) {
        b.onclick = function () {
          var i = Number(b.getAttribute('data-ins')), key = el.querySelector('[data-tgt="' + i + '"]').value;
          chat.messages[i].inserted = true; save();
          if (opts.onInsert) opts.onInsert(key, chat.messages[i].content);
          b.textContent = '넣음'; b.disabled = true;
        };
      });
    }
    function send(text) {
      if (!text || busy) return;
      busy = true;
      chat.messages.push({ id: U.uid('msg'), role: 'user', content: text, t: U.now() });
      chat.messages.push({ role: 'assistant', content: '', t: U.now() });
      render();
      var bubble = el.querySelectorAll('.msg.ai'); bubble = bubble[bubble.length - 1];
      var body = bubble.querySelector('[data-body]'); body.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
      var ctx = ctxFor(chat.projectId); ctx.messages = chat.messages.slice(0, -1).map(function (m) { return { role: m.role, content: m.content }; }).slice(-20);
      var log = el.querySelector('.chat-log');
      var responseReceived = false;
      AXP.AI.stream(MODE[mode].task, ctx, function (t) { body.textContent = t; log.scrollTop = log.scrollHeight; })
        .then(function (t) { responseReceived = true; chat.messages[chat.messages.length - 1].content = t; return save(); })
        .catch(function (e) { if (!responseReceived) { chat.messages.pop(); chat.messages.pop(); } AXP.toast(responseReceived ? '대화 저장이 안 됐어요. 다시 시도해 주세요: ' + e.message : (e.message || '응답이 끊겼어요'), true); })
        .then(function () { busy = false; render(); var ta = el.querySelector('textarea'); if (ta) ta.focus(); });
    }
    // 업무용 AI·외부 대화: AI 답에 대한 판단 → 판단 기록
    function decide(i, action) {
      var m = chat.messages[i];
      var prevUser = (chat.messages.slice(0, i).reverse().find(function (x) { return x.role === 'user'; }) || {}).content || '';
      var ph = { '쓴다': '왜 그대로 써도 된다고 판단했나요? (예: 출처를 확인했다)', '고친다': '무엇을 왜 고쳤나요?', '버린다': '왜 쓰지 않기로 했나요?', '보류': '무엇을 더 확인해야 하나요?' }[action];
      var md = AXP.modal({ title: 'AI 답을 「' + action + '」', sub: '15초면 충분해요. 저장하면 시각이 찍히고 원본이 잠겨요.',
        body: '<div class="tl-orig">' + esc(U.short(m.content, 400)) + '</div><label class="lb mt12">판단 유형</label><div class="chips" data-kinds>' + AXP.KINDS.map(function (k, j) { return '<button type="button" class="chip" aria-pressed="' + (k === (action === '쓴다' ? '실행 판단' : 'AI 검증') ? 'true' : 'false') + '" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
          '<label class="lb mt12" for="dReason">한 줄 이유</label><input type="text" id="dReason" placeholder="' + esc(ph) + '"><div class="row end mt16"><button class="btn" id="dSave">기록하기</button></div>' });
      var kind = action === '쓴다' ? '실행 판단' : 'AI 검증';
      U.$$('[data-k]', md.body).forEach(function (b) { b.onclick = function () { kind = b.getAttribute('data-k'); U.$$('[data-k]', md.body).forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); }; });
      U.$('#dSave', md.body).onclick = function () {
        var reason = U.$('#dReason', md.body).value.trim();
        if (!reason) { U.$('#dReason', md.body).focus(); return; }
        var p = chat.projectId ? DB.get('projects', chat.projectId) : null;
        D.addLog({ projectId: chat.projectId, stage: p ? p.stage : (mode === 'external' ? 'external' : 'chat'), kind: kind, source: mode === 'external' ? '외부 대화' : 'AI 대화', action: action,
          aiMessage: U.short(m.content, 600), text: '요청: ' + U.short(prevUser, 100) + '\nAI 답을 「' + action + '」 — ' + reason }).then(function (l) {
          m.decision = { action: action, reason: reason, logId: l.id };
          save().then(render); md.close(); AXP.toast('판단 기록에 남겼어요'); if (opts.onLog) opts.onLog(l);
        });
      };
    }
    // 대화에서 판단 후보 찾기 → 확인한 것만 기록
    function extract() {
      var md = AXP.modal({ title: '판단 후보 찾기', sub: '대화에서 판단의 순간을 찾아요. 맞는 것만 골라 기록하세요. 없는 판단은 만들지 않아요.', body: '<p class="muted">대화를 읽고 있어요…</p>', wide: true });
      AXP.AI.run('extract_decisions', { transcript: Chat.transcriptText(chat, mode === 'mentor' ? 'AI 사수' : 'AI'), source: mode === 'external' ? chat.source : (mode === 'mentor' ? 'AI 사수 대화' : '업무용 AI 대화') }).then(function (r) {
        var items = (r && r.items) || [];
        if (!items.length) { md.body.innerHTML = '<div class="note gold">' + esc((r && r.note) || '판단의 순간을 찾지 못했어요.') + '</div>'; return; }
        md.body.innerHTML = items.map(function (it, i) {
          return '<label class="item check" style="display:flex"><input type="checkbox" checked data-c="' + i + '"><div><div class="row"><span class="badge">' + esc(it.kind) + '</span>' + (it.action ? '<span class="badge blue">' + esc(it.action) + '</span>' : '') + '</div><div class="mt8">' + esc(it.text) + '</div>' + (it.quote ? '<div class="tiny muted mt8">근거: "' + esc(it.quote) + '"</div>' : '') + '</div></label>';
        }).join('') + '<div class="row end mt16"><button class="btn" id="exSave">고른 판단 기록하기</button></div>';
        U.$('#exSave', md.body).onclick = function () {
          var picks = U.$$('[data-c]', md.body).filter(function (c) { return c.checked; }).map(function (c) { return items[Number(c.getAttribute('data-c'))]; });
          var p = chat.projectId ? DB.get('projects', chat.projectId) : null;
          var src = mode === 'external' ? '외부 대화' : mode === 'mentor' ? '멘토 대화' : 'AI 대화';
          Promise.all(picks.map(function (it) { return D.addLog({ projectId: chat.projectId, stage: p ? p.stage : 'chat', kind: AXP.KINDS.indexOf(it.kind) >= 0 ? it.kind : '실행 판단', source: src, action: it.action || '', text: it.text + (it.quote ? '\n근거: "' + it.quote + '"' : '') }); }))
            .then(function () { md.close(); AXP.toast(picks.length + '개를 판단 기록에 남겼어요'); if (opts.onLog) opts.onLog(); });
        };
      }).catch(function (e) { md.body.innerHTML = '<div class="note red">' + esc(e.message) + '</div>'; });
    }

    render();
    return { chat: function () { return chat; }, reset: function (m) { mode = m || mode; chat = newChat(); chat.mode = mode; render(); } };
  };

  // 외부 대화 가져오기 모달
  Chat.importModal = function (projectId, done) {
    var me = D.me();
    var md = AXP.modal({ title: '외부 AI 대화 가져오기', sub: 'ChatGPT·Claude·Gemini 등에서 나눈 대화를 그대로 붙여넣으세요. 과정 기록과 평가에 함께 쓰여요. 개인정보는 지우고 붙여넣어 주세요.', wide: true,
      body: '<div class="grid g2"><div><label class="lb" for="exSrc">어디서 나눈 대화인가요?</label><select id="exSrc"><option>ChatGPT</option><option>Claude</option><option>Gemini</option><option>Copilot</option><option>뤼튼</option><option>기타</option></select></div>' +
        '<div><label class="lb" for="exPrj">연결할 프로젝트</label><select id="exPrj"><option value="">(연결 안 함)</option>' + D.myProjects().map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === projectId ? ' selected' : '') + '>' + esc(p.title) + '</option>'; }).join('') + '</select></div></div>' +
        '<label class="lb mt12" for="exRaw">대화 내용 <span class="hint">"나:", "ChatGPT:", "You said" 같은 표시가 있으면 자동으로 나눠요</span></label><textarea id="exRaw" rows="12" placeholder="나: 해지 사유 분류 기준 만들어줘\nChatGPT: 1. 가격 부담 2. ..."></textarea>' +
        '<label class="lb mt12" for="exUrl">공유 링크 (선택)</label><input type="url" id="exUrl" placeholder="https://chatgpt.com/share/..."><div class="row end mt16"><button class="btn" id="exGo">가져오기</button></div>' });
    U.$('#exGo', md.body).onclick = function () {
      var raw = U.$('#exRaw', md.body).value.trim(); if (!raw) { U.$('#exRaw', md.body).focus(); return; }
      var msgs = Chat.parseTranscript(raw).map(function (m) { return Object.assign(m, { t: U.now() }); });
      var src = U.$('#exSrc', md.body).value;
      var rec = { id: U.uid('cht'), userId: me.id, projectId: U.$('#exPrj', md.body).value, mode: 'external', source: src, url: U.$('#exUrl', md.body).value.trim(), title: src + ' · ' + U.short((msgs.find(function (m) { return m.role === 'user'; }) || msgs[0]).content, 24), messages: msgs, raw: raw.length > 20000 ? '' : raw };
      DB.put('chats', rec).then(function (c) {
        var p = c.projectId ? DB.get('projects', c.projectId) : null;
        D.addLog({ projectId: c.projectId, stage: p ? p.stage : 'external', kind: 'AI 검증', source: '외부 대화', text: src + ' 대화 ' + msgs.length + '개 메시지를 가져옴' + (c.url ? ' (공유 링크 첨부)' : '') + '. 판단 표시 전.' });
        md.close(); AXP.toast('대화를 가져왔어요. AI 답마다 판단을 표시해 보세요'); if (done) done(c);
      });
    };
  };
})();
