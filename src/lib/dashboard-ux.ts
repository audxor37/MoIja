export type DashboardNavItem = {
  label: "홈" | "경기" | "랭킹" | "팀" | "MY";
  href: string;
};

export type MeetingListFilter = "upcoming" | "today" | "mine" | "needs-record" | "ended";

export const meetingListFilters: Array<{ label: string; value: MeetingListFilter }> = [
  { label: "예정", value: "upcoming" },
  { label: "오늘", value: "today" },
  { label: "내 경기", value: "mine" },
  { label: "기록 필요", value: "needs-record" },
  { label: "종료", value: "ended" }
];

export type UpcomingMeetingSummary = {
  attendingCount: number;
  responseRate: number;
  unansweredCount: number;
  waitlistedCount: number;
  confirmationNeededCount: number;
  noShowCount: number;
};

export type DashboardTone = "success" | "info" | "warning" | "danger" | "muted";
export type MeetingTask = "attendance" | "lineup" | "guests" | "record";
export type TeamTask = "invite" | "members";
export type ProfileTask = "edit";
export type HubActionIcon = "clipboardCheck" | "shield" | "users" | "userPlus" | "trophy" | "user";

export type HubAction = {
  title: string;
  description: string;
  href: string;
  icon: HubActionIcon;
};

export function getActiveDashboardNavItems(): DashboardNavItem[] {
  return [
    { label: "홈", href: "/" },
    { label: "경기", href: "/meetings" },
    { label: "랭킹", href: "/ranking" },
    { label: "팀", href: "/team" },
    { label: "MY", href: "/profile" }
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

export function buildMeetingTaskHref(meetingId: string, task: MeetingTask) {
  return `/meetings/${meetingId}/${task}`;
}

export function buildTeamTaskHref(task: TeamTask) {
  return `/team/${task}`;
}

export function buildProfileTaskHref(task: ProfileTask) {
  return `/profile/${task}`;
}

export function getMeetingHubActions({
  meetingId,
  canManageAttendance,
  canManageLineup
}: {
  meetingId: string;
  canManageAttendance: boolean;
  canManageLineup: boolean;
}): HubAction[] {
  if (canManageAttendance) {
    return [
      { title: "빠른 체크인", description: "현장 출석 확인", href: buildMeetingTaskHref(meetingId, "attendance"), icon: "clipboardCheck" },
      { title: "라인업 작성", description: "확정자 기준 편집", href: buildMeetingTaskHref(meetingId, "lineup"), icon: "users" },
      { title: "용병 관리", description: "초대와 참석 상태", href: buildMeetingTaskHref(meetingId, "guests"), icon: "userPlus" },
      { title: "기록 입력", description: "결과와 개인 기록", href: buildMeetingTaskHref(meetingId, "record"), icon: "trophy" }
    ];
  }

  if (canManageLineup) {
    return [
      { title: "내 라인업 확인", description: "공유된 배치 보기", href: buildMeetingTaskHref(meetingId, "lineup"), icon: "users" }
    ];
  }

  return [
    { title: "참석 응답", description: "참석 상태 변경", href: buildMeetingTaskHref(meetingId, "attendance"), icon: "clipboardCheck" }
  ];
}

export function getMeetingFocusMetrics(summary: UpcomingMeetingSummary) {
  return [
    { label: "응답률", value: `${summary.responseRate}%`, tone: "info" as const },
    { label: "미응답", value: String(summary.unansweredCount), tone: "muted" as const },
    { label: "확정필요", value: String(summary.confirmationNeededCount), tone: "warning" as const },
    { label: "노쇼", value: String(summary.noShowCount), tone: "danger" as const }
  ];
}

export function normalizeMeetingListFilter(value: string | undefined | null): MeetingListFilter {
  return meetingListFilters.some((filter) => filter.value === value) ? (value as MeetingListFilter) : "upcoming";
}

export function filterDashboardMeetings<T extends {
  startsAt: string;
  myAttendanceStatus: unknown | null;
  attendanceSummary: { confirmationNeededCount: number };
}>(meetings: T[], filter: MeetingListFilter, now = new Date()) {
  const todayKey = toKoreanDateKey(now);

  return meetings.filter((meeting) => {
    const startsAt = new Date(meeting.startsAt);
    const isToday = toKoreanDateKey(startsAt) === todayKey;
    const isEnded = startsAt.getTime() < now.getTime();

    if (filter === "today") return isToday;
    if (filter === "mine") return Boolean(meeting.myAttendanceStatus);
    if (filter === "needs-record") return meeting.attendanceSummary.confirmationNeededCount > 0;
    if (filter === "ended") return isEnded;
    return !isEnded;
  });
}

function toKoreanDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
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
