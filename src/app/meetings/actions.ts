"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    .select("role, teams(id)")
    .eq("profile_id", user.id)
    .in("role", ["owner", "manager"])
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  type TeamRecord = { id: string };
  const typedMembership = membership as
    | {
        role?: string;
        teams?: TeamRecord | TeamRecord[] | null;
      }
    | null;
  const joinedTeam = Array.isArray(typedMembership?.teams)
    ? typedMembership?.teams[0]
    : typedMembership?.teams;

  return {
    supabase,
    user,
    team: joinedTeam ? { id: joinedTeam.id, role: typedMembership?.role ?? "member" } : null
  };
}

export async function createMeeting(formData: FormData) {
  const input = readMeetingForm(formData);

  if (!input.ok) {
    redirectWithMeetingMessage(input.message, "/meetings/new");
  }

  const { supabase, user, team } = await getCurrentUserAndTeam();

  if (!user) {
    redirectWithMeetingError("auth", "/meetings/new");
  }

  if (!team) {
    redirectWithMeetingError("permission", "/meetings/new");
  }

  const baseMeeting = {
    team_id: team.id,
    title: input.title,
    starts_at: input.startsAt,
    capacity: input.capacity,
    attendance_method: input.attendanceMethod,
    attendance_closes_at: input.attendanceClosesAt,
    created_by: user.id
  };

  const { error } = await supabase.from("matches").insert({
    ...baseMeeting,
    location_note: input.locationNote,
    memo: input.memo,
    allow_waitlist: input.allowWaitlist
  });

  if (error && isSchemaColumnError(error)) {
    console.warn("[meetings:create] Retrying with base matches schema.", error);
    const { error: fallbackError } = await supabase.from("matches").insert(baseMeeting);

    if (!fallbackError) {
      revalidatePath("/");
      redirectWithMeetingMessage("모임을 만들었습니다.");
    }

    console.error("[meetings:create] Base schema insert failed.", fallbackError);
    redirectWithMeetingError("create", "/meetings/new");
  }

  if (error) {
    console.error("[meetings:create] Insert failed.", error);
    redirectWithMeetingError("create", "/meetings/new");
  }

  revalidatePath("/");
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
      revalidatePath("/");
      revalidatePath(`/meetings/${meetingId}/edit`);
      redirectWithMeetingMessage("모임 정보를 수정했습니다.");
    }

    console.error("[meetings:update] Base schema update failed.", fallbackError);
    redirectWithMeetingError("update", `/meetings/${meetingId}/edit`);
  }

  if (error) {
    console.error("[meetings:update] Update failed.", error);
    redirectWithMeetingError("update", `/meetings/${meetingId}/edit`);
  }

  revalidatePath("/");
  revalidatePath(`/meetings/${meetingId}/edit`);
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

  revalidatePath("/");
  redirectWithMeetingMessage("모임을 삭제했습니다.");
}
