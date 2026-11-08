/* OB·YB 간편 리뷰 규칙 — 서버와 파일 데모에서 같은 흐름을 사용합니다. */
(function (root) {
  'use strict';
  var REV = 'mentorReviews', PREF = 'mentorReviewPrefs';
  function reject(message, status) { throw Object.assign(new Error(message), { status: status || 400 }); }
  function text(value, min, max, label) {
    var s = typeof value === 'string' ? value.trim() : '';
    if (s.length < min || s.length > max) reject(label + '은(는) ' + min + '–' + max + '자로 적어 주세요.');
    return s;
  }
  function month(now) { return new Date(new Date(now).getTime() + 9 * 3600000).toISOString().slice(0, 7); }
  function status(r, now) { return r.status === 'pending' && r.expiresAt <= now ? 'expired' : r.status; }
  function shape(r, now) { return Object.assign({}, r, { status: status(r, now) }); }
  function view(r, a, now) {
    var out = shape(r, now);
    if (a.uid !== r.learnerId && a.role !== 'admin') { delete out.reflection; delete out.reflectionLogId; }
    return out;
  }
  function defaults(id) { return { id: id, enabled: false, monthlyLimit: 2, minutes: 10, scope: '' }; }
  function publicFeedback(rows, learnerId) {
    return rows.filter(function (r) { return r.learnerId === learnerId && r.status === 'completed' && r.mentorPublic === true && r.learnerPublic === true; }).map(function (r) {
      return { id: r.id, projectTitle: r.snapshot.title, contextType: r.snapshot.contextType, mentorName: r.mentorName, mentorRole: r.mentorRole, feedback: r.feedback, completedAt: r.completedAt };
    });
  }
  async function bootstrap(store, a, now) {
    if (!['learner', 'mentor', 'admin'].includes(a.role)) reject('성인 프로그램에서 이용할 수 있습니다.', 403);
    var rows = await store.list(REV), prefs = await store.list(PREF), profiles = await store.list('mentors'), users = await store.list('users'), directory = [];
    for (var p of profiles) {
      var u = users.find(function (x) { return x.id === p.userId && x.role === 'mentor' && !x.disabled; });
      var pref = prefs.find(function (x) { return x.id === p.userId; });
      if (!u || !pref || !pref.enabled) continue;
      var quota = await store.get('quotas', 'ob-slot:' + u.id + ':' + month(now));
      directory.push({ id: p.id, name: u.name, role: p.role || '', company: p.company || '', tags: p.tags || [], ob: p.ob || '', minutes: pref.minutes, scope: pref.scope, remaining: Math.max(0, pref.monthlyLimit - (quota ? quota.count : 0)), pending: rows.filter(function (r) { return r.mentorId === u.id && status(r, now) === 'pending'; }).length });
    }
    return { reviews: rows.filter(function (r) { return a.role === 'admin' || r.learnerId === a.uid || r.mentorId === a.uid; }).map(function (r) { return view(r, a, now); }), directory: directory, preferences: a.role === 'mentor' ? (prefs.find(function (p) { return p.id === a.uid; }) || defaults(a.uid)) : null };
  }
  async function act(store, a, b, utils) {
    if (!['learner', 'mentor', 'admin'].includes(a.role)) reject('성인 프로그램에서 이용할 수 있습니다.', 403);
    var now = utils.now(), rec, rows;
    if (b.action === 'preferences') {
      if (a.role !== 'mentor') reject('멘토만 참여 설정을 바꿀 수 있습니다.', 403);
      if (!(await store.list('mentors')).some(function (m) { return m.userId === a.uid; })) reject('내 멘토 프로필을 먼저 등록해 주세요.');
      if (!Number.isInteger(b.monthlyLimit) || b.monthlyLimit < 1 || b.monthlyLimit > 4 || ![5, 10, 15].includes(b.minutes)) reject('월 1–4건, 5·10·15분 중에서 선택해 주세요.');
      rec = { id: a.uid, enabled: b.enabled === true, monthlyLimit: b.monthlyLimit, minutes: b.minutes, scope: text(b.scope || '', 0, 200, '도움 줄 수 있는 범위'), updatedAt: now };
      await store.put(PREF, rec); return rec;
    }
    if (b.action === 'request') {
      if (a.role !== 'learner') reject('훈련생만 리뷰를 요청할 수 있습니다.', 403);
      if (b.shareConsent !== true) reject('선택한 멘토와 운영진에게 요청 자료를 공유하는 데 동의해 주세요.');
      var profile = await store.get('mentors', b.mentorProfileId), target = profile && await store.get('users', profile.userId), pref = target && await store.get(PREF, target.id);
      if (!target || target.disabled || target.role !== 'mentor' || !pref || !pref.enabled) reject('현재 리뷰를 받는 멘토가 아닙니다.', 409);
      var quota = await store.get('quotas', 'ob-slot:' + target.id + ':' + month(now));
      if (quota && quota.count >= pref.monthlyLimit) reject('이번 달 수락 한도가 찼습니다. 다음 달에 요청해 주세요.', 409);
      rows = await store.list(REV);
      if (rows.filter(function (r) { return r.learnerId === a.uid && ['pending', 'accepted'].includes(status(r, now)); }).length >= 2) reject('진행 중인 요청은 두 건까지 가능합니다.', 409);
      if (rows.some(function (r) { return r.learnerId === a.uid && r.mentorId === target.id && ['pending', 'accepted'].includes(status(r, now)); })) reject('이 멘토에게 보낸 요청이 진행 중입니다.', 409);
      if (rows.filter(function (r) { return r.mentorId === target.id && status(r, now) === 'pending'; }).length >= 5) reject('이 멘토의 대기 요청이 찼습니다.', 409);
      var projectId = '', title;
      if (b.projectId) {
        var project = await store.get('projects', b.projectId);
        if (!project || !(project.userId === a.uid || (project.members || []).includes(a.uid))) reject('내 프로젝트만 보낼 수 있습니다.', 403);
        projectId = project.id; title = project.title;
      } else title = text(b.title, 2, 120, '프로젝트 제목');
      if (!['플랫폼 훈련', '개인 프로젝트', '현업 프로젝트'].includes(b.contextType)) reject('프로젝트 유형을 선택해 주세요.');
      if (!['판단 검토', '산출물 방향', '포트폴리오 설명'].includes(b.focus)) reject('리뷰 초점을 선택해 주세요.');
      if (!Array.isArray(b.logIds) || b.logIds.length > 3) reject('판단 기록은 최대 3개까지 보낼 수 있습니다.');
      var logs = [];
      for (var id of new Set(b.logIds)) {
        var l = await store.get('logs', id);
        if (!l || l.userId !== a.uid || (projectId && l.projectId !== projectId)) reject('선택한 프로젝트의 내 판단 기록만 보낼 수 있습니다.', 403);
        logs.push({ id: l.id, text: l.text, original: l.edited ? l.original : undefined, createdAt: l.createdAt, kind: l.kind });
      }
      var decision = text(b.decisionNote || '', logs.length ? 0 : 20, 1500, '직접 내린 판단과 이유');
      var link = text(b.artifactUrl || '', 0, 1500, '산출물 링크');
      if (link) { try { var url = new URL(link); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(); link = url.href; } catch (_) { reject('산출물은 http 또는 https 링크로 넣어 주세요.'); } }
      var question = text(b.question, 10, 500, '질문'), summary = text(b.artifactSummary, 30, 1500, '결과물과 맥락 설명');
      if (!await store.consume('ob-request:' + a.uid + ':' + month(now), 3)) reject('이번 달 요청 한도 3건을 사용했습니다.', 429);
      var learner = await store.get('users', a.uid);
      rec = { id: utils.uid('obr'), learnerId: a.uid, mentorId: target.id, mentorProfileId: profile.id, learnerName: learner.name, mentorName: target.name, mentorRole: profile.role || '', focus: b.focus, question: question, snapshot: { projectId: projectId, title: title, contextType: b.contextType, artifactSummary: summary, artifactUrl: link, decisionNote: decision, logs: logs }, status: 'pending', requestedMinutes: pref.minutes, mentorPublic: false, learnerPublic: false, shareConsentAt: now, createdAt: now, expiresAt: new Date(new Date(now).getTime() + 7 * 86400000).toISOString() };
      await store.put(REV, rec); return rec;
    }
    rec = await store.get(REV, b.id);
    if (!rec || !(rec.learnerId === a.uid || rec.mentorId === a.uid || a.role === 'admin')) reject('요청을 찾을 수 없습니다.', 404);
    // 저장소가 메모리인 경우에도 검증 중 원본 객체를 바꾸지 않습니다.
    rec = JSON.parse(JSON.stringify(rec));
    var current = status(rec, now), ownMentor = a.role === 'mentor' && rec.mentorId === a.uid, ownLearner = a.role === 'learner' && rec.learnerId === a.uid;
    if (b.action === 'accept') {
      if (!ownMentor) reject('요청받은 멘토만 수락할 수 있습니다.', 403);
      if (current === 'accepted' || current === 'completed') return rec;
      if (current !== 'pending') reject('수락할 수 없는 상태입니다.', 409);
      var currentPref = await store.get(PREF, a.uid);
      if (!currentPref || !currentPref.enabled) reject('리뷰 참여를 먼저 켜 주세요.', 409);
      var claim = 'ob-accept:' + rec.id + ':' + month(now);
      if (!await store.consume(claim, 1)) reject('수락을 처리 중입니다. 새로고침해 주세요.', 409);
      if (!await store.consume('ob-slot:' + a.uid + ':' + month(now), currentPref.monthlyLimit)) { await store.del('quotas', claim); reject('이번 달 수락 한도를 사용했습니다.', 409); }
      rec.status = 'accepted'; rec.acceptedAt = now;
    } else if (b.action === 'decline') {
      if (!ownMentor) reject('요청받은 멘토만 거절할 수 있습니다.', 403);
      if (current !== 'pending') reject('대기 중인 요청만 거절할 수 있습니다.', 409);
      rec.status = 'declined'; rec.declineNote = text(b.note || '', 0, 300, '짧은 안내');
    } else if (b.action === 'cancel') {
      if (!ownLearner) reject('요청자만 취소할 수 있습니다.', 403);
      if (!['pending', 'accepted'].includes(current)) reject('진행 중인 요청만 취소할 수 있습니다.', 409);
      rec.status = 'cancelled';
    } else if (b.action === 'complete') {
      if (!ownMentor) reject('요청받은 멘토만 조언을 남길 수 있습니다.', 403);
      if (current !== 'accepted') reject('수락한 요청에 조언을 남겨 주세요.', 409);
      rec.feedback = { strength: text(b.strength, 5, 600, '좋았던 판단'), checkpoint: text(b.checkpoint, 5, 600, '더 확인할 점'), nextAction: text(b.nextAction, 5, 600, '다음 시도') };
      rec.status = 'completed'; rec.completedAt = now; rec.mentorPublic = b.publicConsent === true;
    } else if (b.action === 'publicConsent') {
      if (current !== 'completed' || (!ownMentor && !ownLearner)) reject('완료된 내 리뷰의 공개 동의만 바꿀 수 있습니다.', 403);
      rec[ownMentor ? 'mentorPublic' : 'learnerPublic'] = b.enabled === true;
    } else if (b.action === 'reflect') {
      if (!ownLearner || current !== 'completed') reject('완료된 내 리뷰에 회고를 남겨 주세요.', 403);
      var reflection = text(b.reflection, 20, 2000, '다음 행동과 그 이유'), logId = 'ob_reflection_' + rec.id, previous = await store.get('logs', logId);
      var log = Object.assign({}, previous || {}, { id: logId, userId: a.uid, projectId: rec.snapshot.projectId, stage: 'obReview', kind: '방향 전환', source: 'OB 멘토 리뷰 회고', origin: 'ob-review', ref: rec.id, text: reflection, original: previous ? previous.original : reflection, edited: previous ? previous.original !== reflection : false, verifiedBy: null, createdAt: previous ? previous.createdAt : now, updatedAt: now });
      if (previous && previous.text !== reflection) log.history = (previous.history || []).concat({ text: previous.text, at: now });
      await store.put('logs', log); await utils.ensurePortfolio(a.uid);
      rec.reflection = reflection; rec.reflectionLogId = logId;
    } else reject('지원하지 않는 요청입니다.');
    rec.updatedAt = now; await store.put(REV, rec); return rec;
  }
  root.AXP_OB_RULES = { bootstrap: bootstrap, act: act, publicFeedback: publicFeedback, status: status, view: view };
})(typeof window === 'undefined' ? globalThis : window);
