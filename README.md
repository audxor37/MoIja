# MoIja

MoIja는 축구/풋살 동호회 운영을 위한 SaaS 플랫폼입니다. 단순한 경기 생성보다 참석 신뢰도, 노쇼 감소, 운영 자동화, 데이터 기반 팀 문화 형성을 우선합니다.

## 개발 기준 문서

- 제품 맥락: [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- 개발 원칙: [docs/DEVELOPMENT_RULES.md](docs/DEVELOPMENT_RULES.md)
- 화면 설계: [docs/SCREEN_SPEC.md](docs/SCREEN_SPEC.md)
- 데이터 모델: [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
- 분석 프레임워크: [docs/ANALYSIS_FRAMEWORK.md](docs/ANALYSIS_FRAMEWORK.md)
- Kakao 로그인 설정: [docs/KAKAO_LOGIN_SETUP.md](docs/KAKAO_LOGIN_SETUP.md)

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
3. 경기 또는 정기 모임 생성
4. 참석 신청 및 참석 처리
5. 신뢰도 계산
6. 랭킹
7. 포지션 관리
8. 경기 기록
