import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  MapPin,
  Plus,
  Timer,
  Users
} from "lucide-react";
import { createMeeting } from "@/app/meetings/actions";
import { HelpIcon } from "@/components/help-icon";

const attendanceMethods = [
  { value: "manual", label: "운영자 확인", description: "현장에서 운영자가 직접 출석을 확정합니다.", badge: "MVP 권장" },
  { value: "qr", label: "QR 체크", description: "멤버가 QR로 빠르게 체크인합니다.", badge: "빠른 체크" },
  { value: "gps_approval", label: "GPS + 승인", description: "위치 확인 후 운영자가 최종 승인합니다.", badge: "신뢰도 강화" }
];

export default async function NewMeetingPage() {
  return (
    <main className="min-h-screen bg-app text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              aria-label="대시보드로 돌아가기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-secondary shadow-soft transition hover:bg-surfaceAlt"
              href="/"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
                경기 생성
              </span>
              <h1 className="mt-2 text-[30px] font-bold leading-10">
                새 경기
              </h1>
            </div>
          </div>
        </header>

        <section className="mx-auto grid w-full max-w-3xl gap-6 py-6 lg:py-8">
          <form action={createMeeting} className="grid gap-5 rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <section>
              <SectionHeader eyebrow="기본 정보" title="경기 정보" />
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-secondary">경기 이름</span>
                  <input
                    className="field-input"
                    name="title"
                    placeholder="예: 목요일 풋살 정기전"
                    required
                    type="text"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-secondary">운영 메모</span>
                  <textarea
                    className="min-h-32 resize-none rounded-[14px] border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition placeholder:text-disabled focus:border-strategy focus:ring-4 focus:ring-[#2563EB]/10"
                    name="memo"
                    placeholder="준비물, 팀 배정, 우천 안내"
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <FieldGroup icon={CalendarClock} title="일정">
                <div className="grid gap-3">
                  <input className="field-input" name="startsOn" required type="date" />
                  <input className="field-input" name="startsAt" required type="time" />
                </div>
              </FieldGroup>
              <FieldGroup icon={MapPin} title="장소">
                <div className="grid gap-3">
                  <input className="field-input" name="placeName" placeholder="장소명" type="text" />
                  <input className="field-input" name="placeAddress" placeholder="주소 또는 지도 링크" type="text" />
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
                  <input className="field-input bg-white" min="1" name="capacity" placeholder="18" type="number" />
                </label>
                <label className="setup-field">
                  <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    대기 허용
                    <HelpIcon title="대기 허용">
                      정원이 찼을 때 멤버가 대기 상태로 응답할 수 있습니다.
                    </HelpIcon>
                  </span>
                  <select className="field-input bg-white" name="allowWaitlist" defaultValue="on">
                    <option value="on">허용</option>
                    <option value="">허용 안 함</option>
                  </select>
                </label>
                <label className="setup-field">
                  <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <Timer size={17} />
                    신청 마감
                  </span>
                  <select className="field-input bg-white" name="deadlineHours" defaultValue="6">
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
                {attendanceMethods.map((method, index) => (
                  <label
                    className={`grid cursor-pointer gap-3 rounded-2xl border p-4 transition hover:border-strategy ${
                      index === 0 ? "border-primary bg-[#F7FCF9]" : "border-line bg-white"
                    }`}
                    key={method.value}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        className="h-4 w-4 accent-primary"
                        defaultChecked={index === 0}
                        name="attendanceMethod"
                        type="radio"
                        value={method.value}
                      />
                      <span className="rounded-full bg-[#E8F3FF] px-2.5 py-1 text-[11px] font-bold text-strategy">
                        {method.badge}
                      </span>
                    </div>
                    <span className="flex items-center gap-2 text-base font-bold">
                      {method.label}
                      <HelpIcon title={method.label}>{method.description}</HelpIcon>
                    </span>
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
                <Plus size={18} />
                경기 만들기
              </button>
            </div>
          </form>

        </section>
      </div>
    </main>
  );
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
