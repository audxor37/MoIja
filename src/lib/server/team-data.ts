import { canManageTeamRole } from "@/lib/team-management";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getTeamManagementData() {
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return { status: "auth" as const };
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
    return { status: "permission" as const };
  }

  const { data: members } = await supabase
    .from("team_members")
    .select("id, profile_id, role, joined_at, profiles(nickname, avatar_url)")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  return {
    status: "ok" as const,
    actorRole: typedMembership.role,
    currentUserId: userId,
    members: ((members ?? []) as TeamMemberRow[]).map((member) => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      return {
        id: member.id,
        profileId: member.profile_id,
        role: member.role,
        joinedAt: member.joined_at,
        nickname: profile?.nickname ?? "이름 없음"
      };
    }),
    team: { id: team.id, name: team.name, inviteCode: team.invite_code }
  };
}

type TeamMemberRow = {
  id: string;
  profile_id: string;
  role: string;
  joined_at: string;
  profiles?: { nickname: string | null; avatar_url: string | null } | { nickname: string | null; avatar_url: string | null }[] | null;
};
