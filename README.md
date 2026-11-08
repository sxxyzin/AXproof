# AX Proof 웹 서비스 — 실행 · 배포 가이드

## v1.2 먼저 보기

현재 기준은 [플랫폼 확장과 실서비스 전환](../docs/06_플랫폼확장과실서비스전환_v1.2.md)입니다. 대화에서 사용자의 판단을 포착해 비공개 포트폴리오에 쌓고, 공유시간의 모임·발표·질문·피드백·회고를 연결했습니다. 초중고는 학생·교사·보호자 역할과 별도 기록을 사용합니다.

실행: `npm.cmd run env:prepare` → `npm.cmd start`. 점검: `npm.cmd test`. 배포 설정 점검: `npm.cmd run preflight -- --production`.

실제 운영은 `AXP_DEMO=0`, Supabase 필수입니다. 최초 배포에는 예시 학생·운영진·훈련생 활동을 넣지 않고, 운영진 가입 후 기수 초대 코드를 설정합니다. 기존 아래 v1.1 안내 중 비밀번호 초기화는 일회용 초기화 코드가 추가됐습니다. 공개 포트폴리오에는 직접 고른 판단만 표시합니다.

AI 사수와 함께하는 실무 역량 훈련·검증 플랫폼입니다. 홈페이지, 훈련생·현직 멘토·운영진 화면, AI(OpenAI 기본 · Claude 선택) 연동 서버, 가입·로그인, 데이터 저장까지 들어 있습니다.

> 배포를 처음부터 따라 하려면 **`../docs/05_앞으로의_방향성과_배포가이드.md`** (Part B, Step 0~8)를 보세요. 이 README는 요약입니다.

## 0. 가장 빠르게 보기

홈페이지(`http://localhost:3000/`)에 대화 → 판단 기록 → 비공개 포트폴리오 자동 재생, 스크롤 진입 모션, 훈련 과정 탭, HRD·서비스 기획·마케팅 판단 체험을 추가했습니다. **서비스 영상 보기**를 누르면 원본으로 제작한 18초 MP4가 재생됩니다. 홈페이지의 재생 화면과 체험은 예시이며, 입력은 이 화면에만 표시되고 계정에 저장하거나 AI API를 호출하지 않습니다. 실제 AI와 기록은 `app.html`에서 사용합니다.

영상·포스터·자막은 `public/assets/media/`에 포함되어 있어 Vercel 빌드에 별도 영상 도구가 필요 없습니다. 영상을 다시 제작하려면 `AXP_FFMPEG`, `AXP_VIDEO_FONT`에 FFmpeg 실행 파일과 한글 폰트를 지정하고 `npm.cmd run media:build`를 실행합니다. 제작 스크립트의 Windows 기본 경로는 프로젝트 안의 Git 제외 제작 도구 폴더를 사용합니다. Chrome/Edge에서는 **Ctrl+Shift+R**로 새 홈을 불러올 수 있습니다.

| 방법 | 하는 일 | AI |
|---|---|---|
| `public/app.html` 파일을 더블클릭 | 브라우저 데모 모드 (이 브라우저에만 저장, 둘러보기만) | 데모 응답 |
| **`start.bat` 더블클릭** (Windows) | 서버 실행 + 브라우저 자동 열림 | 키를 넣으면 실제 AI |
| `npm install` → `npm start` | 같은 동작 (Mac·Windows 공통) | 〃 |

브라우저 데모 데이터는 `assets/js/seed.js`의 `AXP_SEED_VERSION`별로 저장합니다. 예시 사용자·프로젝트를 수정할 때 이 버전도 올리면 다시 열거나 새로고침할 때 새 예시가 반영됩니다. 이전 버전의 저장 데이터는 삭제하지 않으며, 예전 계정으로 로그인돼 있었다면 둘러보기에서 최신 계정을 다시 선택합니다.

서버 실행 후 주소
- 서비스 소개: http://localhost:3000/
- 플랫폼: http://localhost:3000/app.html — **로그인 / 처음이에요(가입) / 둘러보기** 탭. 둘러보기에서 훈련생 우서진 · 현직 멘토 김혜원 · 링커스 운영진을 고를 수 있어요.
- 역할 바로가기: `app.html?as=learner`, `?as=mentor`, `?as=admin`
- 기획서: http://localhost:3000/plan.html (파일 하나짜리 버전은 `../docs/AXProof_기획안_v2.html`, `npm run plan:html`로 다시 만들 수 있어요)

> Node.js 18.17 이상이 필요합니다 (https://nodejs.org 의 LTS).

## 1. AI 연결 (기본 OpenAI)

키는 **서버에만** 저장되고 브라우저로 내려가지 않습니다.

- **화면에서:** 운영진으로 로그인 → `AI 설정` → GPT 키 입력 → 저장 → `연결 테스트` (로컬 실행 시 `data/secrets.json`에 저장)
- **파일로:** `.env.example`을 `.env`로 복사해 `OPENAI_API_KEY` 입력 후 재시작

이 키는 AI 사수 전용이 아닙니다. 질문 초안 생성·질문지 검토·직무/이슈 조사 점검·AI 실무자 인터뷰·인사이트 정리·주제/기획안 리뷰·주간 체크인·디펜스 질문·역량 피드백·면접 카드·지식 추출·Case 초안 등 모든 AI 도구가 같은 서버 연결을 사용합니다. 초중고 교사의 리포트 초안도 연결된 AI를 사용하며, 학생에게는 교사가 검토한 예시를 제공합니다.

질문 생성: **프로젝트 → 인터뷰 준비 → 인터뷰 목표 입력 → AI로 질문 초안 생성**. 생성된 질문의 목적과 후속 질문을 확인하고 필요한 질문을 골라 추가합니다. 기존 질문은 보존하며, 직접 적은 선택 이유만 본인의 판단 기록으로 남깁니다. 기본 질문 틀 버튼은 고정된 작성 도구입니다.

각 AI 도구는 실행 전 서버의 연결 상태를 갱신합니다. 연결된 API의 일시적 오류는 화면에 알려 주며 데모 응답으로 성공 처리하지 않습니다. 서버 없이 파일로 열거나 키가 없는 경우는 데모 응답입니다.

| 용도 | 기본 모델 (운영진이 변경 가능) |
|---|---|
| AI 사수·업무용 AI 대화 | `gpt-5.6` (추론 강도 low) |
| AI 실무자·코치·지식 추출 | `gpt-5.6` (low) |
| 리뷰·디펜스·Readiness | `gpt-5.6` (medium) |

- OpenAI **Responses API**로 호출합니다(`store: false`, HRD Voice Analyzer와 같은 방식). 모델이 추론 강도 값을 지원하지 않으면 서버가 자동으로 낮춰 다시 보냅니다.
- 키에 설명 문구·한글이 섞이면 서버가 알려 줍니다. 크레딧 부족·모델명 오류도 한글 메시지로 표시돼요.
- Claude도 쓰려면 `ANTHROPIC_API_KEY`를 추가하세요(기본 `claude-opus-5-5`). 두 키가 모두 있으면 훈련생이 대화 중 GPT/Claude를 고를 수 있게 할 수 있어요.
- 키가 없으면 앱은 자동으로 **데모 응답**(규칙 기반)으로 동작합니다. 화면 왼쪽 아래 배지로 상태를 볼 수 있어요.

## 2. 함께 쓰기 (파일럿 운영)

1. 운영진 가입: 로그인 화면 **처음이에요** → 초대 코드 `axproof-admin` (로컬 기본값, `.env`의 `AXP_ADMIN_CODE`로 변경) → 이름·이메일·비밀번호
2. `기수·프로그램`에서 기수 이름·**훈련생 코드**·**멘토 코드**·**직무팀**을 정하고 저장
3. 훈련생·멘토는 **처음이에요** 탭에서 초대 코드 → 이름·이메일·비밀번호(영문+숫자 8자 이상)·직무팀 → 동의 순서로 가입, 이후엔 이메일·비밀번호로 로그인
4. 비밀번호를 잊으면 운영진이 `훈련생 → 이름 → 비밀번호 초기화` → 본인이 같은 이메일·초대 코드로 다시 가입 (기록은 그대로)
5. 실제 운영 전에 `데이터 관리 → 빈 상태로 시작` (Case·지식·아카이브와 운영진 계정은 유지)
6. 지난 기수 자료는 `자료 아카이브 → 자료 가져오기`, 멘토 엑셀은 `멘토 DB → CSV 가져오기`

## 3. 인터넷에 배포하기 (GitHub → Supabase → Vercel)

### 3-1. Supabase (데이터베이스)
1. https://supabase.com → New project (Region: Northeast Asia (Seoul))
2. SQL Editor → `supabase/schema.sql` 내용 붙여넣기 → Run
3. Project Settings → API에서 `Project URL`과 **`service_role` 키** 복사 (anon 키 아님. 이 키는 절대 공개하지 마세요)

### 3-2. Vercel (웹 + API)
1. `AXProof_플랫폼_v1` 폴더(이미 Git 저장소)를 GitHub **비공개** 저장소로 올리기 — `gh repo create axproof --private --source . --push`
2. https://vercel.com → Add New → Project → 저장소 Import → **Root Directory: `web`** → Framework Preset: **Other** (빌드 설정은 `vercel.json`이 지정)
3. Environment Variables:

| 이름 | 값 |
|---|---|
| `OPENAI_API_KEY` | OpenAI 키 — **필수** |
| `AXP_SECRET` | 긴 무작위 문자열 (로그인 토큰 서명) — **필수** |
| `AXP_ADMIN_CODE` | 운영진 가입 코드 — **필수** |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | 3-1에서 복사 — **필수** |
| `ANTHROPIC_API_KEY` | (선택) Claude |
| `AXP_DEMO` | 시연용으로 둘러보기를 열려면 `1` (운영 시 비워 두기) |

4. Deploy → `https://<프로젝트>.vercel.app/api/health` 에서 `"store":"supabase"`, `"openai":true` 확인 → `/app.html`에서 운영진 코드로 가입
5. 처음 접속하면 예시 데이터가 들어갑니다. 운영 전 `데이터 관리 → 빈 상태로 시작`.

> 환경변수를 바꾼 뒤에는 Vercel → Deployments → 최신 배포 → **Redeploy**.

### 3-3. 다른 방법
- **Render / Railway / 자체 서버:** `npm install && npm start` 로 실행되는 일반 Node 서버입니다. 디스크가 유지되는 환경이면 Supabase 없이 `data/db.json`에 저장돼요(소규모 파일럿).
- 정적 호스팅(GitHub Pages)에 `public/`만 올리면 **브라우저 데모 모드**로만 동작합니다.

## 4. 지식 에이전트 정기 실행 (선택)
운영진 `지식 베이스·에이전트`에 채용공고·기업 소식 주소를 등록하고 `지금 수집 실행`을 누르면 수집 → 추출 → (신뢰도 기준 이상 공식 자료는) 자동 반영됩니다. 매주 자동으로 돌리려면 Vercel Cron 또는 GitHub Actions에서 운영진 토큰으로 `/api/fetch-url` → `/api/ai`(task `kb_extract`) → `/api/store`(knowledge)를 호출하는 작업을 추가하세요. (다음 버전에서 서버 전용 엔드포인트로 묶을 예정)

## 5. 폴더 구조

```
web/
├─ server.js              로컬·단일 서버 실행기 (정적 파일 + API)
├─ api/                   서버 API (Vercel 함수로도 그대로 동작)
│  ├─ ai.js               AI 중계 — OpenAI Responses API(기본) / Claude 공식 SDK, 스트리밍, 사용량 기록
│  ├─ store.js            데이터 API — 역할별 권한, 판단 기록 원본 잠금
│  ├─ auth.js             초대 코드 가입 · 이메일/비밀번호 로그인 · 데모 · 비밀번호 초기화
│  ├─ settings.js         AI 모델·키 설정 (운영진)
│  ├─ fetch-url.js        지식 에이전트 페이지 수집
│  ├─ public.js           공개 포트폴리오
│  ├─ health.js
│  └─ _lib/               util(토큰·비밀값), db(Supabase/파일/메모리), providers(Claude·OpenAI)
├─ public/
│  ├─ index.html          서비스 소개 홈페이지
│  ├─ app.html            플랫폼 (훈련생·멘토·운영진·공개 포트폴리오)
│  ├─ plan.html           기획서 뷰어 (docs/*.md)
│  └─ assets/
│     ├─ css/app.css
│     └─ js/  core · ai · prompts(프롬프트 설계) · ui · chat · project(7단계) · learner · mentor · admin · seed(예시 데이터)
├─ supabase/schema.sql
├─ scripts/  copy-docs.js(배포 빌드) · smoke-test.js(npm run check) · build-plan-html.js(npm run plan:html)
├─ .env.example · vercel.json · start.bat
```

## 6. 점검
서버를 켠 상태에서 다른 창에서 `npm run check` — 가입·로그인(비밀번호 규칙·중복·잠금), 비밀번호·이메일 비노출, 훈련생·직무팀 권한, 판단 기록 원본 잠금, 팀 프로젝트 단계별 저장, AI 중계를 확인합니다 (21개 항목). 운영 중인 배포 주소에는 돌리지 마세요(점검용 계정이 생겨요).

## 7. 보안 · 개인정보 메모
- API 키·`service_role` 키·`AXP_SECRET`은 저장소에 올리지 마세요.
- 배포 환경은 데모 로그인이 기본으로 꺼져 있습니다. 시연이 끝나면 `AXP_DEMO`를 지우세요.
- 비밀번호는 scrypt 해시로만 저장되고 API로 절대 내려가지 않아요. 5번 틀리면 5분 잠깁니다. 이메일 소유 인증(메일 발송)은 아직 없으니 초대 코드를 외부에 공개하지 마세요.
- 외부 AI 대화를 붙여넣을 때 실명·연락처는 지우도록 안내 문구가 있습니다. 실제 현직자 인터뷰는 동의한 경우에만 지식 베이스로 보냅니다.

## OB·YB 간편 멘토 리뷰

멘토 계정에서 **OB·YB 멘토 리뷰 → 참여 설정**을 켜면 YB가 선택 자료와 질문 하나를 보낼 수 있습니다. OB는 월 1–4건·건당 5/10/15분의 참여 범위를 정하고 수락·거절·조언을 남깁니다. YB의 **내 포트폴리오**에 받은 조언을 연결하며, 그 뒤 본인이 쓴 회고만 판단 기록으로 저장합니다. 기본 비공개이고 OB와 YB가 모두 선택한 조언만 공개 포트폴리오에 표시합니다.

YB 화면: http://localhost:3000/app.html#/ob-review · [상세 정책과 운영 가설](../docs/07_OBYB_멘토리뷰.md). 데모 멘토도 참여를 먼저 켜야 목록에 나옵니다.
