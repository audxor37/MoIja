import assert from "node:assert/strict";
import test from "node:test";
import { calculateReliabilityScore } from "./reliability";

test("calculates reliability from attendance rate, no-show rate, and current streak", () => {
  const result = calculateReliabilityScore([
    { status: "confirmed" },
    { status: "confirmed" },
    { status: "no_show" },
    { status: "absent" },
    { status: "confirmed" }
  ]);

  assert.deepEqual(result, {
    score: 66,
    attendedCount: 3,
    absentCount: 1,
    noShowCount: 1,
    totalCount: 5,
    attendanceRate: 60,
    noShowRate: 25,
    currentStreak: 2
  });
});

test("returns a neutral baseline when a member has no completed attendance history", () => {
  const result = calculateReliabilityScore([]);

  assert.equal(result.score, 50);
  assert.equal(result.attendanceRate, 0);
  assert.equal(result.noShowRate, 0);
  assert.equal(result.currentStreak, 0);
});
