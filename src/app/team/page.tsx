import { Copy, RefreshCcw, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { regenerateTeamInviteCode, updateTeamMemberRole } from "@/app/team/actions";
import { canAssignTeamRole, canManageTeamRole, TEAM_ROLES, teamRoleLabel } from "@/lib/team-management";
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
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <Shell message="로그인 후 팀 관리를 사용할 수 있습니다." />;
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role, teams(id, name, invite_code)")
    .eq("profile_id", user.id)
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

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="grid gap-4">
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F7EE] text-primary">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{teamRoleLabel(typedMembership.role)}</p>
                <h1 className="text-2xl font-bold">{team.name}</h1>
              </div>
            </div>
            <div className="mt-5 grid gap-2">
              <InviteCodeCopyButton inviteCode={team.invite_code} />
              <form action={regenerateTeamInviteCode}>
                <input name="teamId" type="hidden" value={team.id} />
                <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-secondary" type="submit">
                  <RefreshCcw size={16} />
                  초대 코드 재발급
                </button>
              </form>
            </div>
          </section>

          {(message || error) ? (
            <div className="rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200]">
              {message || error}
            </div>
          ) : null}
        </aside>

        <section className="rounded-2xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">멤버 목록</h2>
              <p className="mt-1 text-sm text-secondary">Owner, Manager, Coach, Member 역할을 관리합니다.</p>
            </div>
            <Users className="text-primary" size={24} />
          </div>

          <div className="mt-5 grid gap-3">
            {rows.map((member) => (
              <article className="rounded-2xl border border-line p-4" key={member.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">{member.nickname}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">{teamRoleLabel(member.role)}</p>
                  </div>
                  <form action={updateTeamMemberRole} className="flex gap-2">
                    <input name="memberId" type="hidden" value={member.id} />
                    <select className="field-input h-11 min-w-32 py-0 text-sm" defaultValue={member.role} name="role">
                      {TEAM_ROLES.map((role) => (
                        <option disabled={!canAssignTeamRole({ actorRole: typedMembership.role, currentTargetRole: member.role, nextTargetRole: role, isSelf: member.profileId === user.id }) && role !== member.role} key={role} value={role}>
                          {teamRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white" type="submit">
                      저장
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
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
