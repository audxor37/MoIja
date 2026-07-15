import { AppShell, TopBar } from "@/components/app-shell";
import { AttendanceResponsePanel } from "@/components/attendance-response-panel";
import { ManagedAttendancePanel } from "@/components/managed-attendance-panel";
import { getMeetingDetailData } from "@/lib/server/meeting-detail-data";

export default async function MeetingAttendancePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { canManageAttendance, currentMeeting, memberRows, myAttendance } = await getMeetingDetailData(id);

  return (
    <AppShell activePath="/meetings">
      <TopBar backHref={`/meetings/${currentMeeting.id}`} title={canManageAttendance ? "빠른 체크인" : "참석 응답"} />
      <section className="grid gap-4 py-5 lg:py-7">
        {canManageAttendance ? (
          <ManagedAttendancePanel
            capacity={currentMeeting.capacity}
            initialMembers={memberRows}
            meetingId={currentMeeting.id}
          />
        ) : (
          <AttendanceResponsePanel
            allowWaitlist={currentMeeting.allow_waitlist}
            initialStatus={myAttendance?.status ?? null}
            meetingId={currentMeeting.id}
          />
        )}
      </section>
    </AppShell>
  );
}
