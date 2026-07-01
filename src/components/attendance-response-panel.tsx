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

const responseOptions = [
  {
    status: "attending",
    label: "참석",
    description: "이 모임에 참석할 예정입니다.",
    tone: "bg-primary text-white hover:bg-[#12843D]"
  },
  {
    status: "waitlisted",
    label: "대기",
    description: "정원이 차면 대기자로 등록합니다.",
    tone: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
  },
  {
    status: "absent",
    label: "불참",
    description: "이번 모임에는 참석하지 않습니다.",
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
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const mutation = useMutation({
    mutationFn: async (nextStatus: AttendanceStatus) => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      formData.set("status", nextStatus);
      return performRespondToMeetingAttendance(formData);
    },
    onSuccess: (result) => {
      setMessage(result.message);
      setMessageTone(result.ok ? "success" : "error");

      if (result.ok) {
        setStatus(result.data.status);
        void queryClient.invalidateQueries({ queryKey: queryKeys.attendances(meetingId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      }
    },
    onError: () => {
      setMessage("참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageTone("error");
    }
  });

  const pendingStatus = useMemo(
    () => (mutation.isPending ? mutation.variables ?? null : null),
    [mutation.isPending, mutation.variables]
  );

  return (
    <article className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">내 참석 응답</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
            현재 상태는 <span className="text-primary">{attendanceStatusLabel(status)}</span>입니다.
          </p>
        </div>
        <CheckCircle2 className="shrink-0 text-primary" size={24} />
      </div>

      {message ? (
        <div
          className={`mt-5 rounded-2xl border px-5 py-4 text-sm font-semibold ${
            messageTone === "success"
              ? "border-[#BEE7C8] bg-[#F0FBF3] text-primary"
              : "border-[#FBD6A3] bg-[#FFF7E8] text-[#8A5200]"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {responseOptions.map((option) => {
          const disabled = mutation.isPending || !canSubmitAttendanceResponse(option.status, allowWaitlist);
          return (
            <button
              className={`grid min-h-28 w-full content-start gap-2 rounded-2xl px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${option.tone} ${
                status === option.status ? "ring-4 ring-primary/20" : ""
              }`}
              disabled={disabled}
              key={option.status}
              onClick={() => mutation.mutate(option.status)}
              type="button"
            >
              <span className="text-base font-black">
                {pendingStatus === option.status ? "저장 중" : option.label}
              </span>
              <span className="text-sm font-semibold leading-6 opacity-80">{option.description}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
