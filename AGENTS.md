# Codex Working Notes

MoIja는 축구/풋살 동호회 운영 SaaS다. 기능을 만들 때는 경기 생성 자체보다 출석 신뢰도, 노쇼 감소, 운영 자동화, 데이터 기반 팀 문화 형성을 우선한다.

## Always Read First

- `docs/PROJECT_CONTEXT.md`
- `docs/DEVELOPMENT_RULES.md`
- `docs/SCREEN_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/ANALYSIS_FRAMEWORK.md`

## Development Lens

- Product: 운영자와 멤버의 반복 행동을 줄이는가?
- Data: 나중에 신뢰도/랭킹/시즌 통계를 계산할 수 있는가?
- Permission: Owner, Manager, Coach, Member 권한이 명확한가?
- Privacy: Kakao ID, 닉네임, 프로필 이미지 외 민감정보를 저장하지 않는가?
- UX: 모바일에서 핵심 행동이 1~2번 안에 가능한가?
- Growth: 축구/풋살 이후 다른 정기 모임으로 확장 가능한가?

## Verification

Before finishing implementation work:

```bash
npm run typecheck
npm run build
```

For local preview:

```bash
npm run dev
```
