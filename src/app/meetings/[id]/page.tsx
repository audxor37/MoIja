import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  MapPin,
  Timer,
  UserCheck,
  Users
} from "lucide-react";
import { AttendanceResponsePanel } from "@/components/attendance-response-panel";
import { HelpIcon } from "@/components/help-icon";
import { MatchCyclePanel, type MatchCyclePlayer } from "@/components/match-cycle-panel";
import { ManagedAttendancePanel, type ManagedAttendanceMember } from "@/components/managed-attendance-panel";
import { MeetingAdminMenu } from "@/components/meeting-admin-menu";
import { attendanceStatusLabel, buildAttendanceSummary, type AttendanceStatus } from "@/lib/attendance";
import { canManageMeeting, formatMeetingDateTime } from "@/lib/meetings";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MeetingDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-app pb-24 text-ink lg:pb-0">
      <div className="mx-auto flex w-full max-w-5xl max-w-full flex-col overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-7">
        <header className="flex items-center gap-3 border-b border-line pb-5">
          <Link
            aria-label="대시보드로 돌아가기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-soft transition hover:bg-surfaceAlt"
            href="/"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0 flex-1">
            <span className="inline-flex h-7 items-center rounded-full bg-[#E8F7EE] px-3 text-xs font-bold text-primary">
              경기 상세
            </span>
            <h1 className="mt-2 truncate text-2xl font-bold leading-8 sm:text-[30px] sm:leading-10">{currentMeeting.title}</h1>
            {currentMeeting.opponent_name ? (
              <p className="mt-1 truncate text-sm font-bold text-strategy">vs {currentMeeting.opponent_name}</p>
            ) : null}
          </div>
          {canManageAttendance ? <MeetingAdminMenu meetingId={currentMeeting.id} /> : null}
        </header>

        <section className="grid min-w-0 gap-5 py-5 lg:py-7">
          <section className="grid min-w-0 gap-4">
            <article className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="bg-navy px-4 py-5 text-white sm:px-5">
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 shrink-0 text-white/70" size={20} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white/65">{canManageAttendance ? "운영 요약" : "내 참석 요약"}</p>
                    <h2 className="mt-1 text-2xl font-black leading-8">{formatMeetingDateTime(currentMeeting.starts_at)}</h2>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white/70">
                      {currentMeeting.location_note ?? "장소 미정"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {canManageAttendance ? (
                    <>
                      <HeroMetric label="응답률" value={`${attendanceSummary.responseRate}%`} />
                      <HeroMetric label="미응답" value={`${attendanceSummary.unansweredCount}명`} />
                      <HeroMetric label="확정필요" value={`${attendanceSummary.confirmationNeededCount}명`} />
                      <HeroMetric label="노쇼" value={`${attendanceSummary.noShowCount}명`} danger />
                    </>
                  ) : (
                    <>
                      <HeroMetric label="내 상태" value={attendanceStatusLabel(myAttendance?.status)} />
                      <HeroMetric label="정원" value={currentMeeting.capacity ? `${currentMeeting.capacity}명` : "미정"} />
                      <HeroMetric label="대기" value={currentMeeting.allow_waitlist ? "가능" : "없음"} />
                      <HeroMetric label="마감" value={currentMeeting.attendance_closes_at ? "설정됨" : "미정"} />
                    </>
                  )}
                </div>
              </div>
              <div className="grid gap-3 p-4 sm:p-5">
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <InfoRow icon={Timer} label="일정" value={formatMeetingDateTime(currentMeeting.starts_at)} />
                  {currentMeeting.opponent_name ? (
                    <InfoRow icon={UserCheck} label="상대팀" value={`vs ${currentMeeting.opponent_name}`} />
                  ) : null}
                  <InfoRow icon={MapPin} label="장소" value={currentMeeting.location_note ?? "장소 미정"} />
                  <InfoRow icon={Users} label="정원" value={currentMeeting.capacity ? `${currentMeeting.capacity}명` : "미정"} />
                  <InfoRow icon={ClipboardCheck} label="신청 마감" value={currentMeeting.attendance_closes_at ? formatMeetingDateTime(currentMeeting.attendance_closes_at) : "마감 미정"} />
                  <InfoRow
                    help={
                      <HelpIcon title="출석 방식">
                        참석 응답과 실제 출석 확정은 분리됩니다. MVP에서는 운영자가 최종 상태를 확정합니다.
                      </HelpIcon>
                    }
                    icon={ClipboardCheck}
                    label="출석 방식"
                    value={attendanceMethodLabel(currentMeeting.attendance_method)}
                  />
                </div>
                {currentMeeting.memo ? (
                  <p className="rounded-xl bg-surfaceAlt px-3 py-3 text-sm font-semibold leading-6 text-secondary">
                    {currentMeeting.memo}
                  </p>
                ) : null}
                {canManageAttendance ? (
                  <Link
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white shadow-card transition hover:bg-[#12843D]"
                    href="#attendance"
                  >
                    <ClipboardCheck size={17} />
                    출석 운영 바로가기
                  </Link>
                ) : null}
              </div>
            </article>

            <section id="response" className="scroll-mt-4">
              <AttendanceResponsePanel
                allowWaitlist={currentMeeting.allow_waitlist}
                initialStatus={myAttendance?.status ?? null}
                meetingId={currentMeeting.id}
              />
            </section>

            {canManageAttendance ? (
              <section id="attendance" className="scroll-mt-4">
                <ManagedAttendancePanel
                  capacity={currentMeeting.capacity}
                  initialMembers={memberRows}
                  meetingId={currentMeeting.id}
                />
              </section>
            ) : null}

            {(canManageAttendance || canManageLineup) ? (
              <section id="cycle" className="scroll-mt-4">
                <MatchCyclePanel
                  canManageGuests={canManageAttendance}
                  canManageLineup={canManageLineup}
                  canManageRecord={canManageAttendance}
                  initialInvites={((matchInvitesResult.data ?? []) as MatchInviteRow[]).map((invite) => ({
                    id: invite.id,
                    code: invite.code,
                    expiresAt: invite.expires_at,
                    usedCount: invite.used_count,
                    maxUses: invite.max_uses
                  }))}
                  initialLineup={lineup ? { formation: lineup.formation, boardNote: lineup.board_note } : null}
                  initialPlayers={cyclePlayers}
                  initialRecord={
                    matchRecord
                      ? {
                          result: matchRecord.result,
                          goalsFor: matchRecord.goals_for,
                          goalsAgainst: matchRecord.goals_against,
                          opponentName: matchRecord.opponent_name,
                          formation: matchRecord.formation,
                          memo: matchRecord.memo
                        }
                      : null
                  }
                  initialPlayerRecords={((playerRecordsResult.data ?? []) as PlayerMatchRecordRow[]).map((record) => ({
                    profileId: record.profile_id,
                    guestId: record.guest_id,
                    goals: record.goals,
                    assists: record.assists,
                    positionCode: record.position_code
                  }))}
                  meetingId={currentMeeting.id}
                  meetingTitle={currentMeeting.title}
                />
              </section>
            ) : null}
          </section>
        </section>
      </div>
      <MeetingMobileActionBar canManageAttendance={canManageAttendance} canManageLineup={canManageLineup} myStatus={myAttendance?.status ?? null} />
    </main>
  );
}

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
  result: "win" | "draw" | "loss";
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

function InfoRow({
  help,
  icon: Icon,
  label,
  value
}: {
  help?: React.ReactNode;
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-surfaceAlt px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-muted">
        <Icon className="shrink-0" size={15} />
        {label}
        {help}
      </div>
      <p className="mt-1 truncate font-bold text-ink">{value}</p>
    </div>
  );
}

function attendanceMethodLabel(value: string) {
  const labels: Record<string, string> = {
    manual: "운영자 확인",
    qr: "QR 체크",
    gps_approval: "GPS + 승인"
  };

  return labels[value] ?? value;
}

function HeroMetric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl px-3 py-2 ${danger ? "bg-[#FFF1F1] text-danger" : "bg-white/10 text-white"}`}>
      <span className="block truncate text-[11px] font-bold opacity-75">{label}</span>
      <span className="mt-1 block truncate text-xl font-black leading-6">{value}</span>
    </div>
  );
}

function MeetingMobileActionBar({
  canManageAttendance,
  canManageLineup,
  myStatus
}: {
  canManageAttendance: boolean;
  canManageLineup: boolean;
  myStatus: AttendanceStatus | null;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-raised lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto] gap-2">
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white"
          href={canManageAttendance ? "#attendance" : "#response"}
        >
          {canManageAttendance ? <ClipboardCheck size={17} /> : <UserCheck size={17} />}
          {canManageAttendance ? "출석 운영" : attendanceStatusLabel(myStatus)}
        </Link>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-4 text-sm font-bold text-secondary"
          href={canManageLineup ? "#cycle" : "#response"}
        >
          {canManageLineup ? "라인업" : "변경"}
        </Link>
      </div>
    </nav>
  );
}
