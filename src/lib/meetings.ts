const DEFAULT_DEADLINE_HOURS = 6;
const VALID_ATTENDANCE_METHODS = ["manual", "qr", "gps", "gps_approval"] as const;

export type AttendanceMethod = (typeof VALID_ATTENDANCE_METHODS)[number];

type MeetingPermissionInput = {
  currentUserId: string | null;
  createdBy: string | null;
  role: string | null | undefined;
};

type MeetingInput = {
  title: string;
  memo: string;
  startsOn: string;
  startsAt: string;
  placeName: string;
  placeAddress: string;
  capacity: string;
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
      capacity: number | null;
      allowWaitlist: boolean;
      attendanceMethod: AttendanceMethod;
      attendanceClosesAt: string;
    }
  | {
      ok: false;
      message: string;
    };

function isAttendanceMethod(value: string): value is AttendanceMethod {
  return VALID_ATTENDANCE_METHODS.includes(value as AttendanceMethod);
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
  const startsOn = input.startsOn.trim();
  const startsAtTime = input.startsAt.trim();
  const placeName = input.placeName.trim();
  const placeAddress = input.placeAddress.trim();
  const capacity = parsePositiveInteger(input.capacity);
  const deadlineHours = parsePositiveInteger(input.deadlineHours) ?? DEFAULT_DEADLINE_HOURS;
  const attendanceMethod = isAttendanceMethod(input.attendanceMethod)
    ? input.attendanceMethod
    : "manual";

  if (!title) {
    return { ok: false, message: "모임 이름을 입력해 주세요." };
  }

  if (!startsOn || !startsAtTime) {
    return { ok: false, message: "모임 날짜와 시간을 입력해 주세요." };
  }

  const startsAt = new Date(`${startsOn}T${startsAtTime}:00+09:00`);

  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, message: "모임 날짜와 시간을 다시 확인해 주세요." };
  }

  const attendanceClosesAt = new Date(startsAt.getTime() - deadlineHours * 60 * 60 * 1000);
  const locationNote = [placeName, placeAddress].filter(Boolean).join(" · ") || null;

  return {
    ok: true,
    title,
    memo: memo || null,
    startsAt: toKoreanTimeIso(startsAt),
    locationNote,
    capacity,
    allowWaitlist: input.allowWaitlist === "on",
    attendanceMethod,
    attendanceClosesAt: toKoreanTimeIso(attendanceClosesAt)
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
