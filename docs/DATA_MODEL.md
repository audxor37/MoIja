# DATA_MODEL

이 문서는 MoIja의 코드와 Supabase 스키마를 만들 때 기준이 되는 데이터 하네스다. 핵심 원칙은 `운영 신뢰도 데이터`와 `경기력 분석 데이터`를 처음부터 분리해서 쌓는 것이다.

## 1. 핵심 엔티티

| 테이블 | 목적 |
| --- | --- |
| profiles | Kakao 로그인 사용자 프로필 |
| teams | 동호회/팀 |
| team_members | 팀 멤버와 역할 |
| venues | 지도 기반 장소 |
| matches | 경기 |
| match_attendances | 멤버의 참석 신청과 출석 상태 |
| attendance_events | 참석 상태 변경 이력 |
| team_invites | 팀 멤버 가입용 초대 코드/링크 |
| match_invites | 특정 경기 용병 초대 코드/링크 |
| guests | 팀 멤버가 아닌 외부 참석자 프로필 |
| match_guests | 용병의 경기 참석 상태 |
| attendance_checkins | QR/GPS 체크인 시도와 판정 근거 |
| seasons | 시즌 |
| reliability_scores | 신뢰도 스냅샷 |
| positions | 포지션 코드 |
| member_positions | 멤버의 기본/가능 포지션 |
| player_attributes | 주발 등 선수 속성 |
| formations | 포메이션 템플릿 |
| match_lineups | 경기별 라인업/포메이션 |
| lineup_players | 라인업에 배치된 참석자와 좌표 |
| match_records | 경기 결과 |
| player_match_records | 골, 도움, MVP 등 개인 기록 |
| match_tactical_events | 경기 중 전술 변경/메모 |
| opponent_teams | 상대팀 기록 |

## 2. 주요 enum

```text
team_role: owner, manager, coach, member
participant_type: member, guest
guest_status: invited, accepted, declined, checked_in, confirmed, no_show
attendance_method: manual, qr, gps, gps_approval
attendance_status: pending, attending, absent, waitlisted, checked_in, confirmed, no_show, late, cancelled
checkin_result: accepted, rejected, needs_approval
match_result: win, draw, loss
strong_foot: left, right, both, unknown
lineup_status: draft, shared, locked, archived
tactical_event_type: formation_change, position_change, substitution, note, ai_suggestion
```

현재 스키마가 이미 사용하는 enum은 유지하되, 새 기능을 만들 때 위 확장 enum으로 이동할 수 있게 설계한다.

## 3. 참석과 출석

### match_attendances

팀 멤버가 경기 참석 의사를 표시하는 테이블이다.

필수 필드:

- `match_id`
- `profile_id`
- `status`
- `responded_at`
- `checked_in_at`
- `confirmed_at`
- `confirmed_by`
- `updated_at`

설계 기준:

- 참석 신청과 운영자 최종 확정은 다르다.
- 멤버 본인은 참석/불참/대기 의사를 바꿀 수 있다.
- 노쇼, 지각, 운영자 확정 참석은 Owner 또는 Manager가 확정한다.

### attendance_events

모든 상태 변경 이력을 저장한다.

필수 필드:

- `attendance_id`
- `participant_type`
- `previous_status`
- `next_status`
- `reason_code`
- `changed_by`
- `changed_at`
- `note`

신뢰도 계산은 최종 상태만 보지 않고 이벤트 이력을 기준으로 계산한다.

### attendance_checkins

QR/GPS 체크인 시도의 근거를 저장한다.

필수 필드:

- `match_id`
- `participant_type`
- `profile_id` 또는 `guest_id`
- `method`
- `latitude`
- `longitude`
- `distance_meters`
- `allowed_radius_meters`
- `result`
- `needs_manager_approval`
- `checked_at`

위치 정보는 출석 검증 이벤트로만 저장한다. 상시 위치 추적이나 경기 외 위치 수집은 하지 않는다.

## 4. 초대와 용병

### team_invites

팀 멤버 가입용 초대다.

필수 필드:

- `team_id`
- `code`
- `role_to_grant`
- `created_by`
- `expires_at`
- `max_uses`
- `used_count`
- `revoked_at`

### match_invites

특정 경기의 용병 초대다.

필수 필드:

- `match_id`
- `code`
- `created_by`
- `expires_at`
- `max_uses`
- `used_count`
- `default_status`
- `revoked_at`

### guests / match_guests

Guest는 팀 멤버가 아니며, 특정 경기 참석자로만 연결된다.

필수 필드:

- `guests.display_name`
- `guests.avatar_url`
- `guests.created_by`
- `match_guests.match_id`
- `match_guests.guest_id`
- `match_guests.status`
- `match_guests.invite_id`
- `match_guests.checked_in_at`
- `match_guests.confirmed_by`

용병은 팀 멤버 통계와 분리하지만, 경기 결과와 포지션/포메이션 분석에는 포함할 수 있다.

## 5. 선수 정보

### positions

포지션 코드는 스포츠별 확장을 고려한다.

예시:

```text
GK, CB, LB, RB, DM, CM, AM, LW, RW, ST
FUTSAL_GK, FIXO, ALA, PIVO
```

### member_positions

멤버가 가능한 포지션을 여러 개 저장한다.

필수 필드:

- `team_id`
- `profile_id`
- `position_code`
- `is_primary`
- `preference_order`
- `assigned_by`

### player_attributes

선수 개인 속성이다.

필수 필드:

- `team_id`
- `profile_id`
- `strong_foot`
- `notes`
- `updated_by`

주발과 포지션은 멤버가 직접 입력할 수 있으나, 공식 라인업과 경기 기록은 운영 권한자가 확정한다.

## 6. 포메이션과 라인업

### formations

포메이션 템플릿이다.

필수 필드:

- `team_id`
- `sport_type`
- `code`
- `name`
- `shape`
- `created_by`

예시:

```text
football: 4-4-2, 4-3-3, 4-2-3-1
futsal: 1-2-1, 2-2, 3-1
```

### match_lineups

경기별 라인업과 포메이션 저장본이다.

필수 필드:

- `match_id`
- `formation_id`
- `status`
- `shared_at`
- `locked_at`
- `created_by`
- `updated_by`

라인업은 draft 상태로 편집하고, shared 상태가 되면 참석자에게 공유한다. locked 상태는 경기 공식 기록 분석의 기준이 된다.

### lineup_players

작전판 위에 배치된 선수/용병 단위다.

필수 필드:

- `lineup_id`
- `participant_type`
- `profile_id` 또는 `guest_id`
- `position_code`
- `slot_label`
- `x`
- `y`
- `is_starter`
- `notes`

`x`, `y`는 전술판 좌표이며 0~100 기준의 상대 좌표로 저장한다.

## 7. 경기 기록과 분석

### match_records

경기 결과의 공식 기록이다.

필수 필드:

- `match_id`
- `season_id`
- `opponent_team_id`
- `lineup_id`
- `result`
- `goals_for`
- `goals_against`
- `recorded_by`
- `recorded_at`

### player_match_records

선수별 경기 기록이다.

필수 필드:

- `match_id`
- `participant_type`
- `profile_id` 또는 `guest_id`
- `position_code`
- `goals`
- `assists`
- `is_mvp`
- `minutes_played`

### match_tactical_events

경기 중 전술 변경과 운영 판단을 남긴다.

필수 필드:

- `match_id`
- `lineup_id`
- `event_type`
- `minute`
- `from_formation_id`
- `to_formation_id`
- `affected_position_code`
- `note`
- `created_by`

AI Coach가 생성한 추천은 공식 기록과 구분하고, 운영자가 채택했는지 별도로 저장한다.

## 8. 신뢰도 초안

초기 점수는 100점에서 시작한다.

- 참석 확정 후 정상 참석: 가산
- 노쇼: 큰 감산
- 마감 직전 취소: 감산
- 일찍 불참 표시: 소폭 가산 또는 감산 없음
- 대기 상태에서 참석 전환: 소폭 가산
- 연속 출석: 보너스
- GPS/QR 체크인 후 운영자 확정: 신뢰 근거 강화

정확한 가중치는 MVP 운영 데이터가 쌓인 뒤 조정한다.

## 9. 분석 질문

데이터 모델은 아래 질문에 답할 수 있어야 한다.

- 이번 시즌 참석률이 높은 멤버는 누구인가?
- 노쇼 위험이 높은 멤버 또는 용병은 누구인가?
- 특정 포지션에서 승률이 높은 멤버는 누구인가?
- 어떤 포메이션에서 득실 차가 가장 좋은가?
- 특정 상대팀을 상대로 이전에 효과적이었던 전략은 무엇인가?
- 참석자는 좋지만 특정 포지션 공백이 생기는 경기는 언제인가?
- 경기 중 포메이션 변경 후 결과가 좋아졌는가?
