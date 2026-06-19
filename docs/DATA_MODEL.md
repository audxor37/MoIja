# DATA_MODEL

## 핵심 엔티티

| 테이블 | 목적 |
| --- | --- |
| profiles | Kakao 로그인 사용자 프로필 |
| teams | 동호회/팀 |
| team_members | 팀 멤버와 역할 |
| venues | 지도 기반 장소 |
| matches | 경기 |
| match_attendances | 참석 신청과 출석 상태 |
| attendance_events | 참석 상태 변경 이력 |
| positions | 포지션 코드 |
| member_positions | 멤버 포지션 |
| match_records | 경기 결과 |
| player_match_records | 골, 도움, MVP 등 개인 기록 |
| seasons | 시즌 |
| reliability_scores | 신뢰도 스냅샷 |

## 주요 enum

```text
team_role: owner, manager, coach, member
attendance_method: manual, qr, gps, gps_approval
attendance_status: attending, absent, waitlisted, no_show
match_result: win, draw, loss
```

## 신뢰도 초안

초기 점수는 100점에서 시작한다.

- 참석 확정 후 정상 참석: 가산
- 노쇼: 큰 감산
- 마감 직전 취소: 감산
- 일찍 불참 표시: 소폭 가산 또는 감산 없음
- 연속 출석: 보너스

정확한 가중치는 MVP 운영 데이터가 쌓인 뒤 조정한다.
