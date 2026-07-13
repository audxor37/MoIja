import { CalendarPlus } from "lucide-react";
import { AppShell, PrimaryAction, ScreenCard, TopBar } from "@/components/app-shell";
import { DashboardCacheHydrator } from "@/components/dashboard-cache-hydrator";
import { DashboardMeetingList } from "@/components/dashboard-meeting-list";
import { getDashboardSession } from "@/lib/server/dashboard-data";
import { canManageTeamRole } from "@/lib/team-management";

export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const session = await getDashboardSession();
  const canCreateMeeting = canManageTeamRole(session.team?.role);

  return (
    <>
      <DashboardCacheHydrator initialData={session} />
      <AppShell activePath="/meetings">
        <TopBar title="경기" backHref="/" />
        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-appTextSoft">2026년 7월</p>
              <h1 className="mt-2 text-[30px] font-black leading-tight text-white">팀 경기 일정</h1>
            </div>
            {canCreateMeeting ? (
              <a className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl bg-lime px-3 text-xs font-black text-app" href="/meetings/new">
                <CalendarPlus size={15} />
                경기 등록
              </a>
            ) : null}
          </div>

          <ScreenCard className="mt-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-appMuted">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <span key={day}>{day}</span>
              ))}
              {Array.from({ length: 23 }, (_, index) => index + 1).map((day) => (
                <span className={`rounded-full py-1.5 ${day === 18 ? "bg-cobalt text-white" : "text-appTextSoft"}`} key={day}>
                  {day}
                </span>
              ))}
            </div>
          </ScreenCard>

          {session.team ? (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-black text-appTextSoft">다가오는 경기 {session.team.meetings.length}</h2>
              <DashboardMeetingList emptyState={canCreateMeeting ? "operator" : "member"} meetings={session.team.meetings} selectFirst />
            </section>
          ) : (
            <ScreenCard className="mt-6">
              <h2 className="text-xl font-black text-white">팀 가입이 필요합니다</h2>
              <p className="mt-2 text-sm font-bold text-appTextSoft">팀에 가입하거나 운영자 팀을 만든 뒤 경기 일정을 볼 수 있습니다.</p>
              <div className="mt-4">
                <PrimaryAction href="/">홈으로</PrimaryAction>
              </div>
            </ScreenCard>
          )}
        </section>
      </AppShell>
    </>
  );
}
