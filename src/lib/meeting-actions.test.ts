import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCreateMeetingRpcArgs,
  MANAGER_TEAM_MEMBERSHIP_SELECT,
  toManagerTeam
} from "./meeting-actions";

test("manager team lookup uses direct team_id instead of a relationship select", () => {
  assert.equal(MANAGER_TEAM_MEMBERSHIP_SELECT, "team_id, role");
  assert.equal(MANAGER_TEAM_MEMBERSHIP_SELECT.includes("teams("), false);
});

test("maps an owner or manager membership row to the writable team", () => {
  assert.deepEqual(toManagerTeam({ team_id: "team-1", role: "owner" }), {
    id: "team-1",
    role: "owner"
  });

  assert.equal(toManagerTeam(null), null);
});

test("builds the create meeting rpc payload without client-side team lookup fields", () => {
  assert.deepEqual(
    buildCreateMeetingRpcArgs({
      title: "Morning futsal",
      startsAt: "2026-07-02T20:00:00+09:00",
      capacity: 18,
      attendanceMethod: "manual",
      attendanceClosesAt: "2026-07-02T14:00:00+09:00",
      locationNote: "Court A",
      memo: null,
      allowWaitlist: true
    }),
    {
      input_title: "Morning futsal",
      input_starts_at: "2026-07-02T20:00:00+09:00",
      input_capacity: 18,
      input_attendance_method: "manual",
      input_attendance_closes_at: "2026-07-02T14:00:00+09:00",
      input_location_note: "Court A",
      input_memo: null,
      input_allow_waitlist: true
    }
  );
});
