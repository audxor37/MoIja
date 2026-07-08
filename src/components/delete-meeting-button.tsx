"use client";

import { Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performDeleteMeeting } from "@/app/meetings/actions";
import { PendingButtonContent } from "@/components/pending-ui";
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      return performDeleteMeeting(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });

      if (result.ok) {
        setIsConfirmOpen(false);
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
    <>
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#FFD7D7] bg-white px-4 text-sm font-bold text-danger transition hover:bg-[#FFF1F1] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={mutation.isPending}
        onClick={() => setIsConfirmOpen(true)}
        type="button"
      >
        <Trash2 size={16} />
        경기 삭제
      </button>
      {isConfirmOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 px-3 py-4 sm:place-items-center" role="dialog" aria-modal="true">
          <section className="w-full max-w-md rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-danger">위험 액션</p>
                <h2 className="mt-1 text-lg font-bold">경기를 삭제할까요?</h2>
                <p className="mt-2 text-sm font-semibold text-secondary">삭제 후 되돌릴 수 없습니다.</p>
              </div>
              <button
                aria-label="삭제 확인 닫기"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-surfaceAlt text-secondary"
                onClick={() => setIsConfirmOpen(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="inline-flex h-12 items-center justify-center rounded-xl bg-surfaceAlt px-4 text-sm font-bold text-secondary"
                onClick={() => setIsConfirmOpen(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-danger px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
                type="button"
              >
                <Trash2 size={16} />
                <PendingButtonContent pending={mutation.isPending} pendingLabel="삭제 중">
                  삭제
                </PendingButtonContent>
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
