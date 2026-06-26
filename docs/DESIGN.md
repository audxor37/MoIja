# MoIja DESIGN.md

## 1. Document Scope

이 문서는 **MoIja의 디자인 시스템과 UI 규칙**만 정의한다.

포함 범위:

* 시각 스타일
* 디자인 토큰
* 레이아웃 규칙
* 컴포넌트 규칙
* 화면 패턴
* 반응형 / 접근성 / 모션 규칙

포함하지 않는 범위:

* 서비스 목표
* 기능 우선순위
* 정책
* 비즈니스 로직
* 제품 로드맵

---

## 2. Design Concept

MoIja의 디자인은 다음 3가지 성격을 함께 가진다.

```text
1. 쉽고 빠른 모바일 UX
2. 데이터가 잘 보이는 운영 도구
3. 축구 도메인에 맞는 전술/라인업 경험
```

### Visual Keywords

```text
깔끔함
신뢰감
직관성
팀워크
전략성
가벼운 스포츠 감성
```

### Style Mix

```text
Toss
- 쉬운 정보 구조
- 카드 중심 화면
- 빠른 액션 UX

Linear
- 데이터 밀도
- 관리자 도구 느낌
- 차분한 정보 위계

Football Manager
- 포메이션 보드
- 선수 카드
- 전술 분석 UI
```

---

## 3. Design Principles

### 3.1 Fast Scan

사용자는 화면을 길게 읽지 않고도 상태를 빠르게 파악할 수 있어야 한다.

### 3.2 One Primary Action

한 화면에는 가장 중요한 액션이 분명해야 한다.

### 3.3 Data Should Feel Simple

통계와 추천 정보는 전문 용어보다 쉬운 언어와 명확한 시각 구조로 표현한다.

### 3.4 Sports Mood, Not Game UI

축구 감성은 반영하되 게임처럼 과장된 UI는 지양한다.

### 3.5 Mobile First

핵심 사용 흐름은 모바일에서 가장 먼저 설계한다.

---

## 4. Color System

## 4.1 Brand Colors

### Primary Green

```text
#16A34A
```

용도:

* Primary CTA
* 참석 완료
* 확정 상태
* 성공 액션
* 긍정적 지표

### Strategy Blue

```text
#2563EB
```

용도:

* 분석
* 추천
* 전술
* 정보 강조
* 링크 / 보조 CTA

### Dark Navy

```text
#0F172A
```

용도:

* 전술판 배경
* 대시보드 강조 영역
* 고밀도 데이터 섹션

---

## 4.2 Neutral Colors

```text
Background:      #F8FAFC
Surface:         #FFFFFF
Surface Alt:     #F2F4F6
Border:          #E5E8EB
Text Primary:    #191F28
Text Secondary:  #4E5968
Text Muted:      #8B95A1
Text Disabled:   #B0B8C1
```

---

## 4.3 Semantic Colors

### Success

```text
#03B26C
```

### Warning

```text
#FE9800
```

### Danger

```text
#F04452
```

### Info

```text
#2563EB
```

### Tactical Highlight

```text
#7C3AED
```

용도:

* 특정 포지션 강조
* 전술 포인트
* 비교 포인트

---

## 4.4 Usage Rules

* 화면 전체를 브랜드 컬러로 채우지 않는다.
* Primary Green은 액션과 확정 상태 중심으로 사용한다.
* Strategy Blue는 분석 / 정보 / 추천에 집중해서 사용한다.
* 상태 컬러는 의미가 겹치지 않도록 일관되게 유지한다.
* 전술 관련 강조는 보라 또는 파랑 계열로 제한한다.

---

## 5. Typography

## 5.1 Font Family

```text
Pretendard
Noto Sans KR
Apple SD Gothic Neo
system-ui
```

숫자 데이터가 많은 화면에서는 **tabular figures** 사용을 권장한다.

---

## 5.2 Type Scale

### Hero

```text
30px / 700 / 40px
```

### Heading L

```text
24px / 700 / 34px
```

### Heading M

```text
20px / 700 / 28px
```

### Section Title

```text
18px / 700 / 26px
```

### Card Title

```text
16px / 600 / 24px
```

### Body

```text
14px / 400 / 22px
```

### Body Small

```text
13px / 400 / 20px
```

### Caption

```text
12px / 400 / 18px
```

### Label

```text
11px / 600 / 16px
```

---

## 5.3 Typography Rules

* 한 화면에서 최대 4단계 위계만 사용한다.
* 타이틀은 700, 본문은 400, 강조는 600을 기본으로 한다.
* 긴 설명보다 짧고 명확한 라벨을 우선한다.
* 숫자, 참석률, 통계 수치는 시각적으로 크게 보여준다.

---

## 6. Spacing

## 6.1 Base Scale

```text
4
8
12
16
20
24
32
40
48
64
```

## 6.2 Rules

* 기본 간격은 8px 배수를 우선한다.
* 모바일 화면의 기본 좌우 패딩은 16px.
* 카드 내부 기본 패딩은 20px.
* 큰 섹션 간 간격은 24~32px.

---

## 7. Radius

```text
XS: 6px
SM: 8px
MD: 12px
LG: 16px
XL: 20px
FULL: 9999px
```

사용 규칙:

* Input / Small Button: 8~12px
* Card / Large Button: 16px
* Bottom Sheet / Modal: 20px
* Badge / Chip: FULL

---

## 8. Shadow

### Shadow 1

```text
0 1px 3px rgba(0,0,0,0.06)
```

### Shadow 2

```text
0 2px 8px rgba(0,0,0,0.08)
```

### Shadow 3

```text
0 6px 20px rgba(0,0,0,0.12)
```

규칙:

* 일반 카드에는 Shadow 2 사용
* 모달 / 바텀시트에는 Shadow 3 사용
* 그림자는 브랜드 표현이 아니라 계층 구분 용도로만 사용

---

## 9. Border & Divider

```text
Default Border: 1px solid #E5E8EB
Strong Border:  1px solid #D1D6DB
Divider:        1px solid rgba(25,31,40,0.08)
```

규칙:

* 대부분의 구분은 연한 border 또는 spacing으로 해결
* 과도한 박스 구분은 피한다

---

## 10. Iconography

### Style

* 단순한 라인 아이콘
* 모서리가 너무 날카롭지 않은 형태
* 20px / 24px 기본 크기

### Usage

* 정보 보조
* 상태 안내
* 액션 설명

### Do

* 텍스트와 함께 사용
* 의미가 명확한 아이콘 사용

### Don’t

* 아이콘만으로 중요한 상태 전달 금지
* 장식용 아이콘 남용 금지

---

## 11. Layout

## 11.1 Mobile Container

```text
Base Width: 375px
Horizontal Padding: 16px
Max Width (Web Centered): 640px
```

## 11.2 Desktop / Tablet

* 대시보드형 화면은 2단 또는 3단 레이아웃 허용
* 운영자 화면에서는 사이드 패널 구조 사용 가능
* 전술판/통계 화면은 더 넓은 폭을 허용

---

## 11.3 Grid Rule

* 모바일: 1열 기본
* 태블릿: 2열 카드 레이아웃 가능
* 데스크탑: 대시보드형 카드 2~3열 가능

---

## 12. Component Foundations

## 12.1 Button

### Primary Button

```text
Height: 56px
Padding: 0 20px
Radius: 16px
Background: #16A34A
Text: #FFFFFF
Font: 16px / 700
```

### Secondary Button

```text
Height: 48px
Padding: 0 16px
Radius: 14px
Background: #E8F3FF
Text: #2563EB
Font: 15px / 600
```

### Tertiary Button

```text
Height: 44px
Padding: 0 16px
Radius: 12px
Background: #F2F4F6
Text: #191F28
Font: 14px / 600
```

### Danger Button

```text
Height: 48px
Radius: 14px
Background: #F04452
Text: #FFFFFF
```

규칙:

* Primary Button은 한 섹션 또는 한 화면에 1개 중심
* 버튼 텍스트는 짧고 명령형으로 작성
* disabled 상태는 회색 대비로 충분히 구분

---

## 12.2 Input

### Default Input

```text
Height: 52px
Padding: 0 16px
Radius: 14px
Background: #FFFFFF
Border: 1px solid #E5E8EB
Text: #191F28
Placeholder: #B0B8C1
```

### Focus

```text
Border: #2563EB
Ring: 0 0 0 3px rgba(37,99,235,0.12)
```

### Error

```text
Border: #F04452
Help Text: #F04452
```

---

## 12.3 Card

### Default Card

```text
Background: #FFFFFF
Radius: 16px
Padding: 20px
Shadow: Shadow 2
Border: none
```

### Dense Card

```text
Padding: 16px
Radius: 14px
```

### Highlight Card

```text
Background: #F8FBFF
Border: 1px solid rgba(37,99,235,0.16)
```

---

## 12.4 Badge / Chip

### Default Chip

```text
Height: 28px
Padding: 0 10px
Radius: 9999px
Font: 12px / 600
```

### Status Variants

* Success
* Warning
* Danger
* Info
* Neutral

예:

```text
참석
미응답
대기
AI 추천
선발 추천
```

---

## 12.5 Tabs

### Top Tabs

```text
Height: 40px
Radius: 12px
Padding: 0 12px
```

### Bottom Navigation

* 아이콘 + 라벨 구조
* 활성 탭은 Primary Green 또는 Dark Navy 강조
* 비활성은 Text Muted

---

## 12.6 Modal / Bottom Sheet

### Modal

```text
Radius: 20px
Padding: 24px
Shadow: Shadow 3
```

### Bottom Sheet

```text
Top Radius: 20px
Padding: 20px
Handle: 36x4 / #D1D6DB
```

규칙:

* 모바일 우선에서는 Bottom Sheet를 우선 사용
* 확인 액션은 하단에 고정

---

## 13. Domain Components

## 13.1 Match Card

포함 정보:

* 경기명 / 상대팀
* 날짜 / 시간 / 장소
* 참석 현황
* 상태 태그
* 주요 액션 버튼

구조:

```text
상대팀명
날짜 / 시간
장소

참석 12  |  미응답 4  |  불참 2

[리마인드] [상세 보기]
```

---

## 13.2 Attendance Status Card

포함 정보:

* 참석
* 미응답
* 불참
* 대기
* 예상 참석 인원

표현 규칙:

* 숫자를 크게
* 상태 라벨을 짧게
* 상태별 색상 고정 사용

---

## 13.3 Player Card

포함 정보:

* 선수명
* 주 포지션
* 가능 포지션
* 참석률
* 최근 경기 수
* 포지션별 효율
* 추천 포지션

시각 규칙:

* 포지션 라벨을 Chip으로 표시
* 통계는 2열 또는 3열 그리드로 정리
* 추천 포지션은 Highlight Card 또는 Info Badge로 강조

---

## 13.4 Formation Board

### Background

```text
#0F172A
```

### Field Tone

* 매우 진한 녹색 또는 네이비 기반
* 라인은 얇고 단순하게 표현
* 과한 잔디 텍스처 사용 금지

### Player Marker

* 원형 또는 라운드 카드형
* 팀 색상은 Primary Green 계열
* 선택 상태는 Strategy Blue outline
* 주장 / GK / 추천 선수는 작은 아이콘 또는 배지로 구분

---

## 13.5 Tactical Insight Card

포함 정보:

* 추천 제목
* 간단한 이유
* 주의 포인트
* 대체안

구조 예시:

```text
추천 포메이션
4-3-3

이유
상대 중앙 숫자 대응에 유리

주의
상대 투톱 침투 주의

대안
4-2-3-1
```

시각 규칙:

* 설명은 3줄 이내 요약 우선
* 분석은 Blue 계열 강조
* 경고는 Warning / Danger 색상 사용

---

## 13.6 Stat Card

포함 정보:

* 수치
* 라벨
* 기준 기간
* 증감

구조 규칙:

* 핵심 수치가 가장 크게 보여야 함
* 증감값은 색상과 아이콘으로 구분
* 한 카드에 1개의 핵심 메시지만 담는다

---

## 14. Screen Patterns

## 14.1 Home Dashboard

구성 우선순위:

1. 다음 경기
2. 참석 현황
3. 빠른 액션
4. 추천 / 분석
5. 최근 기록

규칙:

* 첫 화면에서 “지금 해야 할 일”이 보여야 한다
* 카드 4개 이상이 한 뷰포트에 과도하게 겹치지 않게 조절

---

## 14.2 Match Detail

섹션:

* 경기 정보
* 참석 현황
* 참가 링크
* 리마인드 / 운영 액션
* 라인업 / 전술 진입

규칙:

* 액션은 섹션 하단보다 상단 가까이에 배치
* 운영자가 자주 쓰는 기능은 sticky action으로도 제공 가능

---

## 14.3 Participant Response Screen

규칙:

* 정보 최소화
* CTA 최대화
* 시각적 부담 최소화

구성:

* 경기 정보
* 참석 여부 질문
* 참석 / 불참 버튼
* 보조 안내

---

## 14.4 Lineup Setting Screen

구성:

* 포메이션 선택
* 필드 보드
* 벤치 선수
* 추천 선수 / 대체 선수
* 저장 버튼

규칙:

* 보드가 화면의 중심
* 벤치 선수는 하단 스크롤 리스트로 구성 가능
* 선수 배치 / 변경 액션은 드래그 또는 탭 기반

---

## 14.5 Tactics Screen

구성:

* 우리팀 포메이션
* 상대 포메이션
* 추천 전략
* 포지션별 대응 포인트

규칙:

* 문장보다 구조화된 카드와 라벨 우선
* 어려운 전술 용어는 보조설명 없이는 노출하지 않음

---

## 15. Data Visualization

사용 가능한 시각화:

* Progress Bar
* Line Chart
* Mini Trend
* Radar Chart
* Heatmap
* Position Map

규칙:

* 한 화면에 차트 종류를 과도하게 섞지 않는다
* 숫자 + 차트 병행 표현
* 차트는 장식이 아니라 의사결정 보조여야 한다

---

## 16. Motion

### Duration

```text
Fast: 120ms
Base: 180ms
Slow: 240ms
```

### Easing

```text
ease-out
```

### Usage

* 버튼 상태 변화
* 카드 등장
* 탭 전환
* 바텀시트 오픈
* 드래그 피드백

규칙:

* 모션은 짧고 명확해야 한다
* 전술판 드래그는 즉각 반응형 피드백 제공
* 과도한 bounce / flashy animation 금지

---

## 17. Accessibility

* 텍스트 대비는 WCAG AA 이상 목표
* 색상만으로 상태 전달 금지
* 버튼 / 탭 / 리스트는 충분한 터치 영역 확보
* 최소 터치 타겟 44px 이상 권장
* 주요 액션은 스크린리더 라벨 명확하게 제공
* 차트에는 수치 대체 정보 제공

---

## 18. Responsive Rules

### Mobile

* 핵심 플로우 기준
* 1열 레이아웃
* 하단 액션 강조

### Tablet

* 2열 카드 가능
* 대시보드 요약 강화

### Desktop

* 운영자 대시보드 최적화
* 전술판 / 통계판 넓게 활용
* 2~3열 정보 패널 허용

---

## 19. Do / Don’t

### Do

* 색상 의미를 일관되게 유지
* 큰 숫자와 짧은 라벨로 정보 전달
* 카드 구조를 단순하게 유지
* 모바일에서 액션을 우선시
* 축구 도메인 컴포넌트를 자연스럽게 통합

### Don’t

* 게임 같은 네온 스타일 사용
* 화면 전체를 짙은 색으로 덮기
* 과도한 테두리 / 그림자 사용
* 통계 화면에 어려운 용어를 그대로 노출
* 한 화면에 너무 많은 CTA 배치

---

## 20. Summary

MoIja의 디자인은 아래 기준을 만족해야 한다.

```text
쉽게 이해된다
빠르게 응답할 수 있다
운영 상태가 한눈에 보인다
데이터가 어렵지 않다
축구팀 관리 도구처럼 느껴진다
```

MoIja의 UI는
“예쁜 스포츠 앱”이 아니라
“운영과 성장을 돕는 축구팀 관리 인터페이스”가 되어야 한다.
