"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/toast-provider";

const routeMessageParams = [
  "meeting_message",
  "attendance_message",
  "team_message",
  "onboarding_message",
  "auth_error",
  "meeting_error",
  "attendance_error",
  "team_error",
  "onboarding_error",
  "error",
  "message"
] as const;

const routeMessages: Record<string, string> = {
  auth_required: "로그인이 필요합니다.",
  callback_failed: "카카오 로그인 처리 중 문제가 발생했습니다. Supabase와 Kakao 설정을 확인해 주세요.",
  delete_failed: "모임 삭제에 실패했습니다.",
  invalid: "요청 값이 올바르지 않습니다.",
  invalid_status: "참석 응답 값을 다시 확인해 주세요.",
  kakao_start_failed: "카카오 로그인 주소를 만들지 못했습니다. Kakao provider 설정을 확인해 주세요.",
  missing: "멤버를 찾지 못했습니다.",
  missing_code: "로그인 인증 코드가 전달되지 않았습니다. 다시 시도해 주세요.",
  missing_meeting: "모임 정보를 찾지 못했습니다.",
  owner_member_failed: "팀은 생성됐지만 운영자 권한 연결에 실패했습니다. team_members RLS를 확인해 주세요.",
  permission: "팀을 관리할 Owner 또는 Manager 권한이 필요합니다.",
  permission_denied: "권한이 필요합니다.",
  create_failed: "모임 저장에 실패했습니다. 입력값과 Supabase 스키마를 확인해 주세요.",
  update_failed: "모임 수정에 실패했습니다.",
  join_failed: "초대 코드로 팀에 참여하지 못했습니다.",
  profile_failed: "프로필 저장에 실패했습니다.",
  save_failed: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  save: "변경 내용을 저장하지 못했습니다.",
  supabase_env_missing: "Supabase 환경 변수가 아직 설정되지 않았습니다. .env.local을 먼저 준비해 주세요.",
  team_create_failed: "팀 저장에 실패했습니다.",
  user_missing: "로그인 세션을 확인하지 못했습니다. 다시 시도해 주세요.",
  role_updated: "권한을 변경했습니다.",
  invite_regenerated: "초대 코드를 다시 만들었습니다."
};

export function RouteQueryInvalidator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const showToast = useToast();

  useEffect(() => {
    const hasMeetingChange = searchParams.has("meeting_message") || searchParams.has("attendance_message");
    const hasTeamChange = searchParams.has("team_message");

    if (hasMeetingChange) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });

      if (pathname.startsWith("/meetings/")) {
        const meetingId = pathname.split("/")[2];
        if (meetingId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.attendances(meetingId) });
        }
      }
    }

    if (hasTeamChange) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myTeams });
    }

    for (const param of routeMessageParams) {
      const value = searchParams.get(param);
      if (!value) continue;

      showToast({
        message: routeMessages[value] ?? value,
        tone: param.includes("error") ? "error" : "success"
      });
      break;
    }
  }, [pathname, queryClient, searchParams, showToast]);

  return null;
}
