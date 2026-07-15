import { notFound } from "next/navigation";
import { AppShell, TopBar } from "@/components/app-shell";
import { TeamManagementPanel } from "@/components/team-management-panel";
import { getTeamManagementData } from "@/lib/server/team-data";

export default async function TeamMembersPage() {
  const data = await getTeamManagementData();

  if (data.status !== "ok") {
    notFound();
  }

  return (
    <AppShell activePath="/team">
      <TopBar title="멤버 권한" backHref="/team" />
      <TeamManagementPanel
        actorRole={data.actorRole}
        currentUserId={data.currentUserId}
        initialMembers={data.members}
        mode="members"
        team={data.team}
      />
    </AppShell>
  );
}
