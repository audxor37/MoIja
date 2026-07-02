import { Copy } from "lucide-react";
import Link from "next/link";
import { TeamManagementPanel } from "@/components/team-management-panel";
import { canManageTeamRole } from "@/lib/team-management";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const teamMessages: Record<string, string> = {
  role_updated: "역할을 변경했습니다.",
  invite_regenerated: "초대 코드를 재발급했습니다."
};

const teamErrors: Record<string, string> = {
  auth: "로그인이 필요합니다.",
  invalid: "요청 값이 올바르지 않습니다.",
  missing: "멤버를 찾지 못했습니다.",
  permission: "팀을 관리할 Owner 또는 Manager 권한이 필요합니다.",
  save: "변경 내용을 저장하지 못했습니다."
};

export default async function TeamPage({
  searchParams
}: {
  searchParams?: Promise<{ team_message?: string; team_error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return <Shell message="로그인 후 팀 관리를 사용할 수 있습니다." />;
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
    return <Shell message="팀 관리는 Owner 또는 Manager만 사용할 수 있습니다." />;
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
  const message = params?.team_message ? teamMessages[params.team_message] : null;
  const error = params?.team_error ? teamErrors[params.team_error] : null;

  return (
    <main className="min-h-screen bg-app text-ink">
      <header className="border-b border-line bg-white px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link className="text-lg font-bold" href="/">MoIja</Link>
          <Link className="rounded-xl bg-surfaceAlt px-4 py-2 text-sm font-bold text-secondary" href="/">홈</Link>
        </div>
      </header>

      {(message || error) ? (
        <section className="mx-auto max-w-6xl px-4 pt-6">
          <div className="rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200]">
            {message || error}
          </div>
        </section>
      ) : null}

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
        <h1 className="mt-4 text-2xl font-bold">팀 관리</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-secondary">{message}</p>
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
