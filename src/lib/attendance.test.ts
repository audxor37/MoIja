import assert from "node:assert/strict";
import test from "node:test";
import {
  ATTENDANCE_RESPONSE_STATUSES,
  buildAttendanceSummary,
  attendanceStatusLabel,
  canSubmitAttendanceResponse,
  shouldWriteAttendanceEvent,
  validateAttendanceResponseStatus
} from "./attendance";

test("allows only member response statuses for meeting attendance", () => {
  assert.deepEqual(ATTENDANCE_RESPONSE_STATUSES, ["attending", "absent", "waitlisted"]);
  assert.equal(validateAttendanceResponseStatus("attending"), "attending");
  assert.equal(validateAttendanceResponseStatus("absent"), "absent");
  assert.equal(validateAttendanceResponseStatus("waitlisted"), "waitlisted");
  assert.equal(validateAttendanceResponseStatus("no_show"), null);
  assert.equal(validateAttendanceResponseStatus(""), null);
});

test("labels attendance statuses for Korean member-facing UI", () => {
  assert.equal(attendanceStatusLabel("attending"), "참석 예정");
  assert.equal(attendanceStatusLabel("absent"), "불참");
  assert.equal(attendanceStatusLabel("waitlisted"), "대기");
  assert.equal(attendanceStatusLabel("no_show"), "노쇼");
  assert.equal(attendanceStatusLabel(null), "미응답");
});

test("writes attendance events only when the stored status changes", () => {
  assert.equal(shouldWriteAttendanceEvent(null, "attending"), true);
  assert.equal(shouldWriteAttendanceEvent("absent", "attending"), true);
  assert.equal(shouldWriteAttendanceEvent("attending", "attending"), false);
});

test("blocks waitlist responses when the meeting does not allow waitlisting", () => {
  assert.equal(canSubmitAttendanceResponse("attending", false), true);
  assert.equal(canSubmitAttendanceResponse("absent", false), true);
  assert.equal(canSubmitAttendanceResponse("waitlisted", true), true);
  assert.equal(canSubmitAttendanceResponse("waitlisted", false), false);
});

test("summarizes attendance groups and response metrics for operators", () => {
  const summary = buildAttendanceSummary(
    [
      { status: "attending" },
      { status: "attending" },
      { status: "waitlisted" },
      { status: "absent" },
      { status: "no_show" }
    ],
    { teamMemberCount: 7, capacity: 4 }
  );

  assert.equal(summary.attendingCount, 2);
  assert.equal(summary.waitlistedCount, 1);
  assert.equal(summary.absentCount, 1);
  assert.equal(summary.noShowCount, 1);
  assert.equal(summary.respondedCount, 5);
  assert.equal(summary.unansweredCount, 2);
  assert.equal(summary.responseRate, 71);
  assert.equal(summary.confirmationNeededCount, 2);
});
