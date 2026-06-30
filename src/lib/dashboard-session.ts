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
};

export type DashboardMatchRow = {
  id: string;
  title: string;
  starts_at: string;
  location_note?: string | null;
  capacity: number | null;
  allow_waitlist?: boolean | null;
  attendance_method: string;
  attendance_closes_at: string | null;
};

export function mapDashboardMeetings(matchRows: DashboardMatchRow[]) {
  return matchRows.slice(0, DASHBOARD_MEETING_LIMIT).map((match) => ({
    id: match.id,
    title: match.title,
    startsAt: match.starts_at,
    locationNote: "location_note" in match ? match.location_note ?? null : null,
    capacity: match.capacity,
    allowWaitlist: "allow_waitlist" in match ? match.allow_waitlist ?? true : true,
    attendanceMethod: match.attendance_method,
    attendanceClosesAt: match.attendance_closes_at
  }));
}
