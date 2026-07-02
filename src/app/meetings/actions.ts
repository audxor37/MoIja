"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  shouldWriteAttendanceEvent,
  validateOperatorAttendanceStatus,
  validateAttendanceResponseStatus,
  type AttendanceStatus
} from "@/lib/attendance";
import type { ActionResult } from "@/lib/action-result";
import {
  buildCreateMatchWithDefaultAttendancesRpcArgs,
  buildRespondToMeetingAttendanceRpcArgs,
  mapRespondToMeetingAttendanceRpcError
} from "@/lib/meeting-actions";
import {
  normalizeNullableText,
  parseNonNegativeInteger,
  validateGuestOperatorStatus,
  validateGuestResponseStatus,
  validateMatchResult
} from "@/lib/match-cycle";
import { canManageMeeting, validateMeetingInput } from "@/lib/meetings";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
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

function makeInviteCode(length = 10) {
  return crypto.randomUUID().replace(/-/g, "").slice(0, length).toUpperCase();
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
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    return { supabase, user: null, team: null };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role, teams(id)")
    .eq("profile_id", userId)
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
    user: { id: userId },
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

  const { error: rpcError } = await supabase.rpc(
    "create_match_with_default_attendances",
    buildCreateMatchWithDefaultAttendancesRpcArgs(input)
  );

  if (!rpcError) {
    revalidatePath("/");
    redirectWithMeetingMessage("모임을 만들었습니다.");
  }

  console.warn("[meetings:create] RPC unavailable; falling back to direct insert.", rpcError);

  const { data: createdMeeting, error } = await supabase
    .from("matches")
    .insert({
      ...baseMeeting,
      location_note: input.locationNote,
      memo: input.memo,
      allow_waitlist: input.allowWaitlist
    })
    .select("id")
    .single();

  if (error && isSchemaColumnError(error)) {
    console.warn("[meetings:create] Retrying with base matches schema.", error);
    const { data: fallbackMeeting, error: fallbackError } = await supabase
      .from("matches")
      .insert(baseMeeting)
      .select("id")
      .single();

    if (!fallbackError) {
      if (fallbackMeeting?.id) {
        await createDefaultMemberAttendances(supabase, team.id, fallbackMeeting.id);
      }
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

  if (createdMeeting?.id) {
    await createDefaultMemberAttendances(supabase, team.id, createdMeeting.id);
  }

  revalidatePath("/");
  redirectWithMeetingMessage("모임을 만들었습니다.");
}

async function createDefaultMemberAttendances(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  teamId: string,
  meetingId: string
) {
  const { data: members } = await supabase.from("team_members").select("profile_id").eq("team_id", teamId);
  const rows = ((members ?? []) as { profile_id: string }[]).map((member) => ({
    match_id: meetingId,
    profile_id: member.profile_id,
    status: "attending"
  }));

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("match_attendances").upsert(rows, { onConflict: "match_id,profile_id" });

  if (error) {
    console.error("[meetings:create] Default attendance insert failed.", error);
  }
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
  const { data, error } = await supabase.rpc(
    "respond_to_meeting_attendance",
    buildRespondToMeetingAttendanceRpcArgs({ meetingId, status: nextStatus })
  );

  if (error || data !== nextStatus) {
    const code = mapRespondToMeetingAttendanceRpcError(error);
    if (code === "auth") {
      return { ok: false, code, message: "로그인이 필요합니다. 다시 로그인해 주세요." };
    }

    if (code === "missing") {
      return { ok: false, code, message: "모임 정보를 찾지 못했습니다." };
    }

    if (code === "invalid") {
      return { ok: false, code, message: "참석 응답 값을 다시 확인해 주세요." };
    }

    console.error("[attendance:respond] RPC failed.", error);
    return { ok: false, code, message: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." };
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

export async function performCreateMatchInvite(
  formData: FormData
): Promise<ActionResult<{ meetingId: string; inviteCode: string }>> {
  const meetingId = formValue(formData, "meetingId");

  if (!meetingId) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { meeting, canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!meeting || !canManage) {
    return { ok: false, code: "permission", message: "용병 초대를 만들 권한이 필요합니다." };
  }

  const inviteCode = makeInviteCode();
  const { error } = await supabase.from("match_invites").insert({
    match_id: meetingId,
    code: inviteCode,
    created_by: user.id,
    default_status: "invited"
  });

  if (error) {
    console.error("[match-invites:create] Insert failed.", error);
    return { ok: false, code: "save", message: "용병 초대코드 생성에 실패했습니다." };
  }

  return { ok: true, message: "용병 초대코드를 만들었습니다.", data: { meetingId, inviteCode } };
}

export async function performAddGuestToMatch(
  formData: FormData
): Promise<ActionResult<{ meetingId: string; guestId: string; status: string }>> {
  const meetingId = formValue(formData, "meetingId");
  const displayName = normalizeNullableText(formValue(formData, "displayName"));

  if (!meetingId || !displayName) {
    return { ok: false, code: "invalid", message: "용병 이름을 입력해 주세요." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!canManage) {
    return { ok: false, code: "permission", message: "용병을 추가할 권한이 필요합니다." };
  }

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .insert({ display_name: displayName, created_by: user.id })
    .select("id")
    .single();

  if (guestError || !guest) {
    console.error("[guests:add] Guest insert failed.", guestError);
    return { ok: false, code: "save", message: "용병 저장에 실패했습니다." };
  }

  const { error } = await supabase.from("match_guests").insert({
    match_id: meetingId,
    guest_id: (guest as { id: string }).id,
    status: "accepted"
  });

  if (error) {
    console.error("[guests:add] Match guest insert failed.", error);
    return { ok: false, code: "save", message: "용병 참석 등록에 실패했습니다." };
  }

  return { ok: true, message: "용병을 참석자로 추가했습니다.", data: { meetingId, guestId: (guest as { id: string }).id, status: "accepted" } };
}

export async function performUpdateGuestAttendance(
  formData: FormData
): Promise<ActionResult<{ meetingId: string; matchGuestId: string; status: string }>> {
  const meetingId = formValue(formData, "meetingId");
  const matchGuestId = formValue(formData, "matchGuestId");
  const nextStatus = validateGuestOperatorStatus(formValue(formData, "status"));

  if (!meetingId || !matchGuestId || !nextStatus) {
    return { ok: false, code: "invalid", message: "용병 출석 값을 다시 확인해 주세요." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!canManage) {
    return { ok: false, code: "permission", message: "용병 출석을 관리할 권한이 필요합니다." };
  }

  const { error } = await supabase
    .from("match_guests")
    .update({
      status: nextStatus,
      confirmed_by: ["confirmed", "no_show"].includes(nextStatus) ? user.id : null
    })
    .eq("id", matchGuestId)
    .eq("match_id", meetingId);

  if (error) {
    console.error("[guests:attendance] Update failed.", error);
    return { ok: false, code: "save", message: "용병 출석 저장에 실패했습니다." };
  }

  return { ok: true, message: "용병 출석을 저장했습니다.", data: { meetingId, matchGuestId, status: nextStatus } };
}

export async function performRespondToGuestInvite(
  formData: FormData
): Promise<ActionResult<{ matchGuestId: string; status: string }>> {
  const matchGuestId = formValue(formData, "matchGuestId");
  const nextStatus = validateGuestResponseStatus(formValue(formData, "status"));

  if (!matchGuestId || !nextStatus) {
    return { ok: false, code: "invalid", message: "참석 응답 값을 다시 확인해 주세요." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("match_guests").update({ status: nextStatus }).eq("id", matchGuestId);

  if (error) {
    return { ok: false, code: "save", message: "용병 참석 응답 저장에 실패했습니다." };
  }

  return { ok: true, message: "용병 참석 응답을 저장했습니다.", data: { matchGuestId, status: nextStatus } };
}

export async function performSaveLineup(formData: FormData): Promise<ActionResult<{ meetingId: string }>> {
  const meetingId = formValue(formData, "meetingId");
  const formation = normalizeNullableText(formValue(formData, "formation")) ?? "2-2";
  const boardNote = normalizeNullableText(formValue(formData, "boardNote"));
  const playerPayload = normalizeNullableText(formValue(formData, "players"));

  if (!meetingId) {
    return { ok: false, code: "missing", message: "모임 정보를 찾지 못했습니다." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { meeting, role } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!meeting || !["owner", "manager", "coach"].includes(role ?? "")) {
    return { ok: false, code: "permission", message: "라인업을 저장할 권한이 필요합니다." };
  }

  const { data: lineup, error: lineupError } = await supabase
    .from("match_lineups")
    .upsert(
      {
        match_id: meetingId,
        formation,
        board_note: boardNote,
        updated_by: user.id
      },
      { onConflict: "match_id" }
    )
    .select("id")
    .single();

  if (lineupError || !lineup) {
    console.error("[lineup:save] Upsert failed.", lineupError);
    return { ok: false, code: "save", message: "라인업 저장에 실패했습니다." };
  }

  const lineupId = (lineup as { id: string }).id;
  const parsedPlayers = playerPayload ? parseLineupPlayers(playerPayload, lineupId) : [];
  await supabase.from("match_lineup_players").delete().eq("lineup_id", lineupId);

  if (parsedPlayers.length > 0) {
    const { error: playersError } = await supabase.from("match_lineup_players").insert(parsedPlayers);

    if (playersError) {
      console.error("[lineup:save] Player insert failed.", playersError);
      return { ok: false, code: "save", message: "라인업 선수 저장에 실패했습니다." };
    }
  }

  return { ok: true, message: "라인업을 저장했습니다.", data: { meetingId } };
}

function parseLineupPlayers(payload: string, lineupId: string) {
  try {
    const parsed = JSON.parse(payload) as Array<Record<string, unknown>>;
    return parsed.map((player, index) => {
      const kind = player.playerKind === "guest" ? "guest" : "member";
      return {
        lineup_id: lineupId,
        profile_id: kind === "member" ? String(player.profileId ?? "") || null : null,
        guest_id: kind === "guest" ? String(player.guestId ?? "") || null : null,
        display_name: String(player.displayName ?? "이름 없음"),
        player_kind: kind,
        position_code: normalizeNullableText(String(player.positionCode ?? "")),
        squad_label: normalizeNullableText(String(player.squadLabel ?? "")),
        x_percent: Math.min(Math.max(parseNonNegativeInteger(String(player.xPercent ?? "50")), 0), 100),
        y_percent: Math.min(Math.max(parseNonNegativeInteger(String(player.yPercent ?? "50")), 0), 100),
        is_starter: player.isStarter !== false,
        sort_order: index
      };
    });
  } catch {
    return [];
  }
}

export async function performSaveMatchRecord(formData: FormData): Promise<ActionResult<{ meetingId: string }>> {
  const meetingId = formValue(formData, "meetingId");
  const result = validateMatchResult(formValue(formData, "result"));
  const goalsFor = parseNonNegativeInteger(formValue(formData, "goalsFor"));
  const goalsAgainst = parseNonNegativeInteger(formValue(formData, "goalsAgainst"));
  const opponentName = normalizeNullableText(formValue(formData, "opponentName"));
  const formation = normalizeNullableText(formValue(formData, "formation"));
  const memo = normalizeNullableText(formValue(formData, "memo"));
  const playerPayload = normalizeNullableText(formValue(formData, "playerRecords"));

  if (!meetingId || !result) {
    return { ok: false, code: "invalid", message: "경기 결과 값을 다시 확인해 주세요." };
  }

  const { supabase, user } = await getCurrentUserAndTeam();

  if (!user) {
    return { ok: false, code: "auth", message: "로그인이 필요합니다." };
  }

  const { canManage } = await getMeetingManagementContext(supabase, user.id, meetingId);

  if (!canManage) {
    return { ok: false, code: "permission", message: "경기 기록을 저장할 권한이 필요합니다." };
  }

  const { error } = await supabase.from("match_records").upsert(
    {
      match_id: meetingId,
      result,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
      opponent_name: opponentName,
      formation,
      memo,
      recorded_by: user.id
    },
    { onConflict: "match_id" }
  );

  if (error) {
    console.error("[match-record:save] Upsert failed.", error);
    return { ok: false, code: "save", message: "경기 기록 저장에 실패했습니다." };
  }

  const playerRecords = playerPayload ? parsePlayerRecords(playerPayload, meetingId) : [];
  await supabase.from("player_match_records").delete().eq("match_id", meetingId);

  if (playerRecords.length > 0) {
    const { error: playersError } = await supabase.from("player_match_records").insert(playerRecords);

    if (playersError) {
      console.error("[match-record:save] Player insert failed.", playersError);
      return { ok: false, code: "save", message: "개인 기록 저장에 실패했습니다." };
    }
  }

  return { ok: true, message: "경기 기록을 저장했습니다.", data: { meetingId } };
}

function parsePlayerRecords(payload: string, meetingId: string) {
  try {
    const parsed = JSON.parse(payload) as Array<Record<string, unknown>>;
    return parsed.map((player) => {
      const kind = player.playerKind === "guest" ? "guest" : "member";
      return {
        match_id: meetingId,
        profile_id: kind === "member" ? String(player.profileId ?? "") || null : null,
        guest_id: kind === "guest" ? String(player.guestId ?? "") || null : null,
        goals: parseNonNegativeInteger(String(player.goals ?? "0")),
        assists: parseNonNegativeInteger(String(player.assists ?? "0")),
        is_mvp: player.isMvp === true,
        position_code: normalizeNullableText(String(player.positionCode ?? "")),
        lineup_slot: normalizeNullableText(String(player.lineupSlot ?? "")),
        note: normalizeNullableText(String(player.note ?? ""))
      };
    });
  } catch {
    return [];
  }
}
