import assert from "node:assert/strict";
import test from "node:test";
import { canAssignTeamRole, canManageTeamRole, isTeamRole, teamRoleLabel } from "./team-management";

test("allows only owners and managers to open team management", () => {
  assert.equal(canManageTeamRole("owner"), true);
  assert.equal(canManageTeamRole("manager"), true);
  assert.equal(canManageTeamRole("coach"), false);
  assert.equal(canManageTeamRole("member"), false);
});

test("guards role assignments by actor role and target state", () => {
  assert.equal(canAssignTeamRole({ actorRole: "manager", currentTargetRole: "member", nextTargetRole: "coach", isSelf: false }), true);
  assert.equal(canAssignTeamRole({ actorRole: "manager", currentTargetRole: "member", nextTargetRole: "owner", isSelf: false }), false);
  assert.equal(canAssignTeamRole({ actorRole: "owner", currentTargetRole: "manager", nextTargetRole: "owner", isSelf: false }), true);
  assert.equal(canAssignTeamRole({ actorRole: "owner", currentTargetRole: "owner", nextTargetRole: "manager", isSelf: false }), false);
  assert.equal(canAssignTeamRole({ actorRole: "owner", currentTargetRole: "manager", nextTargetRole: "coach", isSelf: true }), false);
  assert.equal(canAssignTeamRole({ actorRole: "member", currentTargetRole: "member", nextTargetRole: "coach", isSelf: false }), false);
});

test("validates and labels supported team roles", () => {
  assert.equal(isTeamRole("owner"), true);
  assert.equal(isTeamRole("guest"), false);
  assert.equal(teamRoleLabel("manager"), "Manager");
  assert.equal(teamRoleLabel(null), "Member");
});
