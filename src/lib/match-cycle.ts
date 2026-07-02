import type { AttendanceStatus } from "./attendance";

export const GUEST_RESPONSE_STATUSES = ["accepted", "declined"] as const;
export const GUEST_OPERATOR_STATUSES = ["accepted", "declined", "confirmed", "no_show"] as const;
export const MATCH_RESULTS = ["win", "draw", "loss"] as const;

export type GuestResponseStatus = (typeof GUEST_RESPONSE_STATUSES)[number];
export type GuestOperatorStatus = (typeof GUEST_OPERATOR_STATUSES)[number];
export type MatchResult = (typeof MATCH_RESULTS)[number];
export type FormationCode =
  | "4-4-2"
  | "4-2-3-1"
  | "4-3-3"
  | "4-1-4-1"
  | "4-5-1"
  | "4-1-2-1-2"
  | "3-5-2"
  | "3-4-3"
  | "3-4-2-1"
  | "5-3-2"
  | "5-4-1";
export type FormationPosition = {
  code: string;
  label: string;
  xPercent: number;
  yPercent: number;
};
export type FormationPreset = {
  code: FormationCode;
  label: string;
  positions: FormationPosition[];
};
export type LineupPlacementInput = {
  id: string;
  playerKind: "member" | "guest";
  profileId: string | null;
  guestId: string | null;
  displayName: string;
  positionCode: string | null;
};
export type LineupPlacement = LineupPlacementInput & {
  xPercent: number;
  yPercent: number;
  isStarter: boolean;
};
export type LineupSlot = {
  id: string;
  positionCode: string;
  positionLabel: string;
  xPercent: number;
  yPercent: number;
  isStarter: boolean;
  playerId: string | null;
  playerKind: "member" | "guest" | null;
  profileId: string | null;
  guestId: string | null;
  displayName: string | null;
};
export type BoardImageSaveFallback = {
  platform: "ios" | "android" | "desktop";
  primaryAction: "share" | "download" | "open";
  message: string;
};
export type InviteSharePayload = {
  title: string;
  text: string;
  url: string;
};
export type ScoringPlayerInput = {
  id: string;
  playerKind: "member" | "guest";
  profileId: string | null;
  guestId: string | null;
  positionCode: string | null;
};
export type ScoringEventInput = {
  scorerId: string;
  assistId: string | null;
};
export type PlayerRecordPayload = {
  playerKind: "member" | "guest";
  profileId: string | null;
  guestId: string | null;
  goals: number;
  assists: number;
  isMvp: boolean;
  positionCode: string | null;
  lineupSlot: string;
};

export const POSITION_LABELS: Record<string, string> = {
  GK: "골키퍼",
  SK: "스위퍼 키퍼",
  CB: "센터백",
  LCB: "왼쪽 센터백",
  RCB: "오른쪽 센터백",
  SW: "스위퍼 / 리베로",
  FB: "풀백",
  LB: "왼쪽 풀백",
  RB: "오른쪽 풀백",
  WB: "윙백",
  LWB: "왼쪽 윙백",
  RWB: "오른쪽 윙백",
  IFB: "인버티드 풀백",
  CDM: "수비형 미드필더",
  DM: "수비형 미드필더",
  CM: "중앙 미드필더",
  LCM: "왼쪽 중앙 미드필더",
  RCM: "오른쪽 중앙 미드필더",
  B2B: "박스 투 박스 미드필더",
  DLP: "딥라잉 플레이메이커",
  BWM: "볼위닝 미드필더",
  AM: "공격형 미드필더",
  CAM: "중앙 공격형 미드필더",
  LAM: "왼쪽 공격형 미드필더",
  RAM: "오른쪽 공격형 미드필더",
  LM: "왼쪽 미드필더",
  RM: "오른쪽 미드필더",
  WM: "와이드 미드필더",
  MEZ: "메짤라",
  REG: "레지스타",
  ANC: "앵커맨",
  ST: "스트라이커",
  CF: "센터 포워드",
  LS: "왼쪽 스트라이커",
  RS: "오른쪽 스트라이커",
  SS: "세컨드 스트라이커",
  TM: "타깃맨",
  PO: "포처",
  DLF: "딥라잉 포워드",
  F9: "폴스 나인",
  W: "윙어",
  LW: "왼쪽 윙어",
  RW: "오른쪽 윙어",
  IF: "인사이드 포워드",
  LIF: "왼쪽 인사이드 포워드",
  RIF: "오른쪽 인사이드 포워드",
  WF: "와이드 포워드",
  LWF: "왼쪽 와이드 포워드",
  RWF: "오른쪽 와이드 포워드"
};

export const FORMATION_PRESETS: FormationPreset[] = [
  {
    code: "4-4-2",
    label: "4-4-2",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LB", label: "LB", xPercent: 18, yPercent: 72 },
      { code: "LCB", label: "LCB", xPercent: 39, yPercent: 75 },
      { code: "RCB", label: "RCB", xPercent: 61, yPercent: 75 },
      { code: "RB", label: "RB", xPercent: 82, yPercent: 72 },
      { code: "LM", label: "LM", xPercent: 18, yPercent: 47 },
      { code: "LCM", label: "LCM", xPercent: 40, yPercent: 50 },
      { code: "RCM", label: "RCM", xPercent: 60, yPercent: 50 },
      { code: "RM", label: "RM", xPercent: 82, yPercent: 47 },
      { code: "LS", label: "LS", xPercent: 42, yPercent: 22 },
      { code: "RS", label: "RS", xPercent: 58, yPercent: 22 }
    ]
  },
  {
    code: "4-1-4-1",
    label: "4-1-4-1",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LB", label: "LB", xPercent: 18, yPercent: 72 },
      { code: "LCB", label: "LCB", xPercent: 39, yPercent: 75 },
      { code: "RCB", label: "RCB", xPercent: 61, yPercent: 75 },
      { code: "RB", label: "RB", xPercent: 82, yPercent: 72 },
      { code: "CDM", label: "CDM", xPercent: 50, yPercent: 58 },
      { code: "LM", label: "LM", xPercent: 18, yPercent: 42 },
      { code: "LCM", label: "LCM", xPercent: 40, yPercent: 44 },
      { code: "RCM", label: "RCM", xPercent: 60, yPercent: 44 },
      { code: "RM", label: "RM", xPercent: 82, yPercent: 42 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 18 }
    ]
  },
  {
    code: "4-5-1",
    label: "4-5-1",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LB", label: "LB", xPercent: 18, yPercent: 72 },
      { code: "LCB", label: "LCB", xPercent: 39, yPercent: 75 },
      { code: "RCB", label: "RCB", xPercent: 61, yPercent: 75 },
      { code: "RB", label: "RB", xPercent: 82, yPercent: 72 },
      { code: "LM", label: "LM", xPercent: 16, yPercent: 48 },
      { code: "LCM", label: "LCM", xPercent: 36, yPercent: 50 },
      { code: "CM", label: "CM", xPercent: 50, yPercent: 52 },
      { code: "RCM", label: "RCM", xPercent: 64, yPercent: 50 },
      { code: "RM", label: "RM", xPercent: 84, yPercent: 48 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 18 }
    ]
  },
  {
    code: "4-1-2-1-2",
    label: "4-1-2-1-2",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LB", label: "LB", xPercent: 18, yPercent: 72 },
      { code: "LCB", label: "LCB", xPercent: 39, yPercent: 75 },
      { code: "RCB", label: "RCB", xPercent: 61, yPercent: 75 },
      { code: "RB", label: "RB", xPercent: 82, yPercent: 72 },
      { code: "CDM", label: "CDM", xPercent: 50, yPercent: 58 },
      { code: "LCM", label: "LCM", xPercent: 38, yPercent: 44 },
      { code: "RCM", label: "RCM", xPercent: 62, yPercent: 44 },
      { code: "CAM", label: "CAM", xPercent: 50, yPercent: 32 },
      { code: "LS", label: "LS", xPercent: 42, yPercent: 18 },
      { code: "RS", label: "RS", xPercent: 58, yPercent: 18 }
    ]
  },
  {
    code: "4-3-3",
    label: "4-3-3",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LB", label: "LB", xPercent: 18, yPercent: 72 },
      { code: "LCB", label: "LCB", xPercent: 39, yPercent: 75 },
      { code: "RCB", label: "RCB", xPercent: 61, yPercent: 75 },
      { code: "RB", label: "RB", xPercent: 82, yPercent: 72 },
      { code: "LCM", label: "LCM", xPercent: 35, yPercent: 50 },
      { code: "CM", label: "CM", xPercent: 50, yPercent: 54 },
      { code: "RCM", label: "RCM", xPercent: 65, yPercent: 50 },
      { code: "LW", label: "LW", xPercent: 25, yPercent: 24 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 19 },
      { code: "RW", label: "RW", xPercent: 75, yPercent: 24 }
    ]
  },
  {
    code: "4-2-3-1",
    label: "4-2-3-1",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LB", label: "LB", xPercent: 18, yPercent: 72 },
      { code: "LCB", label: "LCB", xPercent: 39, yPercent: 75 },
      { code: "RCB", label: "RCB", xPercent: 61, yPercent: 75 },
      { code: "RB", label: "RB", xPercent: 82, yPercent: 72 },
      { code: "LDM", label: "LDM", xPercent: 40, yPercent: 55 },
      { code: "RDM", label: "RDM", xPercent: 60, yPercent: 55 },
      { code: "LAM", label: "LAM", xPercent: 28, yPercent: 36 },
      { code: "CAM", label: "CAM", xPercent: 50, yPercent: 34 },
      { code: "RAM", label: "RAM", xPercent: 72, yPercent: 36 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 18 }
    ]
  },
  {
    code: "3-5-2",
    label: "3-5-2",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LCB", label: "LCB", xPercent: 32, yPercent: 73 },
      { code: "CB", label: "CB", xPercent: 50, yPercent: 76 },
      { code: "RCB", label: "RCB", xPercent: 68, yPercent: 73 },
      { code: "LWB", label: "LWB", xPercent: 15, yPercent: 48 },
      { code: "LCM", label: "LCM", xPercent: 38, yPercent: 50 },
      { code: "CM", label: "CM", xPercent: 50, yPercent: 53 },
      { code: "RCM", label: "RCM", xPercent: 62, yPercent: 50 },
      { code: "RWB", label: "RWB", xPercent: 85, yPercent: 48 },
      { code: "LS", label: "LS", xPercent: 42, yPercent: 22 },
      { code: "RS", label: "RS", xPercent: 58, yPercent: 22 }
    ]
  },
  {
    code: "3-4-3",
    label: "3-4-3",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LCB", label: "LCB", xPercent: 32, yPercent: 73 },
      { code: "CB", label: "CB", xPercent: 50, yPercent: 76 },
      { code: "RCB", label: "RCB", xPercent: 68, yPercent: 73 },
      { code: "LM", label: "LM", xPercent: 20, yPercent: 50 },
      { code: "LCM", label: "LCM", xPercent: 42, yPercent: 52 },
      { code: "RCM", label: "RCM", xPercent: 58, yPercent: 52 },
      { code: "RM", label: "RM", xPercent: 80, yPercent: 50 },
      { code: "LW", label: "LW", xPercent: 25, yPercent: 24 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 19 },
      { code: "RW", label: "RW", xPercent: 75, yPercent: 24 }
    ]
  },
  {
    code: "3-4-2-1",
    label: "3-4-2-1",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LCB", label: "LCB", xPercent: 32, yPercent: 73 },
      { code: "CB", label: "CB", xPercent: 50, yPercent: 76 },
      { code: "RCB", label: "RCB", xPercent: 68, yPercent: 73 },
      { code: "LWB", label: "LWB", xPercent: 16, yPercent: 50 },
      { code: "LCM", label: "LCM", xPercent: 42, yPercent: 54 },
      { code: "RCM", label: "RCM", xPercent: 58, yPercent: 54 },
      { code: "RWB", label: "RWB", xPercent: 84, yPercent: 50 },
      { code: "LAM", label: "LAM", xPercent: 40, yPercent: 32 },
      { code: "RAM", label: "RAM", xPercent: 60, yPercent: 32 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 17 }
    ]
  },
  {
    code: "5-3-2",
    label: "5-3-2",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LWB", label: "LWB", xPercent: 12, yPercent: 70 },
      { code: "LCB", label: "LCB", xPercent: 34, yPercent: 75 },
      { code: "CB", label: "CB", xPercent: 50, yPercent: 78 },
      { code: "RCB", label: "RCB", xPercent: 66, yPercent: 75 },
      { code: "RWB", label: "RWB", xPercent: 88, yPercent: 70 },
      { code: "LCM", label: "LCM", xPercent: 38, yPercent: 48 },
      { code: "CM", label: "CM", xPercent: 50, yPercent: 52 },
      { code: "RCM", label: "RCM", xPercent: 62, yPercent: 48 },
      { code: "LS", label: "LS", xPercent: 42, yPercent: 20 },
      { code: "RS", label: "RS", xPercent: 58, yPercent: 20 }
    ]
  },
  {
    code: "5-4-1",
    label: "5-4-1",
    positions: [
      { code: "GK", label: "GK", xPercent: 50, yPercent: 90 },
      { code: "LWB", label: "LWB", xPercent: 12, yPercent: 70 },
      { code: "LCB", label: "LCB", xPercent: 34, yPercent: 75 },
      { code: "CB", label: "CB", xPercent: 50, yPercent: 78 },
      { code: "RCB", label: "RCB", xPercent: 66, yPercent: 75 },
      { code: "RWB", label: "RWB", xPercent: 88, yPercent: 70 },
      { code: "LM", label: "LM", xPercent: 20, yPercent: 45 },
      { code: "LCM", label: "LCM", xPercent: 42, yPercent: 48 },
      { code: "RCM", label: "RCM", xPercent: 58, yPercent: 48 },
      { code: "RM", label: "RM", xPercent: 80, yPercent: 45 },
      { code: "ST", label: "ST", xPercent: 50, yPercent: 18 }
    ]
  }
];

export function validateGuestResponseStatus(value: string): GuestResponseStatus | null {
  return GUEST_RESPONSE_STATUSES.includes(value as GuestResponseStatus) ? (value as GuestResponseStatus) : null;
}

export function validateGuestOperatorStatus(value: string): GuestOperatorStatus | null {
  return GUEST_OPERATOR_STATUSES.includes(value as GuestOperatorStatus) ? (value as GuestOperatorStatus) : null;
}

export function validateMatchResult(value: string): MatchResult | null {
  return MATCH_RESULTS.includes(value as MatchResult) ? (value as MatchResult) : null;
}

export function getFormationPreset(value: string | null | undefined) {
  return FORMATION_PRESETS.find((preset) => preset.code === value) ?? FORMATION_PRESETS[0];
}

export function getPositionLabel(code: string) {
  return POSITION_LABELS[code] ?? code;
}

export function getDefaultLineupSlots(formation: string, players: LineupPlacementInput[]): LineupSlot[] {
  const preset = getFormationPreset(formation);

  return preset.positions.map((position, index) => {
    const player = players[index] ?? null;
    return {
      id: `${preset.code}:${position.code}:${index}`,
      positionCode: position.code,
      positionLabel: getPositionLabel(position.code),
      xPercent: position.xPercent,
      yPercent: position.yPercent,
      isStarter: true,
      playerId: player?.id ?? null,
      playerKind: player?.playerKind ?? null,
      profileId: player?.profileId ?? null,
      guestId: player?.guestId ?? null,
      displayName: player?.displayName ?? null
    };
  });
}

export function getDefaultLineupPlacements(formation: string, players: LineupPlacementInput[]): LineupPlacement[] {
  const preset = getFormationPreset(formation);

  return players.map((player, index) => {
    const position = preset.positions[index];
    const benchIndex = Math.max(index - preset.positions.length, 0);

    return {
      ...player,
      positionCode: position?.code ?? "SUB",
      xPercent: position?.xPercent ?? 14 + (benchIndex % 5) * 18,
      yPercent: position?.yPercent ?? 7,
      isStarter: Boolean(position)
    };
  });
}

export function guestStatusLabel(status: string | null | undefined) {
  const labels: Record<string, string> = {
    invited: "초대",
    accepted: "참석 예정",
    declined: "불참",
    checked_in: "체크인",
    confirmed: "참석 확정",
    no_show: "노쇼"
  };

  return status ? labels[status] ?? "초대" : "초대";
}

export function playerKindLabel(kind: "member" | "guest") {
  return kind === "member" ? "회원" : "용병";
}

export function parseNonNegativeInteger(value: string) {
  const numberValue = Number.parseInt(value, 10);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : 0;
}

export function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isPlayableAttendanceStatus(status: AttendanceStatus | string | null | undefined) {
  return status === "attending";
}

export function getBoardImageSaveFallback({
  userAgent,
  canShareFiles
}: {
  userAgent: string;
  canShareFiles: boolean;
}): BoardImageSaveFallback {
  const normalizedUserAgent = userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(normalizedUserAgent) ||
    (normalizedUserAgent.includes("macintosh") && normalizedUserAgent.includes("mobile"));
  const isAndroid = normalizedUserAgent.includes("android");
  const platform = isIos ? "ios" : isAndroid ? "android" : "desktop";

  if (canShareFiles) {
    return {
      platform,
      primaryAction: "share",
      message: "복사가 제한된 환경입니다. 사진첩 저장을 선택해 공유 시트에서 이미지 저장을 진행해 주세요."
    };
  }

  if (platform === "ios") {
    return {
      platform,
      primaryAction: "open",
      message: "복사가 제한된 환경입니다. 이미지를 연 뒤 길게 눌러 사진에 저장해 주세요."
    };
  }

  return {
    platform,
    primaryAction: "download",
    message: "복사가 제한된 환경입니다. 이미지 다운로드로 저장해 주세요."
  };
}

export function getBoardImageFileName(meetingTitle: string) {
  const safeTitle = meetingTitle
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `${safeTitle || "moija-lineup"}_라인업.png`;
}

export function buildInviteSharePayload({
  inviteCode,
  siteUrl
}: {
  inviteCode: string;
  siteUrl: string;
}): InviteSharePayload {
  const normalizedSiteUrl = siteUrl.replace(/\/+$/, "");
  const encodedCode = encodeURIComponent(inviteCode);

  return {
    title: "MoIja 초대",
    text: `MoIja 초대 코드: ${inviteCode}`,
    url: `${normalizedSiteUrl}/?invite=${encodedCode}`
  };
}

export function summarizeScoringEvents({
  players,
  events
}: {
  players: ScoringPlayerInput[];
  events: ScoringEventInput[];
}): PlayerRecordPayload[] {
  const totals = new Map<string, { goals: number; assists: number }>();

  for (const event of events) {
    if (event.scorerId) {
      const current = totals.get(event.scorerId) ?? { goals: 0, assists: 0 };
      totals.set(event.scorerId, { ...current, goals: current.goals + 1 });
    }

    if (event.assistId) {
      const current = totals.get(event.assistId) ?? { goals: 0, assists: 0 };
      totals.set(event.assistId, { ...current, assists: current.assists + 1 });
    }
  }

  return players
    .map((player) => {
      const total = totals.get(player.id) ?? { goals: 0, assists: 0 };

      return {
        playerKind: player.playerKind,
        profileId: player.profileId,
        guestId: player.guestId,
        goals: total.goals,
        assists: total.assists,
        isMvp: false,
        positionCode: player.positionCode,
        lineupSlot: "starter"
      };
    })
    .filter((record) => record.goals > 0 || record.assists > 0);
}
