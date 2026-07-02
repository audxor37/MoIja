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
  buildInviteSharePayload,
  getBoardImageSaveFallback,
  getBoardImageFileName,
  summarizeScoringEvents,
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

test("guides mobile board image save by OS capability", () => {
  assert.deepEqual(
    getBoardImageSaveFallback({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1",
      canShareFiles: true
    }),
    {
      platform: "ios",
      primaryAction: "share",
      message: "복사가 제한된 환경입니다. 사진첩 저장을 선택해 공유 시트에서 이미지 저장을 진행해 주세요."
    }
  );

  assert.deepEqual(
    getBoardImageSaveFallback({
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/125.0 Mobile Safari/537.36",
      canShareFiles: false
    }),
    {
      platform: "android",
      primaryAction: "download",
      message: "복사가 제한된 환경입니다. 이미지 다운로드로 저장해 주세요."
    }
  );
});

test("builds safe Korean lineup image filenames from meeting titles", () => {
  assert.equal(getBoardImageFileName("목요 풋살"), "목요 풋살_라인업.png");
  assert.equal(getBoardImageFileName("강남/서초: 친선전?"), "강남_서초_ 친선전_라인업.png");
  assert.equal(getBoardImageFileName("  "), "moija-lineup_라인업.png");
});

test("builds invite share payload with code and join link", () => {
  assert.deepEqual(buildInviteSharePayload({ inviteCode: "ABCD1234", siteUrl: "https://moija.app/" }), {
    title: "MoIja 초대",
    text: "MoIja 초대 코드: ABCD1234",
    url: "https://moija.app/?invite=ABCD1234"
  });
});

test("summarizes scoring events into player record totals", () => {
  const records = summarizeScoringEvents({
    players: [
      { id: "member:1", playerKind: "member", profileId: "profile-1", guestId: null, positionCode: "ST" },
      { id: "member:2", playerKind: "member", profileId: "profile-2", guestId: null, positionCode: "CM" },
      { id: "guest:1", playerKind: "guest", profileId: null, guestId: "guest-1", positionCode: null }
    ],
    events: [
      { scorerId: "member:1", assistId: "member:2" },
      { scorerId: "member:1", assistId: null },
      { scorerId: "guest:1", assistId: "member:2" }
    ]
  });

  assert.deepEqual(records, [
    {
      playerKind: "member",
      profileId: "profile-1",
      guestId: null,
      goals: 2,
      assists: 0,
      isMvp: false,
      positionCode: "ST",
      lineupSlot: "starter"
    },
    {
      playerKind: "member",
      profileId: "profile-2",
      guestId: null,
      goals: 0,
      assists: 2,
      isMvp: false,
      positionCode: "CM",
      lineupSlot: "starter"
    },
    {
      playerKind: "guest",
      profileId: null,
      guestId: "guest-1",
      goals: 1,
      assists: 0,
      isMvp: false,
      positionCode: null,
      lineupSlot: "starter"
    }
  ]);
});
