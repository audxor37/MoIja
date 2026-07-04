import { cache } from "react";
import { buildAttendanceSummary } from "@/lib/attendance";
import {
  DASHBOARD_MEETING_LIMIT,
  type DashboardAttendanceRow,
  type DashboardMeeting,
  type DashboardMatchRow,
  mapDashboardMeetings
} from "@/lib/dashboard-session";
import { calculateReliabilityScore, type ReliabilityScore } from "@/lib/reliability";
import { isMissingRefreshTokenError } from "@/lib/supabase/auth-error";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type TeamSession = {
  id: string;
  name: string;
  role: string;
  inviteCode: string | null;
  meetings: DashboardMeeting[];
  reliability: ReliabilityScore;
};

export type DashboardSession = {
  nickname: string | null;
  team: TeamSession | null;
};

export const getDashboardSession = cache(async function getDashboardSession(): Promise<DashboardSession> {
  try {
    const supabase = await createSupabaseServerClient();
    const userId = await getCurrentUserId(supabase);

    if (!userId) {
      return { nickname: null, team: null };
    }

    const profilePromise = supabase.from("profiles").select("nickname").eq("id", userId).maybeSingle();
    const membershipPromise = supabase
      .from("team_members")
      .select("role, teams(id, name, invite_code)")
      .eq("profile_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const [{ data: profile }, { data: membership }] = await Promise.all([profilePromise, membershipPromise]);
    const nickname = profile?.nickname || "운영자";

    type TeamRecord = { id: string; name: string; invite_code: string | null };
    const typedMembership = membership as
      | {
          role?: string;
          teams?: TeamRecord | TeamRecord[] | null;
        }
      | null;
    const joinedTeam = Array.isArray(typedMembership?.teams)
      ? typedMembership?.teams[0]
      : typedMembership?.teams;

    if (!joinedTeam || !typedMembership?.role) {
      return { nickname, team: null };
    }

    const memberCountPromise = supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("team_id", joinedTeam.id);
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, title, starts_at, created_by, location_note, capacity, allow_waitlist, attendance_method, attendance_closes_at")
      .eq("team_id", joinedTeam.id)
      .order("starts_at", { ascending: true })
      .limit(DASHBOARD_MEETING_LIMIT);

    const { data: fallbackMatches } = matchesError
      ? await supabase
          .from("matches")
          .select("id, title, starts_at, created_by, capacity, attendance_method, attendance_closes_at")
          .eq("team_id", joinedTeam.id)
          .order("starts_at", { ascending: true })
          .limit(DASHBOARD_MEETING_LIMIT)
      : { data: null };

    const matchRows = (matches ?? fallbackMatches ?? []) as DashboardMatchRow[];
    const matchIds = matchRows.map((match) => match.id);
    const [{ count: teamMemberCount }, { data: attendanceRows }, { data: myAttendanceRows }, { data: reliabilityRows }] = await Promise.all([
      memberCountPromise,
      matchIds.length > 0
        ? supabase.from("match_attendances").select("match_id, status").in("match_id", matchIds)
        : Promise.resolve({ data: [] }),
      matchIds.length > 0
        ? supabase.from("match_attendances").select("match_id, status").eq("profile_id", userId).in("match_id", matchIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from("match_attendances")
        .select("status, matches!inner(team_id, starts_at)")
        .eq("profile_id", userId)
        .eq("matches.team_id", joinedTeam.id)
        .order("starts_at", { referencedTable: "matches", ascending: false })
    ]);
    const attendanceSummaryByMatchId = new Map<string, DashboardMeeting["attendanceSummary"]>();
    const myAttendanceStatusByMatchId = new Map<string, DashboardMeeting["myAttendanceStatus"]>();

    for (const row of (myAttendanceRows ?? []) as DashboardAttendanceRow[]) {
      myAttendanceStatusByMatchId.set(row.match_id, row.status);
    }

    for (const match of matchRows) {
      const rowsForMatch = ((attendanceRows ?? []) as DashboardAttendanceRow[]).filter(
        (attendance) => attendance.match_id === match.id
      );
      attendanceSummaryByMatchId.set(
        match.id,
        buildAttendanceSummary(rowsForMatch, {
          teamMemberCount: teamMemberCount ?? 0,
          capacity: match.capacity
        })
      );
    }

    const meetings = mapDashboardMeetings(
      matchRows,
      {
        currentUserId: userId,
        role: typedMembership.role
      },
      attendanceSummaryByMatchId,
      myAttendanceStatusByMatchId
    );

    return {
      nickname,
      team: {
        id: joinedTeam.id,
        name: joinedTeam.name,
        role: typedMembership.role,
        inviteCode: joinedTeam.invite_code,
        meetings,
        reliability: calculateReliabilityScore((reliabilityRows ?? []) as { status: "attending" | "confirmed" | "absent" | "no_show" }[])
      }
    };
  } catch (error) {
    if (!isMissingRefreshTokenError(error)) {
      console.error("getDashboardSession error:", error);
    }

    return { nickname: null, team: null };
  }
});
