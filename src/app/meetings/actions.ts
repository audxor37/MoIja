"use server";

import { redirect } from "next/navigation";
import {
  buildCreateMeetingRpcArgs,
  MANAGER_TEAM_MEMBERSHIP_SELECT,
  type ManagerTeamMembershipRow,
  toManagerTeam
} from "@/lib/meeting-actions";
import { validateMeetingInput } from "@/lib/meetings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const meetingErrorParams: Record<string, string> = {
  auth: "meeting_error=auth_required",
  permission: "meeting_error=permission_denied",
  create: "meeting_error=create_failed",
  update: "meeting_error=update_failed",
  delete: "meeting_error=delete_failed",
  missing: "meeting_error=missing_meeting"
};

function formValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function redirectWithMeetingError(key: keyof typeof meetingErrorParams, path = "/"): never {
  redirect(`${path}?${meetingErrorParams[key]}`);
}

function redirectWithMeetingMessage(message: string, path = "/"): never {
  redirect(`${path}?meeting_message=${encodeURIComponent(message)}`);
}

function readMeetingForm(formData: FormData) {
  return validateMeetingInput({
    title: formValue(formData, "title"),
    memo: formValue(formData, "memo"),
    startsOn: formValue(formData, "startsOn"),
    startsAt: formValue(formData, "startsAt"),
    placeName: formValue(formData, "placeName"),
    placeAddress: formValue(formData, "placeAddress"),
    capacity: formValue(formData, "capacity"),
    allowWaitlist: formValue(formData, "allowWaitlist"),
    deadlineHours: formValue(formData, "deadlineHours"),
    attendanceMethod: formValue(formData, "attendanceMethod")
  });
}

function isSchemaColumnError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /column|schema cache/i.test(error.message ?? "")
  );
}

function isAuthRequiredError(error: { code?: string; message?: string } | null) {
  return error?.code === "28000" || /auth|jwt|session/i.test(error?.message ?? "");
}

function isPermissionError(error: { code?: string; message?: string } | null) {
  return error?.code === "42501" || /permission|privilege|manager|owner/i.test(error?.message ?? "");
}

async function getCurrentUserAndTeam() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, team: null };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select(MANAGER_TEAM_MEMBERSHIP_SELECT)
    .eq("profile_id", user.id)
    .in("role", ["owner", "manager"])
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const team = toManagerTeam(membership as ManagerTeamMembershipRow | null);

  return {
    supabase,
    user,
    team
  };
}

export async function createMeeting(formData: FormData) {
  const input = readMeetingForm(formData);

  if (!input.ok) {
    redirectWithMeetingMessage(input.message, "/meetings/new");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_match_for_current_manager", buildCreateMeetingRpcArgs(input));

  if (isAuthRequiredError(error)) {
    redirectWithMeetingError("auth", "/meetings/new");
  }

  if (isPermissionError(error)) {
    redirectWithMeetingError("permission", "/meetings/new");
  }

  if (error) {
    console.error("[meetings:create] Insert failed.", error);
    redirectWithMeetingError("create", "/meetings/new");
  }

  redirectWithMeetingMessage("모임을 만들었습니다.");
}

export async function updateMeeting(formData: FormData) {
  const meetingId = formValue(formData, "meetingId");

  if (!meetingId) {
    redirectWithMeetingError("missing");
  }

  const input = readMeetingForm(formData);

  if (!input.ok) {
    redirectWithMeetingMessage(input.message, `/meetings/${meetingId}/edit`);
  }

  const { supabase, user, team } = await getCurrentUserAndTeam();

  if (!user) {
    redirectWithMeetingError("auth", `/meetings/${meetingId}/edit`);
  }

  if (!team) {
    redirectWithMeetingError("permission", `/meetings/${meetingId}/edit`);
  }

  const baseMeeting = {
    title: input.title,
    starts_at: input.startsAt,
    capacity: input.capacity,
    attendance_method: input.attendanceMethod,
    attendance_closes_at: input.attendanceClosesAt
  };

  const { error } = await supabase
    .from("matches")
    .update({
      ...baseMeeting,
      location_note: input.locationNote,
      memo: input.memo,
      allow_waitlist: input.allowWaitlist
    })
    .eq("id", meetingId)
    .eq("team_id", team.id);

  if (error && isSchemaColumnError(error)) {
    console.warn("[meetings:update] Retrying with base matches schema.", error);
    const { error: fallbackError } = await supabase
      .from("matches")
      .update(baseMeeting)
      .eq("id", meetingId)
      .eq("team_id", team.id);

    if (!fallbackError) {
      redirectWithMeetingMessage("모임 정보를 수정했습니다.");
    }

    console.error("[meetings:update] Base schema update failed.", fallbackError);
    redirectWithMeetingError("update", `/meetings/${meetingId}/edit`);
  }

  if (error) {
    console.error("[meetings:update] Update failed.", error);
    redirectWithMeetingError("update", `/meetings/${meetingId}/edit`);
  }

  redirectWithMeetingMessage("모임 정보를 수정했습니다.");
}

export async function deleteMeeting(formData: FormData) {
  const meetingId = formValue(formData, "meetingId");

  if (!meetingId) {
    redirectWithMeetingError("missing");
  }

  const { supabase, user, team } = await getCurrentUserAndTeam();

  if (!user) {
    redirectWithMeetingError("auth");
  }

  if (!team) {
    redirectWithMeetingError("permission");
  }

  const { error } = await supabase.from("matches").delete().eq("id", meetingId).eq("team_id", team.id);

  if (error) {
    console.error("[meetings:delete] Delete failed.", error);
    redirectWithMeetingError("delete");
  }

  redirectWithMeetingMessage("모임을 삭제했습니다.");
}
