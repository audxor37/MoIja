import { LogOut, ShieldCheck, Users } from "lucide-react";
import { AppShell, ScreenCard, StatCard, TopBar } from "@/components/app-shell";
import { RoutePendingLink, SubmitButton } from "@/components/pending-ui";
import { getDashboardSession } from "@/lib/server/dashboard-data";
import { teamRoleLabel } from "@/lib/team-management";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getDashboardSession();

  if (!session.nickname) {
    return (
      <AppShell activePath="/profile">
        <TopBar title="내 정보" backHref="/" />
        <ScreenCard className="mt-6">
          <ShieldCheck className="text-appMuted" size={24} />
          <h1 className="mt-4 text-2xl font-bold text-white">내 정보</h1>
          <RoutePendingLink className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-lime px-5 text-sm font-bold text-app" href="/">
            홈으로
          </RoutePendingLink>
        </ScreenCard>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/profile">
      <TopBar title="내 정보" backHref="/" />
      <section className="mt-6">
        <ScreenCard className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-appCardSoft text-lg font-black text-white">
            {session.nickname.slice(0, 1)}
          </div>
          <h1 className="mt-4 text-3xl font-black text-white">{session.nickname}</h1>
          <p className="mt-2 text-sm font-bold text-appMuted">
            {session.team?.name ?? "소속 팀 없음"} · {session.team ? teamRoleLabel(session.team.role) : "Guest"}
          </p>
          {session.team ? (
            <div className="mt-5 grid grid-cols-3 gap-2">
              <StatCard active label="신뢰도" value={`${session.team.reliability.score}`} />
              <StatCard label="참석률" value={`${session.team.reliability.attendanceRate}%`} />
              <StatCard label="연속" value={`${session.team.reliability.currentStreak}회`} />
            </div>
          ) : null}

          <form action="/api/auth/signout" className="mt-6" method="post">
            <SubmitButton
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-appCardSoft px-5 text-sm font-bold text-appTextSoft transition hover:bg-appLine sm:w-auto"
              pendingLabel="로그아웃 중"
            >
              <LogOut size={17} />
              로그아웃
            </SubmitButton>
          </form>
        </ScreenCard>

        {session.team ? (
          <ScreenCard className="mt-4">
            <div className="flex items-center gap-2">
              <Users className="text-lime" size={20} />
              <h2 className="text-lg font-bold text-white">나의 축구 정보</h2>
            </div>
            <div className="mt-4 grid gap-2">
              <InfoPill label="주 포지션" value="MF · 가능 포지션 DF" />
              <InfoPill label="참석 이력" value={`예정 경기 ${session.team.meetings.length}개`} />
              <InfoPill label="팀" value={session.team.name} />
              <InfoPill label="역할" value={teamRoleLabel(session.team.role)} />
            </div>
          </ScreenCard>
        ) : null}
      </section>
    </AppShell>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-appCardSoft px-4 py-3 text-sm font-semibold">
      <span className="text-appMuted">{label}</span>
      <span className="min-w-0 truncate text-appText">{value}</span>
    </div>
  );
}
