(function () {
  var A = window.AXP, DB = A.DB, U = A.U;
  A.Evidence = {
    demo: function (chat) {
      var me = A.D.me(), found = [];
      if (!me || me.role !== 'learner') return Promise.resolve();
      (chat.messages || []).forEach(function (m, i) {
        if (m.role !== 'user') return;
        var it = window.AXP_DECISIONS.detect(m.content), id = 'auto_' + chat.id + '_' + (m.id || i);
        if (!it || DB.get('logs', id)) return;
        found.push(DB.put('logs', { id: id, userId: me.id, projectId: chat.projectId || '', stage: 'chat', kind: it.kind, action: it.action, source: '대화 자동 포착', origin: 'chat-auto', detection: 'rule-demo', text: it.quote, userQuote: it.quote, chatId: chat.id, messageIndex: i }));
      });
      return Promise.all(found).then(function () {
        if (found.length && !DB.where('portfolios', function (p) { return p.userId === me.id; }).length) return DB.put('portfolios', { id: 'pf_' + me.id, userId: me.id, public: false, headline: '', projectIds: [], picks: [] });
      }).then(function () { chat.capture = { status: 'done', mode: 'rule-demo', count: DB.where('logs', function (l) { return l.chatId === chat.id; }).length }; DB.saveLocal(); });
    },
    retry: function (chatId) {
      return A.api('api/evidence', { method: 'POST', body: { chatId: chatId } }).then(function (j) { return DB.load().then(function () { return j.chat; }); });
    }
  };
})();
