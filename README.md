# MoIja

MoIja는 축구/풋살 동호회 운영을 위한 SaaS 플랫폼입니다. 단순한 경기 생성보다 참석 신뢰도, 노쇼 감소, 운영 자동화, 데이터 기반 팀 문화 형성을 우선합니다.

초기 목표는 운영자가 회원과 용병의 참석 여부를 안정적으로 관리하고, 멤버가 자신의 참석률과 신뢰도를 인식하도록 만드는 것입니다. 이후에는 포지션, 주발, 포메이션, 경기 기록을 연결해 팀의 경기력과 승률을 높이는 방향으로 확장합니다.

## 개발 기준 문서

- 제품 맥락: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- 개발 원칙: [docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md)
- 화면 설계: [docs/SCREEN_SPEC.md](docs/SCREEN_SPEC.md)
- 데이터 모델: [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- 분석 프레임워크: [docs/ANALYSIS_FRAMEWORK.md](docs/ANALYSIS_FRAMEWORK.md)
- AI 로드맵: [docs/AI_ROADMAP.md](docs/AI_ROADMAP.md)
- Kakao 로그인 설정: [docs/KAKAO_LOGIN_SETUP.md](docs/KAKAO_LOGIN_SETUP.md)

## 서비스 방향

1. 운영 안정화: 경기 생성, 참석 신청, 출석 확정, 노쇼 관리
2. 팀 데이터화: 참석률, 신뢰도, 시즌 기록, 개인 기록
3. 경기력 향상: 포지션, 주발, 포메이션, 라인업 공유
4. 전술 분석: 포메이션별 승률, 선수 조합, 상대팀별 전략
5. AI Coach: 라인업 추천, 경기 흐름 분석, 운영 인사이트

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 Supabase 값을 채웁니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## MVP 범위

1. Kakao 로그인
2. 팀 생성 및 멤버 관리
3. 경기 생성
4. 참석 신청 및 참석 처리
5. 운영자 출석 확정
6. 팀 초대 코드
7. 경기 단위 용병 초대
8. 신뢰도 계산
9. 랭킹
10. 경기 결과와 개인 기록

## 확장 범위

1. GPS/QR 출석 검증
2. 포지션과 주발 정보
3. 경기별 라인업 저장
4. 포메이션 보드 공유
5. 포지션별 출전 기록
6. 포메이션별 승률 분석
7. 상대팀별 전략 기록
8. AI Coach 추천
