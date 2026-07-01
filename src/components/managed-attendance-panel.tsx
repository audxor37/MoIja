"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { performUpdateManagedAttendance } from "@/app/meetings/actions";
import { buildAttendanceSummary, type AttendanceStatus } from "@/lib/attendance";
import { queryKeys } from "@/lib/query-keys";

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
  const [members, setMembers] = useState(initialMembers);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

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
      setMessage(result.message);
      setMessageTone(result.ok ? "success" : "error");

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
      setMessage("출석 상태 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setMessageTone("error");
    }
  });

  return (
    <article className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">운영자 출석 관리</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
            참석 신청과 실제 출석 처리를 분리해 관리합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm font-bold sm:grid-cols-4">
          <StatusPill label="응답률" value={`${summary.responseRate}%`} />
          <StatusPill label="미응답" value={`${summary.unansweredCount}명`} />
          <StatusPill label="대기" value={`${summary.waitlistedCount}명`} />
          <StatusPill label="확정 필요" value={`${summary.confirmationNeededCount}명`} />
        </div>
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

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <AttendanceGroup title="참석 예정" status="attending" members={members} meetingId={meetingId} mutation={mutation} />
        <AttendanceGroup title="대기" status="waitlisted" members={members} meetingId={meetingId} mutation={mutation} />
        <AttendanceGroup title="불참" status="absent" members={members} meetingId={meetingId} mutation={mutation} />
        <AttendanceGroup title="미응답" status={null} members={members} meetingId={meetingId} mutation={mutation} />
        <AttendanceGroup title="노쇼" status="no_show" members={members} meetingId={meetingId} mutation={mutation} />
      </div>
    </article>
  );
}

function AttendanceGroup({
  title,
  status,
  members,
  meetingId,
  mutation
}: {
  title: string;
  status: AttendanceStatus | null;
  members: ManagedAttendanceMember[];
  meetingId: string;
  mutation: ReturnType<typeof useMutation<Awaited<ReturnType<typeof performUpdateManagedAttendance>>, Error, { profileId: string; status: AttendanceStatus }>>;
}) {
  const filteredMembers = members.filter((member) => (member.attendance?.status ?? null) === status);

  return (
    <section className="rounded-xl border border-line bg-surfaceAlt p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-secondary">{filteredMembers.length}명</span>
      </div>
      <div className="mt-3 grid gap-2">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div className="rounded-xl bg-white px-3 py-3" key={member.profileId}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{member.nickname}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{member.role}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {status !== "attending" ? (
                    <AttendanceActionButton meetingId={meetingId} profileId={member.profileId} status="attending" label="확정" mutation={mutation} />
                  ) : null}
                  {status !== "no_show" ? (
                    <AttendanceActionButton meetingId={meetingId} profileId={member.profileId} status="no_show" label="노쇼" danger mutation={mutation} />
                  ) : null}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl bg-white px-3 py-4 text-sm font-semibold text-muted">해당 멤버가 없습니다.</p>
        )}
      </div>
    </section>
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
      className={`h-9 rounded-lg px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
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

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surfaceAlt px-3 py-3">
      <span className="text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
