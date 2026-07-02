"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { canAssignTeamRole, canManageTeamRole, isTeamRole } from "@/lib/team-management";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectWithTeamError(error: string): never {
  redirect(`/team?team_error=${error}`);
}

function makeInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export async function updateTeamMemberRole(formData: FormData) {
  const result = await performUpdateTeamMemberRole(formData);

  if (!result.ok) {
    redirectWithTeamError(result.code);
  }

  revalidatePath("/team");
  redirect("/team?team_message=role_updated");
}

export async function performUpdateTeamMemberRole(
  formData: FormData
): Promise<ActionResult<{ memberId: string; teamId: string; role: string }>> {
  const memberId = String(formData.get("memberId") ?? "");
  const nextRole = String(formData.get("role") ?? "");

  if (!memberId || !isTeamRole(nextRole)) {
    return { ok: false, code: "invalid", message: "요청 값이 올바르지 않습니다." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { data: target } = await supabase
    .from("team_members")
    .select("id, team_id, profile_id, role")
    .eq("id", memberId)
    .maybeSingle();

  const targetMember = target as { id: string; team_id: string; profile_id: string; role: string } | null;

  if (!targetMember) {
    return { ok: false, code: "missing", message: "멤버를 찾지 못했습니다." };
  }

  const { data: actor } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", targetMember.team_id)
    .eq("profile_id", userId)
    .maybeSingle();

  const actorRole = (actor as { role?: string } | null)?.role ?? null;

  if (
    !canAssignTeamRole({
      actorRole,
      currentTargetRole: targetMember.role,
      nextTargetRole: nextRole,
      isSelf: targetMember.profile_id === userId
    })
  ) {
    return { ok: false, code: "permission", message: "팀을 관리할 Owner 또는 Manager 권한이 필요합니다." };
  }

  const { error } = await supabase.from("team_members").update({ role: nextRole }).eq("id", targetMember.id);

  if (error) {
    return { ok: false, code: "save", message: "변경 내용을 저장하지 못했습니다." };
  }

  return {
    ok: true,
    message: "역할을 변경했습니다.",
    data: { memberId: targetMember.id, teamId: targetMember.team_id, role: nextRole }
  };
}

export async function regenerateTeamInviteCode(formData: FormData) {
  const result = await performRegenerateTeamInviteCode(formData);

  if (!result.ok) {
    redirectWithTeamError(result.code);
  }

  revalidatePath("/");
  revalidatePath("/team");
  redirect("/team?team_message=invite_regenerated");
}

export async function performRegenerateTeamInviteCode(
  formData: FormData
): Promise<ActionResult<{ teamId: string; inviteCode: string }>> {
  const teamId = String(formData.get("teamId") ?? "");

  if (!teamId) {
    return { ok: false, code: "invalid", message: "요청 값이 올바르지 않습니다." };
  }

  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("profile_id", userId)
    .maybeSingle();

  const role = (membership as { role?: string } | null)?.role ?? null;

  if (!canManageTeamRole(role)) {
    return { ok: false, code: "permission", message: "팀을 관리할 Owner 또는 Manager 권한이 필요합니다." };
  }

  const inviteCode = makeInviteCode();
  const { error } = await supabase.from("teams").update({ invite_code: inviteCode }).eq("id", teamId);

  if (error) {
    return { ok: false, code: "save", message: "변경 내용을 저장하지 못했습니다." };
  }

  return { ok: true, message: "초대 코드를 재발급했습니다.", data: { teamId, inviteCode } };
}
