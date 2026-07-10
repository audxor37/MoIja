"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Timer } from "lucide-react";
import { RoutePendingLink } from "@/components/pending-ui";
import type { DashboardMeeting } from "@/lib/dashboard-session";
import {
  filterDashboardMeetings,
  getMeetingFocusMetrics,
  meetingListFilters,
  type DashboardTone,
  type MeetingListFilter
} from "@/lib/dashboard-ux";
import { formatMeetingDateTime } from "@/lib/meetings";

export type DashboardMeetingListProps = {
  meetings: DashboardMeeting[];
  emptyState: "operator" | "member";
  selectFirst?: boolean;
};

export function DashboardMeetingList({ meetings, emptyState, selectFirst = false }: DashboardMeetingListProps) {
  const [activeFilter, setActiveFilter] = useState<MeetingListFilter>("upcoming");
  const [isPending, startTransition] = useTransition();
  const filteredMeetings = useMemo(() => filterDashboardMeetings(meetings, activeFilter), [activeFilter, meetings]);

  return (
    <>
      <MeetingFilterBar
        activeFilter={activeFilter}
        isPending={isPending}
        onChange={(nextFilter) => {
          startTransition(() => setActiveFilter(nextFilter));
        }}
      />
      <div aria-busy={isPending} className={`mt-4 grid gap-3 transition ${isPending ? "opacity-70" : "opacity-100"}`}>
        {filteredMeetings.length > 0 ? (
          filteredMeetings.map((meeting, index) => (
            <MeetingCard key={meeting.id} meeting={meeting} selected={selectFirst && index === 0} />
          ))
        ) : emptyState === "operator" ? (
          <EmptyOperatorMeetings />
        ) : (
          <EmptyMemberMeetings />
        )}
      </div>
    </>
  );
}

function MeetingFilterBar({
  activeFilter,
  isPending,
  onChange
}: {
  activeFilter: MeetingListFilter;
  isPending: boolean;
  onChange: (filter: MeetingListFilter) => void;
}) {
  return (
    <nav className="sticky top-0 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto border-y border-line bg-white px-4 py-2 sm:mx-0 sm:rounded-xl sm:border sm:bg-surfaceAlt">
      {meetingListFilters.map((filter) => {
        const active = filter.value === activeFilter;
        return (
          <button
            aria-pressed={active}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-black transition disabled:cursor-not-allowed ${
              active ? "bg-ink text-white" : "bg-white text-secondary hover:text-ink"
            }`}
            disabled={isPending && active}
            key={filter.value}
            onClick={() => {
              if (!active) onChange(filter.value);
            }}
            type="button"
          >
            {filter.label}
          </button>
        );
      })}
    </nav>
  );
}

function MeetingCard({ meeting, selected }: { meeting: DashboardMeeting; selected?: boolean }) {
  const summary = meeting.attendanceSummary;
  const focusMetrics = getMeetingFocusMetrics(summary);

  return (
    <RoutePendingLink
      className={`rounded-2xl border bg-white p-3.5 transition sm:p-4 ${
        selected ? "border-primary shadow-card" : "border-line hover:border-lineStrong"
      }`}
      href={`/meetings/${meeting.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-black transition sm:text-lg">{meeting.title}</span>
            {selected ? (
              <span className="shrink-0 rounded-full bg-[#E8F7EE] px-2.5 py-1 text-[11px] font-bold text-primary">다음</span>
            ) : null}
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-secondary">
            {formatMeetingDateTime(meeting.startsAt)} · {meeting.locationNote ?? "장소 미정"}
          </p>
          {meeting.opponentName ? (
            <p className="mt-1 truncate text-xs font-bold text-strategy">vs {meeting.opponentName}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-[#FFF4E5] px-2.5 py-1 text-[11px] font-bold text-warning">
          {meeting.attendanceClosesAt ? `${formatMeetingDateTime(meeting.attendanceClosesAt)} 마감` : "마감 미정"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 text-sm font-semibold text-secondary">
        {focusMetrics.map((metric) => (
          <MetricPill key={metric.label} label={metric.label} tone={metric.tone} value={metric.value} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <TinyMeta label="정원" value={meeting.capacity ? `${meeting.capacity}명` : "미정"} />
        <TinyMeta label="대기" value={meeting.allowWaitlist ? "허용" : "없음"} />
        <TinyMeta label="방식" value={attendanceMethodLabel(meeting.attendanceMethod)} />
        {summary.noShowCount > 0 ? <TinyMeta label="노쇼" value={`${summary.noShowCount}명`} danger /> : null}
      </div>
    </RoutePendingLink>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: string; tone: DashboardTone }) {
  return (
    <div className={`min-w-0 rounded-xl px-2 py-2 ${metricToneClass(tone)}`}>
      <span className="block truncate text-[10px] font-bold opacity-70">{label}</span>
      <span className="mt-0.5 block truncate text-base font-black leading-5">{value}</span>
    </div>
  );
}

function TinyMeta({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${danger ? "bg-[#FFF1F1] text-danger" : "bg-surfaceAlt text-secondary"}`}>
      {label} {value}
    </span>
  );
}

function EmptyOperatorMeetings() {
  return (
    <div className="rounded-2xl border border-dashed border-lineStrong bg-surfaceAlt p-6 text-center">
      <p className="text-lg font-bold">아직 등록된 경기가 없습니다</p>
      <RoutePendingLink
        className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white"
        href="/meetings/new"
      >
        <Plus size={17} />
        첫 경기 만들기
      </RoutePendingLink>
    </div>
  );
}

function EmptyMemberMeetings() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-lineStrong bg-surfaceAlt p-6 text-center">
      <p className="text-lg font-bold">예정된 경기가 없습니다</p>
    </div>
  );
}

function metricToneClass(tone: DashboardTone) {
  const classes: Record<DashboardTone, string> = {
    success: "bg-[#E8F7EE] text-primary",
    info: "bg-[#E8F3FF] text-strategy",
    warning: "bg-[#FFF4E5] text-warning",
    danger: "bg-[#FFF1F1] text-danger",
    muted: "bg-surfaceAlt text-secondary"
  };

  return classes[tone];
}

function attendanceMethodLabel(value: string) {
  const labels: Record<string, string> = {
    manual: "수동",
    qr: "QR",
    gps: "GPS",
    gps_approval: "GPS 승인"
  };

  return labels[value] ?? "수동";
}
