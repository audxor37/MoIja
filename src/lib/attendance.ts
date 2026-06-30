export const ATTENDANCE_RESPONSE_STATUSES = ["attending", "absent", "waitlisted"] as const;

export type AttendanceResponseStatus = (typeof ATTENDANCE_RESPONSE_STATUSES)[number];
export type AttendanceStatus = AttendanceResponseStatus | "no_show";

export function validateAttendanceResponseStatus(value: string): AttendanceResponseStatus | null {
  return ATTENDANCE_RESPONSE_STATUSES.includes(value as AttendanceResponseStatus)
    ? (value as AttendanceResponseStatus)
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
