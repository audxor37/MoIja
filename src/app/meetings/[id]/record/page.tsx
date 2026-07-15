import { notFound } from "next/navigation";
import { AppShell, TopBar } from "@/components/app-shell";
import { MatchCyclePanel } from "@/components/match-cycle-panel";
import { getMeetingDetailData } from "@/lib/server/meeting-detail-data";

export default async function MeetingRecordPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const {
    canManageAttendance,
    canManageLineup,
    currentMeeting,
    cyclePlayers,
    lineup,
    matchInvites,
    matchRecord,
    playerRecords
  } = await getMeetingDetailData(id);

  if (!canManageAttendance) {
    notFound();
  }

  return (
    <AppShell activePath="/meetings">
      <TopBar backHref={`/meetings/${currentMeeting.id}`} title="기록 입력" />
      <section className="grid gap-4 py-5 lg:py-7">
        <MatchCyclePanel
          canManageGuests={canManageAttendance}
          canManageLineup={canManageLineup}
          canManageRecord={canManageAttendance}
          initialInvites={matchInvites}
          initialLineup={lineup}
          initialPlayers={cyclePlayers}
          initialRecord={matchRecord}
          initialPlayerRecords={playerRecords}
          initialSection="record"
          meetingId={currentMeeting.id}
          meetingTitle={currentMeeting.title}
          showSectionTabs={false}
        />
      </section>
    </AppShell>
  );
}
