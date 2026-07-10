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
    repeatMode: "once",
    opponentName: "FC 관악",
    seriesOpponents: [],
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
    attendanceClosesAt: "2026-07-02T14:00:00+09:00",
    deadlineHours: 6,
    repeatMode: "once",
    repeatCount: 1,
    opponentName: "FC 관악",
    seriesOpponents: ["FC 관악"]
  });
});

test("rejects meeting capacity outside the selectable range", () => {
  const baseInput = {
    title: "목요일 풋살 정기전",
    memo: "",
    startsOn: "2026-07-02",
    startsAt: "20:00",
    placeName: "신림 풋살파크",
    placeAddress: "",
    repeatMode: "once",
    opponentName: "",
    seriesOpponents: [],
    allowWaitlist: "",
    deadlineHours: "6",
    attendanceMethod: "manual"
  };

  assert.deepEqual(validateMeetingInput({ ...baseInput, capacity: "9" }), {
    ok: false,
    message: "정원은 10명부터 24명까지 선택해 주세요."
  });
  assert.deepEqual(validateMeetingInput({ ...baseInput, capacity: "25" }), {
    ok: false,
    message: "정원은 10명부터 24명까지 선택해 주세요."
  });
  assert.deepEqual(validateMeetingInput({ ...baseInput, capacity: "" }), {
    ok: false,
    message: "정원은 10명부터 24명까지 선택해 주세요."
  });
});

test("normalizes weekly recurring meeting opponents for the selected round count", () => {
  const result = validateMeetingInput({
    title: "목요일 풋살 정기전",
    memo: "",
    startsOn: "",
    weeklyStartOn: "2026-06-29",
    weeklyWeekday: "4",
    startsAt: "20:00",
    placeName: "신림 풋살파크",
    placeAddress: "",
    capacity: "18",
    repeatMode: "weekly",
    repeatCount: "5",
    opponentName: "FC 기본",
    seriesOpponents: ["FC 1", "", " FC 3 ", "", "FC 5", "FC 6", "", ""],
    allowWaitlist: "on",
    deadlineHours: "12",
    attendanceMethod: "manual"
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal(result.repeatMode, "weekly");
  assert.equal(result.repeatCount, 5);
  assert.equal(result.startsAt, "2026-07-02T20:00:00+09:00");
  assert.equal(result.opponentName, "FC 1");
  assert.deepEqual(result.seriesOpponents, ["FC 1", null, "FC 3", null, "FC 5"]);
});

test("rejects weekly recurring meetings without a weekday schedule", () => {
  const baseInput = {
    title: "목요일 풋살 정기전",
    memo: "",
    startsOn: "",
    weeklyStartOn: "2026-06-29",
    startsAt: "20:00",
    placeName: "신림 풋살파크",
    placeAddress: "",
    capacity: "18",
    repeatMode: "weekly",
    repeatCount: "5",
    opponentName: "",
    seriesOpponents: [],
    allowWaitlist: "on",
    deadlineHours: "12",
    attendanceMethod: "manual"
  };

  assert.deepEqual(validateMeetingInput({ ...baseInput, weeklyWeekday: "" }), {
    ok: false,
    message: "반복 경기의 시작 주와 요일을 선택해 주세요."
  });
  assert.deepEqual(validateMeetingInput({ ...baseInput, weeklyWeekday: "7" }), {
    ok: false,
    message: "반복 경기의 시작 주와 요일을 선택해 주세요."
  });
});

test("defaults weekly recurring meetings to eight rounds and rejects invalid selected counts", () => {
  const baseInput = {
    title: "목요일 풋살 정기전",
    memo: "",
    startsOn: "2026-07-02",
    startsAt: "20:00",
    placeName: "신림 풋살파크",
    placeAddress: "",
    capacity: "18",
    repeatMode: "weekly",
    opponentName: "FC 기본",
    seriesOpponents: ["FC 1", "", "FC 3"],
    allowWaitlist: "on",
    deadlineHours: "12",
    attendanceMethod: "manual"
  };

  const defaultedResult = validateMeetingInput({ ...baseInput, repeatCount: "" });
  assert.equal(defaultedResult.ok, true);
  if (defaultedResult.ok) {
    assert.equal(defaultedResult.repeatCount, 8);
    assert.equal(defaultedResult.seriesOpponents.length, 8);
  }

  assert.deepEqual(validateMeetingInput({ ...baseInput, repeatCount: "1" }), {
    ok: false,
    message: "반복 주차는 2주부터 12주까지 선택해 주세요."
  });
  assert.deepEqual(validateMeetingInput({ ...baseInput, repeatCount: "13" }), {
    ok: false,
    message: "반복 주차는 2주부터 12주까지 선택해 주세요."
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
    repeatMode: "once",
    opponentName: "",
    seriesOpponents: [],
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
