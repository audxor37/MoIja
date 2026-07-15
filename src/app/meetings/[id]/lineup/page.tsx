import { ActionRow, AppShell, ScreenCard, TopBar } from "@/components/app-shell";
import { MatchCyclePanel } from "@/components/match-cycle-panel";
import { getMeetingDetailData } from "@/lib/server/meeting-detail-data";

export default async function MeetingLineupPage({
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

  return (
    <AppShell activePath="/meetings">
      <TopBar backHref={`/meetings/${currentMeeting.id}`} title="라인업" />
      <section className="grid gap-4 py-5 lg:py-7">
        {canManageLineup ? (
          <MatchCyclePanel
            canManageGuests={canManageAttendance}
            canManageLineup={canManageLineup}
            canManageRecord={canManageAttendance}
            initialInvites={matchInvites}
            initialLineup={lineup}
            initialPlayers={cyclePlayers}
            initialRecord={matchRecord}
            initialPlayerRecords={playerRecords}
            initialSection="lineup"
            meetingId={currentMeeting.id}
            meetingTitle={currentMeeting.title}
            showSectionTabs={false}
          />
        ) : (
          <ScreenCard>
            <p className="text-sm font-black text-lime">라인업</p>
            <h1 className="mt-2 text-2xl font-black text-white">공유된 라인업 준비 중</h1>
            <p className="mt-2 text-sm font-bold leading-6 text-appTextSoft">운영자 또는 Coach가 라인업을 공유하면 이 화면에서 확인할 수 있습니다.</p>
            <div className="mt-4">
              <ActionRow description="내 참석 상태 변경" href={`/meetings/${currentMeeting.id}/attendance`} icon="clipboardCheck" title="참석 응답" />
            </div>
          </ScreenCard>
        )}
      </section>
    </AppShell>
  );
}
