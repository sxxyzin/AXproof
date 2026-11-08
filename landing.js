/* AX Proof 홈페이지: 코드로 재생하는 예시와 계정에 저장하지 않는 판단 체험. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var preference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var reduce = preference.matches;

  // 스크롤 진입 모션: 기능을 지원하지 않거나 모션 감소 설정이면 내용을 바로 표시합니다.
  var revealObserver;
  if ('IntersectionObserver' in window && !reduce) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    document.documentElement.classList.add('motion-enabled');
    $$('[data-reveal]').forEach(function (el) { revealObserver.observe(el); });
  }

  var menu = $('#menuToggle'), nav = $('#navLinks');
  function closeMenu() { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', '메뉴 열기'); }
  menu.addEventListener('click', function () {
    var open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  $$('#navLinks a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // 두 탭 그룹 모두 키보드 방향키 / Home / End를 지원합니다.
  function tabs(selector, panelPrefix, onChange) {
    var buttons = $$(selector), selected = 0;
    function select(index, focus, manual) {
      selected = (index + buttons.length) % buttons.length;
      buttons.forEach(function (button, i) {
        var active = i === selected;
        button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; button.classList.toggle('is-active', active);
        $('#' + panelPrefix + i).hidden = !active;
      });
      if (focus) buttons[selected].focus();
      if (onChange) onChange(selected, manual);
    }
    buttons.forEach(function (button, i) {
      button.addEventListener('click', function () { select(i, false, true); });
      button.addEventListener('keydown', function (e) {
        var target = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? selected + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? selected - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : null;
        if (target !== null) { e.preventDefault(); select(target, true, true); }
      });
    });
    select(0, false, false);
    return { select: select, next: function () { select(selected + 1, false, false); } };
  }
  var playing = !reduce, previewTimer = null, playButton = $('#previewPlay');
  function paintPlay() { playButton.textContent = playing ? 'Ⅱ' : '▶'; playButton.setAttribute('aria-label', playing ? '예시 재생 일시정지' : '예시 자동 재생'); playButton.setAttribute('aria-pressed', String(playing)); }
  function schedulePreview() {
    clearTimeout(previewTimer);
    if (playing && !document.hidden && !film.open) previewTimer = setTimeout(function () { preview.next(); schedulePreview(); }, 5500);
  }
  var preview = tabs('[data-preview]', 'preview-', function (index, manual) { if (manual) { playing = false; clearTimeout(previewTimer); paintPlay(); } });
  tabs('[data-journey]', 'journey-');
  playButton.addEventListener('click', function () { playing = !playing; paintPlay(); schedulePreview(); });

  // 실제 MP4를 클릭했을 때만 로드·재생합니다. 자동 재생 차단도 정상 처리합니다.
  var film = $('#filmDialog'), video = $('#serviceFilm'), filmTrigger = null;
  function closedFilm() { video.pause(); document.body.classList.remove('film-is-open'); if (filmTrigger) filmTrigger.focus(); schedulePreview(); }
  function closeFilm() { if (typeof film.close === 'function' && film.open) film.close(); else { film.removeAttribute('open'); closedFilm(); } }
  $$('[data-open-film]').forEach(function (button) { button.addEventListener('click', function () {
    filmTrigger = button; if (typeof film.showModal === 'function') film.showModal(); else film.setAttribute('open', '');
    document.body.classList.add('film-is-open'); clearTimeout(previewTimer);
    var playback = video.play(); if (playback && playback.catch) playback.catch(function () { /* 사용자가 영상의 재생 버튼으로 시작할 수 있습니다. */ });
  }); });
  $('#filmClose').addEventListener('click', closeFilm);
  film.addEventListener('close', closedFilm);
  film.addEventListener('click', function (e) { if (e.target === film) { var rect = film.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeFilm(); } });
  document.addEventListener('visibilitychange', schedulePreview);
  function changedPreference(e) { reduce = e.matches; if (reduce) { playing = false; paintPlay(); clearTimeout(previewTimer); document.documentElement.classList.remove('motion-enabled'); if (revealObserver) revealObserver.disconnect(); } }
  if (preference.addEventListener) preference.addEventListener('change', changedPreference);
  else if (preference.addListener) preference.addListener(changedPreference);
  paintPlay(); schedulePreview();

  var SCENARIOS = {
    hrd: {
      title: '교육 만족도 의견을 정리해 보고하려고 합니다.', context: '서술형 응답을 AI로 분류했습니다. 보고서를 보내기 전, 결과를 확인할 차례입니다.',
      suggestion: '“업계 평균으로 교육 불만의 40%는 비용 부담입니다. 이 비율을 기준으로 예산 개선안을 제안하세요.”',
      responses: {
        use: ['그 비율의 근거를 설명할 수 있나요?', '그대로 사용한다면 숫자의 출처와 우리 교육에 적용할 수 있는 조건을 확인해야 해요. 어떤 근거가 확보되어 있나요?'],
        edit: ['무엇을 바꾸고, 무엇을 남길까요?', '분류 구조는 참고하되 출처 없는 비율은 빼는 방법도 있어요. 어떤 부분을 왜 바꾸려는지 적어 보세요.'],
        reject: ['대신 사용할 근거는 무엇인가요?', '사용하지 않기로 정한 기준과, 우리 데이터로 다시 확인할 방법을 함께 설명해 보세요.'],
        verify: ['확인할 첫 행동을 구체적으로.', '어떤 원문을 몇 건 대조할지, 어떤 결과가 나오면 비율을 쓸 수 있을지 생각해 보세요.']
      }
    },
    service: {
      title: '회원가입 중 이탈을 줄이는 방법을 정하려고 합니다.', context: '어느 화면에서 왜 이탈하는지 아직 확인하지 않았습니다. AI에 개선 방향을 물었습니다.',
      suggestion: '“입력 항목이 많아서 이탈하는 것입니다. 본인 확인 단계를 없애고 바로 가입하게 바꾸세요.”',
      responses: {
        use: ['생략해도 되는 단계인지 확인했나요?', '이탈의 원인과 본인 확인이 필요한 이유가 아직 확인되지 않았어요. 그대로 적용할 근거가 무엇인지 적어 보세요.'],
        edit: ['줄일 단계와 유지할 조건을 나눠 보세요.', '입력 부담을 줄이면서도 필요한 확인 절차를 지킬 수 있을까요? 바꿀 부분과 이유를 설명해 보세요.'],
        reject: ['이 제안을 사용하지 않는 기준은요?', '근거가 부족한 결론인지, 서비스 제약에 맞지 않는지 구분해 보세요. 대신 먼저 확인할 것도 적어 보세요.'],
        verify: ['사용자의 어느 장면부터 살펴볼까요?', '단계별 이탈 기록, 오류 메시지, 사용자 인터뷰 중 무엇을 먼저 볼지와 그 이유를 정해 보세요.']
      }
    },
    marketing: {
      title: '다음 주 광고 예산을 어떤 채널에 쓸지 정하려고 합니다.', context: '두 채널의 클릭률은 비교했지만 구매 전환과 고객 구성은 아직 확인하지 않았습니다.',
      suggestion: '“클릭률이 더 높은 A 채널의 성과가 좋습니다. 다음 주 예산을 전부 A 채널로 옮기세요.”',
      responses: {
        use: ['클릭 이후의 결과도 확인했나요?', '클릭률과 이번 캠페인의 목표가 같은 의미인지 살펴보세요. 전액을 옮길 만큼 확보한 근거는 무엇인가요?'],
        edit: ['어떤 조건을 붙여 집행할까요?', '일부 예산으로 시험하거나 전환을 확인한 뒤 늘리는 방법도 있어요. 수정한 기준과 이유를 적어 보세요.'],
        reject: ['클릭률만으로 판단하기 어려운 이유는요?', '사용하지 않기로 한 기준과, 예산 배분을 위해 추가로 필요한 정보를 구체적으로 적어 보세요.'],
        verify: ['무슨 지표가 결정을 바꿀까요?', '구매 전환, 신규 고객 비중, 획득 비용 중 무엇을 먼저 비교하고 어떤 기준으로 결정할지 적어 보세요.']
      }
    }
  };
  var labels = { use: '그대로 쓴다', edit: '고쳐서 쓴다', reject: '사용하지 않는다', verify: '더 확인한다' };
  var selectedChoice = '', scenario = 'hrd', reason = $('#simReason'), record = $('#simRecord'), response = $('#simResponse'), result = $('#simResult');
  var initialResponse = response.innerHTML;
  function updateRecord() { record.disabled = !selectedChoice || !reason.value.trim(); }
  function clearSimulation() {
    selectedChoice = ''; reason.value = ''; reason.disabled = true; record.disabled = true; result.hidden = true; response.innerHTML = initialResponse;
    $$('[data-choice]').forEach(function (button) { button.setAttribute('aria-pressed', 'false'); });
  }
  $('#scenarioSelect').addEventListener('change', function () {
    scenario = SCENARIOS[this.value] ? this.value : 'hrd'; var s = SCENARIOS[scenario];
    $('#simTask').textContent = s.title; $('#simContext').textContent = s.context; $('#simSuggestion').textContent = s.suggestion; clearSimulation();
  });
  $$('[data-choice]').forEach(function (button) { button.setAttribute('aria-pressed', 'false'); button.addEventListener('click', function () {
    selectedChoice = button.getAttribute('data-choice');
    $$('[data-choice]').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
    var feedback = SCENARIOS[scenario].responses[selectedChoice];
    response.innerHTML = '<span class="small-pill"></span><h3 class="selection-heading"></h3><p></p>';
    response.querySelector('.small-pill').textContent = labels[selectedChoice]; response.querySelector('h3').textContent = feedback[0]; response.querySelector('p').textContent = feedback[1];
    reason.disabled = false; result.hidden = true; updateRecord();
  }); });
  reason.addEventListener('input', function () { result.hidden = true; updateRecord(); });
  $('#simForm').addEventListener('submit', function (e) {
    e.preventDefault(); if (!selectedChoice || !reason.value.trim()) { reason.focus(); return; }
    $('#simResultTitle').textContent = labels[selectedChoice]; $('#simResultReason').textContent = reason.value.trim(); result.hidden = false;
    if (result.scrollIntoView) result.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
  $('#simReset').addEventListener('click', function () { clearSimulation(); var button = $('[data-choice]'); if (button) button.focus(); });
})();
