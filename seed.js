/* AX Proof 예시 데이터 — 서버(첫 실행)와 브라우저 데모 모드가 함께 씁니다.
   회사·인물은 가상입니다(훈련생 '우서진'은 서비스 기획자 본인의 데모 계정).
   HRD Case는 링커스 개인 프로젝트 「HRD Voice Analyzer」(우서진)를 바탕으로 재구성했습니다. */
// 예시 데이터가 바뀌면 버전도 갱신합니다. 이전 버전의 브라우저 데이터는 보관됩니다.
window.AXP_SEED_VERSION = '2026-11-08.2';
window.AXP_SEED = function () {
  var DAY = 864e5, now = Date.now();
  function ago(d, h) { return new Date(now - d * DAY - (h || 0) * 36e5).toISOString(); }
  function ahead(d) { return new Date(now + d * DAY).toISOString().slice(0, 10); }

  /* ---------- 기수 · 직무팀 ---------- */
  var cohort = {
    id: 'coh_20', name: '링커스 20기', org: '링커스', startDate: ahead(-63), weeks: 13, currentWeek: 10,
    inviteCode: 'LINKUS20', mentorCode: 'LINKUS20-MENTOR', status: '진행 중',
    teams: [
      { id: 'team_hrd', name: 'HRD팀', track: 'HRD', members: ['usr_seojin', 'usr_doyun', 'usr_yuna'] },
      { id: 'team_mkt', name: '마케팅팀', track: '마케팅', members: ['usr_minjun', 'usr_haeun'] },
      { id: 'team_ops', name: '서비스기획팀', track: '서비스기획·운영', members: ['usr_seoyeon'] }
    ],
    modules: [
      { id: 'm1', title: 'AI 업무 활용 온보딩', weeks: '1주차', kind: 'onboarding', desc: '업무에서 AI를 쓰는 방식·좋은 요청·검증·보안을 사례로 익힙니다.' },
      { id: 'm2', title: '링커슈', weeks: '2~4주차', kind: 'linkushu', desc: '직무별로 실무자를 컨택·인터뷰하고, 직무·산업 이슈를 탐구해 문제를 찾고 AI 프로젝트 해결안을 제안·발표합니다.' },
      { id: 'm3', title: '개인 프로젝트', weeks: '5~9주차', kind: 'personal', desc: '링커슈에서 제안한 AI 프로젝트를 4주 동안 직접 만들고 검증합니다.' },
      { id: 'm4', title: '팀 프로젝트', weeks: '10~12주차', kind: 'team', desc: '직무팀이 하나의 프로젝트를 함께 수행합니다. 팀원 각자의 판단은 따로 기록돼요.' },
      { id: 'm5', title: '디펜스 · 수료', weeks: '13주차', kind: 'defense', desc: 'AI 없이 내 판단을 설명하고, 포트폴리오를 완성합니다.' }
    ],
    policy: { onboardingGate: true, mentorApprovalGate: false, preceptorAuto: true, defenseNoPaste: true, maxInterviewQuestions: 15 },
    createdAt: ago(70)
  };

  function U(id, name, track, team, extra) {
    var o = { id: id, name: name, email: id.replace('usr_', '') + '@axproof.demo', role: 'learner', cohortId: 'coh_20', track: track, teamId: team, demo: false, createdAt: ago(62) };
    for (var k in (extra || {})) o[k] = extra[k];
    return o;
  }
  var users = [
    { id: 'usr_admin', name: '링커스 운영진', email: 'admin@axproof.demo', role: 'admin', demo: true, createdAt: ago(70) },
    U('usr_seojin', '우서진', 'HRD', 'team_hrd', { demo: true, bio: '교육 현장의 목소리를 데이터로 읽고, 근거로 설명하는 HRD 담당자를 꿈꿉니다.' }),
    U('usr_doyun', '박도윤', 'HRD', 'team_hrd'),
    U('usr_yuna', '한유나', 'HRD', 'team_hrd'),
    U('usr_minjun', '이민준', '마케팅', 'team_mkt'),
    U('usr_haeun', '정하은', '마케팅', 'team_mkt'),
    U('usr_seoyeon', '최서연', '서비스기획·운영', 'team_ops'),
    { id: 'usr_mentor', name: '김혜원', email: 'mentor@axproof.demo', role: 'mentor', cohortId: 'coh_20', track: 'HRD · 12년차', bio: '링커스 OB(14기). 제조 대기업 인재개발팀 HRD 리드.', demo: true, createdAt: ago(68) }
  ];

  var settings = [
    { id: 'program', preceptor: {
        levels: [
          { key: 'show', name: '보여주기', desc: 'AI 사수가 현업의 판단 과정을 먼저 시연합니다. 예시 문서·질문을 보여 줄 수 있어요.' },
          { key: 'together', name: '같이하기', desc: '내가 먼저 시도하고, 막힌 지점에서만 2단계까지 힌트를 받습니다.' },
          { key: 'watch', name: '지켜보기', desc: '내가 주도합니다. AI 사수는 요청할 때만 질문형으로 피드백합니다.' },
          { key: 'solo', name: '맡기기', desc: '코칭 없이 혼자 판단합니다. AI 사수는 규칙·일정 같은 사실만 답합니다.' }
        ],
        stageMap: { onboarding: 'show', job: 'together', issue: 'together', prep: 'together', talk: 'together', insight: 'together', topic: 'together', propose: 'watch', plan: 'watch', run: 'watch', final: 'solo' }
      },
      mentorPersonas: [
        { id: 'hrd', name: '강민정', title: 'HRD(교육기획·운영) 10년차', style: '꼼꼼하고 따뜻함. "그 교육이 현업을 바꿨다는 근거가 뭐예요?"처럼 근거와 교육 효과를 자주 묻는다.', tracks: ['HRD'] },
        { id: 'ops', name: '한지훈', title: '서비스기획·운영 9년차', style: '차분하고 구체적. 숫자와 근거를 자주 묻는다.', tracks: ['서비스기획·운영', '데이터 분석'] },
        { id: 'mkt', name: '정다은', title: '브랜드 마케팅 8년차', style: '밝고 직설적. 고객과 예산 관점으로 되묻는다.', tracks: ['마케팅'] }
      ],
      createdAt: ago(70) }
  ];

  /* ---------- Case ---------- */
  var cases = [
    { id: 'case_hrd', title: "중견 제조기업 '한빛정밀' 인재개발팀의 교육 운영에서 AI 과제 찾기", company: '한빛정밀 (가상)', industry: '제조 · 사내 교육(HRD)', track: 'HRD', source: '현업 실사례 재구성', status: '운영 중', difficulty: '기본', parallelCaseId: 'case_hrd2',
      origin: '링커스 개인 프로젝트 「HRD Voice Analyzer」(우서진, 2026) 기반 재구성',
      persona: { name: '정은지', title: '인재개발팀 HRD 매니저', career: '교육운영 대행사 2년 → 사내 HRD 4년차',
        greeting: '안녕하세요, 인재개발팀 정은지예요. 하반기 교육이 몰려서 정신은 없는데, 그래서 할 얘기는 많아요. 편하게 물어보세요.',
        story: [
          ['현장·하루 일과', '오전엔 이번 주 교육 과정 운영을 챙긴다. 강사, 교육장, 교재를 확인하고, 오후엔 끝난 과정의 만족도 설문을 정리하고 결과 보고서를 쓴다. 한 달에 사내 교육이 10개 넘게 돌아간다.'],
          ['커리어·동기', '교육운영 대행사에서 일하다가, 교육이 실제로 일을 바꾸는지 보고 싶어서 사내 HRD로 왔다. 교육생이 현업에서 써 봤다고 말해 줄 때가 제일 보람 있다.'],
          ['반복·소모 업무', '교육이 끝날 때마다 서술형 만족도 응답을 하나씩 읽으면서 긍정 의견, 개선 의견, 추가 교육 요구를 엑셀에 옮겨 적는다. 과정 하나에 응답이 100개 넘으면 반나절이 그냥 간다.'],
          ['비효율·병목', '같은 말을 다르게 쓴 응답이 많아서 반복 의견을 놓치기 쉽다. "실습 시간이 짧다"랑 "직접 해볼 기회가 더 있었으면"이 사실 같은 얘기인데 따로 세게 된다.'],
          ['비효율·병목', '경영진 보고서에 한두 명이 쓴 의견이 "교육생 의견"처럼 들어갈 때가 있다. 나중에 몇 명이 그렇게 말했냐고 물으면 원문을 다시 뒤져야 한다.'],
          ['데이터·도구', '설문은 구글 폼과 사내 LMS 두 군데서 받는다. 결과는 엑셀로 내려받아 정리하고, 보고서는 PPT로 만든다.'],
          ['현장·하루 일과', '연초에는 부서별 교육 수요조사를 취합하는데, 부서마다 양식이 달라서 합치는 데 일주일이 걸린다.']
        ],
        hidden: [['제약·조건', '설문 원본에는 이름·부서·사번이 같이 내려와서 외부 AI에 그대로 넣으면 안 된다. 보안팀 지침이다. 개발자 지원은 없고 예산도 거의 없다. 다음 분기 교육 계획 회의 전, 4주 안에 쓸 수 있는 결과가 필요하다. 그리고 최종 판단은 HRD 담당자가 해야 한다.']],
        judgment: 'AI로 설문을 정리하더라도 판단 근거가 된 원문을 꼭 같이 보여 주게 했다. 경영진이 몇 명이 그렇게 말했냐고 물으면 바로 답할 수 있어야 하니까. 한 명만 말한 의견은 소수 의견이라고 표시한다.' },
      pains: ['서술형 만족도 응답 수작업 정리', '같은 의미·다른 표현의 반복 의견 누락', '소수 의견의 과대 보고', '부서별 교육 수요조사 취합', '교육 결과 보고서 작성'],
      events: [{ week: 3, text: '다음 주 경영진 보고가 당겨졌어요. 그리고 보안팀에서 설문 원본(이름·부서 포함)을 외부 AI에 넣지 말라는 공지가 다시 나왔어요.' }],
      knowledgeIds: ['kn_1', 'kn_2'], createdAt: ago(80) },
    { id: 'case_hrd2', title: "물류기업 '바로로지스' 교육운영팀의 신입 온보딩 피드백 정리 (전이 검증용)", company: '바로로지스 (가상)', industry: '물류 · 신입 온보딩', track: 'HRD', source: '가상 시나리오', status: '운영 중', difficulty: '검증', parallelCaseId: 'case_hrd',
      persona: { name: '오태윤', title: '교육운영 담당', career: '물류센터 현장 2년 → 교육운영 3년차',
        greeting: '안녕하세요, 교육운영 오태윤입니다. 신입 입사 시즌이라 바쁜데, 궁금한 거 물어보세요.',
        story: [
          ['현장·하루 일과', '4주짜리 신입 온보딩을 운영한다. 매주 금요일에 신입들이 주간 회고를 서술형으로 쓰고, 현장 사수들이 코멘트를 단다.'],
          ['반복·소모 업무', '주간 회고 60개와 사수 코멘트를 읽고, 온보딩에서 막히는 지점을 정리해 팀장에게 보고한다. 금요일 오후가 통째로 간다.'],
          ['비효율·병목', '사수 코멘트가 메신저, 메일, 종이 체크리스트로 흩어져 있어서 한곳에 모으는 것부터 일이다.'],
          ['데이터·도구', '회고는 구글 폼, 체크리스트는 종이, 보고는 엑셀이다.']
        ],
        hidden: [['제약·조건', '신입 이름과 사수 평가 코멘트는 인사 정보라서 외부로 반출하면 안 된다. 현장 사수들은 바빠서 새 도구를 쓰게 하기 어렵다.']],
        judgment: '온보딩 피드백 요약은 하되, 개인 평가로 쓰이지 않게 익명 집계만 보고하기로 했다.' },
      pains: ['주간 회고 수작업 정리', '흩어진 사수 코멘트', '막히는 지점 보고'], events: [{ week: 1, text: '인사팀에서 신입 평가 정보는 교육팀 밖으로 공유하지 말라는 지침이 내려왔어요.' }], knowledgeIds: [], createdAt: ago(75) },
    { id: 'case_hrd3', title: "IT 기업 '넥스트웨이브' 인재개발팀의 연간 교육 수요조사 개선 (팀 프로젝트)", company: '넥스트웨이브 (가상)', industry: 'IT 서비스 · HRD', track: 'HRD', source: '가상 시나리오', status: '운영 중', difficulty: '팀', parallelCaseId: '',
      persona: { name: '서지민', title: '교육기획 파트장', career: 'HRD 9년차',
        greeting: '안녕하세요, 교육기획 파트장 서지민이에요. 내년 교육 계획 짜느라 한창인데, 팀으로 오셨다고요? 반가워요.',
        story: [
          ['현장·하루 일과', '10~11월은 내년 교육 계획을 세우는 시기다. 부서별 수요조사를 받고, 예산안을 만들고, 경영진에 보고한다.'],
          ['반복·소모 업무', '20개 부서가 각자 다른 양식으로 수요조사를 보내서, 엑셀로 합치고 비슷한 요구끼리 묶는 데 일주일이 걸린다.'],
          ['비효율·병목', '부서장이 쓴 요구와 실제 구성원이 원하는 교육이 다를 때가 많은데, 그걸 확인할 방법이 없다.'],
          ['데이터·도구', '수요조사는 엑셀 양식과 메일로 받는다. 작년 교육 이력은 LMS에 있다.'],
          ['커리어·동기', '교육 예산이 줄면서, 교육이 왜 필요한지 근거로 설득하는 일이 점점 중요해졌다.']
        ],
        hidden: [['제약·조건', '예산안 보고는 11월 셋째 주. 부서별 요구에 개인 이름이 섞여 있어 외부 AI에 그대로 넣을 수 없다. 부서장에게 다시 양식을 돌리는 건 한 번만 가능하다.']],
        judgment: '부서장 요구와 구성원 요구가 다르면 둘 다 보고서에 나란히 적고, 결정은 경영진 회의에 넘긴다.' },
      pains: ['부서별 양식 불일치', '비슷한 요구 묶기', '부서장·구성원 요구 차이 확인', '예산 근거 만들기'], events: [{ week: 2, text: '예산안 보고가 1주 당겨졌어요. 그리고 3개 부서가 아직 수요조사를 안 냈어요.' }], knowledgeIds: ['kn_1'], createdAt: ago(20) },
    { id: 'case_hankki', title: "구독형 밀키트 스타트업 '한끼랩' 운영팀의 하루에서 AI 과제 찾기", company: '한끼랩 (가상)', industry: '푸드테크 · 구독 커머스', track: '서비스기획·운영', source: '가상 시나리오', status: '운영 중', difficulty: '기본', parallelCaseId: 'case_dasi',
      persona: { name: '박서연', title: '운영팀장', career: '물류회사 5년 → 스타트업 3년차',
        greeting: '안녕하세요, 운영팀 박서연이에요. 오늘 운영팀 이야기 들으러 오셨다고요? 편하게 물어보세요.',
        story: [
          ['현장·하루 일과', '9시에 밤새 들어온 고객 문의부터 확인, 오전엔 배송 이슈 대응, 오후엔 파트너사 통화와 보고서. 야근이 잦다.'],
          ['반복·소모 업무', '고객 문의가 하루 80건쯤 오는데 절반 이상이 배송 조회, 주소 변경, 교환 같은 비슷한 문의다. 팀원 2명이 일일이 답하고 엑셀로 분류한다.'],
          ['비효율·병목', '매주 월요일 오전 3시간을 써서 주문·해지·클레임 데이터를 세 개 시스템에서 모아 엑셀로 해지 리포트를 만든다.'],
          ['데이터·도구', '쓰는 도구는 엑셀, 구글 시트, 사내 메신저 정도다.']
        ],
        hidden: [['제약·조건', '개발자 지원은 거의 못 받는다. 고객 개인정보는 외부 AI에 그대로 넣으면 안 된다. 4주 안에 눈에 보이는 결과가 필요하다.']],
        judgment: '문의 자동응답보다 해지 리포트 자동화를 먼저 하자고 했다. 고객 응대는 실수 비용이 크니까.' },
      pains: ['반복 문의 응대·분류', '주간 해지 리포트 수작업', '흩어진 배송 클레임'], events: [{ week: 3, text: '대표님이 이번 달 예산을 절반으로 줄이셨어요. 고객 이름·연락처는 외부 AI에 넣지 말라는 공지도 내려왔어요.' }], knowledgeIds: ['kn_4'], createdAt: ago(60) },
    { id: 'case_dasi', title: "중고 가구 거래 플랫폼 '다시집' CS팀의 문제 찾기 (전이 검증용)", company: '다시집 (가상)', industry: '중고 거래 플랫폼', track: '서비스기획·운영', source: '가상 시나리오', status: '운영 중', difficulty: '검증', parallelCaseId: 'case_hankki',
      persona: { name: '오민재', title: 'CS 리드', career: '콜센터 3년 → 플랫폼 CS 4년차', greeting: '안녕하세요, 다시집 CS 리드 오민재입니다. 궁금한 거 편하게 물어보세요.',
        story: [['반복·소모 업무', '상품 등록 반려 사유를 판매자에게 하나씩 설명한다. 하루 50건 이상이다.'], ['비효율·병목', '분쟁 처리 기준이 문서마다 달라서 상담원마다 다르게 안내한다.']],
        hidden: [['제약·조건', '상품 사진에 집 내부나 주소가 찍힌 경우가 많아 외부 AI에 사진을 그대로 올리면 안 된다.']], judgment: '분쟁 자동 판정은 보류하고, 상담원용 기준 검색부터 만들자고 했다.' },
      pains: ['상품 등록 반려 안내', '분쟁 처리 기준 불일치'], events: [], knowledgeIds: [], createdAt: ago(55) },
    { id: 'case_green', title: "비건 화장품 브랜드 '그린루틴' 신제품 런칭 마케팅", company: '그린루틴 (가상)', industry: '뷰티 · D2C', track: '마케팅', source: '현업 실사례 재구성', status: '운영 중', difficulty: '기본', parallelCaseId: '',
      persona: { name: '서하린', title: '브랜드 마케팅 매니저', career: '광고대행사 4년 → 인하우스 3년차', greeting: '안녕하세요, 그린루틴 마케팅 서하린이에요. 신제품 런칭 준비로 바쁜데, 궁금한 거 물어보세요!',
        story: [['반복·소모 업무', '매주 채널별 성과를 각 광고 관리자에서 내려받아 시트에 붙여 넣는다.'], ['비효율·병목', '리뷰에 성분 불만과 효과 칭찬이 섞여 있어 제품팀에 전달하기 어렵다.']],
        hidden: [['제약·조건', '런칭 예산은 100만 원, 기간 2주. 화장품 광고는 효능 표현 규제가 있다.']], judgment: '인플루언서 대형 계약 대신 마이크로 인플루언서 10명으로 나눴다.' },
      pains: ['채널 성과 취합 수작업', '리뷰 분류·전달', '효능 표현 검수'], events: [{ week: 3, text: '런칭 일정이 1주 당겨졌어요. 효능 표현 하나가 심의에서 반려됐어요.' }], knowledgeIds: ['kn_3'], createdAt: ago(50) },
    { id: 'case_chl_1', title: '물류 스타트업 F사 · 배송 지연 고객 안내 개선 (기업 챌린지)', company: 'F사 (기업 제시 · 익명)', industry: '물류', track: '서비스기획·운영', source: '기업·기관 제시', status: '운영 중', difficulty: '챌린지', parallelCaseId: '',
      persona: { name: '문지영', title: 'CS 매니저', career: '이커머스 CS 3년 → 물류 스타트업 2년차', greeting: '안녕하세요, F사 CS 매니저 문지영이에요. 배송 지연 때문에 요즘 문의가 정말 많아요.',
        story: [['반복·소모 업무', '지연 사유가 다른데 안내 문구는 하나라서 고객이 다시 문의한다. 하루 120건 중 70건이 "언제 와요?"다.'], ['비효율·병목', '지연 사유가 현장 기사님 메모로만 남아서 CS팀이 바로 알 수 없다.']],
        hidden: [['제약·조건', '고객 연락처·주소는 외부 AI에 넣을 수 없다. 문자 한 건은 90자 이내. 보장 시간을 약속하는 표현은 안 된다.']], judgment: '지연 사유별로 문구를 세 가지로만 나눴다.' },
      pains: ['지연 안내 문구가 하나뿐', '지연 사유 전달 지연'], events: [{ week: 2, text: '추석 물량으로 지연이 평소의 3배가 됐어요.' }], knowledgeIds: [], createdAt: ago(3) }
  ];

  /* ---------- 서진의 링커슈 (완료) ---------- */
  var TALK_HRD = [
    { role: 'assistant', content: cases[0].persona.greeting },
    { role: 'user', content: '최근에 교육이 끝난 날, 퇴근할 때까지 어떤 일을 하셨는지 처음부터 말씀해 주시겠어요?' },
    { role: 'assistant', content: '지난주 목요일에 리더십 과정이 끝났는데, 오후 내내 서술형 만족도 응답을 읽었어요. 120개 정도였는데 하나씩 읽으면서 좋았던 점, 아쉬운 점, 더 배우고 싶은 걸 엑셀에 옮겨 적어요. 그날은 결국 반나절이 다 갔죠. 더 궁금한 거 있으세요?' },
    { role: 'user', content: '정리하실 때 가장 헷갈리거나 시간이 오래 걸리는 부분은 어디예요?' },
    { role: 'assistant', content: '같은 말을 다르게 쓴 응답이요. "실습 시간이 짧다"랑 "직접 해볼 기회가 더 있었으면"이 같은 얘기인데 따로 세게 돼요. 그러다 보니 반복 의견을 놓치기도 하고요.' },
    { role: 'user', content: '기사에서는 AI로 교육 효과를 측정하는 회사가 늘고 있다던데, 현장에서는 실제로 어떻게 느끼세요?' },
    { role: 'assistant', content: '관심은 많은데, 저희는 아직 엑셀이에요. 오히려 걱정되는 건 보고서예요. 한두 명이 쓴 의견이 "교육생 의견"처럼 경영진 보고에 들어갈 때가 있거든요. 나중에 몇 명이 그랬냐고 물으면 원문을 다시 뒤져야 해요.' },
    { role: 'user', content: '설문 데이터를 외부 도구에 넣을 때 꼭 지켜야 하는 규칙이 있나요?' },
    { role: 'assistant', content: '아, 그건 중요해요. 설문 원본에 이름이랑 부서, 사번이 같이 내려와서 외부 AI에 그대로 넣으면 안 돼요. 보안팀 지침이에요. 개발자 지원도 없고 예산도 거의 없어요. 그리고 최종 판단은 결국 저희 HRD 담당자가 해야 하고요.' },
    { role: 'user', content: '보고서에 소수 의견이 들어갔을 때, 그때는 어떻게 판단하셨어요?' },
    { role: 'assistant', content: 'AI로 정리하더라도 근거가 된 원문을 꼭 같이 보여 주자고 정했어요. 경영진이 몇 명이 그렇게 말했냐고 물으면 바로 답할 수 있어야 하니까요. 한 명만 말한 건 소수 의견이라고 표시하고요.' }
  ];
  var LK = {
    job: { roles: '교육 기획: 연간 교육 체계와 과정 설계\n교육 운영: 강사·일정·교육장·교재 관리\n교육 평가: 만족도·효과성 분석과 결과 보고\n교육 수요조사: 부서별 요구 취합과 우선순위', skills: '소프트 스킬: 이해관계자 조율, 커뮤니케이션, 문제 정의\n하드 스킬: 교수 설계(ADDIE), 설문 설계·분석, 엑셀·LMS 활용', future: '생성형 AI가 교육 콘텐츠 제작과 운영 업무를 빠르게 대신하면서, HRD는 교육 효과를 데이터로 증명하고 학습 경험을 설계하는 역할로 무게가 옮겨갈 전망이다.', reviewed: true },
    issue: { keyword: '생성형 AI 확산과 사내 교육 효과 측정의 데이터화', links: '(예시) 기업 교육에 AI 도입 확대 관련 기사 · HR 테크 업계 동향 리포트', define: '교육이 끝난 뒤 만족도만 보던 방식에서, 교육생의 서술형 피드백과 현업 적용 데이터를 근거로 교육 효과를 설명해야 하는 요구가 커지고 있다.', background: '교육 예산이 줄면서 경영진이 교육의 효과를 숫자와 근거로 요구한다. 동시에 생성형 AI로 텍스트 데이터를 분석하는 비용이 크게 낮아졌다.', cases: '(예시) 일부 기업이 교육 후 설문·면담 기록을 AI로 분석해 다음 과정 설계에 반영', trend: 'HR 테크 업계는 학습 데이터 분석 기능을 앞다퉈 내놓고 있지만, 중견기업 HRD 현장은 여전히 엑셀 수작업이 많다.', criteria: [true, true, true, true], reviewed: true },
    prep: { goal: '교육이 끝난 뒤 HRD 담당자가 어디서 시간을 쓰고 무엇을 판단하는지 알고 싶다. 그래서 AI로 풀 문제 하나를 고를 근거를 얻는다.', research: '채용공고에서 HRD 매니저의 주요 업무는 교육 기획·운영·평가·수요조사로 나온다(지식 베이스). 이슈 탐구에서 교육 효과의 데이터화 요구를 확인했다.',
      questions: ['최근에 교육이 끝난 날, 퇴근할 때까지 어떤 일을 하셨는지 처음부터 말씀해 주시겠어요?', '정리하실 때 가장 헷갈리거나 시간이 오래 걸리는 부분은 어디예요?', '기사에서는 AI로 교육 효과를 측정하는 회사가 늘고 있다던데, 현장에서는 실제로 어떻게 느끼세요?', '설문 데이터를 외부 도구에 넣을 때 꼭 지켜야 하는 규칙이 있나요?', '보고서에 소수 의견이 들어갔을 때, 그때는 어떻게 판단하셨어요?'], reviewed: true },
    talk: { mode: 'virtual', turns: TALK_HRD, hit: ['현장·하루 일과', '반복·소모 업무', '비효율·병목', '제약·조건'] },
    insight: { pains: [
      { text: '교육 1회당 서술형 응답 정리에 반나절이 든다', kind: '사실', evidence: '120개 정도였는데 하나씩 읽으면서… 반나절이 다 갔죠' },
      { text: '같은 의미를 다르게 쓴 응답 때문에 반복 의견을 놓친다', kind: '사실', evidence: '"실습 시간이 짧다"랑 "직접 해볼 기회가 더 있었으면"이 같은 얘기인데 따로 세게 돼요' },
      { text: '소수 의견이 경영진 보고에 전체 의견처럼 들어간다', kind: '사실', evidence: '한두 명이 쓴 의견이 "교육생 의견"처럼 경영진 보고에 들어갈 때가 있거든요' },
      { text: '경영진은 교육 효과의 근거를 점점 더 요구할 것이다', kind: '추정', evidence: '' }
    ], criteria: '근거 원문 없이 보고하지 않는다. 한 명만 말한 의견은 소수 의견으로 표시한다. 최종 판단은 HRD 담당자가 한다.',
      report: { purpose: '교육 종료 후 HRD 담당자의 시간 사용과 판단 기준을 알고, AI 과제를 고를 근거를 얻는다', summary: 'HRD 담당자는 서술형 만족도 응답 정리에 교육 1회당 반나절을 쓴다. 표현이 다른 같은 의견을 놓치고, 소수 의견이 보고에 과대 반영되는 문제가 있다. 설문 원본의 개인정보 때문에 외부 AI 사용에 제약이 있다.',
        findings: [{ text: '서술형 응답 정리에 반나절', kind: '사실', quote: '반나절이 다 갔죠' }, { text: '같은 의미 다른 표현의 반복 의견 누락', kind: '사실', quote: '같은 얘기인데 따로 세게 돼요' }, { text: '소수 의견 과대 보고', kind: '사실', quote: '"교육생 의견"처럼 경영진 보고에' }],
        criteria: ['근거 원문을 함께 보여 준다', '소수 의견은 소수라고 표시한다', '최종 판단은 HRD 담당자'], gaps: ['응답 수가 1,000개를 넘는 대형 과정은 어떻게 하는지', '교육 효과를 현업 적용으로 어떻게 확인하는지'] } },
    propose: { secs: {
      problem: '교육 종료 후 서술형 만족도 응답을 하나씩 읽고 정리하느라 과정당 반나절이 들고, 같은 의미의 반복 의견을 놓치거나 소수 의견을 전체 의견처럼 보고하는 문제',
      overview: '서술형 응답을 의미가 비슷한 의견끼리 묶어 긍정 의견·개선 의견·추가 교육 니즈로 나누고, 판단 근거가 된 원문을 함께 보여 주는 HRD 분석 웹 도구',
      how: '데이터: 교육 만족도 서술형 응답(이름·부서 제거 후)\nAI 방식: 생성형 AI 의미 분류 + 코드 검증(응답에 R001 번호를 붙이고 AI는 번호만 반환, 서버가 원문으로 치환·건수 집계)\n흐름: 응답 붙여넣기 → 분석 → 유형별 주제 카드(대표 의견·근거 원문·건수) → 담당자 검토',
      effect: '정성: 반복 의견 누락 감소, 근거 있는 경영진 보고, 소수 의견 과대 보고 방지\n정량: 과정당 정리 시간 반나절(약 4시간) → 30분 목표',
      risk: '개인정보: 입력 전 이름·부서·사번 제거 안내\nAI 오분류: 근거 원문 대조, 애매한 응답은 "별도 확인"으로\n현업 도입: 결정을 대신하지 않고 "담당자가 확인할 부분"으로 표현\n비용: API 사용량·비용 측정' }, ver: 2, mentor: [{ target: '기대 효과', quote: '반나절 → 30분 목표', comment: '30분이 됐는지 무엇으로 확인할 건가요? 정확도는 어떻게 함께 볼 건가요?', reply: '같은 응답 세트를 직접 정리한 시간과 도구 사용 시간을 비교하고, 근거 원문이 주제와 맞는지 샘플로 대조하겠습니다.' }] },
    final: { report: { sum: 'HRD 담당자의 서술형 만족도 응답 정리 병목을 찾아, 의미 기반 분류 + 근거 원문 제시 도구를 제안했다.', slides: 'https://example.com/linkushu-hrd-slides', qna: '현직자 질문: 응답이 1,000개가 넘으면? → 나눠 분석하고 집계는 코드로.', learn: '검색하면 알 수 있는 건 미리 조사하고, 인터뷰는 판단 기준을 듣는 데 썼더니 문제 정의가 단단해졌다.' }, links: ['https://example.com/linkushu-hrd-slides'],
      byUser: { usr_seojin: { defense: { done: true, questions: ['버린 후보 "수요조사 취합"을 지금 다시 고른다면 같은 선택을 할 건가요?', '근거 원문을 반드시 함께 보여 주기로 한 판단의 근거는 무엇이었나요?'], answers: [{ q: '버린 후보', a: '같은 선택을 하겠습니다. 수요조사는 연 1회라 4주 안에 효과를 확인하기 어렵고, 만족도 정리는 매주 반복되니까요.', sec: 74 }, { q: '근거 원문', a: '인터뷰에서 경영진이 몇 명이 그렇게 말했냐고 묻는다는 말을 들었고, 소수 의견 과대 보고가 실제 문제였기 때문입니다.', sec: 61 }] },
      readiness: { levels: { '문제 정의': 4, 'AI 협업': 3, '검증': 3, '판단·변화 대응': 3, '설명·책임': 4 }, strengths: ['인터뷰를 판단 기준을 듣는 데 써서 문제 정의의 근거가 분명합니다.', '버린 후보와 이유를 디펜스에서 일관되게 설명했습니다.'], improve: ['데이터·도구 영역을 더 물었다면 실현가능성 판단이 단단해졌을 거예요.'], scenes: ['"한 명만 말한 의견은 소수 의견으로 표시" — 현직자 판단 기준을 설계 원칙으로 옮김', '"수요조사는 연 1회라 4주 안에 확인이 어려움" — 검증 가능성으로 후보를 버림'], next: '개인 프로젝트에서는 AI 결과를 근거 원문과 대조하는 검증 절차를 먼저 정하세요.', delegation: { level: '리더 검토 후', why: '문제 정의와 설명은 독립적으로 가능하나, 구현 단계 검증 습관은 아직 확인 전입니다.' }, interview: ['소수 의견 표시 원칙을 실제 보고서에 어떻게 반영할 건가요?', '1,000개 이상 응답에서는 어떻게 하시겠어요?'] } } }, submittedAt: ago(41) }
  };

  /* ---------- 서진의 개인 프로젝트 (수행 중) ---------- */
  var PERSONAL = {
    prep: LK.prep, talk: LK.talk, insight: LK.insight,
    topic: { cands: [{ text: '교육 1회당 서술형 응답 정리에 반나절이 든다', on: true, pick: true, fit: 3, impact: 3, doable: 3 }, { text: '부서별 교육 수요조사 취합', on: true, pick: false, fit: 2, impact: 3, doable: 1 }], pick: '교육 만족도 서술형 응답 의미 기반 분석', why: '매 교육마다 반복되고(사실), 4주 안에 실제 응답으로 효과를 확인할 수 있다. 개인정보만 제거하면 외부 AI를 쓸 수 있다.', drop: '부서별 수요조사 취합: 효과는 크지만 연 1회라 4주 안에 검증이 어렵다.', fromLinkushu: true },
    plan: { ver: 3, secs: {
      bg: '교육 종료 후 서술형 만족도 응답 정리에 과정당 반나절이 들고, 반복 의견 누락·소수 의견 과대 보고가 생긴다(링커슈 인터뷰).',
      goal: '응답 24개 기준 정리 시간을 직접 정리 대비 80% 줄이고, 모든 주제에 근거 원문이 붙는지 확인한다. 4주차에 실제 테스트 응답으로 측정.',
      how: '1) 키워드 규칙 1차 프로토타입으로 한계 확인 2) OpenAI API로 의미 기반 묶기 3) 응답에 R001 번호를 붙이고 AI는 번호만 반환 → 서버가 원문으로 치환 4) 건수·반복 판정·상위 3개는 코드로 5) GitHub·Vercel 배포, API 키는 서버 환경변수',
      alt: '전부 AI에 맡기기: 원문을 AI가 다시 쓰거나 숫자를 지어낼 위험이 있어 제외. 키워드 규칙만 쓰기: 표현이 다른 같은 의견을 못 묶어서 제외.',
      risk: '개인정보 → 입력 전 이름·부서 제거 안내. AI 오분류 → 근거 검수 단계 추가, 애매하면 "별도 확인". 비용 → 1회 분석 토큰·비용 측정.',
      plan: '1주: 문제·입출력 정의, 1차 HTML 프로토타입 / 2주: OpenAI 연동, 프롬프트 설계 / 3주: 코드 검증·배포 / 4주: 실제 응답으로 측정·회고' },
      aiInserts: [{ sec: 'how', text: '' }] },
    run: { week: 2, weeks: { 1: { out: '키워드 규칙 기반 1차 HTML 프로토타입 (입력창 + 결과 카드)', did: '키워드 규칙으로 분류해 보니 "실습 시간이 짧다"와 "직접 해볼 기회가 더 있었으면"을 다른 의견으로 나눴다. 의미 이해가 필요하다고 판단해 2주차에 LLM 분석으로 바꾸기로 했다.', checked: true,
      mentor: { feedback: '1주차 목표대로 프로토타입을 만들고 한계를 직접 확인했어요.', ai_use: 'AI가 필요한 이유를 결과로 확인한 뒤 도입을 결정한 점이 좋아요.', question: 'LLM으로 바꾸면 무엇이 새로 위험해지나요? 그 위험은 무엇으로 막을 건가요?', reply: '원문을 바꿔 쓰거나 숫자를 지어낼 수 있어요. 응답에 번호를 붙이고 AI는 번호만 돌려주게 한 뒤, 원문 치환과 건수 계산은 코드로 하겠습니다.' } } } }
  };

  /* ---------- HRD팀 팀 프로젝트 (진행 중) ---------- */
  var TEAM = {
    prep: { goal: '부서별 수요조사가 어디서 막히는지, 부서장과 구성원 요구가 다를 때 어떻게 판단하는지 알고 싶다. 그래서 팀이 4주 안에 풀 문제를 고른다.', research: '작년 교육 이력은 LMS에 있다(지식 베이스). 넥스트웨이브는 예산안을 11월에 보고한다.',
      questions: ['올해 수요조사를 받으면서 가장 오래 걸린 일을 처음부터 말씀해 주시겠어요?', '부서장 요구와 구성원 요구가 달랐던 때, 어떻게 판단하셨어요?', '수요조사 결과를 보고할 때 경영진이 가장 많이 묻는 건 무엇인가요?', '부서별 응답을 외부 도구에 넣을 때 지켜야 하는 규칙이 있나요?'], reviewed: true },
    talk: { mode: 'virtual', turns: [{ role: 'assistant', content: '안녕하세요, 교육기획 파트장 서지민이에요. 내년 교육 계획 짜느라 한창인데, 팀으로 오셨다고요? 반가워요.' }, { role: 'user', content: '올해 수요조사를 받으면서 가장 오래 걸린 일을 처음부터 말씀해 주시겠어요?' }, { role: 'assistant', content: '20개 부서가 각자 다른 양식으로 보내서, 엑셀로 합치고 비슷한 요구끼리 묶는 데 일주일이 걸렸어요. 부서마다 같은 교육을 다른 이름으로 쓰기도 하고요.' }], hit: ['반복·소모 업무'] }
  };

  var projects = [
    { id: 'prj_seojin_lk', kind: 'linkushu', teamId: 'team_hrd', userId: 'usr_seojin', members: ['usr_seojin', 'usr_doyun', 'usr_yuna'], cohortId: 'coh_20', caseId: 'case_hrd', title: '[링커슈 · HRD팀] 교육 만족도 데이터의 활용', stage: 'final', reached: 6, data: LK, completedAt: ago(40), createdAt: ago(58), updatedAt: ago(40) },
    { id: 'prj_seojin', kind: 'personal', fromLinkushu: 'prj_seojin_lk', userId: 'usr_seojin', members: ['usr_seojin'], cohortId: 'coh_20', caseId: 'case_hrd', title: 'HRD Voice Analyzer — 교육 만족도 서술형 응답 분석', stage: 'run', reached: 5, data: PERSONAL, createdAt: ago(35), updatedAt: ago(0, 3) },
    { id: 'prj_team_hrd', kind: 'team', teamId: 'team_hrd', userId: 'usr_seojin', members: ['usr_seojin', 'usr_doyun', 'usr_yuna'], cohortId: 'coh_20', caseId: 'case_hrd3', title: '[HRD팀] 넥스트웨이브 연간 교육 수요조사 개선', stage: 'talk', reached: 1, data: TEAM, createdAt: ago(5), updatedAt: ago(1) },
    { id: 'prj_doyun', kind: 'personal', userId: 'usr_doyun', members: ['usr_doyun'], cohortId: 'coh_20', caseId: 'case_hrd', title: '부서별 교육 수요조사 취합 자동화', stage: 'plan', reached: 4, data: { prep: { questions: ['수요조사 양식은 어떻게 받으세요?'] }, topic: { pick: '부서별 교육 수요조사 취합', why: '' }, plan: { ver: 1, secs: { bg: '부서마다 양식이 달라 취합에 일주일' } } }, createdAt: ago(30), updatedAt: ago(1) },
    { id: 'prj_yuna', kind: 'personal', userId: 'usr_yuna', members: ['usr_yuna'], cohortId: 'coh_20', caseId: 'case_hrd', title: '교육 결과 보고서 초안 자동화', stage: 'talk', reached: 1, data: { prep: { goal: '교육 결과 보고서에서 경영진이 무엇을 보고 판단하는지 알고, 자동화할 부분을 정한다', questions: ['최근 결과 보고서를 쓰신 과정을 처음부터 말씀해 주시겠어요?'] }, talk: { mode: 'real', hit: [] } }, createdAt: ago(30), updatedAt: ago(6) },
    { id: 'prj_minjun', kind: 'personal', userId: 'usr_minjun', members: ['usr_minjun'], cohortId: 'coh_20', caseId: 'case_green', title: '그린루틴 런칭 리뷰 분석', stage: 'insight', reached: 2, data: { prep: { goal: '마케터가 리뷰를 어떻게 쓰는지 알고 싶다', questions: ['리뷰는 어디서 확인하세요?'] }, talk: { mode: 'real', realNotes: '현직 멘토 인터뷰 메모: 리뷰는 매일 보지만 정리할 시간이 없음. 성분 불만과 효과 칭찬이 섞여 있음.', consent: true, hit: ['반복·소모 업무'] }, insight: { pains: [{ text: '리뷰 정리할 시간이 없다', kind: '사실', evidence: '' }] } }, createdAt: ago(30), updatedAt: ago(3) },
    { id: 'prj_haeun', kind: 'personal', userId: 'usr_haeun', members: ['usr_haeun'], cohortId: 'coh_20', caseId: 'case_green', title: '마이크로 인플루언서 선정 기준', stage: 'topic', reached: 3, data: { topic: { pick: '' } }, createdAt: ago(30), updatedAt: ago(2) },
    { id: 'prj_seoyeon', kind: 'personal', userId: 'usr_seoyeon', members: ['usr_seoyeon'], cohortId: 'coh_20', caseId: 'case_hankki', title: '한끼랩 반복 문의 분류', stage: 'prep', reached: 0, data: { prep: { goal: '', questions: ['회사 매출이 얼마인가요?', '직원 수는 몇 명인가요?', 'AI를 쓰고 싶으신가요?'] } }, createdAt: ago(25), updatedAt: ago(6) }
  ];

  /* ---------- 판단 기록 ---------- */
  function L(id, u, prj, stage, kind, source, text, d, h, extra) {
    var o = { id: id, userId: u, projectId: prj, stage: stage, kind: kind, source: source, text: text, original: text, edited: false, createdAt: ago(d, h) };
    for (var k in (extra || {})) o[k] = extra[k];
    return o;
  }
  var S = 'usr_seojin';
  var logs = [
    L('log_l1', S, 'prj_seojin_lk', 'job', '문제 정의', '문서 작성', '직무 탐구 작성. 세부 업무 4개(기획·운영·평가·수요조사), 필요 역량을 소프트/하드로 구분. AI 사수 질문 뒤 "미래 전망"에 근거 없는 수치를 빼고 방향만 남김.', 56, 4),
    L('log_l2', S, 'prj_seojin_lk', 'issue', '대안 선택', '문서 작성', '이슈 후보 2개(HR 테크 투자 확대 / 교육 효과 측정의 데이터화) 중 "교육 효과 측정의 데이터화" 선택. 이유: HRD 담당자의 업무 방식에 직접 영향을 주고, 인터뷰에서 현장 체감을 확인할 수 있음. 이슈 선정 기준 4개 모두 충족.', 54, 2),
    L('log_l3', S, 'prj_seojin_lk', 'prep', '문제 정의', '문서 작성', '인터뷰 목표: 교육 종료 후 시간 사용과 판단 기준 파악 → AI 과제 근거 확보. 질문 5개. 코치 검토 뒤 2개를 고침(폐쇄형 → 경험형), 이슈를 현장에서 검증하는 질문 1개 추가.', 52, 3),
    L('log_l4', S, 'prj_seojin_lk', 'talk', '문제 정의', '인터뷰', '질문 5개 (질문지 그대로 5개). 다룬 영역: 현장·하루 일과, 반복·소모 업무, 비효율·병목, 제약·조건. 묻지 않은 영역: 커리어·동기, 데이터·도구.', 51, 5),
    L('log_l5', S, 'prj_seojin_lk', 'insight', 'AI 검증', '코치 근거 확인', '발견 4개 정리 (사실 3, 추정 1). "경영진이 근거를 더 요구할 것"은 인터뷰 원문에 근거가 없어 추정으로 표시. 현직자 판단 기준: 근거 원문 없이 보고하지 않는다, 소수 의견은 소수로 표시.', 49, 2, { verifiedBy: 'usr_mentor', verifyNote: '사실과 추정을 구분한 판단이 현업 보고 습관과 같아요.' }),
    L('log_l6', S, 'prj_seojin_lk', 'propose', '대안 선택', '문서 작성', 'AI 프로젝트 제안: "서술형 응답 의미 기반 분석 + 근거 원문 제시". 버린 후보: 부서별 수요조사 취합 — 연 1회라 4주 안에 효과 검증이 어려움.', 46, 1, { verifiedBy: 'usr_mentor', verifyNote: '검증 가능성으로 범위를 좁힌 판단, 현업에서도 이렇게 합니다.' }),
    L('log_l7', S, 'prj_seojin_lk', 'propose', 'AI 검증', '멘토 대화', '사수: 30분이 됐는지 무엇으로 확인할 건가요? 정확도는 어떻게 함께 볼 건가요?\n나: 같은 응답 세트를 직접 정리한 시간과 도구 사용 시간을 비교하고, 근거 원문이 주제와 맞는지 샘플로 대조하겠습니다.', 45, 6),
    L('log_l8', S, 'prj_seojin_lk', 'final', '실행 판단', '디펜스', 'Q: 근거 원문을 반드시 함께 보여 주기로 한 판단의 근거는?\nA: 인터뷰에서 경영진이 몇 명이 그렇게 말했냐고 묻는다는 말을 들었고, 소수 의견 과대 보고가 실제 문제였기 때문입니다.\n(답변 시간 61초)', 41, 2),
    L('log_p1', S, 'prj_seojin', 'topic', '대안 선택', '문서 작성', '링커슈 제안을 이어받아 주제 확정: 교육 만족도 서술형 응답 의미 기반 분석. 범위를 "AI가 결정하는 도구"가 아니라 "담당자가 판단하기 전에 정리해 주는 도구"로 제한.', 34, 3),
    L('log_p2', S, 'prj_seojin', 'plan', 'AI 검증', 'AI 대화', 'AI가 제안한 "AI가 원문을 요약해 그대로 보고서에 넣기"를 버림. 이유: 원문을 AI가 다시 쓰면 근거가 흔들림. 응답에 R001 번호를 붙이고 AI는 번호만 반환하게 설계.', 32, 2, { action: '버린다', aiMessage: '응답을 주제별로 요약하고, 대표 의견 문장을 AI가 정리해 보고서에 바로 넣으면 시간을 크게 줄일 수 있습니다.' }),
    L('log_p3', S, 'prj_seojin', 'plan', '실행 판단', '문서 작성', '기획안 v3 저장. 바뀐 섹션: 해결 방안, 검토한 대안. "답이 딱 떨어지는 부분(건수·반복 판정·상위 3개)은 코드로" 원칙을 넣음. AI 원문 1개 중 고치거나 뺀 것 1개.', 31, 4),
    L('log_p4', S, 'prj_seojin', 'run', '방향 전환', '주간 체크인', '1주차 체크인. 키워드 규칙 프로토타입이 "실습 시간이 짧다"와 "직접 해볼 기회"를 다른 의견으로 나눔 → 의미 이해가 필요하다고 판단, 2주차에 LLM 분석으로 전환.', 24, 5, { verifiedBy: 'usr_mentor', verifyNote: 'AI가 필요한 이유를 결과로 확인하고 도입한 점이 좋습니다.' }),
    L('log_p5', S, 'prj_seojin', 'run', 'AI 검증', '멘토 대화', '1주차 사수: LLM으로 바꾸면 무엇이 새로 위험해지나요?\n나: 원문을 바꿔 쓰거나 숫자를 지어낼 수 있어요. 번호만 돌려받고, 원문 치환과 건수 계산은 코드로 하겠습니다.', 24, 3),
    L('log_p6', S, 'prj_seojin', 'run', 'AI 검증', '외부 대화', 'ChatGPT 대화에서 Structured Outputs 스키마 오류(uniqueItems 미지원)를 만남. 스키마 제약을 빼고 중복 제거·최대 개수는 JavaScript 검증 코드로 옮김.', 20, 2, { action: '고친다' }),
    L('log_lk_d', 'usr_doyun', 'prj_seojin_lk', 'issue', '대안 선택', '문서 작성', '이슈 후보로 "HR 테크 투자 확대"를 제안했지만, 중견기업 HRD 현장과 거리가 멀어 팀 논의 끝에 내려놓음.', 54, 5),
    L('log_lk_y', 'usr_yuna', 'prj_seojin_lk', 'prep', 'AI 검증', '문서 작성', '"HRD 담당자는 몇 명인가요?"는 채용공고·회사 소개로 확인 가능해 사전 리서치로 옮김.', 52, 6),
    L('log_t1', 'usr_doyun', 'prj_team_hrd', 'prep', '문제 정의', '문서 작성', '팀 인터뷰 목표 초안 작성: 수요조사 병목과 부서장·구성원 요구 차이 판단 방식 파악.', 4, 5),
    L('log_t2', 'usr_yuna', 'prj_team_hrd', 'prep', 'AI 검증', '문서 작성', '질문 4개 중 "수요조사 양식이 몇 개인가요?"는 사전 리서치로 옮기자고 제안(검색·자료로 확인 가능).', 4, 2),
    L('log_t3', S, 'prj_team_hrd', 'talk', '문제 정의', '인터뷰', '팀 인터뷰 진행 중. 질문 1개. 다룬 영역: 반복·소모 업무.', 1, 4),
    L('log_o1', 'usr_seoyeon', 'prj_seoyeon', 'prep', '문제 정의', '문서 작성', '질문 3개 준비. 코치 검토 없이 시작.', 6, 2),
    L('log_o2', 'usr_haeun', 'prj_haeun', 'topic', '대안 선택', 'AI 대화', 'AI가 제안한 인플루언서 후보 리스트를 그대로 씀(쓴다). 이유 미기재.', 2, 4, { action: '쓴다' }),
    L('log_o3', 'usr_minjun', 'prj_minjun', 'talk', '문제 정의', '실제 인터뷰', '실제 현직자 인터뷰 메모를 올림. 지식 베이스 활용 동의함.', 5, 3),
    L('log_o4', 'usr_doyun', 'prj_doyun', 'topic', '대안 선택', '문서 작성', '부서별 수요조사 취합 선택. 고른 이유: 양식 통일만으로도 효과가 큼.', 9, 1)
  ];

  var chats = [
    { id: 'cht_1', userId: S, projectId: 'prj_seojin', mode: 'mentor', title: 'AI 결과를 어떻게 검증할까', messages: [
      { role: 'user', content: 'AI가 응답을 주제로 묶어 줬는데, 이게 맞는지 어떻게 확인하면 좋을까요?', t: ago(22, 3) },
      { role: 'assistant', content: '현업에서는 결과를 쓰기 전에 "근거가 된 원문이 정말 그 주제를 말하나"부터 봐요. 주제마다 근거 원문을 2~3개씩 뽑아 직접 읽어 보면 오분류가 보일 거예요. 서진 님이라면 몇 개 주제를, 어떤 순서로 확인하겠어요?', t: ago(22, 3) }
    ], createdAt: ago(22, 3) },
    { id: 'cht_2', userId: S, projectId: 'prj_seojin', mode: 'external', source: 'ChatGPT', title: 'ChatGPT · Structured Outputs 스키마 오류', messages: [
      { role: 'user', content: 'Invalid schema: uniqueItems is not permitted 이 오류가 떠요', t: ago(20, 3) },
      { role: 'assistant', content: 'Structured Outputs는 일부 JSON Schema 키워드를 지원하지 않습니다. uniqueItems를 제거하고, 중복 제거는 코드에서 처리하세요.', t: ago(20, 3), decision: { action: '고친다', reason: '스키마에서 빼고 중복 제거·개수 제한을 JS 검증으로 옮김' } }
    ], createdAt: ago(20, 3) }
  ];

  var reviews = [
    { id: 'rev_1', projectId: 'prj_seojin_lk', learnerId: S, mentorId: 'usr_mentor', mentorName: '김혜원', stage: 'propose', status: '완료', comments: [{ quote: '소수 의견은 소수로 표시', text: '현업에서 정말 자주 생기는 문제를 잘 짚었어요. 개인 프로젝트에서는 "몇 건 중 몇 건"을 화면에 꼭 보여 주세요.', reply: '' }], rubric: { '문제 정의': 4, 'AI 협업': 3, '검증': 3, '판단·변화 대응': 3, '설명·책임': 4 }, verified: true, approved: true, createdAt: ago(44) },
    { id: 'rev_2', projectId: 'prj_doyun', learnerId: 'usr_doyun', mentorId: '', mentorName: '', stage: 'plan', status: '요청', comments: [], rubric: null, verified: false, createdAt: ago(1) }
  ];

  var mentors = [
    { id: 'mtr_1', name: '김혜원', userId: 'usr_mentor', company: '제조 대기업 A사', role: '인재개발팀 HRD 리드', years: 12, industry: '제조', tags: ['HRD', '교육기획', '교육평가'], contactOk: true, channel: '플랫폼 메시지', lastContact: ago(30).slice(0, 10), contactCount: 7, note: '링커스 OB · 14기 · 인터뷰 30분 가능', cohorts: ['14기'] },
    { id: 'mtr_2', name: '송유진', company: '뷰티 B사', role: '브랜드 마케터', years: 7, industry: '뷰티', tags: ['브랜드', '인플루언서', '퍼포먼스'], contactOk: true, channel: '이메일', lastContact: ago(5).slice(0, 10), contactCount: 4, note: '링커스 OB · 15기', cohorts: ['15기'] },
    { id: 'mtr_3', name: '한도현', company: '핀테크 C사', role: '데이터 분석가', years: 6, industry: '핀테크', tags: ['SQL', '대시보드', '실험'], contactOk: false, channel: '이메일', lastContact: ago(120).slice(0, 10), contactCount: 2, note: '하반기 컨택 불가', cohorts: ['16기'] },
    { id: 'mtr_4', name: '이소라', company: 'IT 서비스 D사', role: '교육운영 매니저', years: 9, industry: 'IT 서비스', tags: ['HRD', '온보딩', 'LMS'], contactOk: true, channel: '카카오톡 오픈채팅', lastContact: ago(30).slice(0, 10), contactCount: 8, note: 'Case 제공 동의', cohorts: ['12기'] },
    { id: 'mtr_5', name: '김건우', company: 'IT 서비스 E사', role: '서비스 기획자(PM)', years: 5, industry: 'IT 서비스', tags: ['기획', 'PRD', '사용자 인터뷰'], contactOk: true, channel: '플랫폼 메시지', lastContact: ago(14).slice(0, 10), contactCount: 3, note: '링커스 OB · 19기', cohorts: ['19기'] },
    { id: 'mtr_6', name: '윤태호', company: '이커머스 F사', role: 'CX 운영 리드', years: 10, industry: '이커머스', tags: ['CS', '운영', 'VOC'], contactOk: true, channel: '플랫폼 메시지', lastContact: ago(60).slice(0, 10), contactCount: 6, note: '링커스 OB · 18기', cohorts: ['18기'] }
  ];
  var contacts = [
    { id: 'ctc_1', learnerId: 'usr_minjun', mentorId: 'mtr_2', projectId: 'prj_minjun', status: '완료', message: '그린루틴 리뷰 분석 프로젝트로 30분 인터뷰를 요청드립니다.', schedule: ago(6).slice(0, 10), createdAt: ago(9) },
    { id: 'ctc_2', learnerId: 'usr_yuna', mentorId: 'mtr_1', projectId: 'prj_yuna', status: '요청', message: '링커스 20기 HRD팀 한유나입니다. 교육 결과 보고서를 쓰실 때 경영진이 무엇을 가장 먼저 보는지 30분 정도 여쭤보고 싶습니다. 질문 예시: 최근 결과 보고서를 쓰신 과정을 처음부터 말씀해 주시겠어요?', createdAt: ago(1) }
  ];

  var archive = [
    { id: 'arc_1', type: '링커슈', title: '[19기 HRD팀] 링커슈 · 사내 교육 효과 측정의 데이터화', cohort: '19기', author: '19기 HRD팀', source: '구글 드라이브', tags: ['HRD', '교육평가'], body: 'Ⅰ. 직무 탐구 — HRD는 교육 기획·운영·평가·수요조사로 나뉜다.\nⅡ. 이슈 탐구 — 교육 예산 축소와 함께 교육 효과를 근거로 설명해야 하는 요구가 커짐.\nⅢ. AI 프로젝트 제안 — 교육 후 서술형 피드백을 분석해 다음 과정 설계에 반영하는 도구. 리스크: 설문 개인정보.', useInKB: true, createdAt: ago(200) },
    { id: 'arc_2', type: '링커슈', title: '[19기 마케팅팀] 링커슈 · 콘텐츠 마케터의 하루는 어떻게 바뀌었나', cohort: '19기', author: '19기 마케팅팀', source: '노션', tags: ['마케팅', '콘텐츠'], body: '현직 마케터 3명 인터뷰 요약. 카피 초안은 AI, 최종 톤 조정과 심의 대응은 사람. 효능 표현 규제가 있는 업종은 AI 초안 검수가 더 오래 걸림.', useInKB: true, createdAt: ago(180) },
    { id: 'arc_3', type: '컨택 보고서', title: '[컨택 보고서] 제조 대기업 HRD 리드 인터뷰', cohort: '18기', author: '18기 김OO', source: '구글 드라이브', tags: ['HRD', '교육평가'], body: '인터뷰 목적: HRD 담당자가 교육 결과를 어떻게 판단·보고하는지 이해.\n핵심 발견: 1) 만족도 점수보다 서술형 의견을 경영진이 더 궁금해함 2) 응답 수가 적은 의견은 소수로 표시 3) 교육 개선은 다음 분기 계획 회의 일정에 맞춰야 반영됨.\n현직자의 판단 기준: 근거 없이 보고하지 않는다.', useInKB: true, createdAt: ago(300) },
    { id: 'arc_4', type: '인터뷰 설계', title: '실무자 인터뷰 질문 설계 가이드 (시니어 인터뷰 방식)', cohort: '공통', author: '링커스 운영진', source: '노션', tags: ['인터뷰', '가이드'], body: '1. 검색으로 알 수 있는 것은 묻지 않는다(회사 규모·매출·비전).\n2. "최근에 ~했던 때를 처음부터" 같은 경험 질문으로 시작한다.\n3. 판단 질문: "그때 다른 선택지는 무엇이었나요? 왜 그걸 택하셨나요?"\n4. 숫자로 확인: "얼마나 자주 / 몇 시간 / 몇 건".\n5. 이슈 검증: "기사에서는 ~라던데 현장에서는 어떻게 느끼세요?"\n6. 마지막에 "제가 꼭 물어봤어야 하는데 안 물어본 게 있을까요?"', useInKB: true, createdAt: ago(400) },
    { id: 'arc_5', type: '세션 자료', title: '20기 세션설계서 · Decision Log 운영 원칙', cohort: '20기', author: '링커스 운영진', source: '구글 드라이브', tags: ['DL', '운영'], body: 'AI로 만든 결과물은 이제 누구나 비슷하게 냅니다. 면접에서 갈리는 건 결과물이 아니라 "왜 그렇게 하셨어요?"에 답할 수 있느냐입니다. 그 답이 미리 적혀 있는 문서가 Decision Log입니다.', useInKB: false, createdAt: ago(250) },
    { id: 'arc_6', type: '세션 자료', title: '[20기] 링커슈 보고서 양식', cohort: '20기', author: '링커스 운영진', source: '구글 드라이브', tags: ['링커슈', '양식'], body: 'Ⅰ. 직무 탐구 (인터뷰 전) — 세부 역할 및 업무 / 필요 역량 및 지식 / 미래 전망\nⅡ. 이슈 탐구 (인터뷰 전) — 선정한 이슈(기사 출처) / 이슈 설명(핵심·배경) / 이슈 분석(사례·산업 동향). 선정 기준: 업무·전략에 직접 영향, 산업·기술·정책 변화 반영, 개선 아이디어 도출 가능, 기사 근거 제시 가능\nⅢ. AI 프로젝트 제안 (인터뷰 후) — 문제 정의 / 프로젝트 개요(방향·데이터와 AI 방식·기대 효과) / 실현가능성 및 리스크', useInKB: false, createdAt: ago(70) }
  ];

  var knowledge = [
    { id: 'kn_1', sourceType: '채용공고(JD)', title: 'HRD 매니저(교육기획·운영) 채용공고 (가상 예시)', url: '', status: '자동 반영', confidence: 0.91, auto: true,
      extracted: { role: 'HRD 매니저', tasks: ['사내 교육 과정 기획·운영', '교육 만족도·효과성 분석', '부서별 교육 수요조사', '교육 결과 보고'], pains: ['설문 결과 수작업 정리', '부서별 양식 불일치'], criteria: ['교육 효과는 현업 적용으로 판단', '데이터 근거 기반 보고'], tools: ['LMS', '엑셀', '구글 폼', 'PPT'] }, caseIds: ['case_hrd', 'case_hrd2', 'case_hrd3'], createdAt: ago(7) },
    { id: 'kn_2', sourceType: '컨택 보고서', title: '제조 대기업 HRD 리드 인터뷰에서 추출', url: '', status: '승인', confidence: 0.86, auto: false,
      extracted: { role: 'HRD 리드', tasks: ['교육 결과 보고', '다음 분기 교육 계획'], pains: ['서술형 의견 정리'], criteria: ['응답 수가 적은 의견은 소수로 표시', '교육 개선은 계획 회의 일정에 맞춰야 반영'], tools: ['LMS', '엑셀'] }, caseIds: ['case_hrd'], createdAt: ago(20) },
    { id: 'kn_3', sourceType: '업계 소식', title: '화장품 광고 효능 표현 심의 강화 (가상 예시)', url: '', status: '검수 대기', confidence: 0.64, auto: false,
      extracted: { role: '브랜드 마케터', tasks: ['광고 문구 심의 대응'], pains: ['AI 카피의 과장 표현'], criteria: ['효능은 근거 자료가 있는 표현만'], tools: [] }, caseIds: ['case_green'], createdAt: ago(1) },
    { id: 'kn_4', sourceType: '채용공고(JD)', title: '구독 커머스 운영 매니저 채용공고 (가상 예시)', url: '', status: '자동 반영', confidence: 0.9, auto: true,
      extracted: { role: '운영 매니저', tasks: ['CS 운영 및 VOC 분석', '주간 운영 지표 리포팅'], pains: ['수작업 리포팅'], criteria: ['고객 경험 일관성'], tools: ['엑셀', '구글 시트'] }, caseIds: ['case_hankki'], createdAt: ago(9) }
  ];

  var challenges = [
    { id: 'chl_1', company: '(예시) 물류 스타트업 F사', title: '배송 지연 고객 안내 메시지 개선', brief: '배송 지연 시 고객 문의가 급증합니다. 주니어의 시각으로 안내 메시지와 운영 프로세스 개선안을 AI와 함께 만들어 주세요. 가상 데이터를 씁니다.', period: ahead(10) + ' ~ ' + ahead(24), status: '모집 중', caseId: 'case_chl_1', contact: 'HR팀 인재영입 담당 (가상)', reward: '우수 3명 현직자 1:1 피드백 + 서류 우대', participants: [], consentRequired: true, createdAt: ago(3) }
  ];

  var assignments = [
    { id: 'asg_1', cohortId: 'coh_20', moduleId: 'm1', title: 'AI 업무 활용 온보딩 완료', type: '온보딩', due: ahead(-56), desc: '레슨 4개와 실습을 마치면 자동으로 제출됩니다.', auto: 'onboarding' },
    { id: 'asg_2', cohortId: 'coh_20', moduleId: 'm2', title: '링커슈 보고서 · 발표', type: '링커슈', due: ahead(-42), desc: '링커슈 프로젝트에서 직무 탐구·이슈 탐구·AI 프로젝트 제안이 보고서 양식으로 자동 완성되고, 발표를 마치면 제출됩니다.', auto: 'linkushu' },
    { id: 'asg_3', cohortId: 'coh_20', moduleId: 'm2', title: '컨택 보고서', type: '컨택 보고서', due: ahead(-45), desc: '인터뷰와 인사이트 정리가 끝나면 프로젝트에서 초안이 만들어집니다.', auto: 'contact_report' },
    { id: 'asg_4', cohortId: 'coh_20', moduleId: 'm3', title: '개인 프로젝트 Decision Log', type: 'Decision Log', due: ahead(4), desc: '판단 기록이 DL 5칸 형식으로 자동 정리됩니다. 확인 후 제출하세요.', auto: 'dl' },
    { id: 'asg_5', cohortId: 'coh_20', moduleId: 'm3', title: '개인 프로젝트 결과 보고 · 디펜스', type: '결과 보고', due: ahead(6), desc: '프로젝트 마지막 단계에서 제출됩니다.', auto: 'final' },
    { id: 'asg_6', cohortId: 'coh_20', moduleId: 'm4', title: '팀 프로젝트 결과 보고', type: '결과 보고', due: ahead(20), desc: '직무팀 프로젝트의 마지막 단계에서 제출됩니다.', auto: 'team_final' }
  ];
  var submissions = [
    { id: 'sub_1', assignmentId: 'asg_1', userId: S, status: '완료', body: '온보딩 4개 레슨 완료', auto: true, createdAt: ago(56) },
    { id: 'sub_2', assignmentId: 'asg_2', userId: S, status: '피드백 완료', title: '[링커슈 · HRD팀] 교육 만족도 데이터의 활용', body: 'Ⅰ. 직무 탐구 … Ⅱ. 이슈 탐구 … Ⅲ. AI 프로젝트 제안 … (링커슈 프로젝트에서 자동 완성)', projectId: 'prj_seojin_lk', auto: true, feedback: '이슈 탐구와 인터뷰가 문제 정의로 자연스럽게 이어졌어요. 발표도 근거가 분명했어요.', createdAt: ago(41) },
    { id: 'sub_3', assignmentId: 'asg_3', userId: S, status: '완료', title: '컨택 보고서 · 한빛정밀 HRD 매니저', body: '[목적] 교육 종료 후 HRD 담당자의 시간 사용과 판단 기준 파악 …', createdAt: ago(48) },
    { id: 'sub_4', assignmentId: 'asg_1', userId: 'usr_doyun', status: '완료', body: '온보딩 완료', auto: true, createdAt: ago(56) },
    { id: 'sub_5', assignmentId: 'asg_1', userId: 'usr_minjun', status: '완료', body: '온보딩 완료', auto: true, createdAt: ago(55) },
    { id: 'sub_6', assignmentId: 'asg_1', userId: 'usr_haeun', status: '완료', body: '온보딩 완료', auto: true, createdAt: ago(55) },
    { id: 'sub_7', assignmentId: 'asg_1', userId: 'usr_yuna', status: '완료', body: '온보딩 완료', auto: true, createdAt: ago(55) },
    { id: 'sub_8', assignmentId: 'asg_2', userId: 'usr_minjun', status: '제출', title: '[링커슈] 마케팅 · 숏폼 광고와 AI', body: 'Ⅰ. 직무 탐구 …', createdAt: ago(42) }
  ];
  var progress = ['usr_seojin', 'usr_doyun', 'usr_yuna', 'usr_minjun', 'usr_haeun'].map(function (u) { return { id: 'prg_' + u, userId: u, onboarding: { done: ['l1', 'l2', 'l3', 'l4'], practice: {} }, createdAt: ago(56) }; })
    .concat([{ id: 'prg_usr_seoyeon', userId: 'usr_seoyeon', onboarding: { done: ['l1', 'l2'], practice: {} }, createdAt: ago(50) }]);
  var portfolios = [
    { id: 'pf_seojin', userId: S, public: false, headline: 'AI의 판단과 코드의 검증을 나눌 줄 아는 HRD 기획자', projectIds: ['prj_seojin_lk', 'prj_seojin'], picks: ['log_l5', 'log_p2', 'log_p4'], createdAt: ago(2) }
  ];
  var usage = [
    { id: 'u_demo_chat', day: ago(1).slice(0, 10), task: 'mentor_chat', provider: 'openai', model: 'gpt-5.6', calls: 42, input: 210000, output: 38000, users: [S, 'usr_doyun', 'usr_yuna'] },
    { id: 'u_demo_persona', day: ago(1).slice(0, 10), task: 'persona', provider: 'openai', model: 'gpt-5.6', calls: 31, input: 120000, output: 15000, users: [S, 'usr_seoyeon'] },
    { id: 'u_demo_review', day: ago(2).slice(0, 10), task: 'plan_review', provider: 'openai', model: 'gpt-5.6', calls: 18, input: 90000, output: 12000, users: [S] }
  ];

  users.push(
    { id: 'usr_school_student', name: '서윤', role: 'student', audience: 'school', ageBand: '초5–6', schoolClassId: 'cls_think', demo: true },
    { id: 'usr_school_teacher', name: '정 선생님', role: 'teacher', audience: 'school', schoolClassId: 'cls_think', demo: true },
    { id: 'usr_school_guardian', name: '서윤 보호자', role: 'guardian', audience: 'school', schoolClassId: 'cls_think', demo: true }
  );
  var schoolClasses = [{ id: 'cls_think', name: '스스로 생각하는 교실 · 4주 과정', level: '초5–6', teacherIds: ['usr_school_teacher'], studentIds: ['usr_school_student'], guardianIds: ['usr_school_guardian'], createdAt: ago(7) }];
  var schoolConsents = [{ id: 'consent_demo', classId: 'cls_think', studentId: 'usr_school_student', guardianId: 'usr_school_guardian', status: 'verified', acceptedAt: ago(7), verifiedAt: ago(7), verifiedBy: 'usr_school_teacher', verificationNote: '시연용 가상 동의 기록', noticeVersion: 'school-2026-11' }];
  var schoolMissions = [
    { id: 'mission_snack', title: '3만 원으로 우리 반 행사 준비하기', level: '초5–6', conditions: '친구 20명 · 예산 30,000원 · 준비물도 예산에 포함', resources: '가격표: 간식 A 3,000원 / 간식 B 1,000원 / 준비물 한 묶음 10,000원', aiExample: '간식 A를 20개 사면 3,000원 × 20명 = 60,000원이에요. 30,000원 예산으로 충분할 거예요.', question: '가격표와 전체 예산을 비교하면, AI 예시에서 무엇을 고쳐야 할까요?', reviewed: true, reviewedBy: 'sample-curriculum', reviewedAt: ago(7) },
    { id: 'mission_picnic', title: '그림 카드로 소풍 준비물 고르기', level: '초1–4', conditions: '친구 4명 · 물은 한 사람에 한 병 · 가방에는 5개까지', resources: '준비물 카드: 물 4병, 돗자리 1개, 공 1개. 선생님과 소리 내어 읽고, 말한 내용을 적어도 좋아요.', aiExample: '물 2병, 돗자리 1개, 공 1개를 담으면 모두 준비됐어요.', question: '친구 수만큼 물이 있나요? 선생님과 카드 수를 세어 보세요.', reviewed: true, reviewedBy: 'sample-curriculum', reviewedAt: ago(7) },
    { id: 'mission_source', title: '학교 소식, 어느 자료를 믿을까?', level: '중학생', conditions: '축제 날짜를 학급에 안내해야 해요. 최신 학교 공지를 확인해요.', resources: '학교 공식 공지(11/6): 11월 20일 개최 / 개인 블로그(작년 게시물): 11월 13일 개최', aiExample: '블로그에 축제가 11월 13일이라고 적혀 있으니 그 날짜로 안내하세요.', question: '작성 시점과 출처를 비교하면 어떤 자료를 선택해야 할까요?', reviewed: true, reviewedBy: 'sample-curriculum', reviewedAt: ago(7) },
    { id: 'mission_argument', title: 'AI가 만든 주장의 근거 확인하기', level: '고등학생', conditions: '전교생 의견을 대표하는지 확인하고, 주장의 한계를 함께 설명해요.', resources: '설문 대상: 희망자 20명 / 응답 16명이 야간 자율학습 시간 변경에 찬성 / 전체 학생 수: 500명', aiExample: '응답자의 80%가 찬성하므로 전교생의 80%가 시간 변경을 원한다고 결론 내릴 수 있습니다.', question: '표본의 구성과 전체 학생 수를 고려하면 주장을 어떻게 고쳐야 할까요?', reviewed: true, reviewedBy: 'sample-curriculum', reviewedAt: ago(7) }
  ];
  var sharingSessions = [{ id: 'sharing_week11', cohortId: 'coh_20', title: '11주차 공유시간 · 내 판단이 바뀐 순간', startsAt: new Date(now + 3 * DAY).toISOString(), venue: '링커스 모임 공간 · 운영진이 장소를 안내해요', format: '오프라인', status: '예정', agenda: '체크인 10분 → 팀별 5분 발표 → 질문과 동료 피드백 → 개인 회고와 다음 행동', participants: ['usr_seojin', 'usr_doyun', 'usr_yuna'], createdAt: ago(1) }];
  return { users: users, cohorts: [cohort], cases: cases, projects: projects, logs: logs, chats: chats, reviews: reviews, mentors: mentors, contacts: contacts,
    sharingSessions: sharingSessions, sharingEntries: [], schoolClasses: schoolClasses, schoolMissions: schoolMissions, schoolConsents: schoolConsents, schoolAttempts: [], schoolReports: [],
    archive: archive, knowledge: knowledge, challenges: challenges, portfolios: portfolios, assignments: assignments, submissions: submissions, settings: settings, usage: usage, progress: progress };
};
