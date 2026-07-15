import { Copy, Users } from "lucide-react";
import Link from "next/link";
import { ActionRow, AppShell, ScreenCard, StatCard, TopBar } from "@/components/app-shell";
import { buildTeamTaskHref } from "@/lib/dashboard-ux";
import { getTeamManagementData } from "@/lib/server/team-data";
import { teamRoleLabel } from "@/lib/team-management";

export default async function TeamPage() {
  const data = await getTeamManagementData();

  if (data.status === "auth") {
    return <Shell message="로그인이 필요합니다" />;
  }

  if (data.status === "permission") {
    return <Shell message="권한 없음" />;
  }

  return (
    <AppShell activePath="/team">
      <TopBar title="팀" backHref="/" />
      <section className="grid gap-4 py-5 lg:py-7">
        <ScreenCard>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-appCardSoft text-lime">
              <Users size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-lime">{teamRoleLabel(data.actorRole)}</p>
              <h1 className="truncate text-2xl font-bold text-white">{data.team.name}</h1>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <StatCard active label="멤버" value={`${data.members.length}명`} />
            <StatCard label="초대코드" value={data.team.inviteCode ? "활성" : "없음"} />
          </div>
        </ScreenCard>

        <section className="grid gap-3">
          <ActionRow description="초대코드 복사와 재발급" href={buildTeamTaskHref("invite")} icon="userPlus" title="팀 초대 관리" />
          <ActionRow description="역할과 권한 조정" href={buildTeamTaskHref("members")} icon="users" title="멤버 권한 관리" />
        </section>
      </section>
    </AppShell>
  );
}

function Shell({ message }: { message: string }) {
  return (
    <AppShell activePath="/team">
      <TopBar title="팀" backHref="/" />
      <ScreenCard className="mt-6">
        <Copy className="text-appMuted" size={24} />
        <h1 className="mt-4 text-2xl font-bold text-white">{message}</h1>
        <Link className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-lime px-5 text-sm font-bold text-app" href="/">
          홈으로
        </Link>
      </ScreenCard>
    </AppShell>
  );
}
