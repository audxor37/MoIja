# Kakao Login Setup

MoIja의 카카오 로그인은 Supabase Auth OAuth provider를 통해 연결한다. 앱 코드는 `/api/auth/kakao`에서 Supabase OAuth를 시작하고, `/auth/callback`에서 인증 코드를 세션 쿠키로 교환한다.

## 1. 로컬 환경 변수

프로젝트 루트에 `.env.local`을 만들고 아래 값을 입력한다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

배포 환경에서는 `NEXT_PUBLIC_SITE_URL`을 실제 서비스 주소로 설정한다.

## 2. Supabase Redirect URL

Supabase Dashboard의 Authentication URL Configuration에 아래 Redirect URL을 추가한다.

```text
http://localhost:3000/auth/callback
```

배포 후에는 실제 도메인의 콜백도 추가한다.

```text
https://your-domain.com/auth/callback
```

## 3. Kakao Developers 설정

Kakao Developers에서 애플리케이션을 만들고 카카오 로그인을 활성화한다.

필수 확인 항목:

- 플랫폼 Web 사이트 도메인: `http://localhost:3000`
- 배포 도메인: 실제 서비스 도메인
- 카카오 로그인 Redirect URI: Supabase가 Kakao provider 설정 화면에서 안내하는 callback URL
- 동의 항목: 카카오 ID, 닉네임, 프로필 이미지 중심으로 최소 수집

## 4. Supabase Kakao Provider

Supabase Dashboard의 Authentication Providers에서 Kakao를 활성화한다.

입력 항목:

- Kakao REST API Key
- Kakao Client Secret을 사용하는 경우 Client Secret

MoIja는 개인정보 최소 저장 원칙을 따른다. 서비스 DB에는 Kakao ID, 닉네임, 프로필 이미지 외 민감정보를 저장하지 않는다.

## 5. 구현된 라우트

- `GET /auth/kakao-login`: MoIja 내부 카카오 로그인 진입 화면
- `GET /api/auth/kakao`: Kakao OAuth 시작
- `GET /auth/callback`: Supabase 인증 코드 교환 및 세션 쿠키 저장

환경변수가 누락되거나 인증에 실패하면 첫 화면으로 돌아오고 한국어 오류 안내를 표시한다.

메인 대시보드의 Kakao 버튼은 `/auth/kakao-login`으로 이동한다. 이 화면에서 `카카오로 계속하기`를 누르면 실제 Supabase Kakao OAuth가 시작된다.
