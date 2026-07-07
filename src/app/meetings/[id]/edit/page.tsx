import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Save, Timer, Users } from "lucide-react";
import { updateMeeting } from "@/app/meetings/actions";
import { HelpIcon } from "@/components/help-icon";
import { canManageMeeting } from "@/lib/meetings";
import { getCurrentUserId } from "@/lib/supabase/auth-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditMeetingPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const userId = await getCurrentUserId(supabase);

  if (!userId) {
    redirect("/?meeting_error=auth_required");
  }

  const { data: meeting, error: meetingError } = await supabase
    .from("matches")
    .select("id, team_id, created_by, title, starts_at, location_note, memo, capacity, allow_waitlist, attendance_method, attendance_closes_at")
    .eq("id", id)
    .maybeSingle();

  const { data: fallbackMeeting } = meetingError
    ? await supabase
        .from("matches")
        .select("id, team_id, created_by, title, starts_at, capacity, attendance_method, attendance_closes_at")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  const currentMeeting = (meeting ?? fallbackMeeting) as MeetingRecord | null;

  if (!currentMeeting) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", currentMeeting.team_id)
    .eq("profile_id", userId)
    .maybeSingle();
  const role = (membership as { role?: string } | null)?.role ?? null;

  if (!canManageMeeting({ currentUserId: userId, createdBy: currentMeeting.created_by, role })) {
    redirect("/?meeting_error=permission_denied");
  }

  const defaults = toFormDefaults(currentMeeting as MeetingRecord);

  return (
    <main className="min-h-screen bg-app text-ink">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex items-center gap-3 border-b border-line pb-6">
          <Link
            aria-label="대시보드로 돌아가기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-soft transition hover:bg-surfaceAlt"
            href="/"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
              경기 수정
            </span>
            <h1 className="mt-2 text-[30px] font-bold leading-10">{currentMeeting.title}</h1>
          </div>
        </header>

        <form action={updateMeeting} className="mt-6 grid gap-5 rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <input name="meetingId" type="hidden" value={currentMeeting.id} />

          <section>
            <SectionHeader eyebrow="기본 정보" title="경기 정보" />
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">경기 이름</span>
                <input className="field-input" name="title" defaultValue={currentMeeting.title} required type="text" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">운영 메모</span>
                <textarea
                  className="min-h-32 resize-none rounded-[14px] border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition placeholder:text-disabled focus:border-strategy focus:ring-4 focus:ring-[#2563EB]/10"
                  name="memo"
                  defaultValue={"memo" in currentMeeting ? currentMeeting.memo ?? "" : ""}
                />
              </label>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <FieldGroup icon={CalendarClock} title="일정">
              <div className="grid gap-3">
                <input className="field-input" name="startsOn" defaultValue={defaults.startsOn} required type="date" />
                <input className="field-input" name="startsAt" defaultValue={defaults.startsAt} required type="time" />
              </div>
            </FieldGroup>
            <FieldGroup icon={MapPin} title="장소">
              <div className="grid gap-3">
                <input className="field-input" name="placeName" defaultValue={defaults.placeName} placeholder="장소명" type="text" />
                <input className="field-input" name="placeAddress" defaultValue={defaults.placeAddress} placeholder="주소 또는 지도 링크" type="text" />
              </div>
            </FieldGroup>
          </section>

          <section>
            <SectionHeader eyebrow="운영 규칙" title="참석 규칙" />
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="setup-field">
                <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Users size={17} />
                  정원
                </span>
                <input className="field-input bg-white" min="1" name="capacity" defaultValue={currentMeeting.capacity ?? ""} type="number" />
              </label>
              <label className="setup-field">
                <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  대기 허용
                  <HelpIcon title="대기 허용">
                    정원이 찼을 때 멤버가 대기 상태로 응답할 수 있습니다.
                  </HelpIcon>
                </span>
                <select className="field-input bg-white" name="allowWaitlist" defaultValue={"allow_waitlist" in currentMeeting ? currentMeeting.allow_waitlist ? "on" : "" : "on"}>
                  <option value="on">허용</option>
                  <option value="">허용 안 함</option>
                </select>
              </label>
              <label className="setup-field">
                <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Timer size={17} />
                  신청 마감
                </span>
                <select className="field-input bg-white" name="deadlineHours" defaultValue={defaults.deadlineHours}>
                  <option value="6">시작 6시간 전</option>
                  <option value="12">시작 12시간 전</option>
                  <option value="24">시작 24시간 전</option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2">
              <SectionHeader eyebrow="출석 방식" title="출석 확정" />
              <HelpIcon title="출석 방식">
                참석 응답과 실제 출석 확정은 분리됩니다. MVP에서는 운영자 확인을 권장합니다.
              </HelpIcon>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["manual", "운영자 확인"],
                ["qr", "QR 체크"],
                ["gps_approval", "GPS + 승인"]
              ].map(([value, label]) => (
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line bg-white p-4 text-sm font-bold" key={value}>
                  <input
                    className="h-4 w-4 accent-primary"
                    defaultChecked={currentMeeting.attendance_method === value}
                    name="attendanceMethod"
                    type="radio"
                    value={value}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-line bg-white/95 p-3 shadow-card backdrop-blur sm:flex-row sm:justify-end">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-xl bg-surfaceAlt px-5 text-sm font-semibold text-secondary transition hover:bg-line"
              href="/"
            >
              취소
            </Link>
            <button
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
              type="submit"
            >
              <Save size={18} />
              수정 저장
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

type MeetingRecord = {
  id: string;
  team_id: string;
  created_by: string | null;
  title: string;
  starts_at: string;
  location_note?: string | null;
  memo?: string | null;
  capacity: number | null;
  allow_waitlist?: boolean | null;
  attendance_method: string;
  attendance_closes_at: string | null;
};

function toFormDefaults(meeting: MeetingRecord) {
  const startsAt = new Date(meeting.starts_at);
  const closeAt = meeting.attendance_closes_at ? new Date(meeting.attendance_closes_at) : null;
  const locationParts = (meeting.location_note ?? "").split(" · ");
  const deadlineHours =
    closeAt && !Number.isNaN(closeAt.getTime())
      ? Math.max(1, Math.round((startsAt.getTime() - closeAt.getTime()) / (60 * 60 * 1000)))
      : 6;

  return {
    startsOn: toKoreanDateValue(startsAt),
    startsAt: toKoreanTimeValue(startsAt),
    placeName: locationParts[0] ?? "",
    placeAddress: locationParts.slice(1).join(" · "),
    deadlineHours: String([6, 12, 24].includes(deadlineHours) ? deadlineHours : 6)
  };
}

function toKoreanDateValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function toKoreanTimeValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  return `${parts.find((part) => part.type === "hour")?.value ?? "00"}:${parts.find((part) => part.type === "minute")?.value ?? "00"}`;
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-strategy">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-bold leading-7">{title}</h2>
    </div>
  );
}

function FieldGroup({
  children,
  icon: Icon,
  title
}: {
  children: React.ReactNode;
  icon: typeof CalendarClock;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surfaceAlt p-4">
      <h2 className="flex items-center gap-2 text-base font-bold">
        <Icon className="text-strategy" size={20} />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
