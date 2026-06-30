import assert from "node:assert/strict";
import test from "node:test";
import { DASHBOARD_MEETING_LIMIT, mapDashboardMeetings } from "./dashboard-session";

test("maps only the dashboard meeting limit", () => {
  const rows = Array.from({ length: DASHBOARD_MEETING_LIMIT + 5 }, (_, index) => ({
    id: `match-${index}`,
    title: `Match ${index}`,
    starts_at: `2026-07-${String(index + 1).padStart(2, "0")}T20:00:00+09:00`,
    created_by: index === 0 ? "user-1" : "other-user",
    location_note: index % 2 === 0 ? "A pitch" : null,
    capacity: 18,
    allow_waitlist: index % 2 === 0,
    attendance_method: "manual",
    attendance_closes_at: null
  }));

  const meetings = mapDashboardMeetings(rows, { currentUserId: "user-1", role: "member" });

  assert.equal(meetings.length, DASHBOARD_MEETING_LIMIT);
  assert.equal(meetings[0]?.id, "match-0");
  assert.equal(meetings[0]?.canManage, true);
  assert.equal(meetings[0]?.myAttendanceStatus, null);
  assert.deepEqual(meetings[0]?.attendanceSummary, {
    responseRate: 0,
    unansweredCount: 0,
    waitlistedCount: 0,
    confirmationNeededCount: 18
  });
  assert.equal(meetings[1]?.canManage, false);
  assert.equal(meetings.at(-1)?.id, `match-${DASHBOARD_MEETING_LIMIT - 1}`);
});
