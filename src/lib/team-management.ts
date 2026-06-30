export const TEAM_ROLES = ["owner", "manager", "coach", "member"] as const;

export type TeamRole = (typeof TEAM_ROLES)[number];

export function isTeamRole(value: string): value is TeamRole {
  return TEAM_ROLES.includes(value as TeamRole);
}

export function canManageTeamRole(currentRole: string | null | undefined) {
  return currentRole === "owner" || currentRole === "manager";
}

export function canAssignTeamRole({
  actorRole,
  currentTargetRole,
  nextTargetRole,
  isSelf
}: {
  actorRole: string | null | undefined;
  currentTargetRole: string | null | undefined;
  nextTargetRole: string;
  isSelf: boolean;
}) {
  if (!canManageTeamRole(actorRole) || !isTeamRole(nextTargetRole) || isSelf) {
    return false;
  }

  if (nextTargetRole === "owner") {
    return actorRole === "owner";
  }

  if (currentTargetRole === "owner") {
    return false;
  }

  return true;
}

export function teamRoleLabel(role: string | null | undefined) {
  const labels: Record<TeamRole, string> = {
    owner: "Owner",
    manager: "Manager",
    coach: "Coach",
    member: "Member"
  };

  return isTeamRole(role ?? "") ? labels[role as TeamRole] : "Member";
}
