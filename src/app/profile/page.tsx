import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck, Users } from "lucide-react";
import { getDashboardSession } from "@/lib/server/dashboard-data";
import { teamRoleLabel } from "@/lib/team-management";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getDashboardSession();

  if (!session.nickname) {
    return (
      <main className="min-h-screen bg-app px-4 py-6 text-ink">
        <section className="mx-auto max-w-md rounded-2xl bg-white p-5 shadow-card">
          <ShieldCheck className="text-muted" size={24} />
          <h1 className="mt-4 text-2xl font-bold">내 정보</h1>
          <Link className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white" href="/">
            홈으로
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app px-4 py-5 text-ink sm:px-6 lg:py-8">
      <section className="mx-auto max-w-2xl">
        <Link
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-secondary shadow-soft transition hover:bg-surfaceAlt"
          href="/"
        >
          <ArrowLeft size={18} />
          홈
        </Link>

        <section className="mt-4 rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <span className="inline-flex h-7 items-center rounded-full bg-[#E8F7EE] px-3 text-xs font-bold text-primary">
            내 정보
          </span>
          <h1 className="mt-3 text-3xl font-bold">{session.nickname}</h1>
          <div className="mt-5 grid gap-3">
            <InfoPill label="닉네임" value={session.nickname} />
            <InfoPill label="팀" value={session.team?.name ?? "소속 팀 없음"} />
            <InfoPill label="역할" value={session.team ? teamRoleLabel(session.team.role) : "-"} />
            <InfoPill label="예정 경기" value={`${session.team?.meetings.length ?? 0}개`} />
            {session.team ? (
              <>
                <InfoPill label="신뢰도" value={`${session.team.reliability.score}점`} />
                <InfoPill label="참석률" value={`${session.team.reliability.attendanceRate}%`} />
                <InfoPill label="노쇼" value={`${session.team.reliability.noShowCount}회`} />
                <InfoPill label="연속 참석" value={`${session.team.reliability.currentStreak}회`} />
              </>
            ) : null}
          </div>

          <form action="/api/auth/signout" className="mt-6" method="post">
            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-5 text-sm font-bold text-secondary transition hover:bg-line sm:w-auto"
              type="submit"
            >
              <LogOut size={17} />
              로그아웃
            </button>
          </form>
        </section>

        {session.team ? (
          <section className="mt-4 rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Users className="text-strategy" size={20} />
              <h2 className="text-lg font-bold">팀 정보</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <InfoPill label="팀" value={session.team.name} />
              <InfoPill label="역할" value={teamRoleLabel(session.team.role)} />
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surfaceAlt px-4 py-3 text-sm font-semibold">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 truncate text-ink">{value}</span>
    </div>
  );
}
