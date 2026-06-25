import {
  Bell,
  CalendarPlus,
  ClipboardCheck,
  Copy,
  Grid2X2,
  LogIn,
  Plus,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  { label: "대시보드", icon: Grid2X2, href: "/", active: true },
  { label: "모임 생성", icon: CalendarPlus, href: "/meetings/new" },
  { label: "참석 체크", icon: ClipboardCheck, href: "/" },
  { label: "공지/리마인드", icon: Bell, href: "/" }
];

const summary = [
  { label: "참석 예정", value: "3", unit: "명" },
  { label: "미응답", value: "2", unit: "명" },
  { label: "예상 참석", value: "4", unit: "명" },
  { label: "응답률", value: "71", unit: "%" }
];

const meetings = [
  {
    title: "목요일 한강 러닝크루",
    date: "5월 29일 (금) 오후 07:30",
    place: "반포 한강공원 잠수교 남단",
    status: "개최 확정",
    statusTone: "bg-[#eef0ff] text-[#4b55d9]",
    counts: "참석 3   미응답 2   취소 1   예상 4",
    progress: "38%"
  },
  {
    title: "퇴근 후 독서모임",
    date: "6월 2일 (화) 오후 08:00",
    place: "성수 커뮤니티룸 2층",
    status: "모집중",
    statusTone: "bg-[#e9f8ed] text-grass",
    counts: "참석 2   미응답 1   취소 0   예상 3",
    progress: "40%"
  }
];

const authMessages: Record<string, string> = {
  callback_failed: "카카오 로그인 처리 중 문제가 발생했습니다. Supabase와 Kakao 설정을 확인하세요.",
  kakao_start_failed: "카카오 로그인 주소를 생성하지 못했습니다. Kakao provider 설정을 확인하세요.",
  missing_code: "로그인 인증 코드가 전달되지 않았습니다. 다시 시도하세요.",
  profile_failed: "로그인은 완료됐지만 프로필 저장에 실패했습니다. profiles RLS와 스키마를 확인하세요.",
  user_missing: "로그인 세션을 확인하지 못했습니다. 다시 시도하세요.",
  supabase_env_missing: "Supabase 환경 변수가 아직 설정되지 않았습니다. .env.local을 먼저 준비하세요."
};

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ auth_error?: string }>;
}) {
  const params = await searchParams;
  const authError = params?.auth_error;
  const authMessage = authError ? authMessages[authError] : null;
  const session = await getCurrentSession();

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-ink">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[300px_1fr]">
        <aside className="bg-[#18332d] px-8 py-7 text-white lg:min-h-screen">
          <Brand />
          <nav className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-1 lg:gap-3">
            {navItems.map((item) => (
              <NavButton key={item.label} {...item} />
            ))}
          </nav>
          <div className="mt-12 hidden text-sm font-semibold leading-7 text-white/72 lg:block">
            <p>Next.js MVP</p>
            <p>Supabase 미설정</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-line bg-[#f7f8f4]/95 px-5 py-5 backdrop-blur sm:px-8 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#eefaf7] text-[#2a655f]">
                  <ShieldCheck size={25} />
                </div>
                <div>
                  <p className="text-lg font-black">운영자 로그인</p>
                  <p className="mt-1 text-sm font-bold text-ink/58">
                    Supabase 환경 변수를 먼저 설정하세요.
                  </p>
                </div>
              </div>
              <AuthActions nickname={session.nickname} />
            </div>
          </header>

          <section className="px-5 py-7 sm:px-8 lg:px-8">
            {authMessage ? (
              <div className="mb-6 rounded-lg border border-[#f0d5a8] bg-[#fff8e6] px-5 py-4 text-sm font-bold text-[#7a4d12]">
                {authMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-base font-black text-[#285b55]">운영자 대시보드</p>
                <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-[42px]">
                  참석 흐름을 한 화면에서 관리합니다
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/62">
                  신청 이후 미응답, 취소, 예상 참석, 실제 참석 기록까지 이어지는 운영 화면입니다.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-black shadow-sm">
                  <Copy size={18} />
                  참가 링크
                </button>
                <Link
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#437d74] px-4 text-sm font-black text-white shadow-sm"
                  href="/meetings/new"
                >
                  <Plus size={18} />
                  새 모임
                </Link>
              </div>
            </div>

            <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summary.map((item) => (
                <SummaryCard key={item.label} {...item} />
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_412px]">
              <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <h2 className="text-2xl font-black">모임 목록</h2>
                <div className="mt-5 grid gap-4">
                  {meetings.map((meeting, index) => (
                    <MeetingCard key={meeting.title} selected={index === 0} {...meeting} />
                  ))}
                </div>
              </section>

              <aside className="rounded-lg border border-line bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black">선택 모임</h2>
                  <span className="rounded-md bg-[#eef0ff] px-3 py-1 text-sm font-black text-[#4b55d9]">
                    개최 확정
                  </span>
                </div>
                <h3 className="mt-6 text-3xl font-black leading-tight">목요일 한강 러닝크루</h3>
                <p className="mt-4 text-lg leading-8 text-ink/62">
                  잠수교에서 출발해 5km와 8km 페이스 그룹으로 나누어 진행합니다.
                </p>
                <p className="mt-5 text-base font-semibold text-ink/58">
                  5월 29일 (금) 오후 07:30 · 반포 한강공원 잠수교 남단
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <SmallMetric label="신청" value="6" suffix="/18" />
                  <SmallMetric label="대기" value="1" suffix="명" />
                </div>
                <ProgressBar value="32%" />
                <div className="mt-7">
                  <span className="rounded-md bg-[#e7f5ef] px-3 py-2 text-sm font-black text-[#2d6c62]">
                    최근 활동 운영자
                  </span>
                  <p className="mt-5 text-sm font-semibold text-ink/60">
                    운영 7회 · 개최율 92% · 평점 4.8
                  </p>
                </div>
              </aside>
            </section>
          </section>
        </section>
      </div>
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#f8df62] text-2xl font-black text-[#19332d] sm:h-14 sm:w-14">
        M
      </div>
      <h2 className="text-3xl font-black leading-tight tracking-normal sm:text-4xl lg:text-2xl">
        모임참석
        <br />
        운영 플랫폼
      </h2>
    </div>
  );
}

function NavButton({
  label,
  href,
  icon: Icon,
  active = false
}: {
  label: string;
  href: string;
  icon: typeof Grid2X2;
  active?: boolean;
}) {
  return (
    <Link
      className={`flex h-20 items-center justify-center gap-4 rounded-lg px-4 text-xl font-black text-white/86 lg:h-[52px] lg:justify-start lg:text-base ${
        active ? "bg-white/18" : "bg-transparent"
      }`}
      href={href}
    >
      <Icon size={26} />
      <span>{label}</span>
    </Link>
  );
}

async function getCurrentSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return { nickname: null };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle();

    const nickname =
      profile?.nickname ||
      (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : null) ||
      (typeof user.user_metadata.name === "string" ? user.user_metadata.name : null) ||
      "운영자";

    return { nickname };
  } catch {
    return { nickname: null };
  }
}

function AuthActions({ nickname }: { nickname: string | null }) {
  if (nickname) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex h-11 items-center rounded-md border border-line bg-white px-4 text-sm font-black text-ink/70">
          {nickname}
        </span>
        <form action="/api/auth/signout" method="post">
          <button
            className="inline-flex h-11 min-w-[96px] items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-black text-ink/62 transition hover:bg-[#eefaf7]"
            type="submit"
          >
            로그아웃
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        className="inline-flex h-11 min-w-[116px] cursor-not-allowed items-center justify-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-black text-ink/42"
        disabled
        type="button"
      >
        <LogIn size={18} />
        Google
      </button>
      <a
        className="inline-flex h-11 min-w-[116px] items-center justify-center gap-2 rounded-md border border-[#f4eb7a] bg-[#f7ef91] px-4 text-sm font-black text-ink/58 transition hover:brightness-95"
        href="/auth/kakao-login"
      >
        <LogIn size={18} />
        Kakao
      </a>
    </div>
  );
}

function SummaryCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <p className="text-base font-semibold text-ink/58">{label}</p>
      <p className="mt-2 flex items-end gap-1">
        <span className="text-4xl font-black">{value}</span>
        <span className="pb-1 text-sm font-semibold text-ink/58">{unit}</span>
      </p>
    </article>
  );
}

function MeetingCard({
  title,
  date,
  place,
  status,
  statusTone,
  counts,
  progress,
  selected
}: {
  title: string;
  date: string;
  place: string;
  status: string;
  statusTone: string;
  counts: string;
  progress: string;
  selected?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        selected ? "border-[#9bbdb7] ring-2 ring-[#cfe0dc]" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="mt-3 text-sm font-semibold text-ink/58">
            {date} · {place}
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-3 py-1 text-sm font-black ${statusTone}`}>
          {status}
        </span>
      </div>
      <ProgressBar value={progress} />
      <p className="mt-4 text-sm font-semibold text-ink/58">{counts}</p>
    </article>
  );
}

function ProgressBar({ value }: { value: string }) {
  return (
    <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#edf0f4]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#3c8076] via-[#8ca56d] to-[#f3d654]"
        style={{ width: value }}
      />
    </div>
  );
}

function SmallMetric({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <p className="text-base font-semibold text-ink/58">{label}</p>
      <p className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-black">{value}</span>
        <span className="pb-1 text-sm font-semibold text-ink/58">{suffix}</span>
      </p>
    </article>
  );
}
