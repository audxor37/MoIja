import assert from "node:assert/strict";
import test from "node:test";
import {
  getInviteJoinSuccessMessage,
  mapGuestInviteRpcError,
  normalizeInviteCode,
  validateJoinTeamInput,
  validateOrganizerTeamInput
} from "./onboarding";

test("normalizes invite codes from plain text or invite links", () => {
  assert.equal(normalizeInviteCode(" moija-2026 "), "MOIJA2026");
  assert.equal(normalizeInviteCode("https://moija.app/?invite=team-77"), "TEAM77");
});

test("rejects empty organizer team names", () => {
  const result = validateOrganizerTeamInput({ teamName: "   ", sportType: "futsal" });

  assert.deepEqual(result, {
    ok: false,
    message: "팀 이름을 입력하세요."
  });
});

test("defaults organizer sport type to futsal", () => {
  const result = validateOrganizerTeamInput({ teamName: "목요 풋살", sportType: "" });

  assert.deepEqual(result, {
    ok: true,
    teamName: "목요 풋살",
    sportType: "futsal"
  });
});

test("requires an invite code before joining a team", () => {
  const result = validateJoinTeamInput({ inviteCode: "   " });

  assert.deepEqual(result, {
    ok: false,
    message: "초대 코드나 초대 링크를 입력하세요."
  });
});

test("maps guest invite rpc errors to onboarding result codes", () => {
  assert.equal(mapGuestInviteRpcError({ code: "P0001", message: "auth_required" }), "auth");
  assert.equal(mapGuestInviteRpcError({ code: "P0001", message: "guest_invite_not_found" }), "join");
  assert.equal(mapGuestInviteRpcError({ code: "P0001", message: "guest_invite_unavailable" }), "join");
  assert.equal(mapGuestInviteRpcError({ code: "42501", message: "new row violates row-level security policy" }), "join");
  assert.equal(mapGuestInviteRpcError(null), "join");
});

test("uses distinct success messages for team and guest invite joins", () => {
  assert.equal(getInviteJoinSuccessMessage("team"), "모임에 가입했습니다.");
  assert.equal(getInviteJoinSuccessMessage("guest"), "용병으로 경기 참석이 확정되었습니다.");
});
