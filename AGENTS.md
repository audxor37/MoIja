# Codex Working Notes

MoIja는 축구/풋살 동호회 운영 SaaS다. 기능을 만들 때는 경기 생성 자체보다 출석 신뢰도, 노쇼 감소, 운영 자동화, 데이터 기반 팀 문화 형성을 우선한다.

## Read Strategy

항상 전체 문서를 읽지 않는다.
작업 유형에 따라 필요한 문서만 읽는다.

- 제품 방향/기능 우선순위 판단이 필요할 때:
  - docs/PROJECT_CONTEXT.md
  - docs/DEVELOPMENT_RULES.md

- 화면, UX, 문구, 라우팅, 컴포넌트 수정이 필요할 때:
  - docs/SCREEN_SPEC.md
  - docs/DEVELOPMENT_RULES.md

- DB, Supabase, RLS, 테이블, enum, 쿼리 수정이 필요할 때:
  - docs/DATA_MODEL.md
  - docs/DEVELOPMENT_RULES.md

- 신규 기능의 영향 분석이 필요할 때:
  - docs/ANALYSIS_FRAMEWORK.md
  - docs/PROJECT_CONTEXT.md

- 단순 버그 수정, 스타일 수정, 버튼 동작 추가는:
  - 관련 코드 파일만 확인한다.
  - 문서 전체를 읽지 않는다.

- 코드 문맥만으로 해결할 수 있는 작업이라면, 굳이 미리 문서를 읽지 않는다.
- 문서를 읽을 때도 전체 출력하지 말고, 필요한 섹션만 검색해서 읽는다.

## Development Lens

- Product: 운영자와 멤버의 반복 행동을 줄이는가?
- Data: 나중에 신뢰도/랭킹/시즌 통계를 계산할 수 있는가?
- Permission: Owner, Manager, Coach, Member, Guest 권한이 명확한가?
- Privacy: Kakao ID, 닉네임, 프로필 이미지 외 민감정보를 저장하지 않는가?
- UX: 모바일에서 핵심 행동이 1~2번 안에 가능한가?
- Growth: 축구/풋살 이후 다른 정기 모임으로 확장 가능한가?

## Default Rules

- 모바일 우선
- MVP에서는 규칙 기반 우선
- 개인정보 최소 저장
- Owner, Manager, Coach, Member, Guest 권한 구분
- 출석 신청과 운영자 확정은 분리
- 변경 이력이 필요한 데이터는 이벤트로 남김

## Supabase Schema Application

- 기능 구현에 Supabase 스키마, RLS, 함수, 인덱스, 마이그레이션 변경이 포함되면 Codex가 직접 원격 Supabase 프로젝트에 적용한다.
- 적용 대상은 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL` project ref와 일치하는 Supabase 프로젝트를 우선한다.
- 원격 적용 전에는 현재 마이그레이션/정책 상태를 확인하고, 적용 후에는 SQL 조회나 마이그레이션 목록으로 실제 반영 여부를 검증한다.
- 로컬에는 동일 내용을 `supabase/migrations`와 필요 시 `supabase/schema.sql`에 남겨 코드와 원격 DB 상태가 어긋나지 않게 한다.
- RLS/권한 변경 시 Owner, Manager, Coach, Member, Guest 권한 분리를 유지하고, `TO authenticated`만으로 끝나는 정책을 만들지 않는다.

## Git Commit Messages

- 커밋 메시지는 한글로 작성한다.
- 제목은 변경 내용을 한 줄로 요약하고, 필요한 경우 본문에 핵심 변경점과 검증 결과를 짧게 적는다.
- 예: `출석 응답 화면과 이력 기록 추가`

## Token Usage

- 항상 토큰 절약 모드로 작업한다.
- 중간 보고는 최소화한다.
- 큰 파일 전체 출력은 꼭 필요한 경우가 아니면 피한다.
- 광범위 탐색보다 필요한 부분만 검색하고 읽는다.
- 명령어 출력은 전체 로그 대신 핵심만 요약한다.
- 명시적으로 요청하지 않으면 브라우저 자동화는 하지 않는다.
- 최종 답변은 변경 내용, 검증 결과, 필요한 다음 단계만 간결하게 작성한다.
- When these instructions conflict with general verbosity or progress-update preferences, prioritize token saving unless the user explicitly asks for detailed reasoning or full logs.
- Windows PowerShell에서 Markdown/문서 파일을 읽을 때는 Get-Content -Encoding UTF8을 사용한다.
- 한글 문서 출력이 깨지면 같은 파일을 반복 출력하지 말고 UTF-8 인코딩으로 다시 읽는다.
- 파일/텍스트 검색은 가능한 한 rg 또는 rg --files를 우선 사용한다.
- 큰 문서는 전체 출력하지 말고, 검색 후 필요한 줄 범위만 읽는다.
- 문서/설정 검토처럼 코드 변경이 없는 작업은 npm run typecheck/build를 생략한다.

## Verification

Before finishing implementation work:

## Build / Typecheck Safety

코드 수정 후 검증을 실행하기 전에 Next.js 개발 서버 또는 이전 빌드 프로세스가 `.next` 디렉터리를 점유하고 있는지 먼저 확인한다.

- `npm run typecheck` 전에 `.next/types`가 깨진 상태일 수 있으므로, Next dev/build 프로세스가 남아 있으면 먼저 정리한다.
- `npm run build` 전에 실행 중인 `next dev` 또는 이전 `next build` 프로세스가 있으면 중지한다.
- `.next/trace` EPERM, `.next/types` 손상, 빌드 타임아웃이 발생하면 같은 명령을 반복하지 말고 프로세스 점유 상태를 먼저 확인한다.
- dev 서버가 필요한 경우에는 build 검증을 마친 뒤 `npm run dev`를 다시 실행한다.
- Windows PowerShell에서는 다음 기준으로 Next 프로세스를 확인한다.

```powershell
Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object { $_.CommandLine -like '*mo-ija*next*dev*' -or $_.CommandLine -like '*mo-ija*next*build*' } |
  Select-Object ProcessId,CommandLine
```

```bash
npm run typecheck
npm run build
```

For local preview:

```bash
npm run dev
```
