import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMeetingTaskHref,
  buildProfileTaskHref,
  buildTeamTaskHref,
  getActiveDashboardNavItems,
  getMeetingHubActions,
  filterDashboardMeetings,
  getMeetingFocusMetrics,
  getReliabilityDisplay,
  getUpcomingMeetingActions
} from "./dashboard-ux";

test("returns demo-aligned bottom navigation items", () => {
  assert.deepEqual(getActiveDashboardNavItems(), [
    { label: "홈", href: "/" },
    { label: "경기", href: "/meetings" },
    { label: "랭킹", href: "/ranking" },
    { label: "팀", href: "/team" },
    { label: "MY", href: "/profile" }
  ]);
});

test("builds compact next-match action metrics for operators", () => {
  const actions = getUpcomingMeetingActions({
    attendingCount: 12,
    responseRate: 63,
    unansweredCount: 4,
    waitlistedCount: 2,
    confirmationNeededCount: 3,
    noShowCount: 1
  });

  assert.deepEqual(actions, [
    { label: "참석", value: "12", tone: "success" },
    { label: "미응답", value: "4", tone: "muted" },
    { label: "대기", value: "2", tone: "info" },
    { label: "확정 필요", value: "3", tone: "warning" },
    { label: "노쇼 위험", value: "1", tone: "danger" }
  ]);
});

test("builds route-based task links for meeting, team, and profile work screens", () => {
  assert.equal(buildMeetingTaskHref("match-1", "attendance"), "/meetings/match-1/attendance");
  assert.equal(buildMeetingTaskHref("match-1", "lineup"), "/meetings/match-1/lineup");
  assert.equal(buildMeetingTaskHref("match-1", "guests"), "/meetings/match-1/guests");
  assert.equal(buildMeetingTaskHref("match-1", "record"), "/meetings/match-1/record");
  assert.equal(buildTeamTaskHref("members"), "/team/members");
  assert.equal(buildTeamTaskHref("invite"), "/team/invite");
  assert.equal(buildProfileTaskHref("edit"), "/profile/edit");
});

test("returns meeting hub actions by role without hash navigation", () => {
  assert.deepEqual(getMeetingHubActions({ meetingId: "match-1", canManageAttendance: true, canManageLineup: true }), [
    { title: "빠른 체크인", description: "현장 출석 확인", href: "/meetings/match-1/attendance", icon: "clipboardCheck" },
    { title: "라인업 작성", description: "확정자 기준 편집", href: "/meetings/match-1/lineup", icon: "users" },
    { title: "용병 관리", description: "초대와 참석 상태", href: "/meetings/match-1/guests", icon: "userPlus" },
    { title: "기록 입력", description: "결과와 개인 기록", href: "/meetings/match-1/record", icon: "trophy" }
  ]);

  assert.deepEqual(getMeetingHubActions({ meetingId: "match-1", canManageAttendance: false, canManageLineup: true }), [
    { title: "내 라인업 확인", description: "공유된 배치 보기", href: "/meetings/match-1/lineup", icon: "users" }
  ]);
});

test("prioritizes compact meeting metrics for fast mobile scanning", () => {
  const metrics = getMeetingFocusMetrics({
    attendingCount: 12,
    responseRate: 63,
    unansweredCount: 4,
    waitlistedCount: 2,
    confirmationNeededCount: 3,
    noShowCount: 1
  });

  assert.deepEqual(metrics, [
    { label: "응답률", value: "63%", tone: "info" },
    { label: "미응답", value: "4", tone: "muted" },
    { label: "확정필요", value: "3", tone: "warning" },
    { label: "노쇼", value: "1", tone: "danger" }
  ]);
});

test("filters dashboard meetings by mobile list chips", () => {
  const meetings = [
    {
      id: "today",
      startsAt: "2026-07-07T10:00:00.000Z",
      myAttendanceStatus: "attending",
      attendanceSummary: { confirmationNeededCount: 0 }
    },
    {
      id: "needs-record",
      startsAt: "2026-07-08T10:00:00.000Z",
      myAttendanceStatus: null,
      attendanceSummary: { confirmationNeededCount: 2 }
    }
  ];

  assert.deepEqual(filterDashboardMeetings(meetings, "today", new Date("2026-07-07T03:00:00.000Z")).map((meeting) => meeting.id), ["today"]);
  assert.deepEqual(filterDashboardMeetings(meetings, "mine", new Date("2026-07-07T03:00:00.000Z")).map((meeting) => meeting.id), ["today"]);
  assert.deepEqual(filterDashboardMeetings(meetings, "needs-record", new Date("2026-07-07T03:00:00.000Z")).map((meeting) => meeting.id), ["needs-record"]);
});

test("labels reliability so members understand their status", () => {
  assert.deepEqual(getReliabilityDisplay({ score: 86, noShowCount: 0, currentStreak: 3 }), {
    label: "안정",
    helper: "참석 흐름이 안정적입니다",
    tone: "success"
  });
  assert.deepEqual(getReliabilityDisplay({ score: 67, noShowCount: 0, currentStreak: 0 }), {
    label: "주의",
    helper: "응답과 참석을 꾸준히 남기면 안정권으로 올라갑니다",
    tone: "warning"
  });
  assert.deepEqual(getReliabilityDisplay({ score: 72, noShowCount: 2, currentStreak: 1 }), {
    label: "회복 중",
    helper: "최근 노쇼 이력이 있어 연속 참석으로 회복이 필요합니다",
    tone: "danger"
  });
});
