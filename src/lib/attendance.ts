export const ATTENDANCE_RESPONSE_STATUSES = ["attending", "absent", "waitlisted"] as const;

export type AttendanceResponseStatus = (typeof ATTENDANCE_RESPONSE_STATUSES)[number];
export type AttendanceStatus = AttendanceResponseStatus | "no_show";
export type AttendanceSummaryInput = { status: AttendanceStatus | null | undefined };

export function validateAttendanceResponseStatus(value: string): AttendanceResponseStatus | null {
  return ATTENDANCE_RESPONSE_STATUSES.includes(value as AttendanceResponseStatus)
    ? (value as AttendanceResponseStatus)
    : null;
}

export function validateOperatorAttendanceStatus(value: string): AttendanceStatus | null {
  return value === "no_show" || ATTENDANCE_RESPONSE_STATUSES.includes(value as AttendanceResponseStatus)
    ? (value as AttendanceStatus)
    : null;
}

export function attendanceStatusLabel(status: AttendanceStatus | null | undefined) {
  const labels: Record<AttendanceStatus, string> = {
    attending: "참석 예정",
    absent: "불참",
    waitlisted: "대기",
    no_show: "노쇼"
  };

  return status ? labels[status] : "미응답";
}

export function shouldWriteAttendanceEvent(
  previousStatus: AttendanceStatus | null | undefined,
  nextStatus: AttendanceStatus
) {
  return previousStatus !== nextStatus;
}

export function canSubmitAttendanceResponse(status: AttendanceResponseStatus, allowWaitlist: boolean) {
  return status !== "waitlisted" || allowWaitlist;
}

export function buildAttendanceSummary(
  attendances: AttendanceSummaryInput[],
  options: { teamMemberCount: number; capacity: number | null | undefined }
) {
  const attendingCount = attendances.filter((attendance) => attendance.status === "attending").length;
  const waitlistedCount = attendances.filter((attendance) => attendance.status === "waitlisted").length;
  const absentCount = attendances.filter((attendance) => attendance.status === "absent").length;
  const noShowCount = attendances.filter((attendance) => attendance.status === "no_show").length;
  const respondedCount = attendances.filter((attendance) => Boolean(attendance.status)).length;
  const totalMembers = Math.max(options.teamMemberCount, respondedCount);
  const unansweredCount = Math.max(totalMembers - respondedCount, 0);
  const responseRate = totalMembers > 0 ? Math.round((respondedCount / totalMembers) * 100) : 0;
  const confirmationNeededCount = Math.max((options.capacity ?? attendingCount) - attendingCount, 0);

  return {
    attendingCount,
    waitlistedCount,
    absentCount,
    noShowCount,
    respondedCount,
    unansweredCount,
    responseRate,
    confirmationNeededCount
  };
}
