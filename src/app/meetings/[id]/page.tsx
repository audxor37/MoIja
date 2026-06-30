import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Timer,
  Users
} from "lucide-react";
import { respondToMeetingAttendance } from "@/app/meetings/actions";
import {
  attendanceStatusLabel,
  canSubmitAttendanceResponse,
  type AttendanceStatus
} from "@/lib/attendance";
import { formatMeetingDateTime } from "@/lib/meetings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const attendanceMessages: Record<string, string> = {
  auth_required: "로그인이 필요합니다. 다시 로그인해 주세요.",
  invalid_status: "참석 응답 값을 다시 확인해 주세요.",
  missing_meeting: "모임 정보를 찾지 못했습니다.",
  save_failed: "참석 응답 저장에 실패했습니다. 잠시 후 다시 시도해 주세요."
};

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

export default async function MeetingDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ attendance_error?: string; attendance_message?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?meeting_error=auth_required");
  }

  const { data: meeting } = await supabase
    .from("matches")
    .select("id, team_id, title, starts_at, location_note, memo, capacity, allow_waitlist, attendance_method, attendance_closes_at")
    .eq("id", id)
    .maybeSingle();

  const currentMeeting = meeting as MeetingRecord | null;

  if (!currentMeeting) {
    notFound();
  }

  const { data: attendance } = await supabase
    .from("match_attendances")
    .select("status, updated_at")
    .eq("match_id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  const myAttendance = attendance as { status: AttendanceStatus; updated_at: string } | null;
  const message =
    query?.attendance_message ||
    (query?.attendance_error ? attendanceMessages[query.attendance_error] : null);

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
            <span className="inline-flex h-7 items-center rounded-full bg-[#E8F7EE] px-3 text-xs font-bold text-primary">
              모임 상세
            </span>
            <h1 className="mt-2 text-[30px] font-bold leading-10">{currentMeeting.title}</h1>
          </div>
        </header>

        {message ? (
          <div className="mt-5 rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200]">
            {message}
          </div>
        ) : null}

        <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
          <section className="grid gap-5">
            <article className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-1 shrink-0 text-strategy" size={22} />
                <div>
                  <h2 className="text-xl font-bold">모임 정보</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
                    {currentMeeting.memo || "운영 메모가 아직 없습니다."}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow icon={Timer} label="일정" value={formatMeetingDateTime(currentMeeting.starts_at)} />
                <InfoRow icon={MapPin} label="장소" value={currentMeeting.location_note ?? "장소 미정"} />
                <InfoRow icon={Users} label="정원" value={currentMeeting.capacity ? `${currentMeeting.capacity}명` : "미정"} />
                <InfoRow icon={ClipboardCheck} label="신청 마감" value={currentMeeting.attendance_closes_at ? formatMeetingDateTime(currentMeeting.attendance_closes_at) : "마감 미정"} />
              </div>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">내 참석 응답</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
                    현재 상태는 <span className="text-primary">{attendanceStatusLabel(myAttendance?.status)}</span>입니다.
                  </p>
                </div>
                <CheckCircle2 className="shrink-0 text-primary" size={24} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {responseOptions.map((option) => (
                  <form action={respondToMeetingAttendance} key={option.status}>
                    <input name="meetingId" type="hidden" value={currentMeeting.id} />
                    <input name="status" type="hidden" value={option.status} />
                    <button
                      className={`grid min-h-28 w-full content-start gap-2 rounded-2xl px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${option.tone} ${
                        myAttendance?.status === option.status ? "ring-4 ring-primary/20" : ""
                      }`}
                      disabled={!canSubmitAttendanceResponse(option.status, currentMeeting.allow_waitlist)}
                      type="submit"
                    >
                      <span className="text-base font-black">{option.label}</span>
                      <span className="text-sm font-semibold leading-6 opacity-80">{option.description}</span>
                    </button>
                  </form>
                ))}
              </div>
            </article>
          </section>

          <aside className="grid gap-5 self-start">
            <section className="rounded-2xl bg-navy p-5 text-white shadow-card">
              <p className="text-xs font-semibold uppercase text-white/55">Attendance</p>
              <h2 className="mt-3 text-2xl font-bold">{attendanceStatusLabel(myAttendance?.status)}</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                참석 의사 변경은 이력으로 남고, 이후 운영자가 실제 출석을 확정할 수 있습니다.
              </p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-card">
              <h2 className="text-lg font-bold">운영 규칙</h2>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-secondary">
                <StatusPill label="대기" value={currentMeeting.allow_waitlist ? "허용" : "허용 안 함"} />
                <StatusPill label="출석 방식" value={attendanceMethodLabel(currentMeeting.attendance_method)} />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

type MeetingRecord = {
  id: string;
  team_id: string;
  title: string;
  starts_at: string;
  location_note: string | null;
  memo: string | null;
  capacity: number | null;
  allow_waitlist: boolean;
  attendance_method: string;
  attendance_closes_at: string | null;
};

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surfaceAlt px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-bold text-muted">
        <Icon size={15} />
        {label}
      </div>
      <p className="mt-2 font-bold text-ink">{value}</p>
    </div>
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

function attendanceMethodLabel(value: string) {
  const labels: Record<string, string> = {
    manual: "운영자 확인",
    qr: "QR 체크",
    gps: "GPS",
    gps_approval: "GPS + 승인"
  };

  return labels[value] ?? "운영자 확인";
}
