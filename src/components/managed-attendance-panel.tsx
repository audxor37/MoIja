"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performUpdateManagedAttendance } from "@/app/meetings/actions";
import { buildAttendanceSummary, type AttendanceStatus } from "@/lib/attendance";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/components/toast-provider";

export type ManagedAttendanceMember = {
  profileId: string;
  role: string;
  nickname: string;
  avatarUrl: string | null;
  attendance: {
    id: string;
    profile_id: string;
    status: AttendanceStatus;
    updated_at: string;
  } | null;
};

export function ManagedAttendancePanel({
  meetingId,
  capacity,
  initialMembers
}: {
  meetingId: string;
  capacity: number | null;
  initialMembers: ManagedAttendanceMember[];
}) {
  const queryClient = useQueryClient();
  const showToast = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [activeGroup, setActiveGroup] = useState<"unanswered" | "waitlisted" | "confirmation" | null>(null);

  const summary = useMemo(
    () =>
      buildAttendanceSummary(
        members.flatMap((member) => (member.attendance ? [{ status: member.attendance.status }] : [])),
        { teamMemberCount: members.length, capacity }
      ),
    [capacity, members]
  );

  const mutation = useMutation({
    mutationFn: async ({ profileId, status }: { profileId: string; status: AttendanceStatus }) => {
      const formData = new FormData();
      formData.set("meetingId", meetingId);
      formData.set("profileId", profileId);
      formData.set("status", status);
      return performUpdateManagedAttendance(formData);
    },
    onSuccess: (result) => {
      showToast({ message: result.message, tone: result.ok ? "success" : "error" });

      if (result.ok) {
        setMembers((current) =>
          current.map((member) =>
            member.profileId === result.data.profileId
              ? {
                  ...member,
                  attendance: {
                    id: member.attendance?.id ?? `${result.data.meetingId}:${result.data.profileId}`,
                    profile_id: result.data.profileId,
                    status: result.data.status,
                    updated_at: new Date().toISOString()
                  }
                }
              : member
          )
        );
        void queryClient.invalidateQueries({ queryKey: queryKeys.attendances(meetingId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      }
    },
    onError: () => {
      showToast({ message: "출석 상태 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.", tone: "error" });
    }
  });

  const unansweredMembers = members.filter((member) => !member.attendance?.status);
  const waitlistedMembers = members.filter((member) => member.attendance?.status === "waitlisted");
  const confirmationCandidates = [...waitlistedMembers, ...unansweredMembers];
  const activeMembers =
    activeGroup === "unanswered"
      ? unansweredMembers
      : activeGroup === "waitlisted"
        ? waitlistedMembers
        : activeGroup === "confirmation"
          ? confirmationCandidates
          : [];
  const activeTitle =
    activeGroup === "unanswered"
      ? "미응답"
      : activeGroup === "waitlisted"
        ? "대기"
        : activeGroup === "confirmation"
          ? "확정 필요"
          : "";

  return (
    <article className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">출석 운영</h2>
          <p className="mt-1 text-sm font-semibold leading-5 text-secondary">
            정원까지 {summary.confirmationNeededCount}명 부족 · 미응답 {summary.unansweredCount}명 · 대기 {summary.waitlistedCount}명
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm font-bold">
          <StatusCard label="미응답" value={`${summary.unansweredCount}명`} onClick={() => setActiveGroup("unanswered")} />
          <StatusCard label="대기" value={`${summary.waitlistedCount}명`} onClick={() => setActiveGroup("waitlisted")} />
          <StatusCard label="확정 필요" value={`${summary.confirmationNeededCount}명`} onClick={() => setActiveGroup("confirmation")} />
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-surfaceAlt px-3 py-2.5 text-xs font-bold text-secondary">
        응답률 {summary.responseRate}% · 참석 예정 {summary.attendingCount}명 · 불참 {summary.absentCount}명
      </div>

      {activeGroup ? (
        <AttendanceModal
          members={activeMembers}
          meetingId={meetingId}
          mutation={mutation}
          onClose={() => setActiveGroup(null)}
          title={activeTitle}
        />
      ) : null}
    </article>
  );
}

function AttendanceModal({
  title,
  members,
  meetingId,
  mutation,
  onClose
}: {
  title: string;
  members: ManagedAttendanceMember[];
  meetingId: string;
  mutation: ReturnType<typeof useMutation<Awaited<ReturnType<typeof performUpdateManagedAttendance>>, Error, { profileId: string; status: AttendanceStatus }>>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 px-3 py-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
      <section className="max-h-[82vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h3 className="font-bold">{title}</h3>
            <p className="mt-0.5 text-xs font-semibold text-muted">{members.length}명</p>
          </div>
          <button className="h-9 rounded-lg bg-surfaceAlt px-3 text-xs font-bold text-secondary" onClick={onClose} type="button">
            닫기
          </button>
        </div>
        <div className="grid max-h-[64vh] gap-2 overflow-y-auto p-3">
          {members.length === 0 ? (
            <p className="rounded-xl bg-surfaceAlt px-3 py-4 text-sm font-semibold text-muted">대상자가 없습니다.</p>
          ) : null}
          {members.map((member) => (
            <div className="rounded-xl bg-white px-3 py-2.5" key={member.profileId}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{member.nickname}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{member.role}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {member.attendance?.status !== "attending" ? (
                    <AttendanceActionButton meetingId={meetingId} profileId={member.profileId} status="attending" label="확정" mutation={mutation} />
                  ) : null}
                  {member.attendance?.status !== "no_show" ? (
                    <AttendanceActionButton meetingId={meetingId} profileId={member.profileId} status="no_show" label="노쇼" danger mutation={mutation} />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AttendanceActionButton({
  profileId,
  status,
  label,
  danger,
  mutation
}: {
  meetingId: string;
  profileId: string;
  status: AttendanceStatus;
  label: string;
  danger?: boolean;
  mutation: ReturnType<typeof useMutation<Awaited<ReturnType<typeof performUpdateManagedAttendance>>, Error, { profileId: string; status: AttendanceStatus }>>;
}) {
  const isPending = mutation.isPending && mutation.variables?.profileId === profileId && mutation.variables.status === status;

  return (
    <button
      className={`h-8 rounded-lg px-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:px-3 ${
        danger ? "border border-[#FFD7D7] bg-white text-danger hover:bg-[#FFF1F1]" : "bg-primary text-white hover:bg-[#12843D]"
      }`}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate({ profileId, status })}
      type="button"
    >
      {isPending ? "저장 중" : label}
    </button>
  );
}

function StatusCard({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button className="flex min-w-0 flex-col items-start rounded-xl bg-surfaceAlt px-3 py-2.5 text-left transition hover:bg-[#E8F7EE]" onClick={onClick} type="button">
      <span className="text-muted">{label}</span>
      <span className="mt-1 shrink-0 text-ink">{value}</span>
    </button>
  );
}
