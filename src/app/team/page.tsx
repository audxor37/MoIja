import { Copy } from "lucide-react";
import Link from "next/link";
import { TeamManagementPanel } from "@/components/team-management-panel";
import { canManageTeamRole } from "@/lib/team-management";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return <Shell message="로그인이 필요합니다" />;
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name, invite_code)")
    .eq("profile_id", userId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const typedMembership = membership as
    | { team_id: string; role: string; teams?: { id: string; name: string; invite_code: string | null } | { id: string; name: string; invite_code: string | null }[] | null }
    | null;
  const team = Array.isArray(typedMembership?.teams) ? typedMembership?.teams[0] : typedMembership?.teams;

  if (!typedMembership || !team || !canManageTeamRole(typedMembership.role)) {
    return <Shell message="권한 없음" />;
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("id, profile_id, role, joined_at, profiles(nickname, avatar_url)")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  const rows = ((members ?? []) as TeamMemberRow[]).map((member) => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    return {
      id: member.id,
      profileId: member.profile_id,
      role: member.role,
      joinedAt: member.joined_at,
      nickname: profile?.nickname ?? "이름 없음"
    };
  });
  return (
    <main className="min-h-screen bg-app text-ink">
      <header className="border-b border-line bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link className="text-lg font-bold" href="/">MoIja</Link>
          <Link className="rounded-xl bg-surfaceAlt px-4 py-2 text-sm font-bold text-secondary" href="/">홈</Link>
        </div>
      </header>
      <TeamManagementPanel
        actorRole={typedMembership.role}
        currentUserId={userId}
        initialMembers={rows}
        team={{ id: team.id, name: team.name, inviteCode: team.invite_code }}
      />
    </main>
  );
}

function Shell({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-app px-4 py-10 text-ink">
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-card">
        <Copy className="text-muted" size={24} />
        <h1 className="mt-4 text-2xl font-bold">{message}</h1>
        <Link className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white" href="/">
          홈으로
        </Link>
      </section>
    </main>
  );
}

type TeamMemberRow = {
  id: string;
  profile_id: string;
  role: string;
  joined_at: string;
  profiles?: { nickname: string | null; avatar_url: string | null } | { nickname: string | null; avatar_url: string | null }[] | null;
};
