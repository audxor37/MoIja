import type { MeetingInputResult } from "./meetings";
import type { AttendanceStatus } from "./attendance";

export const MANAGER_TEAM_MEMBERSHIP_SELECT = "team_id, role";

export type ManagerTeamMembershipRow = {
  team_id: string | null;
  role?: string | null;
};

type ValidMeetingInput = Omit<Extract<MeetingInputResult, { ok: true }>, "ok">;

export function buildCreateMeetingRpcArgs(input: ValidMeetingInput) {
  return {
    input_title: input.title,
    input_starts_at: input.startsAt,
    input_capacity: input.capacity,
    input_attendance_method: input.attendanceMethod,
    input_attendance_closes_at: input.attendanceClosesAt,
    input_location_note: input.locationNote,
    input_memo: input.memo,
    input_allow_waitlist: input.allowWaitlist
  };
}

export function toManagerTeam(membership: ManagerTeamMembershipRow | null) {
  if (!membership?.team_id) {
    return null;
  }

  return {
    id: membership.team_id,
    role: membership.role ?? "member"
  };
}

export function buildRespondToMeetingAttendanceRpcArgs(input: { meetingId: string; status: AttendanceStatus }) {
  return {
    input_match_id: input.meetingId,
    input_status: input.status
  };
}

export function buildCreateMatchWithDefaultAttendancesRpcArgs(input: ValidMeetingInput) {
  return {
    input_title: input.title,
    input_starts_at: input.startsAt,
    input_capacity: input.capacity,
    input_attendance_method: input.attendanceMethod,
    input_attendance_closes_at: input.attendanceClosesAt,
    input_location_note: input.locationNote,
    input_memo: input.memo,
    input_allow_waitlist: input.allowWaitlist
  };
}

export function mapRespondToMeetingAttendanceRpcError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return "save";
  }

  if (error.code === "P0001") {
    if (error.message === "auth_required") {
      return "auth";
    }

    if (error.message === "missing_meeting") {
      return "missing";
    }

    if (error.message === "invalid_status") {
      return "invalid";
    }
  }

  return "save";
}
