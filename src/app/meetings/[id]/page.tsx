import Link from "next/link";
import { ClipboardCheck, MapPin, Timer, UserCheck, Users } from "lucide-react";
import { ActionRow, AppShell, ScreenCard, StatCard, TopBar } from "@/components/app-shell";
import { HelpIcon } from "@/components/help-icon";
import { MeetingAdminMenu } from "@/components/meeting-admin-menu";
import { attendanceStatusLabel, type AttendanceStatus } from "@/lib/attendance";
import { getMeetingHubActions } from "@/lib/dashboard-ux";
import { formatMeetingDateTime } from "@/lib/meetings";
import { getMeetingDetailData } from "@/lib/server/meeting-detail-data";

export default async function MeetingDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const {
    attendanceSummary,
    canManageAttendance,
    canManageLineup,
    currentMeeting,
    myAttendance
  } = await getMeetingDetailData(id);
  const actions = getMeetingHubActions({
    meetingId: currentMeeting.id,
    canManageAttendance,
    canManageLineup
  });

  return (
    <AppShell activePath="/meetings">
      <TopBar
        backHref="/meetings"
        right={canManageAttendance ? <MeetingAdminMenu meetingId={currentMeeting.id} /> : undefined}
        title="경기 상세"
      />
      <section className="grid min-w-0 gap-4 py-5 lg:py-7">
        <ScreenCard className="bg-gradient-to-br from-appCardSoft to-appCard">
          <span className="inline-flex rounded-lg bg-lime px-2 py-1 text-[11px] font-black text-app">D-0</span>
          <p className="mt-5 text-sm font-bold text-appTextSoft">{formatMeetingDateTime(currentMeeting.starts_at)}</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white">{currentMeeting.title}</h1>
          {currentMeeting.opponent_name ? <p className="mt-1 text-sm font-bold text-cobalt">vs {currentMeeting.opponent_name}</p> : null}
          <p className="mt-3 text-sm font-bold text-appTextSoft">{currentMeeting.location_note ?? "장소 미정"}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {canManageAttendance ? (
              <>
                <StatCard active label="응답률" value={`${attendanceSummary.responseRate}%`} />
                <StatCard label="미응답" value={`${attendanceSummary.unansweredCount}명`} />
                <StatCard label="확정필요" value={`${attendanceSummary.confirmationNeededCount}명`} />
                <StatCard label="노쇼" value={`${attendanceSummary.noShowCount}명`} />
              </>
            ) : (
              <>
                <StatCard active label="내 상태" value={attendanceStatusLabel(myAttendance?.status)} />
                <StatCard label="정원" value={currentMeeting.capacity ? `${currentMeeting.capacity}명` : "미정"} />
                <StatCard label="대기" value={currentMeeting.allow_waitlist ? "가능" : "없음"} />
                <StatCard label="마감" value={currentMeeting.attendance_closes_at ? "설정됨" : "미정"} />
              </>
            )}
          </div>
        </ScreenCard>

        <section className="grid gap-2">
          {actions.map((action) => (
            <ActionRow
              description={action.description}
              href={action.href}
              icon={action.icon}
              key={action.href}
              title={action.title}
            />
          ))}
        </section>

        <ScreenCard>
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
            <p className="mt-3 rounded-xl bg-appCardSoft px-3 py-3 text-sm font-semibold leading-6 text-appTextSoft">
              {currentMeeting.memo}
            </p>
          ) : null}
        </ScreenCard>
      </section>
      <MeetingMobileActionBar canManageAttendance={canManageAttendance} canManageLineup={canManageLineup} meetingId={currentMeeting.id} myStatus={myAttendance?.status ?? null} />
    </AppShell>
  );
}

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
    <div className="min-w-0 rounded-xl bg-appCardSoft px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-appMuted">
        <Icon className="shrink-0" size={15} />
        {label}
        {help}
      </div>
      <p className="mt-1 truncate font-bold text-appText">{value}</p>
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

function MeetingMobileActionBar({
  canManageAttendance,
  canManageLineup,
  meetingId,
  myStatus
}: {
  canManageAttendance: boolean;
  canManageLineup: boolean;
  meetingId: string;
  myStatus: AttendanceStatus | null;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-appLine bg-app/95 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 shadow-raised backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-[1fr_auto] gap-2">
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lime px-4 text-sm font-black text-app"
          href={`/meetings/${meetingId}/attendance`}
        >
          {canManageAttendance ? <ClipboardCheck size={17} /> : <UserCheck size={17} />}
          {canManageAttendance ? "출석 운영" : attendanceStatusLabel(myStatus)}
        </Link>
        <Link
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-appCardSoft px-4 text-sm font-bold text-appTextSoft"
          href={`/meetings/${meetingId}/${canManageLineup ? "lineup" : "attendance"}`}
        >
          {canManageLineup ? "라인업" : "변경"}
        </Link>
      </div>
    </nav>
  );
}
