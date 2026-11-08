/* AX Proof · 공통 코어: 유틸, 세션, 저장소(서버/데모), 모달·토스트 */
(function () {
  var AXP = window.AXP = window.AXP || {};

  /* ---------- 유틸 ---------- */
  var U = AXP.U = {};
  U.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  U.uid = function (p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  U.now = function () { return new Date().toISOString(); };
  U.$ = function (s, r) { return (r || document).querySelector(s); };
  U.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  U.fmt = function (iso, withTime) {
    if (!iso) return '';
    var d = new Date(iso), n = new Date();
    var diff = (n - d) / 1000;
    if (!withTime) {
      if (diff < 60) return '방금';
      if (diff < 3600) return Math.floor(diff / 60) + '분 전';
      if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
      if (diff < 86400 * 7) return Math.floor(diff / 86400) + '일 전';
    }
    var s = (d.getMonth() + 1) + '/' + d.getDate();
    if (withTime) s += ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    return s;
  };
  U.date = function (iso) { if (!iso) return ''; var d = new Date(iso); return d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate(); };
  U.initial = function (name) { return (name || '?').trim().slice(-2, -1) || (name || '?').slice(0, 1); };
  U.short = function (s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; };
  U.debounce = function (fn, ms) { var t; return function () { var a = arguments, me = this; clearTimeout(t); t = setTimeout(function () { fn.apply(me, a); }, ms); }; };
  U.ls = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* 무시 */ } }
  };
  U.parseJSON = function (text) {
    if (text && typeof text === 'object') return text;
    var s = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    try { return JSON.parse(s); } catch (e) { /* 계속 */ }
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { /* 계속 */ } }
    return null;
  };
  U.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  U.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { AXP.toast('복사했어요'); }, function () { AXP.toast('복사하지 못했어요', true); });
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); AXP.toast('복사했어요'); } catch (e) { AXP.toast('복사하지 못했어요', true); }
    ta.remove();
  };
  U.avg = function (arr) { var a = arr.filter(function (x) { return typeof x === 'number' && !isNaN(x); }); return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : 0; };
  U.pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; };

  /* ---------- 토스트·모달 ---------- */
  AXP.toast = function (msg, err) {
    var w = U.$('.toast-wrap'); if (!w) { w = document.createElement('div'); w.className = 'toast-wrap'; document.body.appendChild(w); }
    var t = document.createElement('div'); t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg; w.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  };
  AXP.modal = function (opts) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>' + U.esc(opts.title || '') + '</h2>' +
      (opts.sub ? '<p class="muted small mt8">' + U.esc(opts.sub) + '</p>' : '') + '</div><button class="x" aria-label="닫기">×</button></div><div class="modal-body"></div></div>';
    var body = bg.querySelector('.modal-body');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    function close() { bg.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    bg.querySelector('.x').onclick = close;
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg);
    var f = bg.querySelector('input,textarea,select'); if (f) setTimeout(function () { f.focus(); }, 30);
    if (opts.onOpen) opts.onOpen(body, close);
    return { el: bg, body: body, close: close };
  };
  AXP.confirm = function (msg, okText) {
    return new Promise(function (resolve) {
      var m = AXP.modal({ title: '확인', body: '<p>' + U.esc(msg) + '</p><div class="row end mt16"><button class="btn ghost" data-x>취소</button><button class="btn" data-ok>' + U.esc(okText || '확인') + '</button></div>', onClose: function () { resolve(false); } });
      m.body.querySelector('[data-x]').onclick = function () { m.close(); };
      m.body.querySelector('[data-ok]').onclick = function () { resolve(true); m.el.remove(); };
    });
  };

  /* ---------- 서버 통신 ---------- */
  var S = AXP.Session = {
    token: U.ls.get('axp:token', ''),
    user: U.ls.get('axp:user', null),
    set: function (token, user) { S.token = token; S.user = user; U.ls.set('axp:token', token); U.ls.set('axp:user', user); },
    clear: function () { S.token = ''; S.user = null; U.ls.del('axp:token'); U.ls.del('axp:user'); }
  };
  AXP.api = function (path, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' };
    if (S.token) headers.Authorization = 'Bearer ' + S.token;
    return fetch(path, { method: opts.method || 'GET', headers: headers, body: opts.body ? JSON.stringify(opts.body) : undefined, signal: opts.signal })
      .then(function (r) {
        if (opts.raw) return r;
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.error || ('오류 ' + r.status)); e.status = r.status; e.data = j; throw e; }
          return j;
        });
      });
  };

  /* ---------- 실행 모드: 서버(정식) / 데모(브라우저 저장) ---------- */
  AXP.Mode = { server: false, health: null };
  AXP.detectMode = function () {
    if (location.protocol === 'file:') return Promise.resolve(AXP.Mode);
    var ac = new AbortController(); var t = setTimeout(function () { ac.abort(); }, 3500);
    return fetch('api/health', { signal: ac.signal }).then(function (r) { return r.json(); }).then(function (h) {
      clearTimeout(t); if (h && h.app === 'axproof') { AXP.Mode.server = true; AXP.Mode.health = h; } return AXP.Mode;
    }).catch(function () { clearTimeout(t); return AXP.Mode; });
  };

  /* ---------- 저장소 ---------- */
  // 새 예시 데이터를 예전 브라우저 저장값과 분리하고, 이전 저장값은 지우지 않습니다.
  var DEMO_KEY = 'axp:demo:db:' + window.AXP_SEED_VERSION;
  var COLS = ['users', 'cohorts', 'cases', 'projects', 'logs', 'chats', 'reviews', 'mentors', 'contacts', 'archive', 'knowledge', 'challenges', 'portfolios', 'assignments', 'submissions', 'settings', 'usage', 'progress'];
  COLS = COLS.concat(['mentorReviews', 'mentorReviewPrefs', 'sharingSessions', 'sharingEntries', 'schoolClasses', 'schoolMissions', 'schoolAttempts', 'schoolReports', 'schoolConsents']);
  var DB = AXP.DB = {
    data: {},
    load: function () {
      if (AXP.Mode.server) {
        return AXP.api('api/store?all=1').then(function (j) { DB.data = j.data; DB.fill(); return DB.data; });
      }
      var d = U.ls.get(DEMO_KEY, null);
      if (!d) { d = window.AXP_SEED(); U.ls.set(DEMO_KEY, d); }
      DB.data = d; DB.fill();
      return Promise.resolve(DB.data);
    },
    fill: function () { COLS.forEach(function (c) { DB.data[c] = DB.data[c] || []; }); },
    saveLocal: function () { if (!AXP.Mode.server && !U.ls.set(DEMO_KEY, DB.data)) AXP.toast('브라우저 저장 공간이 부족해요', true); },
    all: function (col) { return DB.data[col] || []; },
    get: function (col, id) { return (DB.data[col] || []).find(function (r) { return r.id === id; }) || null; },
    where: function (col, fn) { return (DB.data[col] || []).filter(fn); },
    _local: function (col, rec) {
      delete rec._touch;
      var list = DB.data[col] = DB.data[col] || [];
      var i = list.findIndex(function (r) { return r.id === rec.id; });
      var prev = i >= 0 ? list[i] : null;
      if (col === 'logs') {
        if (!prev) { rec.createdAt = U.now(); rec.original = rec.text; rec.edited = false; }
        else {
          rec.createdAt = prev.createdAt; rec.original = prev.original; rec.edited = rec.text !== prev.original;
          if (rec.text !== prev.text) rec.history = (prev.history || []).concat([{ text: prev.text, at: U.now() }]).slice(-20);
        }
      } else rec.createdAt = prev ? prev.createdAt : (rec.createdAt || U.now());
      rec.updatedAt = U.now();
      if (i >= 0) list[i] = rec; else list.push(rec);
      return rec;
    },
    put: function (col, rec) {
      rec = JSON.parse(JSON.stringify(rec));
      rec.id = rec.id || U.uid(col.slice(0, 3));
      if (!AXP.Mode.server) { var local = DB._local(col, rec); DB.saveLocal(); return Promise.resolve(local); }
      return AXP.api('api/store?col=' + col, { method: 'PUT', body: rec }).then(function (j) { var l = DB.data[col] = DB.data[col] || []; var k = l.findIndex(function (r) { return r.id === j.data.id; }); if (k >= 0) l[k] = j.data; else l.push(j.data); (j.evidence || []).forEach(function (log) { var list = DB.data.logs, i = list.findIndex(function (r) { return r.id === log.id; }); if (i >= 0) list[i] = log; else list.push(log); }); if (j.portfolio) { var p = DB.data.portfolios, i = p.findIndex(function (r) { return r.id === j.portfolio.id; }); if (i >= 0) p[i] = j.portfolio; else p.push(j.portfolio); } return j.data; })
        .catch(function (e) { AXP.toast('저장하지 못했어요: ' + e.message, true); throw e; });
    },
    del: function (col, id) {
      DB.data[col] = (DB.data[col] || []).filter(function (r) { return r.id !== id; });
      if (!AXP.Mode.server) { DB.saveLocal(); return Promise.resolve(); }
      return AXP.api('api/store?col=' + col + '&id=' + encodeURIComponent(id), { method: 'DELETE' });
    },
    resetDemo: function (empty) {
      if (AXP.Mode.server) return AXP.api('api/store?action=reset', { method: 'POST', body: { empty: !!empty } }).then(DB.load);
      var d = window.AXP_SEED();
      if (empty) { ['projects', 'logs', 'chats', 'reviews', 'contacts', 'portfolios', 'submissions', 'progress', 'usage', 'challenges'].forEach(function (c) { d[c] = []; }); d.users = d.users.filter(function (u) { return u.role === 'admin' || u.demo; }); }
      U.ls.set(DEMO_KEY, d); DB.data = d; DB.fill(); return Promise.resolve(d);
    },
    exportAll: function () {
      if (AXP.Mode.server) return AXP.api('api/store?action=export', { method: 'POST' }).then(function (j) { return j.data; });
      return Promise.resolve(DB.data);
    },
    importAll: function (data) {
      if (AXP.Mode.server) return AXP.api('api/store?action=import', { method: 'POST', body: { data: data } }).then(DB.load);
      U.ls.set(DEMO_KEY, data); DB.data = data; DB.fill(); return Promise.resolve(data);
    }
  };

  /* ---------- 도메인 헬퍼 ---------- */
  var D = AXP.D = {};
  D.me = function () { return S.user ? (DB.get('users', S.user.id) || S.user) : null; };
  D.user = function (id) { return DB.get('users', id) || { id: id, name: '알 수 없음' }; };
  D.cohort = function (id) { return DB.get('cohorts', id || (D.me() || {}).cohortId) || DB.all('cohorts')[0] || null; };
  D.case = function (id) { return DB.get('cases', id); };
  D.program = function () { return DB.get('settings', 'program') || (window.AXP_SEED().settings[0]); };
  D.myProjects = function (uid) { uid = uid || (D.me() || {}).id; return DB.where('projects', function (p) { return p.userId === uid || (p.members || []).indexOf(uid) >= 0; }).sort(function (a, b) { return (b.updatedAt || '').localeCompare(a.updatedAt || ''); }); };
  D.logsOf = function (uid, pid) { return DB.where('logs', function (l) { return l.userId === uid && (!pid || l.projectId === pid); }).sort(function (a, b) { return (a.createdAt || '').localeCompare(b.createdAt || ''); }); };
  D.progress = function (uid) {
    uid = uid || (D.me() || {}).id;
    return DB.where('progress', function (p) { return p.userId === uid; })[0] || { id: 'prg_' + uid, userId: uid, onboarding: { done: [], practice: {} } };
  };
  D.onboarded = function (uid) { return (D.progress(uid).onboarding.done || []).length >= 4; };

  // 판단 기록 추가 (모든 자동 기록의 단일 입구)
  D.addLog = function (o) {
    var me = D.me();
    var rec = { id: U.uid('log'), userId: o.userId || me.id, projectId: o.projectId || '', stage: o.stage || 'etc', kind: o.kind || '실행 판단', source: o.source || '자동 기록', text: o.text, action: o.action || '', aiMessage: o.aiMessage || '', ref: o.ref || '' };
    return DB.put('logs', rec);
  };

  // 단계 정의 · 프로젝트 종류별 흐름
  AXP.STAGE_DEFS = {
    job: { name: '직무 탐구', short: '직무' },
    issue: { name: '이슈 탐구', short: '이슈' },
    prep: { name: '인터뷰 준비', short: '준비' },
    talk: { name: '실무자 인터뷰', short: '인터뷰' },
    insight: { name: '인사이트 정리', short: '인사이트' },
    topic: { name: '주제 선정', short: '주제' },
    propose: { name: 'AI 프로젝트 제안', short: '제안' },
    plan: { name: '프로젝트 기획안', short: '기획안' },
    run: { name: '수행 · 주간 체크인', short: '수행' },
    final: { name: '결과 보고 · 디펜스', short: '보고' }
  };
  AXP.KINDS_INFO = {
    linkushu: { name: '링커슈', stages: ['job', 'issue', 'prep', 'talk', 'insight', 'propose', 'final'], finalName: '발표 · 디펜스', badge: 'blue', desc: '직무별 실무자 컨택 → 직무·산업 이슈 탐구 → 문제 정의 → AI 프로젝트 제안 → 발표' },
    personal: { name: '개인 프로젝트', stages: ['prep', 'talk', 'insight', 'topic', 'plan', 'run', 'final'], badge: 'green', desc: '링커슈에서 제안한 AI 프로젝트를 4주 동안 직접 만들고 검증' },
    team: { name: '팀 프로젝트', stages: ['prep', 'talk', 'insight', 'topic', 'plan', 'run', 'final'], badge: 'violet', desc: '직무팀이 하나의 프로젝트를 함께 수행. 판단은 팀원마다 따로 기록' }
  };
  AXP.kindOf = function (p) { return (p && AXP.KINDS_INFO[p.kind]) ? p.kind : 'personal'; };
  AXP.stagesFor = function (p) {
    var k = AXP.KINDS_INFO[AXP.kindOf(p)];
    return k.stages.map(function (key) { var d = AXP.STAGE_DEFS[key]; return { key: key, name: key === 'final' && k.finalName ? k.finalName : d.name, short: key === 'final' && k.finalName ? '발표' : d.short }; });
  };
  AXP.STAGES = AXP.stagesFor({ kind: 'personal' });
  AXP.STAGE_NAME = { onboarding: '온보딩', etc: '기타', chat: 'AI 대화', external: '외부 대화', issue_sub: '링커슈' };
  AXP.STAGE_NAME.sharing = '공유시간';
  AXP.STAGE_NAME.obReview = 'OB 멘토 리뷰';
  Object.keys(AXP.STAGE_DEFS).forEach(function (k) { AXP.STAGE_NAME[k] = AXP.STAGE_DEFS[k].name; });
  AXP.isTeamProject = function (p) { return !!(p && (p.teamId || (p.members || []).length > 1)); };
  // 팀 프로젝트는 디펜스·피드백을 팀원별로 보관 (final.byUser[uid])
  AXP.finalOf = function (p, uid) {
    p.data = p.data || {}; var f = p.data.final = p.data.final || {};
    if (!AXP.isTeamProject(p)) return f;
    f.byUser = f.byUser || {}; return (f.byUser[uid] = f.byUser[uid] || {});
  };
  AXP.readinessOf = function (p, uid) {
    var f = p && p.data && p.data.final; if (!f) return null;
    if (f.byUser && f.byUser[uid] && f.byUser[uid].readiness) return f.byUser[uid].readiness;
    return f.readiness || null;
  };
  AXP.inDefense = function (p, uid) {
    var f = p && p.data && p.data.final; if (!f) return false;
    var m = f.byUser && f.byUser[uid] ? f.byUser[uid] : f;
    return !!(m.defense && m.defense.questions && !m.defense.done);
  };
  D.firstName = function (name) { name = String(name || ''); return /^[가-힣]{3,4}$/.test(name) ? name.slice(1) : name; };
  D.team = function (teamId) { var c = D.cohort(); return c && (c.teams || []).find(function (t) { return t.id === teamId; }) || null; };
  AXP.AREAS = ['현장·하루 일과', '커리어·동기', '반복·소모 업무', '비효율·병목', '데이터·도구', '제약·조건'];
  AXP.COMPETENCIES = ['문제 정의', 'AI 협업', '검증', '판단·변화 대응', '설명·책임'];
  AXP.KINDS = ['문제 정의', '대안 선택', 'AI 검증', '방향 전환', '실행 판단'];
  AXP.ACTIONS = ['쓴다', '고친다', '버린다', '보류'];
})();
