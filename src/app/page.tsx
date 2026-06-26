import {
  Activity,
  BarChart3,
  Bell,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Grid2X2,
  KeyRound,
  LogIn,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Timer,
  Trophy,
  UserRoundPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { createOrganizerTeam, joinTeamByInvite } from "@/app/onboarding/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  { label: "대시보드", icon: Grid2X2, href: "/", active: true },
  { label: "모임 생성", icon: CalendarPlus, href: "/meetings/new" },
  { label: "출석 체크", icon: ClipboardCheck, href: "/" },
  { label: "공지/리마인드", icon: Bell, href: "/" }
];

const summary = [
  { label: "참석 확정", value: "12", unit: "명", tone: "success", note: "확정 인원" },
  { label: "미응답", value: "4", unit: "명", tone: "warning", note: "리마인드 필요" },
  { label: "예상 참석", value: "15", unit: "명", tone: "info", note: "대기 포함" },
  { label: "응답률", value: "78", unit: "%", tone: "neutral", note: "지난 경기 대비 +6%" }
];

const meetings = [
  {
    title: "목요일 풋살 정기전",
    date: "6월 27일(목) 오후 08:00",
    place: "신림 풋살파크 A구장",
    status: "개최 확정",
    statusTone: "success",
    attendance: { attending: 12, pending: 4, absent: 2, expected: 15 },
    progress: "78%",
    action: "미응답 4명 리마인드"
  },
  {
    title: "일요일 7:7 친선전",
    date: "6월 28일(일) 오전 10:30",
    place: "성암 보조구장",
    status: "모집중",
    statusTone: "info",
    attendance: { attending: 9, pending: 6, absent: 1, expected: 12 },
    progress: "60%",
    action: "대기자 2명 확인"
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

const onboardingErrors: Record<string, string> = {
  auth_required: "로그인 세션을 확인하지 못했습니다. 다시 카카오로 로그인하세요.",
  join_failed: "초대 코드를 찾지 못했습니다. 운영자에게 받은 코드나 링크를 다시 확인하세요.",
  owner_member_failed: "팀은 생성됐지만 운영자 권한 연결에 실패했습니다. team_members RLS를 확인하세요.",
  profile_failed: "프로필 저장에 실패했습니다. profiles RLS와 스키마를 확인하세요.",
  team_create_failed: "팀 생성에 실패했습니다. teams 스키마와 RLS를 확인하세요."
};

const bottomNav = [
  { label: "홈", icon: Grid2X2, active: true },
  { label: "경기", icon: CalendarPlus },
  { label: "랭킹", icon: Trophy },
  { label: "팀", icon: Users },
  { label: "내 정보", icon: ShieldCheck }
];

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ auth_error?: string; onboarding_error?: string; onboarding_message?: string }>;
}) {
  const params = await searchParams;
  const authError = params?.auth_error;
  const authMessage = authError ? authMessages[authError] : null;
  const onboardingError = params?.onboarding_error ? onboardingErrors[params.onboarding_error] : null;
  const onboardingMessage = params?.onboarding_message ?? null;
  const session = await getCurrentSession();

  if (!session.nickname) {
    return <PublicHome authMessage={authMessage} />;
  }

  if (!session.team) {
    return (
      <OnboardingStart
        message={authMessage || onboardingError || onboardingMessage}
        nickname={session.nickname}
      />
    );
  }

  return (
    <OperatorDashboard
      authMessage={authMessage}
      nickname={session.nickname}
      team={session.team}
    />
  );
}

function PublicHome({ authMessage }: { authMessage: string | null }) {
  return (
    <main className="min-h-screen bg-app text-ink">
      <header className="border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <Brand />
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 text-sm font-bold text-[#191600] transition hover:brightness-95"
            href="/auth/kakao-login"
          >
            <MessageCircle size={17} />
            카카오 로그인
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:py-14">
        <div>
          <span className="inline-flex h-8 items-center rounded-full bg-[#E8F7EE] px-3 text-xs font-bold text-primary">
            축구/풋살 모임 운영 SaaS
          </span>
          <h1 className="mt-4 max-w-3xl text-[34px] font-bold leading-[1.18] sm:text-[46px]">
            참석 약속이 지켜지는 팀 문화를 만듭니다
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-secondary">
            MoIja는 경기 생성보다 참석 신뢰도, 노쇼 감소, 운영 자동화에 집중합니다. 운영자는 미응답과
            대기자를 먼저 보고, 멤버는 자신의 참석 상태와 기록을 빠르게 확인합니다.
          </p>

          {authMessage ? (
            <div className="mt-5 rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200]">
              {authMessage}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
              href="/auth/kakao-login"
            >
              <MessageCircle size={20} />
              카카오로 시작하기
            </Link>
            <a
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-bold text-secondary transition hover:bg-surfaceAlt"
              href="#preview"
            >
              운영 흐름 보기
            </a>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-secondary">
            <span className="rounded-full bg-white px-3 py-2 shadow-soft">Kakao ID</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-soft">닉네임</span>
            <span className="rounded-full bg-white px-3 py-2 shadow-soft">프로필 이미지</span>
            <span className="rounded-full bg-[#E8F3FF] px-3 py-2 text-strategy shadow-soft">필수 정보만 저장</span>
          </div>
        </div>

        <section id="preview" className="rounded-2xl bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-strategy">Today</p>
              <h2 className="mt-1 text-xl font-bold">운영자가 먼저 볼 일</h2>
            </div>
            <Activity className="text-primary" size={24} />
          </div>

          <div className="mt-5 grid gap-3">
            {[
              ["미응답 4명", "마감 전 리마인드 필요", "warning"],
              ["대기자 2명", "취소 발생 시 자동 안내", "info"],
              ["노쇼 위험 1명", "최근 취소 이력 확인", "danger"]
            ].map(([title, description, tone]) => (
              <div className="rounded-xl border border-line bg-surfaceAlt p-4" key={title}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-bold">{title}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(tone)}`} />
                </div>
                <p className="mt-1 text-sm font-semibold text-secondary">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl bg-navy p-5 text-white">
            <p className="text-sm font-semibold text-white/60">다음 경기 응답률</p>
            <p className="mt-2 text-4xl font-bold">78%</p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/12">
              <div className="h-full w-[78%] rounded-full bg-[#22C55E]" />
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-10 sm:px-6 md:grid-cols-3">
        {[
          ["노쇼 감소", "마감 전 미응답, 지각 취소, 대기 전환을 운영자가 놓치지 않게 정리합니다."],
          ["신뢰도 기록", "출석 변경 이력을 남겨 시즌 통계와 멤버 신뢰도 계산의 기반을 만듭니다."],
          ["모바일 우선", "참석 신청, 상태 변경, 리마인드 같은 핵심 행동을 1~2번 안에 처리합니다."]
        ].map(([title, description]) => (
          <article className="rounded-2xl bg-white p-5 shadow-card" key={title}>
            <CheckCircle2 className="text-primary" size={22} />
            <h2 className="mt-4 text-lg font-bold">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-secondary">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function OnboardingStart({
  message,
  nickname
}: {
  message: string | null;
  nickname: string;
}) {
  return (
    <main className="min-h-screen bg-app text-ink">
      <header className="border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <Brand />
          <AuthActions nickname={nickname} />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:py-10">
        <div className="lg:sticky lg:top-8">
          <span className="inline-flex h-8 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
            첫 시작 설정
          </span>
          <h1 className="mt-4 text-[32px] font-bold leading-[1.18] sm:text-[42px]">
            지금 하려는 일을 선택해주세요
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-8 text-secondary">
            계정을 운영자와 참석자로 나누지 않습니다. 팀마다 역할을 다르게 가질 수 있도록 첫 행동만
            선택하고, 권한은 팀 멤버십에 저장합니다.
          </p>

          {message ? (
            <div className="mt-5 rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200]">
              {message}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 text-sm font-semibold text-secondary">
            <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-soft">
              <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={20} />
              <p>팀을 만들면 자동으로 Owner가 되고, 초대 코드는 새 멤버 진입에 사용됩니다.</p>
            </div>
            <div className="flex gap-3 rounded-2xl bg-white p-4 shadow-soft">
              <Users className="mt-0.5 shrink-0 text-strategy" size={20} />
              <p>초대받은 사람은 기본 Member로 들어오며, 운영자가 나중에 권한을 조정할 수 있습니다.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EE] text-primary">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">모임을 운영할게요</p>
                <h2 className="mt-1 text-2xl font-bold">새 팀을 만들고 참석 관리를 시작합니다</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
                  팀 이름과 종목만 먼저 저장합니다. 장소, 경기, 출석 방식은 다음 단계에서 확장합니다.
                </p>
              </div>
            </div>

            <form action={createOrganizerTeam} className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">팀 이름</span>
                <input
                  className="field-input"
                  name="teamName"
                  placeholder="예: 목요 풋살 크루"
                  type="text"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">종목</span>
                <select className="field-input" name="sportType" defaultValue="futsal">
                  <option value="futsal">풋살</option>
                  <option value="soccer">축구</option>
                  <option value="running">러닝</option>
                  <option value="study">스터디</option>
                  <option value="book">독서 모임</option>
                </select>
              </label>
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
                type="submit"
              >
                <Plus size={18} />
                팀 만들고 Owner로 시작
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F3FF] text-strategy">
                <UserRoundPlus size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-strategy">초대받은 모임에 참석할게요</p>
                <h2 className="mt-1 text-2xl font-bold">초대 코드로 팀에 들어갑니다</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
                  운영자에게 받은 코드나 링크를 입력하면 Member로 가입됩니다.
                </p>
              </div>
            </div>

            <form action={joinTeamByInvite} className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">초대 코드 또는 링크</span>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    className="field-input w-full pl-11"
                    name="inviteCode"
                    placeholder="예: ABCD1234"
                    type="text"
                  />
                </div>
              </label>
              <button
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-navy px-5 text-base font-bold text-white shadow-card transition hover:bg-[#243244]"
                type="submit"
              >
                <LogIn size={18} />
                Member로 참석 시작
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

type TeamSession = {
  id: string;
  name: string;
  role: string;
  inviteCode: string | null;
};

function OperatorDashboard({
  authMessage,
  nickname,
  team
}: {
  authMessage: string | null;
  nickname: string;
  team: TeamSession;
}) {
  return (
    <main className="min-h-screen bg-app pb-24 text-ink lg:pb-0">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-line bg-white px-4 py-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
          <Brand />
          <nav className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-8 lg:grid-cols-1">
            {navItems.map((item) => (
              <NavButton key={item.label} {...item} />
            ))}
          </nav>
          <div className="mt-8 hidden rounded-2xl bg-navy p-5 text-white shadow-card lg:block">
            <p className="text-xs font-semibold uppercase text-white/55">Today</p>
            <p className="mt-3 text-lg font-bold leading-7">미응답 4명에게 마감 전 리마인드가 필요합니다</p>
            <p className="mt-3 text-sm leading-6 text-white/64">노쇼 위험을 낮추는 운영 액션을 먼저 보여줍니다.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EE] text-primary">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-base font-bold">운영자 대시보드</p>
                  <p className="mt-1 text-sm text-secondary">{team.name}의 오늘 필요한 참석 관리 액션을 확인합니다.</p>
                </div>
              </div>
              <AuthActions nickname={nickname} />
            </div>
          </header>

          <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {authMessage ? (
              <div className="mb-6 rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200]">
                {authMessage}
              </div>
            ) : null}

            <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
                  {team.role === "owner" ? "Owner 대시보드" : "팀 대시보드"}
                </span>
                <h1 className="mt-3 max-w-3xl text-[30px] font-bold leading-10 sm:text-[34px]">
                  {team.name}의 참석 신뢰도를 한눈에 관리합니다
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary sm:text-base sm:leading-7">
                  미응답, 대기, 취소 흐름을 먼저 보여주고 운영자가 바로 리마인드할 수 있게 정리했습니다.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E8F3FF] px-4 text-sm font-semibold text-strategy transition hover:bg-[#DBEAFF]"
                  title={team.inviteCode ? `초대 코드: ${team.inviteCode}` : "초대 코드가 아직 없습니다"}
                  type="button"
                >
                  <Copy size={18} />
                  {team.inviteCode ? `초대 코드 ${team.inviteCode}` : "참가 링크"}
                </button>
                <Link
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
                  href="/meetings/new"
                >
                  <Plus size={18} />
                  새 모임
                </Link>
              </div>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summary.map((item) => (
                <SummaryCard key={item.label} {...item} />
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_392px]">
              <section className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">모임 목록</h2>
                    <p className="mt-1 text-sm text-secondary">운영 액션이 필요한 순서로 정렬합니다.</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surfaceAlt px-3 py-1 text-xs font-bold text-secondary">
                    <Timer size={14} />
                    마감 6시간 전
                  </span>
                </div>
                <div className="mt-5 grid gap-4">
                  {meetings.map((meeting, index) => (
                    <MeetingCard key={meeting.title} selected={index === 0} {...meeting} />
                  ))}
                </div>
              </section>

              <aside className="grid gap-5">
                <section className="rounded-2xl bg-white p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-[#E8F7EE] px-3 py-1 text-xs font-bold text-primary">
                        개최 확정
                      </span>
                      <h2 className="mt-4 text-2xl font-bold leading-8">목요일 풋살 정기전</h2>
                    </div>
                    <Activity className="text-primary" size={24} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-secondary">
                    신림 풋살파크 A구장에서 진행합니다. 미응답 멤버 리마인드와 대기자 전환 여부를 확인하세요.
                  </p>
                  <div className="mt-5 space-y-3 text-sm">
                    <InfoRow icon={Timer} label="일정" value="6월 27일(목) 오후 08:00" />
                    <InfoRow icon={MapPin} label="장소" value="신림 풋살파크 A구장" />
                    <InfoRow icon={Users} label="신청" value="참석 12명 · 대기 2명 · 미응답 4명" />
                  </div>
                  <div className="mt-5">
                    <ProgressBar value="78%" />
                    <p className="mt-2 text-xs font-semibold text-muted">응답률 78% · 목표 90%</p>
                  </div>
                  <button className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-[#12843D]">
                    <Send size={17} />
                    미응답 리마인드
                  </button>
                </section>

                <section className="rounded-2xl bg-navy p-5 text-white shadow-card">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-[#93C5FD]" size={20} />
                    <h2 className="text-lg font-bold">전술/운영 인사이트</h2>
                  </div>
                  <p className="mt-4 text-3xl font-bold">4-2-3-1</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    참석 확정 인원 기준 중앙 미드필더가 부족합니다. 대기자 중 CM 가능 멤버를 우선 확정하면
                    라인업 안정성이 높아집니다.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">추천</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">대기자 전환</span>
                  </div>
                </section>
              </aside>
            </section>
          </section>
        </section>
      </div>
      <MobileBottomNav />
    </main>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
        M
      </div>
      <div>
        <p className="text-lg font-bold leading-6">MoIja</p>
        <p className="text-xs font-semibold text-muted">모임참석 운영 플랫폼</p>
      </div>
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
      className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition lg:justify-start ${
        active ? "bg-[#E8F7EE] text-primary" : "text-secondary hover:bg-surfaceAlt hover:text-ink"
      }`}
      href={href}
    >
      <Icon size={18} />
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
      return { nickname: null, team: null };
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

    const { data: membership } = await supabase
      .from("team_members")
      .select("role, teams(id, name, invite_code)")
      .eq("profile_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    type TeamRecord = {
      id: string;
      name: string;
      invite_code: string | null;
    };

    const typedMembership = membership as
      | {
          role?: string;
          teams?: TeamRecord | TeamRecord[] | null;
        }
      | null;
    const joinedTeam = Array.isArray(typedMembership?.teams)
      ? typedMembership?.teams[0]
      : typedMembership?.teams;
    const team =
      joinedTeam && typedMembership?.role
        ? {
            id: joinedTeam.id,
            name: joinedTeam.name,
            role: typedMembership.role,
            inviteCode: joinedTeam.invite_code
          }
        : null;

    return { nickname, team };
  } catch {
    return { nickname: null, team: null };
  }
}

function AuthActions({ nickname }: { nickname: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-secondary">
        {nickname}
      </span>
      <form action="/api/auth/signout" method="post">
        <button
          className="inline-flex h-11 min-w-[96px] items-center justify-center rounded-xl bg-surfaceAlt px-4 text-sm font-semibold text-secondary transition hover:bg-line"
          type="submit"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  note,
  tone
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
  tone: string;
}) {
  const toneClass: Record<string, string> = {
    success: "bg-[#E8F7EE] text-primary",
    warning: "bg-[#FFF4E5] text-warning",
    info: "bg-[#E8F3FF] text-strategy",
    neutral: "bg-surfaceAlt text-secondary"
  };

  return (
    <article className="rounded-2xl bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-secondary">{label}</p>
        <span className={`h-2 w-2 rounded-full ${toneClass[tone].split(" ")[0]}`} />
      </div>
      <p className="mt-3 flex items-end gap-1">
        <span className="text-[34px] font-bold leading-10">{value}</span>
        <span className="pb-1 text-sm font-semibold text-secondary">{unit}</span>
      </p>
      <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClass[tone]}`}>{note}</p>
    </article>
  );
}

function MeetingCard({
  title,
  date,
  place,
  status,
  statusTone,
  attendance,
  progress,
  action,
  selected
}: {
  title: string;
  date: string;
  place: string;
  status: string;
  statusTone: string;
  attendance: { attending: number; pending: number; absent: number; expected: number };
  progress: string;
  action: string;
  selected?: boolean;
}) {
  const badgeClass =
    statusTone === "success" ? "bg-[#E8F7EE] text-primary" : "bg-[#E8F3FF] text-strategy";

  return (
    <article
      className={`rounded-2xl border bg-white p-4 transition ${
        selected ? "border-primary shadow-card" : "border-line hover:border-lineStrong"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{title}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>{status}</span>
          </div>
          <p className="mt-2 text-sm text-secondary">
            {date} · {place}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-bold text-warning">
          {action}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <StatusCount label="참석" value={attendance.attending} tone="text-primary" />
        <StatusCount label="미응답" value={attendance.pending} tone="text-warning" />
        <StatusCount label="불참" value={attendance.absent} tone="text-danger" />
        <StatusCount label="예상" value={attendance.expected} tone="text-strategy" />
      </div>
      <ProgressBar value={progress} />
    </article>
  );
}

function StatusCount({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <p className={`text-lg font-bold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
    </div>
  );
}

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
    <div className="flex gap-3">
      <Icon className="mt-0.5 shrink-0 text-muted" size={17} />
      <p>
        <span className="font-semibold text-secondary">{label}</span>
        <span className="mx-2 text-lineStrong">|</span>
        <span className="font-semibold text-ink">{value}</span>
      </p>
    </div>
  );
}

function ProgressBar({ value }: { value: string }) {
  return (
    <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surfaceAlt">
      <div className="h-full rounded-full bg-primary" style={{ width: value }} />
    </div>
  );
}

function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white px-2 py-2 shadow-raised lg:hidden">
      {bottomNav.map(({ label, icon: Icon, active }) => (
        <button
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${
            active ? "text-primary" : "text-muted"
          }`}
          key={label}
          type="button"
        >
          <Icon size={19} />
          {label}
        </button>
      ))}
    </nav>
  );
}

function statusDotClass(tone: string) {
  const toneClass: Record<string, string> = {
    warning: "bg-warning",
    info: "bg-strategy",
    danger: "bg-danger"
  };

  return toneClass[tone] ?? "bg-primary";
}
