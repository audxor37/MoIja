"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canAssignTeamRole, canManageTeamRole, isTeamRole } from "@/lib/team-management";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectWithTeamError(error: string): never {
  redirect(`/team?team_error=${error}`);
}

function makeInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function updateTeamMemberRole(formData: FormData) {
  const memberId = String(formData.get("memberId") ?? "");
  const nextRole = String(formData.get("role") ?? "");

  if (!memberId || !isTeamRole(nextRole)) {
    redirectWithTeamError("invalid");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithTeamError("auth");
  }

  const { data: target } = await supabase
    .from("team_members")
    .select("id, team_id, profile_id, role")
    .eq("id", memberId)
    .maybeSingle();

  const targetMember = target as { id: string; team_id: string; profile_id: string; role: string } | null;

  if (!targetMember) {
    redirectWithTeamError("missing");
  }

  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", targetMember.team_id)
    .eq("profile_id", user.id)
    .maybeSingle();

  const actorRole = (actor as { role?: string } | null)?.role ?? null;

  if (
    !canAssignTeamRole({
      actorRole,
      currentTargetRole: targetMember.role,
      nextTargetRole: nextRole,
      isSelf: targetMember.profile_id === user.id
    })
  ) {
    redirectWithTeamError("permission");
  }

  const { error } = await supabase.from("team_members").update({ role: nextRole }).eq("id", targetMember.id);

  if (error) {
    redirectWithTeamError("save");
  }

  revalidatePath("/team");
  redirect("/team?team_message=role_updated");
}

export async function regenerateTeamInviteCode(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");

  if (!teamId) {
    redirectWithTeamError("invalid");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithTeamError("auth");
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("profile_id", user.id)
    .maybeSingle();

  const role = (membership as { role?: string } | null)?.role ?? null;

  if (!canManageTeamRole(role)) {
    redirectWithTeamError("permission");
  }

  const { error } = await supabase.from("teams").update({ invite_code: makeInviteCode() }).eq("id", teamId);

  if (error) {
    redirectWithTeamError("save");
  }

  revalidatePath("/");
  revalidatePath("/team");
  redirect("/team?team_message=invite_regenerated");
}
