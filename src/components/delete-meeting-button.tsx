"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performDeleteMeeting } from "@/app/meetings/actions";
import { queryKeys } from "@/lib/query-keys";

export function DeleteMeetingButton({ meetingId, onDeleted }: { meetingId: string; onDeleted?: (meetingId: string) => void }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      return performDeleteMeeting(formData);
    },
    onSuccess: (result) => {
      setMessage(result.message);
      setMessageTone(result.ok ? "success" : "error");

      if (result.ok) {
        onDeleted?.(result.data.meetingId);
        void queryClient.invalidateQueries({ queryKey: queryKeys.events(result.data.teamId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      }
    },
    onError: () => {
      setMessage("모임 삭제에 실패했습니다.");
      setMessageTone("error");
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
      {message ? (
        <p className={`text-xs font-bold ${messageTone === "success" ? "text-primary" : "text-danger"}`}>{message}</p>
      ) : null}
    </div>
  );
}
