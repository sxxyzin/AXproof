/* AX Proof · AI 클라이언트
   - 서버에 API 키가 연결돼 있으면 /api/ai 로 실제 모델 호출 (키는 서버에만 있음)
   - 아니면 prompts.js 의 데모 응답으로 동작 (화면 체험용) */
(function () {
  var AXP = window.AXP, U = AXP.U;
  var refreshing = null;

  var AI = AXP.AI = {
    forcedDemo: false,
    isLive: function () {
      var h = AXP.Mode.health;
      return !AI.forcedDemo && AXP.Mode.server && !!h && !!h.ai && (h.ai.anthropic || h.ai.openai);
    },
    label: function () {
      if (!AI.isLive()) return { text: '데모 응답', cls: 'gold', title: 'API 키를 연결하면 실제 AI가 답합니다 (운영진 > AI 설정)' };
      var h = AXP.Mode.health.ai;
      var pref = U.ls.get('axp:provider', '');
      var configured = (AXP.DB.get('settings', 'ai') || {}).provider || 'openai';
      var p = pref && h[pref] ? pref : h[configured] ? configured : (h.openai ? 'openai' : 'anthropic');
      return { text: p === 'anthropic' ? 'Claude 연결됨' : 'GPT 연결됨', cls: 'green', title: '서버를 거쳐 실제 모델이 답합니다' };
    },
    provider: function () { return U.ls.get('axp:provider', '') || undefined; },

    // 열어 둔 탭에서도 키 연결·서버 재시작 뒤의 상태로 모든 AI 도구를 실행합니다.
    ready: function () {
      if (!AXP.Mode.server || AI.forcedDemo) return Promise.resolve();
      if (!refreshing) refreshing = AXP.api('api/health').then(function (h) {
        if (!h || h.app !== 'axproof' || !h.ai) throw new Error('AI 연결 상태를 확인하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        AXP.Mode.health = h;
        var label = AI.label();
        U.$$('[data-ai-status]').forEach(function (el) { el.textContent = label.text; el.className = 'badge ' + label.cls; el.title = label.title; });
      }).then(function () { refreshing = null; }, function (e) { refreshing = null; throw e; });
      return refreshing;
    },

    run: function (task, ctx) {
      var t = AXP.TASKS[task];
      if (!t) return Promise.reject(new Error('알 수 없는 작업: ' + task));
      return AI.ready().then(function () { return AI.runReady(task, ctx || {}, t); });
    },
    runReady: function (task, ctx, t) {
      if (!AI.isLive() && !(task === 'readiness' && AXP.Mode.server)) return delay(t.mock(ctx), 500 + Math.random() * 500);
      var req = t.build(ctx);
      return AXP.api('api/ai', { method: 'POST', body: { task: task, projectId: ctx.projectId || (ctx.project && ctx.project.id), caseId: ctx.case && ctx.case.id, tier: t.tier, json: t.json, system: req.system, messages: req.messages, provider: AI.provider() } })
        .then(function (j) {
          if (!t.json) return j.text;
          var o = U.parseJSON(j.text);
          if (!o) throw new Error('AI 응답을 읽지 못했어요. 다시 시도해 주세요.');
          if (t.validate) t.validate(o);
          if (t.withMeta) o._ai = { mode: j.provider === 'demo' ? 'demo' : 'model', provider: j.provider, model: j.model, at: U.now() };
          return o;
        })
        .catch(function (e) {
          if (e.status === 503 && e.data && e.data.error === 'no_key') throw new Error('AI 키 연결이 해제됐어요. 운영진의 AI 설정을 확인하고 다시 시도해 주세요.');
          throw e;
        });
    },

    // 스트리밍 대화 (AI 사수·업무용 AI)
    stream: function (task, ctx, onText) {
      var t = AXP.TASKS[task];
      if (!t) return Promise.reject(new Error('알 수 없는 작업: ' + task));
      return AI.ready().then(function () { return AI.streamReady(task, ctx || {}, onText, t); });
    },
    streamReady: function (task, ctx, onText, t) {
      if (!AI.isLive()) return fakeStream(t.mock(ctx), onText);
      var req = t.build(ctx);
      var headers = { 'Content-Type': 'application/json' };
      if (AXP.Session.token) headers.Authorization = 'Bearer ' + AXP.Session.token;
      return fetch('api/ai', { method: 'POST', headers: headers, body: JSON.stringify({ task: task, projectId: ctx.projectId || (ctx.project && ctx.project.id), caseId: ctx.case && ctx.case.id, tier: t.tier, stream: true, system: req.system, messages: req.messages, provider: AI.provider() }) })
        .then(function (r) {
          if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
            if (r.status === 503 && j.error === 'no_key') throw new Error('AI 키 연결이 해제됐어요. 운영진의 AI 설정을 확인하고 다시 시도해 주세요.');
            var e = new Error(j.error || ('오류 ' + r.status)); e.status = r.status; throw e;
          });
          var reader = r.body.getReader(), dec = new TextDecoder(), text = '';
          function pump() {
            return reader.read().then(function (x) {
              if (x.done) return text;
              var chunk = dec.decode(x.value, { stream: true });
              text += chunk;
              var k = text.indexOf('\u0000ERR:');
              if (k >= 0) { onText(text.slice(0, k)); throw new Error(text.slice(k + 5)); }
              onText(text);
              return pump();
            });
          }
          return pump();
        });
    }
  };

  function delay(v, ms) { return new Promise(function (r) { setTimeout(function () { r(v); }, ms); }); }
  function fakeStream(text, onText) {
    text = String(text);
    return new Promise(function (resolve) {
      var i = 0;
      (function tick() {
        i = Math.min(text.length, i + 3 + Math.floor(Math.random() * 6));
        onText(text.slice(0, i));
        if (i >= text.length) return resolve(text);
        setTimeout(tick, 18);
      })();
    });
  }
})();
