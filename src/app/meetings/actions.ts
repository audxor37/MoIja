"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canSubmitAttendanceResponse,
  shouldWriteAttendanceEvent,
  validateOperatorAttendanceStatus,
  validateAttendanceResponseStatus,
  type AttendanceStatus
} from "@/lib/attendance";
import type { ActionResult } from "@/lib/action-result";
import { canManageMeeting, validateMeetingInput } from "@/lib/meetings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const meetingErrorParams: Record<string, string> = {
  auth: "meeting_error=auth_required",
  permission: "meeting_error=permission_denied",
  create: "meeting_error=create_failed",
  update: "meeting_error=update_failed",
  delete: "meeting_error=delete_failed",
  missing: "meeting_error=missing_meeting"
};

const attendanceErrorParams: Record<string, string> = {
  auth: "attendance_error=auth_required",
  invalid: "attendance_error=invalid_status",
  missing: "attendance_error=missing_meeting",
  permission: "attendance_error=permission_denied",
  save: "attendance_error=save_failed"
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

function redirectWithAttendanceError(key: keyof typeof attendanceErrorParams, meetingId: string): never {
  redirect(`/meetings/${meetingId}?${attendanceErrorParams[key]}`);
}

function redirectWithAttendanceMessage(message: string, meetingId: string): never {
  redirect(`/meetings/${meetingId}?attendance_message=${encodeURIComponent(message)}`);
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

async function getMeetingManagementContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  meetingId: string
) {
  const { data: meeting } = await supabase
    .from("matches")
    .select("id, team_id, created_by")
    .eq("id", meetingId)
    .maybeSingle();

  const currentMeeting = meeting as { id: string; team_id: string; created_by: string | null } | null;

  if (!currentMeeting) {
    return { meeting: null, role: null, canManage: false };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", currentMeeting.team_id)
    .eq("profile_id", userId)
    .maybeSingle();

  const role = (membership as { role?: string } | null)?.role ?? null;

  return {
    meeting: currentMeeting,
    role,
    canManage: canManageMeeting({
      currentUserId: userId,
      createdBy: currentMeeting.created_by,
      role
    })
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

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    redirectWithMeetingError("auth", `/meetings/${meetingId}/edit`);
  }

  const { meeting, canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!meeting) {
    redirectWithMeetingError("missing");
  }

  if (!canManage) {
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
    .eq("team_id", meeting.team_id);

  if (error && isSchemaColumnError(error)) {
    console.warn("[meetings:update] Retrying with base matches schema.", error);
    const { error: fallbackError } = await supabase
      .from("matches")
      .update(baseMeeting)
      .eq("id", meetingId)
      .eq("team_id", meeting.team_id);

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
  const result = await performDeleteMeeting(formData);

  if (!result.ok) {
    redirectWithMeetingError(result.code as keyof typeof meetingErrorParams);
  }

  revalidatePath("/");
  redirectWithMeetingMessage(result.message);
}

export async function performDeleteMeeting(formData: FormData): Promise<ActionResult<{ meetingId: string; teamId: string }>> {
  const meetingId = formValue(formData, "meetingId");

  if (!meetingId) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { meeting, canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!meeting) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  if (!canManage) {
    return { ok: false, code: "permission", message: "모임을 관리할 Owner 또는 Manager 권한이 필요합니다." };
  }

  const { error } = await supabase.from("matches").delete().eq("id", meetingId).eq("team_id", meeting.team_id);

  if (error) {
    console.error("[meetings:delete] Delete failed.", error);
    return { ok: false, code: "delete", message: "모임 삭제에 실패했습니다." };
  }

  return { ok: true, message: "모임을 삭제했습니다.", data: { meetingId, teamId: meeting.team_id } };
}

export async function respondToMeetingAttendance(formData: FormData) {
  const result = await performRespondToMeetingAttendance(formData);
  const meetingId = formValue(formData, "meetingId");

  if (!result.ok) {
    redirectWithAttendanceError(result.code as keyof typeof attendanceErrorParams, meetingId);
  }

  redirectWithAttendanceMessage(result.message, meetingId);
}

export async function performRespondToMeetingAttendance(
  formData: FormData
): Promise<ActionResult<{ meetingId: string; status: AttendanceStatus }>> {
  const meetingId = formValue(formData, "meetingId");
  const nextStatus = validateAttendanceResponseStatus(formValue(formData, "status"));

  if (!meetingId) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  if (!nextStatus) {
    return { ok: false, code: "invalid", message: "참석 응답 값을 다시 확인해 주세요." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const { data: meeting } = await supabase
    .from("matches")
    .select("id, allow_waitlist")
    .eq("id", meetingId)
    .maybeSingle();

  if (!meeting) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  const currentMeeting = meeting as { id: string; allow_waitlist: boolean | null };

  if (!canSubmitAttendanceResponse(nextStatus, currentMeeting.allow_waitlist ?? true)) {
    return { ok: false, code: "invalid", message: "참석 응답 값을 다시 확인해 주세요." };
  }

  const { data: existing } = await supabase
    .from("match_attendances")
    .select("id, status")
    .eq("match_id", meetingId)
    .eq("profile_id", user.id)
    .maybeSingle();
  const previousStatus = (existing as { id: string; status: AttendanceStatus } | null)?.status ?? null;

  const { data: attendance, error: attendanceError } = await supabase
    .from("match_attendances")
    .upsert(
      {
        match_id: meetingId,
        profile_id: user.id,
        status: nextStatus
      },
      { onConflict: "match_id,profile_id" }
    )
    .select("id")
    .single();

  if (attendanceError || !attendance) {
    console.error("[attendance:respond] Upsert failed.", attendanceError);
    return { ok: false, code: "save", message: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (shouldWriteAttendanceEvent(previousStatus, nextStatus)) {
    const { error: eventError } = await supabase.from("attendance_events").insert({
      attendance_id: attendance.id,
      previous_status: previousStatus,
      next_status: nextStatus,
      changed_by: user.id
    });

    if (eventError) {
      console.error("[attendance:respond] Event insert failed.", eventError);
      return { ok: false, code: "save", message: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }
  }

  return { ok: true, message: "참석 응답을 저장했습니다.", data: { meetingId, status: nextStatus } };
}

export async function updateManagedAttendance(formData: FormData) {
  const result = await performUpdateManagedAttendance(formData);
  const meetingId = formValue(formData, "meetingId");

  if (!result.ok) {
    redirectWithAttendanceError(result.code as keyof typeof attendanceErrorParams, meetingId);
  }

  revalidatePath("/");
  revalidatePath(`/meetings/${meetingId}`);
  redirectWithAttendanceMessage(result.message, meetingId);
}

export async function performUpdateManagedAttendance(
  formData: FormData
): Promise<ActionResult<{ meetingId: string; profileId: string; status: AttendanceStatus }>> {
  const meetingId = formValue(formData, "meetingId");
  const profileId = formValue(formData, "profileId");
  const nextStatus = validateOperatorAttendanceStatus(formValue(formData, "status"));

  if (!meetingId) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  if (!profileId || !nextStatus) {
    return { ok: false, code: "invalid", message: "참석 응답 값을 다시 확인해 주세요." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const { meeting, canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!meeting) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  if (!canManage) {
    return { ok: false, code: "permission", message: "출석을 관리할 Owner 또는 Manager 권한이 필요합니다." };
  }

  const { data: existing } = await supabase
    .from("match_attendances")
    .select("id, status")
    .eq("match_id", meetingId)
    .eq("profile_id", profileId)
    .maybeSingle();
  const previousStatus = (existing as { id: string; status: AttendanceStatus } | null)?.status ?? null;

  const { data: attendance, error: attendanceError } = await supabase
    .from("match_attendances")
    .upsert(
      {
        match_id: meetingId,
        profile_id: profileId,
        status: nextStatus
      },
      { onConflict: "match_id,profile_id" }
    )
    .select("id")
    .single();

  if (attendanceError || !attendance) {
    console.error("[attendance:manage] Upsert failed.", attendanceError);
    return { ok: false, code: "save", message: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (shouldWriteAttendanceEvent(previousStatus, nextStatus)) {
    const { error: eventError } = await supabase.from("attendance_events").insert({
      attendance_id: attendance.id,
      previous_status: previousStatus,
      next_status: nextStatus,
      changed_by: user.id
    });

    if (eventError) {
      console.error("[attendance:manage] Event insert failed.", eventError);
      return { ok: false, code: "save", message: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }
  }

  return {
    ok: true,
    message: nextStatus === "no_show" ? "노쇼 처리했습니다." : "출석 상태를 확정했습니다.",
    data: { meetingId, profileId, status: nextStatus }
  };
}
