const DEFAULT_SPORT_TYPE = "futsal";

type OrganizerTeamInput = {
  teamName: string;
  sportType: string;
};

type JoinTeamInput = {
  inviteCode: string;
};

type OrganizerTeamResult =
  | {
      ok: true;
      teamName: string;
      sportType: string;
    }
  | {
      ok: false;
      message: string;
    };

type JoinTeamResult =
  | {
      ok: true;
      inviteCode: string;
    }
  | {
      ok: false;
      message: string;
    };

export type InviteJoinKind = "team" | "guest";

export function normalizeInviteCode(value: string) {
  let rawValue = value.trim();

  try {
    const parsedUrl = new URL(rawValue);
    rawValue =
      parsedUrl.searchParams.get("invite") ||
      parsedUrl.searchParams.get("code") ||
      parsedUrl.pathname.split("/").filter(Boolean).at(-1) ||
      rawValue;
  } catch {
    // Plain invite codes are expected; URL parsing is best-effort only.
  }

  return rawValue.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function mapGuestInviteRpcError(error: { code?: string; message?: string } | null) {
  if (error?.code === "P0001" && error.message === "auth_required") {
    return "auth";
  }

  return "join";
}

export function getInviteJoinSuccessMessage(kind: InviteJoinKind) {
  return kind === "guest" ? "용병으로 경기 참석이 확정되었습니다." : "팀에 가입했습니다.";
}

export function validateOrganizerTeamInput(input: OrganizerTeamInput): OrganizerTeamResult {
  const teamName = input.teamName.trim();
  const sportType = input.sportType.trim() || DEFAULT_SPORT_TYPE;

  if (!teamName) {
    return {
      ok: false,
      message: "팀 이름을 입력하세요."
    };
  }

  return {
    ok: true,
    teamName,
    sportType
  };
}

export function validateJoinTeamInput(input: JoinTeamInput): JoinTeamResult {
  const inviteCode = normalizeInviteCode(input.inviteCode);

  if (!inviteCode) {
    return {
      ok: false,
      message: "초대 코드나 초대 링크를 입력하세요."
    };
  }

  return {
    ok: true,
    inviteCode
  };
}
