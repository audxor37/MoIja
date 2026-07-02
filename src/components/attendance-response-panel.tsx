"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performRespondToMeetingAttendance } from "@/app/meetings/actions";
import {
  attendanceStatusLabel,
  canSubmitAttendanceResponse,
  type AttendanceStatus
} from "@/lib/attendance";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/toast-provider";

const responseOptions = [
  {
    status: "attending",
    label: "참석",
    description: "참석 예정",
    tone: "bg-primary text-white hover:bg-[#12843D]"
  },
  {
    status: "waitlisted",
    label: "대기",
    description: "정원 초과 시 대기",
    tone: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
  },
  {
    status: "absent",
    label: "불참",
    description: "이번 경기 불참",
    tone: "bg-surfaceAlt text-secondary hover:bg-line"
  }
] as const;

export function AttendanceResponsePanel({
  meetingId,
  allowWaitlist,
  initialStatus
}: {
  meetingId: string;
  allowWaitlist: boolean;
  initialStatus: AttendanceStatus | null;
}) {
  const queryClient = useQueryClient();
  const showToast = useToast();
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);

  const mutation = useMutation({
    mutationFn: async (nextStatus: AttendanceStatus) => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      formData.set("status", nextStatus);
      return performRespondToMeetingAttendance(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });

      if (result.ok) {
        setStatus(result.data.status);
        void queryClient.invalidateQueries({ queryKey: queryKeys.attendances(meetingId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      }
    },
    onError: () => {
      showToast({ message: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.", tone: "error" });
    }
  });

  const pendingStatus = useMemo(
    () => (mutation.isPending ? mutation.variables ?? null : null),
    [mutation.isPending, mutation.variables]
  );

  return (
    <article className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">내 참석 응답</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-secondary">
            현재 상태는 <span className="text-primary">{attendanceStatusLabel(status)}</span>입니다.
          </p>
        </div>
        <CheckCircle2 className="shrink-0 text-primary" size={22} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {responseOptions.map((option) => {
          const disabled = mutation.isPending || !canSubmitAttendanceResponse(option.status, allowWaitlist);
          return (
            <button
              className={`grid min-h-20 w-full min-w-0 content-start gap-1 rounded-xl px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-24 sm:px-4 ${option.tone} ${
                status === option.status ? "ring-4 ring-primary/20" : ""
              }`}
              disabled={disabled}
              key={option.status}
              onClick={() => mutation.mutate(option.status)}
              type="button"
            >
              <span className="truncate text-sm font-black sm:text-base">
                {pendingStatus === option.status ? "저장 중" : option.label}
              </span>
              <span className="text-xs font-semibold leading-4 opacity-80 sm:text-sm sm:leading-5">{option.description}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
