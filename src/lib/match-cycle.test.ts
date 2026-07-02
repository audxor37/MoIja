import assert from "node:assert/strict";
import test from "node:test";
import {
  guestStatusLabel,
  isPlayableAttendanceStatus,
  normalizeNullableText,
  parseNonNegativeInteger,
  getFormationPreset,
  getDefaultLineupPlacements,
  getDefaultLineupSlots,
  getPositionLabel,
  validateGuestOperatorStatus,
  validateGuestResponseStatus,
  validateMatchResult
} from "./match-cycle";

test("validates guest response statuses separately from operator statuses", () => {
  assert.equal(validateGuestResponseStatus("accepted"), "accepted");
  assert.equal(validateGuestResponseStatus("confirmed"), null);
  assert.equal(validateGuestOperatorStatus("confirmed"), "confirmed");
  assert.equal(validateGuestOperatorStatus("invited"), null);
});

test("validates match result and normalizes record inputs", () => {
  assert.equal(validateMatchResult("win"), "win");
  assert.equal(validateMatchResult("cancelled"), null);
  assert.equal(parseNonNegativeInteger("3"), 3);
  assert.equal(parseNonNegativeInteger("-1"), 0);
  assert.equal(normalizeNullableText("  상대팀  "), "상대팀");
  assert.equal(normalizeNullableText("  "), null);
});

test("labels guests and limits playable attendance to attending members", () => {
  assert.equal(guestStatusLabel("no_show"), "노쇼");
  assert.equal(isPlayableAttendanceStatus("attending"), true);
  assert.equal(isPlayableAttendanceStatus("waitlisted"), false);
});

test("provides football formation presets with default position slots", () => {
  const preset = getFormationPreset("4-4-2");

  assert.equal(preset?.label, "4-4-2");
  assert.deepEqual(preset?.positions.map((position) => position.code), [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LM",
    "LCM",
    "RCM",
    "RM",
    "LS",
    "RS"
  ]);
});

test("provides all requested football formation options", () => {
  assert.deepEqual(
    ["4-4-2", "4-2-3-1", "4-3-3", "4-1-4-1", "4-5-1", "4-1-2-1-2", "3-5-2", "3-4-3", "3-4-2-1", "5-3-2", "5-4-1"].map(
      (code) => getFormationPreset(code).code
    ),
    ["4-4-2", "4-2-3-1", "4-3-3", "4-1-4-1", "4-5-1", "4-1-2-1-2", "3-5-2", "3-4-3", "3-4-2-1", "5-3-2", "5-4-1"]
  );
});

test("returns formation slots even when only a few players are available", () => {
  const slots = getDefaultLineupSlots("4-2-3-1", [
    {
      id: "player-1",
      playerKind: "member",
      profileId: "profile-1",
      guestId: null,
      displayName: "선수1",
      positionCode: null
    },
    {
      id: "player-2",
      playerKind: "member",
      profileId: "profile-2",
      guestId: null,
      displayName: "선수2",
      positionCode: null
    }
  ]);

  assert.equal(slots.length, 11);
  assert.equal(slots[0].positionCode, "GK");
  assert.equal(slots[0].displayName, "선수1");
  assert.equal(slots[2].positionCode, "LCB");
  assert.equal(slots[2].displayName, null);
});

test("labels tactical position abbreviations for board display", () => {
  assert.equal(getPositionLabel("GK"), "골키퍼");
  assert.equal(getPositionLabel("LWB"), "왼쪽 윙백");
  assert.equal(getPositionLabel("CAM"), "중앙 공격형 미드필더");
  assert.equal(getPositionLabel("RW"), "오른쪽 윙어");
});

test("maps players onto formation positions and keeps bench players outside starters", () => {
  const players = Array.from({ length: 12 }, (_, index) => ({
    id: `player-${index + 1}`,
    playerKind: "member" as const,
    profileId: `profile-${index + 1}`,
    guestId: null,
    matchGuestId: null,
    displayName: `선수${index + 1}`,
    status: "attending",
    positionCode: null
  }));

  const placements = getDefaultLineupPlacements("4-3-3", players);

  assert.equal(placements[0].positionCode, "GK");
  assert.equal(placements[10].positionCode, "RW");
  assert.equal(placements[10].isStarter, true);
  assert.equal(placements[11].positionCode, "SUB");
  assert.equal(placements[11].isStarter, false);
});
