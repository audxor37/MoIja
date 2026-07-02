import {
  Activity,
  BarChart3,
  CalendarPlus,
  ClipboardCheck,
  Grid2X2,
  KeyRound,
  LogIn,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  ShieldCheck,
  UserCheck,
  Timer,
  Trophy,
  UserRoundPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { createOrganizerTeam, joinTeamByInvite } from "@/app/onboarding/actions";
import { DashboardCacheHydrator } from "@/components/dashboard-cache-hydrator";
import { DeleteMeetingButton } from "@/components/delete-meeting-button";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { attendanceStatusLabel } from "@/lib/attendance";
import type { DashboardMeeting } from "@/lib/dashboard-session";
import { formatMeetingDateTime } from "@/lib/meetings";
import { getDashboardSession, type TeamSession } from "@/lib/server/dashboard-data";
import { canManageTeamRole, teamRoleLabel } from "@/lib/team-management";

const navItems = [
  { label: "대시보드", icon: Grid2X2, href: "/", active: true },
  { label: "모임 생성", icon: CalendarPlus, href: "/meetings/new" },
  { label: "출석 체크", icon: ClipboardCheck, href: "/" },
  { label: "팀 관리", icon: Users, href: "/team" }
];

const bottomNav = [
  { label: "홈", icon: Grid2X2, active: true },
  { label: "경기", icon: CalendarPlus },
  { label: "랭킹", icon: Trophy },
  { label: "팀", icon: Users },
  { label: "내 정보", icon: ShieldCheck }
];

export default async function Home() {
  const session = await getDashboardSession();

  if (!session.nickname) {
    return (
      <>
        <DashboardCacheHydrator initialData={session} />
        <PublicHome />
      </>
    );
  }

  if (!session.team) {
    return (
      <>
        <DashboardCacheHydrator initialData={session} />
        <OnboardingStart nickname={session.nickname} />
      </>
    );
  }

  return canManageTeamRole(session.team.role) ? (
    <>
      <DashboardCacheHydrator initialData={session} />
      <OperatorDashboard nickname={session.nickname} team={session.team} />
    </>
  ) : (
    <>
      <DashboardCacheHydrator initialData={session} />
      <MemberDashboard nickname={session.nickname} team={session.team} />
    </>
  );
}

function PublicHome() {
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

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-12">
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-7">
          <span className="inline-flex h-8 items-center rounded-full bg-[#E8F7EE] px-3 text-xs font-bold text-primary">
            로그인 필요
          </span>
          <h1 className="mt-4 text-[32px] font-bold leading-[1.18] sm:text-[42px]">
            모임 참석을 운영하려면 먼저 로그인하세요
          </h1>
          <p className="mt-4 text-base font-semibold leading-8 text-secondary">
            초대받은 모임의 참석 여부, 대기 상태, 리마인드, 내 기록을 로그인 후 바로 확인할 수 있습니다.
          </p>

          <div className="mt-6 grid gap-3">
            <Link
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-5 text-base font-black text-[#191600] shadow-sm transition hover:brightness-95"
              href="/auth/kakao-login"
            >
              <MessageCircle size={20} />
              카카오로 계속하기
            </Link>
            <Link
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-surfaceAlt px-5 text-sm font-black text-secondary transition hover:bg-line"
              href="/auth/password"
            >
              <KeyRound size={18} />
              이메일로 로그인
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function OnboardingStart({ nickname }: { nickname: string }) {
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
            지금 하려는 일을 선택해 주세요
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-8 text-secondary">
            계정은 아직 운영자나 참석자로 나뉘지 않았습니다. 팀마다 역할을 다르게 가질 수 있도록 첫 행동만 선택합니다.
          </p>
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
                  팀 이름과 종목만 먼저 저장합니다. 장소와 모임은 다음 단계에서 확장합니다.
                </p>
              </div>
            </div>

            <form action={createOrganizerTeam} className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">팀 이름</span>
                <input className="field-input" name="teamName" placeholder="예: 목요일 풋살 크루" type="text" />
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
                  운영자에게 받은 코드나 링크를 입력하면 Member로 참여합니다.
                </p>
              </div>
            </div>

            <form action={joinTeamByInvite} className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-secondary">초대 코드 또는 링크</span>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input className="field-input w-full pl-11" name="inviteCode" placeholder="예: ABCD1234" type="text" />
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

function OperatorDashboard({
  nickname,
  team
}: {
  nickname: string;
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;
  const nextSummary = nextMeeting?.attendanceSummary ?? {
    responseRate: 0,
    unansweredCount: 0,
    waitlistedCount: 0,
    confirmationNeededCount: 0
  };

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
            <p className="mt-3 text-lg font-bold leading-7">
              {nextMeeting ? `${nextMeeting.title} 참석 응답을 확인하세요` : "첫 모임을 만들고 참석 흐름을 시작하세요"}
            </p>
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
                  <p className="mt-1 text-sm text-secondary">{team.name}의 참석 관리 액션을 확인합니다</p>
                </div>
              </div>
              <AuthActions nickname={nickname} />
            </div>
          </header>

          <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
                  {team.role === "owner" ? "Owner 대시보드" : "팀 대시보드"}
                </span>
                <h1 className="mt-3 max-w-3xl text-[30px] font-bold leading-10 sm:text-[34px]">
                  {team.name}의 모임과 참석 신뢰도를 관리합니다
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary sm:text-base sm:leading-7">
                  생성한 모임을 기준으로 참석 마감, 대기 허용, 출석 방식을 기록합니다.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <InviteCodeCopyButton inviteCode={team.inviteCode} />
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
              <SummaryCard label="응답률" value={String(nextSummary.responseRate)} unit="%" tone="success" note="다음 모임 기준" />
              <SummaryCard label="미응답" value={String(nextSummary.unansweredCount)} unit="명" tone="warning" note="리마인드 대상" />
              <SummaryCard label="대기" value={String(nextSummary.waitlistedCount)} unit="명" tone="info" note="전환 후보" />
              <SummaryCard label="확정 필요" value={String(nextSummary.confirmationNeededCount)} unit="명" tone="neutral" note="정원 대비" />
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_392px]">
              <section className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">모임 목록</h2>
                    <p className="mt-1 text-sm text-secondary">생성한 모임을 수정하거나 삭제할 수 있습니다.</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surfaceAlt px-3 py-1 text-xs font-bold text-secondary">
                    <Timer size={14} />
                    마감 시간 자동 계산
                  </span>
                </div>
                <div className="mt-5 grid gap-4">
                  {team.meetings.length > 0 ? (
                    team.meetings.map((meeting, index) => (
                      <MeetingCard key={meeting.id} meeting={meeting} selected={index === 0} />
                    ))
                  ) : (
                    <EmptyMeetings />
                  )}
                </div>
              </section>

              <aside className="grid gap-5">
                <section className="rounded-2xl bg-white p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full bg-[#E8F7EE] px-3 py-1 text-xs font-bold text-primary">
                        다음 운영 액션
                      </span>
                      <h2 className="mt-4 text-2xl font-bold leading-8">
                        {nextMeeting ? nextMeeting.title : "새 모임 생성"}
                      </h2>
                    </div>
                    <Activity className="text-primary" size={24} />
                  </div>
                  {nextMeeting ? (
                    <div className="mt-5 space-y-3 text-sm">
                      <InfoRow icon={Timer} label="일정" value={formatMeetingDateTime(nextMeeting.startsAt)} />
                      <InfoRow icon={MapPin} label="장소" value={nextMeeting.locationNote ?? "장소 미정"} />
                      <InfoRow icon={Users} label="운영" value={`${nextMeeting.capacity ?? "-"}명 · ${nextMeeting.allowWaitlist ? "대기 허용" : "대기 없음"}`} />
                    </div>
                  ) : (
                    <p className="mt-4 text-sm font-semibold leading-7 text-secondary">
                      첫 모임을 만들면 이 영역에서 마감, 장소, 참석 방식이 바로 보입니다.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl bg-navy p-5 text-white shadow-card">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-[#93C5FD]" size={20} />
                    <h2 className="text-lg font-bold">운영 인사이트</h2>
                  </div>
                  <p className="mt-4 text-3xl font-bold">CRUD 준비 완료</p>
                  <p className="mt-3 text-sm leading-6 text-white/70">
                    응답률과 미응답, 대기 인원을 기준으로 다음 운영 액션을 먼저 확인합니다.
                  </p>
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

function MemberDashboard({
  nickname,
  team
}: {
  nickname: string;
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;

  return (
    <main className="min-h-screen bg-app pb-24 text-ink lg:pb-0">
      <header className="border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Brand />
          <AuthActions nickname={nickname} />
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
            {teamRoleLabel(team.role)} 홈
          </span>
          <h1 className="mt-3 text-[30px] font-bold leading-10">{team.name}의 내 다음 경기</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-secondary">
            참석 신청과 현재 상태를 먼저 확인합니다. 운영 확정과 노쇼 처리는 운영자가 관리합니다.
          </p>
          {nextMeeting ? (
            <article className="mt-6 rounded-2xl border border-primary bg-[#F8FEFA] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-primary">다음 경기</p>
                  <Link className="mt-1 block text-2xl font-bold hover:text-primary" href={`/meetings/${nextMeeting.id}`}>
                    {nextMeeting.title}
                  </Link>
                  <p className="mt-3 text-sm font-semibold text-secondary">
                    {formatMeetingDateTime(nextMeeting.startsAt)} · {nextMeeting.locationNote ?? "장소 미정"}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-secondary">
                  <UserCheck size={16} />
                  {attendanceStatusLabel(nextMeeting.myAttendanceStatus)}
                </span>
              </div>
              <Link
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white sm:w-auto"
                href={`/meetings/${nextMeeting.id}`}
              >
                <ClipboardCheck size={17} />
                참석 상태 변경
              </Link>
            </article>
          ) : (
            <EmptyMemberMeetings />
          )}
        </section>

        <aside className="grid gap-5">
          <section className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold">내 상태</h2>
            <div className="mt-4 grid gap-3">
              <StatusPill label="역할" value={teamRoleLabel(team.role)} />
              <StatusPill label="다음 응답" value={nextMeeting ? attendanceStatusLabel(nextMeeting.myAttendanceStatus) : "대기 중"} />
              <StatusPill label="예정 경기" value={`${team.meetings.length}개`} />
            </div>
          </section>
          <section className="rounded-2xl bg-navy p-5 text-white shadow-card">
            <h2 className="text-lg font-bold">참석 신뢰도</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              참석, 불참, 대기 응답을 경기 전에 남기면 운영자가 정원과 대기 전환을 더 정확히 관리할 수 있습니다.
            </p>
          </section>
        </aside>
      </section>
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
        <p className="text-xs font-semibold text-muted">모임 참석 운영 플랫폼</p>
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
        {unit ? <span className="pb-1 text-sm font-semibold text-secondary">{unit}</span> : null}
      </p>
      <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClass[tone]}`}>{note}</p>
    </article>
  );
}

function MeetingCard({ meeting, selected }: { meeting: DashboardMeeting; selected?: boolean }) {
  return (
    <article
      className={`rounded-2xl border bg-white p-4 transition ${
        selected ? "border-primary shadow-card" : "border-line hover:border-lineStrong"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="text-lg font-bold transition hover:text-primary" href={`/meetings/${meeting.id}`}>
              {meeting.title}
            </Link>
            <span className="rounded-full bg-[#E8F7EE] px-3 py-1 text-xs font-bold text-primary">등록됨</span>
          </div>
          <p className="mt-2 text-sm text-secondary">
            {formatMeetingDateTime(meeting.startsAt)} · {meeting.locationNote ?? "장소 미정"}
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-bold text-warning">
          {meeting.attendanceClosesAt ? `${formatMeetingDateTime(meeting.attendanceClosesAt)} 마감` : "마감 미정"}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-semibold text-secondary sm:grid-cols-3">
        <StatusPill label="정원" value={meeting.capacity ? `${meeting.capacity}명` : "미정"} />
        <StatusPill label="대기" value={meeting.allowWaitlist ? "허용" : "없음"} />
        <StatusPill label="출석" value={attendanceMethodLabel(meeting.attendanceMethod)} />
      </div>
      {meeting.canManage ? (
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-surfaceAlt px-4 text-sm font-bold text-secondary transition hover:bg-line"
            href={`/meetings/${meeting.id}/edit`}
          >
            <Pencil size={16} />
            수정
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-[#12843D]"
            href={`/meetings/${meeting.id}`}
          >
            상세
          </Link>
          <DeleteMeetingButton meetingId={meeting.id} />
        </div>
      ) : (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-sm font-semibold text-muted">생성자 또는 운영 권한이 있는 멤버만 수정/삭제할 수 있습니다.</p>
        </div>
      )}
    </article>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surfaceAlt px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="ml-2 text-ink">{value}</span>
    </div>
  );
}

function EmptyMeetings() {
  return (
    <div className="rounded-2xl border border-dashed border-lineStrong bg-surfaceAlt p-6 text-center">
      <p className="text-lg font-bold">아직 등록된 모임이 없습니다</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
        새 모임을 만들면 참석 마감과 운영 규칙이 이곳에 표시됩니다.
      </p>
      <Link
        className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white"
        href="/meetings/new"
      >
        <Plus size={17} />
        첫 모임 만들기
      </Link>
    </div>
  );
}

function EmptyMemberMeetings() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-lineStrong bg-surfaceAlt p-6 text-center">
      <p className="text-lg font-bold">예정된 경기가 없습니다</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
        운영자가 경기를 만들면 여기서 참석 상태를 바로 남길 수 있습니다.
      </p>
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

function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-white px-2 py-2 shadow-raised lg:hidden">
      {bottomNav.map(({ label, icon: Icon, active }) => (
        <Link
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${
            active ? "text-primary" : "text-muted"
          }`}
          href={label === "팀" ? "/team" : "/"}
          key={label}
        >
          <Icon size={19} />
          {label}
        </Link>
      ))}
    </nav>
  );
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
