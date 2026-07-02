import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageMeeting,
  formatMeetingDateTime,
  validateMeetingInput
} from "./meetings";

test("validates required meeting fields and computes the attendance deadline", () => {
  const result = validateMeetingInput({
    title: "  목요일 풋살 정기전  ",
    memo: "비 오면 실내 B구장으로 변경",
    startsOn: "2026-07-02",
    startsAt: "20:00",
    placeName: "신림 풋살파크 A구장",
    placeAddress: "서울 관악구",
    capacity: "18",
    allowWaitlist: "on",
    deadlineHours: "6",
    attendanceMethod: "manual"
  });

  assert.deepEqual(result, {
    ok: true,
    title: "목요일 풋살 정기전",
    memo: "비 오면 실내 B구장으로 변경",
    startsAt: "2026-07-02T20:00:00+09:00",
    locationNote: "신림 풋살파크 A구장 · 서울 관악구",
    capacity: 18,
    allowWaitlist: true,
    attendanceMethod: "manual",
    attendanceClosesAt: "2026-07-02T14:00:00+09:00"
  });
});

test("allows meeting creators and operators to manage a meeting", () => {
  assert.equal(canManageMeeting({ currentUserId: "user-1", createdBy: "user-1", role: "member" }), true);
  assert.equal(canManageMeeting({ currentUserId: "user-2", createdBy: "user-1", role: "owner" }), true);
  assert.equal(canManageMeeting({ currentUserId: "user-2", createdBy: "user-1", role: "manager" }), true);
});

test("blocks members who did not create the meeting from managing it", () => {
  assert.equal(canManageMeeting({ currentUserId: "user-2", createdBy: "user-1", role: "member" }), false);
  assert.equal(canManageMeeting({ currentUserId: "user-2", createdBy: null, role: "coach" }), false);
  assert.equal(canManageMeeting({ currentUserId: null, createdBy: "user-1", role: "owner" }), false);
});

test("rejects meetings without a title", () => {
  const result = validateMeetingInput({
    title: " ",
    memo: "",
    startsOn: "2026-07-02",
    startsAt: "20:00",
    placeName: "신림 풋살파크",
    placeAddress: "",
    capacity: "18",
    allowWaitlist: "",
    deadlineHours: "6",
    attendanceMethod: "manual"
  });

  assert.deepEqual(result, {
    ok: false,
    message: "경기 이름을 입력해 주세요."
  });
});

test("formats meeting dates for the dashboard", () => {
  assert.equal(formatMeetingDateTime("2026-07-02T20:00:00+09:00"), "7월 2일(목) 오후 08:00");
});
