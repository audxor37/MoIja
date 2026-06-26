"use server";

import { redirect } from "next/navigation";
import { validateJoinTeamInput, validateOrganizerTeamInput } from "@/lib/onboarding";
import { upsertOwnProfile } from "@/lib/supabase/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const errorParams: Record<string, string> = {
  auth: "onboarding_error=auth_required",
  join: "onboarding_error=join_failed",
  profile: "onboarding_error=profile_failed",
  team: "onboarding_error=team_create_failed",
  member: "onboarding_error=owner_member_failed"
};

function redirectWithMessage(message: string): never {
  redirect(`/?onboarding_message=${encodeURIComponent(message)}`);
}

function redirectWithError(key: keyof typeof errorParams): never {
  redirect(`/?${errorParams[key]}`);
}

export async function createOrganizerTeam(formData: FormData) {
  const input = validateOrganizerTeamInput({
    teamName: String(formData.get("teamName") ?? ""),
    sportType: String(formData.get("sportType") ?? "")
  });

  if (!input.ok) {
    redirectWithMessage(input.message);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithError("auth");
  }

  const { error: profileError } = await upsertOwnProfile(supabase, user);

  if (profileError) {
    redirectWithError("profile");
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: input.teamName,
      sport_type: input.sportType,
      created_by: user.id
    })
    .select("id")
    .single();

  if (teamError || !team) {
    redirectWithError("team");
  }

  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: user.id,
    role: "owner"
  });

  if (memberError) {
    redirectWithError("member");
  }

  redirect("/");
}

export async function joinTeamByInvite(formData: FormData) {
  const input = validateJoinTeamInput({
    inviteCode: String(formData.get("inviteCode") ?? "")
  });

  if (!input.ok) {
    redirectWithMessage(input.message);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirectWithError("auth");
  }

  const { error: profileError } = await upsertOwnProfile(supabase, user);

  if (profileError) {
    redirectWithError("profile");
  }

  const { error } = await supabase.rpc("join_team_by_invite_code", {
    input_invite_code: input.inviteCode
  });

  if (error) {
    redirectWithError("join");
  }

  redirect("/");
}
