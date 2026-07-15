import { notFound, redirect } from "next/navigation";
import { type MatchCyclePlayer, type MatchInviteRow as UiMatchInviteRow, type MatchRecordValue, type PlayerRecordValue } from "@/components/match-cycle-panel";
import { type ManagedAttendanceMember } from "@/components/managed-attendance-panel";
import { buildAttendanceSummary, type AttendanceStatus } from "@/lib/attendance";
import { canManageMeeting } from "@/lib/meetings";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getMeetingDetailData(id: string) {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    redirect("/?meeting_error=auth_required");
  }

  const { data: meeting } = await supabase
    .from("matches")
    .select("id, team_id, created_by, title, starts_at, location_note, opponent_name, memo, capacity, allow_waitlist, attendance_method, attendance_closes_at")
    .eq("id", id)
    .maybeSingle();

  const currentMeeting = meeting as MeetingRecord | null;

  if (!currentMeeting) {
    notFound();
  }

  const { data: attendance } = await supabase
    .from("match_attendances")
    .select("status, updated_at")
    .eq("match_id", id)
    .eq("profile_id", userId)
    .maybeSingle();
  const myAttendance = attendance as { status: AttendanceStatus; updated_at: string } | null;

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", currentMeeting.team_id)
    .eq("profile_id", userId)
    .maybeSingle();
  const currentRole = (membership as { role?: string } | null)?.role ?? null;
  const canManageAttendance = canManageMeeting({
    currentUserId: userId,
    createdBy: currentMeeting.created_by,
    role: currentRole
  });
  const canManageLineup = ["owner", "manager", "coach"].includes(currentRole ?? "");

  const [membersResult, attendancesResult] = canManageAttendance || canManageLineup
    ? await Promise.all([
        supabase
          .from("team_members")
          .select("profile_id, role, profiles(nickname, avatar_url)")
          .eq("team_id", currentMeeting.team_id)
          .order("joined_at", { ascending: true }),
        supabase
          .from("match_attendances")
          .select("id, profile_id, status, updated_at")
          .eq("match_id", currentMeeting.id)
      ])
    : [{ data: null }, { data: null }];

  const attendanceRows = ((attendancesResult.data ?? []) as AttendanceRow[]);
  const attendanceByProfile = new Map(attendanceRows.map((row) => [row.profile_id, row]));
  const memberRows: ManagedAttendanceMember[] = ((membersResult.data ?? []) as TeamMemberRow[]).map((member) => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;

    return {
      profileId: member.profile_id,
      role: member.role,
      nickname: profile?.nickname ?? "이름 없음",
      avatarUrl: profile?.avatar_url ?? null,
      attendance: attendanceByProfile.get(member.profile_id) ?? null
    };
  });

  const [
    matchGuestsResult,
    matchInvitesResult,
    lineupResult,
    matchRecordResult,
    playerRecordsResult
  ] = await Promise.all([
    canManageAttendance || canManageLineup
      ? supabase
          .from("match_guests")
          .select("id, guest_id, status, guests(display_name, avatar_url)")
          .eq("match_id", currentMeeting.id)
      : { data: [] },
    canManageAttendance
      ? supabase
          .from("match_invites")
          .select("id, code, expires_at, used_count, max_uses")
          .eq("match_id", currentMeeting.id)
          .order("created_at", { ascending: false })
      : { data: [] },
    canManageLineup
      ? supabase
          .from("match_lineups")
          .select("id, formation, board_note")
          .eq("match_id", currentMeeting.id)
          .maybeSingle()
      : { data: null },
    canManageAttendance
      ? supabase
          .from("match_records")
          .select("result, goals_for, goals_against, opponent_name, formation, memo")
          .eq("match_id", currentMeeting.id)
          .maybeSingle()
      : { data: null },
    canManageAttendance
      ? supabase
          .from("player_match_records")
          .select("profile_id, guest_id, goals, assists, position_code")
          .eq("match_id", currentMeeting.id)
      : { data: null }
  ]);

  const cyclePlayers: MatchCyclePlayer[] = [
    ...memberRows.map((member) => ({
      id: `member:${member.profileId}`,
      playerKind: "member" as const,
      profileId: member.profileId,
      guestId: null,
      matchGuestId: null,
      displayName: member.nickname,
      status: member.attendance?.status ?? "unanswered",
      positionCode: null
    })),
    ...(((matchGuestsResult.data ?? []) as MatchGuestRow[]).map((guest) => {
      const guestProfile = Array.isArray(guest.guests) ? guest.guests[0] : guest.guests;
      return {
        id: `guest:${guest.guest_id}`,
        playerKind: "guest" as const,
        profileId: null,
        guestId: guest.guest_id,
        matchGuestId: guest.id,
        displayName: guestProfile?.display_name ?? "용병",
        status: guest.status,
        positionCode: null
      };
    }))
  ];

  const lineup = lineupResult.data as { formation: string; board_note: string | null } | null;
  const matchRecord = matchRecordResult.data as MatchRecordRow | null;
  const attendanceSummary = buildAttendanceSummary(
    attendanceRows.map((row) => ({ status: row.status })),
    { teamMemberCount: memberRows.length, capacity: currentMeeting.capacity }
  );

  return {
    attendanceSummary,
    canManageAttendance,
    canManageLineup,
    currentMeeting,
    currentRole,
    cyclePlayers,
    lineup: lineup ? { formation: lineup.formation, boardNote: lineup.board_note } : null,
    matchInvites: ((matchInvitesResult.data ?? []) as MatchInviteRow[]).map((invite): UiMatchInviteRow => ({
      id: invite.id,
      code: invite.code,
      expiresAt: invite.expires_at,
      usedCount: invite.used_count,
      maxUses: invite.max_uses
    })),
    matchRecord: matchRecord
      ? {
          result: matchRecord.result,
          goalsFor: matchRecord.goals_for,
          goalsAgainst: matchRecord.goals_against,
          opponentName: matchRecord.opponent_name,
          formation: matchRecord.formation,
          memo: matchRecord.memo
        } satisfies MatchRecordValue
      : null,
    memberRows,
    myAttendance,
    playerRecords: ((playerRecordsResult.data ?? []) as PlayerMatchRecordRow[]).map((record): PlayerRecordValue => ({
      profileId: record.profile_id,
      guestId: record.guest_id,
      goals: record.goals,
      assists: record.assists,
      positionCode: record.position_code
    })),
    userId
  };
}

export type MeetingDetailData = Awaited<ReturnType<typeof getMeetingDetailData>>;

type MeetingRecord = {
  id: string;
  team_id: string;
  created_by: string | null;
  title: string;
  starts_at: string;
  location_note: string | null;
  opponent_name: string | null;
  memo: string | null;
  capacity: number | null;
  allow_waitlist: boolean;
  attendance_method: string;
  attendance_closes_at: string | null;
};

type AttendanceRow = {
  id: string;
  profile_id: string;
  status: AttendanceStatus;
  updated_at: string;
};

type TeamMemberRow = {
  profile_id: string;
  role: string;
  profiles?: { nickname?: string | null; avatar_url?: string | null } | { nickname?: string | null; avatar_url?: string | null }[] | null;
};

type MatchGuestRow = {
  id: string;
  guest_id: string;
  status: string;
  guests?: { display_name?: string | null; avatar_url?: string | null } | { display_name?: string | null; avatar_url?: string | null }[] | null;
};

type MatchInviteRow = {
  id: string;
  code: string;
  expires_at: string | null;
  used_count: number;
  max_uses: number | null;
};

type MatchRecordRow = {
  result: "win" | "draw" | "loss" | null;
  goals_for: number;
  goals_against: number;
  opponent_name: string | null;
  formation: string | null;
  memo: string | null;
};

type PlayerMatchRecordRow = {
  profile_id: string | null;
  guest_id: string | null;
  goals: number;
  assists: number;
  position_code: string | null;
};
