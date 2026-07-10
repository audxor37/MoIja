const DEFAULT_DEADLINE_HOURS = 6;
const MIN_CAPACITY = 10;
const MAX_CAPACITY = 24;
const DEFAULT_WEEKLY_SERIES_COUNT = 8;
const MIN_WEEKLY_SERIES_COUNT = 2;
const MAX_WEEKLY_SERIES_COUNT = 12;
const VALID_WEEKDAYS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const VALID_ATTENDANCE_METHODS = ["manual", "qr", "gps", "gps_approval"] as const;
const VALID_REPEAT_MODES = ["once", "weekly"] as const;
const LEGACY_WEEKLY_REPEAT_MODE = "weekly_8";

export type AttendanceMethod = (typeof VALID_ATTENDANCE_METHODS)[number];
export type MeetingRepeatMode = (typeof VALID_REPEAT_MODES)[number];

type MeetingPermissionInput = {
  currentUserId: string | null;
  createdBy: string | null;
  role: string | null | undefined;
};

type MeetingInput = {
  title: string;
  memo: string;
  startsOn: string;
  weeklyStartOn?: string;
  weeklyWeekday?: string;
  startsAt: string;
  placeName: string;
  placeAddress: string;
  capacity: string;
  repeatMode: string;
  repeatCount?: string;
  opponentName: string;
  seriesOpponents: string[];
  allowWaitlist: string;
  deadlineHours: string;
  attendanceMethod: string;
};

export type MeetingInputResult =
  | {
      ok: true;
      title: string;
      memo: string | null;
      startsAt: string;
      locationNote: string | null;
      capacity: number;
      allowWaitlist: boolean;
      attendanceMethod: AttendanceMethod;
      attendanceClosesAt: string;
      deadlineHours: number;
      repeatMode: MeetingRepeatMode;
      repeatCount: number;
      opponentName: string | null;
      seriesOpponents: Array<string | null>;
    }
  | {
      ok: false;
      message: string;
    };

function isAttendanceMethod(value: string): value is AttendanceMethod {
  return VALID_ATTENDANCE_METHODS.includes(value as AttendanceMethod);
}

function isRepeatMode(value: string): value is MeetingRepeatMode {
  return VALID_REPEAT_MODES.includes(value as MeetingRepeatMode);
}

function normalizeRepeatMode(value: string): MeetingRepeatMode {
  if (value === LEGACY_WEEKLY_REPEAT_MODE) {
    return "weekly";
  }

  return isRepeatMode(value) ? value : "once";
}

export function canManageMeeting({ currentUserId, createdBy, role }: MeetingPermissionInput) {
  if (!currentUserId) {
    return false;
  }

  return createdBy === currentUserId || role === "owner" || role === "manager";
}

function parsePositiveInteger(value: string) {
  const normalized = Number.parseInt(value, 10);
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null;
}

function normalizeNullableText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeSeriesOpponents(input: MeetingInput, repeatCount: number) {
  if (repeatCount === 1) {
    return [normalizeNullableText(input.opponentName)];
  }

  return Array.from({ length: repeatCount }, (_, index) =>
    normalizeNullableText(input.seriesOpponents[index] ?? "")
  );
}

function isValidWeekday(value: string) {
  return VALID_WEEKDAYS.includes(value as (typeof VALID_WEEKDAYS)[number]);
}

function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateOnly(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function resolveWeeklyStartsOn(weeklyStartOn: string, weeklyWeekday: string) {
  const startWeek = weeklyStartOn.trim();
  const weekday = weeklyWeekday.trim();

  if (!startWeek || !isValidWeekday(weekday)) {
    return null;
  }

  const startDate = parseDateOnly(startWeek);

  if (!startDate) {
    return null;
  }

  const offset = (Number(weekday) - startDate.getUTCDay() + 7) % 7;
  startDate.setUTCDate(startDate.getUTCDate() + offset);

  return formatDateOnly(startDate);
}

function toKoreanTimeIso(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

export function validateMeetingInput(input: MeetingInput): MeetingInputResult {
  const title = input.title.trim();
  const memo = input.memo.trim();
  const repeatMode = normalizeRepeatMode(input.repeatMode);
  const weeklyStartsOn =
    repeatMode === "weekly"
      ? resolveWeeklyStartsOn(input.weeklyStartOn ?? "", input.weeklyWeekday ?? "")
      : null;
  const startsOn = repeatMode === "weekly" ? weeklyStartsOn ?? "" : input.startsOn.trim();
  const startsAtTime = input.startsAt.trim();
  const placeName = input.placeName.trim();
  const placeAddress = input.placeAddress.trim();
  const capacity = parsePositiveInteger(input.capacity);
  const deadlineHours = parsePositiveInteger(input.deadlineHours) ?? DEFAULT_DEADLINE_HOURS;
  const parsedRepeatCount = parsePositiveInteger(input.repeatCount ?? "");
  const repeatCount = repeatMode === "weekly" ? parsedRepeatCount ?? DEFAULT_WEEKLY_SERIES_COUNT : 1;
  const attendanceMethod = isAttendanceMethod(input.attendanceMethod)
    ? input.attendanceMethod
    : "manual";

  if (!title) {
    return { ok: false, message: "경기 이름을 입력해 주세요." };
  }

  if (repeatMode === "weekly" && !weeklyStartsOn) {
    return { ok: false, message: "반복 경기의 시작 주와 요일을 선택해 주세요." };
  }

  if (!startsOn || !startsAtTime) {
    return { ok: false, message: "경기 날짜와 시간을 입력해 주세요." };
  }

  if (!capacity || capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) {
    return { ok: false, message: "정원은 10명부터 24명까지 선택해 주세요." };
  }

  if (
    repeatMode === "weekly" &&
    (repeatCount < MIN_WEEKLY_SERIES_COUNT || repeatCount > MAX_WEEKLY_SERIES_COUNT)
  ) {
    return { ok: false, message: "반복 주차는 2주부터 12주까지 선택해 주세요." };
  }

  const startsAt = new Date(`${startsOn}T${startsAtTime}:00+09:00`);

  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, message: "경기 날짜와 시간을 다시 확인해 주세요." };
  }

  const attendanceClosesAt = new Date(startsAt.getTime() - deadlineHours * 60 * 60 * 1000);
  const locationNote = [placeName, placeAddress].filter(Boolean).join(" · ") || null;
  const seriesOpponents = normalizeSeriesOpponents(input, repeatCount);

  return {
    ok: true,
    title,
    memo: memo || null,
    startsAt: toKoreanTimeIso(startsAt),
    locationNote,
    capacity,
    allowWaitlist: input.allowWaitlist === "on",
    attendanceMethod,
    attendanceClosesAt: toKoreanTimeIso(attendanceClosesAt),
    deadlineHours,
    repeatMode,
    repeatCount,
    opponentName: seriesOpponents[0] ?? null,
    seriesOpponents
  };
}

export function formatMeetingDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "일정 미정";
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const dayPeriod = get("dayPeriod") || (date.getHours() < 12 ? "오전" : "오후");

  return `${get("month")}월 ${get("day")}일(${get("weekday")}) ${dayPeriod} ${get("hour")}:${get("minute")}`;
}
