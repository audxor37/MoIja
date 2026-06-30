import { canManageMeeting } from "./meetings";

export const DASHBOARD_MEETING_LIMIT = 20;

export type DashboardMeeting = {
  id: string;
  title: string;
  startsAt: string;
  locationNote: string | null;
  capacity: number | null;
  allowWaitlist: boolean;
  attendanceMethod: string;
  attendanceClosesAt: string | null;
  canManage: boolean;
};

export type DashboardMatchRow = {
  id: string;
  title: string;
  starts_at: string;
  created_by: string | null;
  location_note?: string | null;
  capacity: number | null;
  allow_waitlist?: boolean | null;
  attendance_method: string;
  attendance_closes_at: string | null;
};

export function mapDashboardMeetings(
  matchRows: DashboardMatchRow[],
  permission: { currentUserId: string; role: string | null | undefined }
) {
  return matchRows.slice(0, DASHBOARD_MEETING_LIMIT).map((match) => ({
    id: match.id,
    title: match.title,
    startsAt: match.starts_at,
    locationNote: "location_note" in match ? match.location_note ?? null : null,
    capacity: match.capacity,
    allowWaitlist: "allow_waitlist" in match ? match.allow_waitlist ?? true : true,
    attendanceMethod: match.attendance_method,
    attendanceClosesAt: match.attendance_closes_at,
    canManage: canManageMeeting({
      currentUserId: permission.currentUserId,
      createdBy: match.created_by,
      role: permission.role
    })
  }));
}
