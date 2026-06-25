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
  Users
} from "lucide-react";

const attendanceMethods = [
  { label: "운영자 확인", description: "현장에서 관리자가 직접 출석을 확정합니다." },
  { label: "QR 체크", description: "도착한 멤버가 QR로 빠르게 체크합니다." },
  { label: "GPS + 승인", description: "위치 확인 후 운영자가 최종 승인합니다." }
];

const reminderRules = [
  "마감 24시간 전 미응답 멤버 알림",
  "마감 3시간 전 참석자 리마인드",
  "취소 발생 시 대기자에게 자동 안내"
];

export default function NewMeetingPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f4] text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              aria-label="대시보드로 돌아가기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink/70 shadow-sm transition hover:bg-[#eefaf7]"
              href="/"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <p className="text-sm font-black text-[#2d6c62]">모임 생성</p>
              <h1 className="mt-1 text-3xl font-black leading-tight tracking-normal sm:text-4xl">
                참석 신뢰도를 높이는 모임을 만듭니다
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 shadow-sm">
            <ShieldCheck className="text-[#2d6c62]" size={22} />
            <p className="text-sm font-bold text-ink/64">
              저장 전에도 참석 마감, 알림, 출석 방식이 함께 설계됩니다.
            </p>
          </div>
        </header>

        <section className="grid gap-6 py-7 lg:grid-cols-[1fr_360px]">
          <form className="grid gap-5 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <section>
              <h2 className="text-xl font-black">기본 정보</h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-black text-ink/66">모임 이름</span>
                  <input
                    className="h-12 rounded-md border border-line bg-[#fbfcf8] px-4 text-base font-bold outline-none transition focus:border-[#437d74] focus:bg-white"
                    placeholder="예: 목요일 풋살 정기전"
                    type="text"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-black text-ink/66">운영 메모</span>
                  <textarea
                    className="min-h-28 resize-none rounded-md border border-line bg-[#fbfcf8] px-4 py-3 text-base font-semibold leading-7 outline-none transition focus:border-[#437d74] focus:bg-white"
                    placeholder="참석 기준, 준비물, 팀 배정 방식 등을 적어주세요."
                  />
                </label>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <FieldCard icon={CalendarClock} title="일정">
                <div className="grid gap-3">
                  <input className="h-11 rounded-md border border-line bg-[#fbfcf8] px-3 font-bold" type="date" />
                  <input className="h-11 rounded-md border border-line bg-[#fbfcf8] px-3 font-bold" type="time" />
                </div>
              </FieldCard>
              <FieldCard icon={MapPin} title="장소">
                <div className="grid gap-3">
                  <input
                    className="h-11 rounded-md border border-line bg-[#fbfcf8] px-3 font-bold"
                    placeholder="장소명"
                    type="text"
                  />
                  <input
                    className="h-11 rounded-md border border-line bg-[#fbfcf8] px-3 font-bold"
                    placeholder="주소 또는 지도 링크"
                    type="text"
                  />
                </div>
              </FieldCard>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2 rounded-lg border border-line bg-[#fbfcf8] p-4">
                <span className="flex items-center gap-2 text-sm font-black text-ink/66">
                  <Users size={17} />
                  정원
                </span>
                <input className="h-11 rounded-md border border-line bg-white px-3 font-bold" min="1" type="number" />
              </label>
              <label className="grid gap-2 rounded-lg border border-line bg-[#fbfcf8] p-4">
                <span className="text-sm font-black text-ink/66">대기 허용</span>
                <select className="h-11 rounded-md border border-line bg-white px-3 font-bold">
                  <option>허용</option>
                  <option>허용 안 함</option>
                </select>
              </label>
              <label className="grid gap-2 rounded-lg border border-line bg-[#fbfcf8] p-4">
                <span className="text-sm font-black text-ink/66">신청 마감</span>
                <select className="h-11 rounded-md border border-line bg-white px-3 font-bold">
                  <option>시작 6시간 전</option>
                  <option>시작 12시간 전</option>
                  <option>시작 24시간 전</option>
                </select>
              </label>
            </section>

            <section>
              <h2 className="text-xl font-black">출석 방식</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {attendanceMethods.map((method, index) => (
                  <label
                    className="grid cursor-pointer gap-3 rounded-lg border border-line bg-[#fbfcf8] p-4 transition hover:border-[#9bbdb7]"
                    key={method.label}
                  >
                    <input className="h-4 w-4 accent-[#437d74]" defaultChecked={index === 0} name="attendance" type="radio" />
                    <span className="text-base font-black">{method.label}</span>
                    <span className="text-sm font-semibold leading-6 text-ink/58">{method.description}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-5 text-sm font-black text-ink/62"
                href="/"
              >
                취소
              </Link>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#437d74] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#376c64]"
                type="button"
              >
                <Plus size={18} />
                모임 만들기
              </button>
            </div>
          </form>

          <aside className="grid gap-5">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="text-[#2d6c62]" size={22} />
                <h2 className="text-xl font-black">운영 체크</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {reminderRules.map((rule) => (
                  <div className="flex gap-3 rounded-md bg-[#f4f8f1] p-3" key={rule}>
                    <CheckCircle2 className="mt-0.5 shrink-0 text-[#2d6c62]" size={18} />
                    <p className="text-sm font-bold leading-6 text-ink/66">{rule}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d8e6df] bg-[#eefaf7] p-5">
              <div className="flex items-center gap-3">
                <Bell className="text-[#2d6c62]" size={22} />
                <h2 className="text-xl font-black">노쇼 감소 힌트</h2>
              </div>
              <p className="mt-4 text-sm font-bold leading-7 text-ink/64">
                신청 마감과 대기자 알림을 함께 설정하면 취소 자리를 빠르게 채울 수 있습니다.
                출석 확정 이후의 변경 기록은 신뢰도 계산에 사용할 수 있게 남기는 흐름이 좋습니다.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function FieldCard({
  children,
  icon: Icon,
  title
}: {
  children: React.ReactNode;
  icon: typeof CalendarClock;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-[#fbfcf8] p-4">
      <h2 className="flex items-center gap-2 text-xl font-black">
        <Icon className="text-[#2d6c62]" size={20} />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
