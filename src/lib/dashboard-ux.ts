export type DashboardNavItem = {
  label: "홈" | "새 경기" | "팀" | "내 정보";
  href: string;
};

export type UpcomingMeetingSummary = {
  attendingCount: number;
  unansweredCount: number;
  waitlistedCount: number;
  confirmationNeededCount: number;
  noShowCount: number;
};

export type DashboardTone = "success" | "info" | "warning" | "danger" | "muted";

export function getActiveDashboardNavItems(): DashboardNavItem[] {
  return [
    { label: "홈", href: "/" },
    { label: "새 경기", href: "/meetings/new" },
    { label: "팀", href: "/team" },
    { label: "내 정보", href: "/profile" }
  ];
}

export function getUpcomingMeetingActions(summary: UpcomingMeetingSummary) {
  return [
    { label: "참석", value: String(summary.attendingCount), tone: "success" as const },
    { label: "미응답", value: String(summary.unansweredCount), tone: "muted" as const },
    { label: "대기", value: String(summary.waitlistedCount), tone: "info" as const },
    { label: "확정 필요", value: String(summary.confirmationNeededCount), tone: "warning" as const },
    { label: "노쇼 위험", value: String(summary.noShowCount), tone: "danger" as const }
  ];
}

export function getReliabilityDisplay({
  score,
  noShowCount,
  currentStreak
}: {
  score: number;
  noShowCount: number;
  currentStreak: number;
}) {
  if (noShowCount > 0) {
    return {
      label: "회복 중",
      helper: "최근 노쇼 이력이 있어 연속 참석으로 회복이 필요합니다",
      tone: "danger" as const
    };
  }

  if (score >= 80 && currentStreak >= 2) {
    return {
      label: "안정",
      helper: "참석 흐름이 안정적입니다",
      tone: "success" as const
    };
  }

  return {
    label: "주의",
    helper: "응답과 참석을 꾸준히 남기면 안정권으로 올라갑니다",
    tone: "warning" as const
  };
}
