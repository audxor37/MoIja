import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Plus,
  ShieldCheck,
  Timer,
  Users
} from "lucide-react";

const attendanceMethods = [
  { label: "운영자 확인", description: "현장에서 관리자가 직접 출석을 확정합니다.", badge: "MVP 권장" },
  { label: "QR 체크", description: "도착한 멤버가 QR로 빠르게 체크합니다.", badge: "빠른 체크" },
  { label: "GPS + 승인", description: "위치 확인 후 운영자가 최종 승인합니다.", badge: "신뢰 강화" }
];

const reminderRules = [
  "마감 24시간 전 미응답 멤버 알림",
  "마감 3시간 전 참석자 리마인드",
  "취소 발생 시 대기자 자동 안내"
];

const setupMetrics = [
  { label: "권장 마감", value: "6h", note: "경기 시작 전" },
  { label: "예상 응답률", value: "82%", note: "리마인드 적용" },
  { label: "출석 방식", value: "수동", note: "운영자 확정" }
];

export default function NewMeetingPage() {
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
                모임 생성
              </span>
              <h1 className="mt-2 text-[30px] font-bold leading-10">
                참석 신뢰도를 높이는 모임을 만듭니다
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card lg:max-w-md">
            <ShieldCheck className="shrink-0 text-primary" size={22} />
            <p className="text-sm font-semibold leading-6 text-secondary">
              저장 전에도 참석 마감, 알림, 출석 방식을 함께 설계해 노쇼 위험을 줄입니다.
            </p>
          </div>
        </header>

        <section className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-8">
          <form className="grid gap-5 rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <section>
              <SectionHeader
                eyebrow="기본 정보"
                title="멤버가 바로 이해할 수 있는 경기 정보를 입력하세요"
              />
              <div className="mt-5 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-secondary">모임 이름</span>
                  <input
                    className="h-[52px] rounded-[14px] border border-line bg-white px-4 text-sm font-semibold outline-none transition placeholder:text-disabled focus:border-strategy focus:ring-4 focus:ring-[#2563EB]/10"
                    placeholder="예: 목요일 풋살 정기전"
                    type="text"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-secondary">운영 메모</span>
                  <textarea
                    className="min-h-32 resize-none rounded-[14px] border border-line bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition placeholder:text-disabled focus:border-strategy focus:ring-4 focus:ring-[#2563EB]/10"
                    placeholder="참석 기준, 준비물, 팀 배정 방식 등을 적어주세요."
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <FieldGroup icon={CalendarClock} title="일정">
                <div className="grid gap-3">
                  <input className="field-input" type="date" />
                  <input className="field-input" type="time" />
                </div>
              </FieldGroup>
              <FieldGroup icon={MapPin} title="장소">
                <div className="grid gap-3">
                  <input className="field-input" placeholder="장소명" type="text" />
                  <input className="field-input" placeholder="주소 또는 지도 링크" type="text" />
                </div>
              </FieldGroup>
            </section>

            <section>
              <SectionHeader eyebrow="운영 규칙" title="정원, 대기, 마감 시간을 함께 정합니다" />
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="setup-field">
                  <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <Users size={17} />
                    정원
                  </span>
                  <input className="field-input bg-white" min="1" placeholder="18" type="number" />
                </label>
                <label className="setup-field">
                  <span className="text-sm font-semibold text-secondary">대기 허용</span>
                  <select className="field-input bg-white">
                    <option>허용</option>
                    <option>허용 안 함</option>
                  </select>
                </label>
                <label className="setup-field">
                  <span className="flex items-center gap-2 text-sm font-semibold text-secondary">
                    <Timer size={17} />
                    신청 마감
                  </span>
                  <select className="field-input bg-white">
                    <option>시작 6시간 전</option>
                    <option>시작 12시간 전</option>
                    <option>시작 24시간 전</option>
                  </select>
                </label>
              </div>
            </section>

            <section>
              <SectionHeader eyebrow="출석 방식" title="현장 운영 방식에 맞게 출석 확정 흐름을 고르세요" />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {attendanceMethods.map((method, index) => (
                  <label
                    className={`grid cursor-pointer gap-3 rounded-2xl border p-4 transition hover:border-strategy ${
                      index === 0 ? "border-primary bg-[#F7FCF9]" : "border-line bg-white"
                    }`}
                    key={method.label}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        className="h-4 w-4 accent-primary"
                        defaultChecked={index === 0}
                        name="attendance"
                        type="radio"
                      />
                      <span className="rounded-full bg-[#E8F3FF] px-2.5 py-1 text-[11px] font-bold text-strategy">
                        {method.badge}
                      </span>
                    </div>
                    <span className="text-base font-bold">{method.label}</span>
                    <span className="text-sm leading-6 text-secondary">{method.description}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl bg-surfaceAlt px-5 text-sm font-semibold text-secondary transition hover:bg-line"
                href="/"
              >
                취소
              </Link>
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
                type="button"
              >
                <Plus size={18} />
                모임 만들기
              </button>
            </div>
          </form>

          <aside className="grid gap-5 self-start">
            <section className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="text-primary" size={22} />
                <h2 className="text-lg font-bold">운영 체크</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {reminderRules.map((rule) => (
                  <div className="flex gap-3 rounded-xl bg-surfaceAlt p-3" key={rule}>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={18} />
                    <p className="text-sm font-semibold leading-6 text-secondary">{rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <Bell className="text-strategy" size={22} />
                <h2 className="text-lg font-bold">노쇼 감소 힌트</h2>
              </div>
              <p className="mt-4 text-sm font-semibold leading-7 text-secondary">
                신청 마감과 대기자 알림을 함께 설정하면 취소 자리를 빠르게 채울 수 있습니다. 출석 확정 이후의 변경 기록은 신뢰도 계산에 사용할 수 있습니다.
              </p>
            </section>

            <section className="rounded-2xl bg-navy p-5 text-white shadow-card">
              <h2 className="text-lg font-bold">설정 미리보기</h2>
              <div className="mt-5 grid gap-4">
                {setupMetrics.map((metric) => (
                  <div className="flex items-end justify-between border-b border-white/10 pb-3" key={metric.label}>
                    <div>
                      <p className="text-sm font-semibold text-white/60">{metric.label}</p>
                      <p className="mt-1 text-xs text-white/45">{metric.note}</p>
                    </div>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
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
