import { ActionRow, AppShell, ScreenCard, StatCard, TopBar } from "@/components/app-shell";
import { DashboardCacheHydrator } from "@/components/dashboard-cache-hydrator";
import { getDashboardSession } from "@/lib/server/dashboard-data";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await getDashboardSession();
  const reliability = session.team?.reliability;

  return (
    <>
      <DashboardCacheHydrator initialData={session} />
      <AppShell activePath="/ranking">
        <TopBar title="시즌 랭킹" backHref="/" />
        <p className="mt-8 text-sm font-black text-appTextSoft">2026 Summer Season</p>
        <h1 className="mt-2 text-[30px] font-black leading-tight text-white">나의 시즌 흐름</h1>
        <ScreenCard className="mt-6">
          <div className="grid grid-cols-3 gap-2">
            <StatCard active label="신뢰도" value={reliability ? `${reliability.score}` : "-"} />
            <StatCard label="참석률" value={reliability ? `${reliability.attendanceRate}%` : "-"} />
            <StatCard label="연속" value={reliability ? `${reliability.currentStreak}회` : "-"} />
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-appTextSoft">
            첫 버전은 내 신뢰도 지표를 기준으로 보여줍니다. 팀 전체 랭킹은 기록 데이터가 쌓인 뒤 확장합니다.
          </p>
        </ScreenCard>
        <section className="mt-4 grid gap-3">
          <ActionRow description="응답과 체크인 관리" href="/meetings" icon="clipboardCheck" title="참석 흐름 관리" />
          <ActionRow description="내 역할과 기록 확인" href="/profile" icon="user" title="내 정보 보기" />
        </section>
      </AppShell>
    </>
  );
}
