"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performDeleteMeeting } from "@/app/meetings/actions";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/toast-provider";

export function DeleteMeetingButton({
  meetingId,
  onDeleted,
  redirectTo
}: {
  meetingId: string;
  onDeleted?: (meetingId: string) => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      return performDeleteMeeting(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });

      if (result.ok) {
        onDeleted?.(result.data.meetingId);
        void queryClient.invalidateQueries({ queryKey: queryKeys.events(result.data.teamId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
        if (redirectTo) {
          router.push(redirectTo);
        }
      }
    },
    onError: () => {
      showToast({ message: "경기 삭제에 실패했습니다.", tone: "error" });
    }
  });

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#FFD7D7] bg-white px-4 text-sm font-bold text-danger transition hover:bg-[#FFF1F1] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
        type="button"
      >
        <Trash2 size={16} />
        {mutation.isPending ? "삭제 중" : "삭제"}
      </button>
    </div>
  );
}
