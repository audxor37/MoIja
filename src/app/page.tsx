import {
  CalendarPlus,
  Grid2X2,
  KeyRound,
  LogIn,
  MapPin,
  MessageCircle,
  Plus,
  ShieldCheck,
  Siren,
  UserCheck,
  Timer,
  UserRoundPlus,
  Users
} from "lucide-react";
import { createOrganizerTeam, joinTeamByInvite } from "@/app/onboarding/actions";
import { ActionRow, AppShell, PrimaryAction, ScreenCard, StatCard, TopBar } from "@/components/app-shell";
import { DashboardCacheHydrator } from "@/components/dashboard-cache-hydrator";
import { DashboardMeetingList } from "@/components/dashboard-meeting-list";
import { HelpIcon } from "@/components/help-icon";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { RoutePendingLink, SubmitButton } from "@/components/pending-ui";
import { attendanceStatusLabel } from "@/lib/attendance";
import {
  getActiveDashboardNavItems,
  getMeetingFocusMetrics,
  getReliabilityDisplay,
  getUpcomingMeetingActions,
  type DashboardTone
} from "@/lib/dashboard-ux";
import { formatMeetingDateTime } from "@/lib/meetings";
import { getDashboardSession, type TeamSession } from "@/lib/server/dashboard-data";
import { canManageTeamRole, teamRoleLabel } from "@/lib/team-management";

export const dynamic = "force-dynamic";

const navIconByLabel = {
  홈: Grid2X2,
  경기: CalendarPlus,
  랭킹: ShieldCheck,
  팀: Users,
  MY: ShieldCheck
} as const;

const activeNavItems = getActiveDashboardNavItems();

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
      <OperatorDashboard team={session.team} />
    </>
  ) : (
    <>
      <DashboardCacheHydrator initialData={session} />
      <MemberDashboard team={session.team} />
    </>
  );
}

function PublicHome() {
  return (
    <main className="min-h-screen bg-app text-ink">
      <header className="border-b border-line bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <Brand />
          <RoutePendingLink
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 text-sm font-bold text-[#191600] transition hover:brightness-95"
            href="/auth/kakao-login"
          >
            <MessageCircle size={17} />
            카카오 로그인
          </RoutePendingLink>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[460px] px-4 py-8 sm:px-6 lg:py-14">
        <section className="w-full rounded-2xl bg-white p-5 shadow-card sm:p-7">
          <h1 className="text-center text-[34px] font-black leading-[1.1] sm:text-[42px]">MoIja</h1>

          <div className="mt-8 grid gap-3">
            <RoutePendingLink
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-5 text-base font-black text-[#191600] shadow-sm transition hover:brightness-95"
              href="/auth/kakao-login"
            >
              <MessageCircle size={20} />
              카카오로 시작하기
            </RoutePendingLink>
            <RoutePendingLink
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-surfaceAlt px-5 text-sm font-black text-secondary transition hover:bg-line"
              href="/auth/password"
            >
              <KeyRound size={18} />
              이메일로 로그인
            </RoutePendingLink>
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
        </div>

        <div className="grid gap-5">
          <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F7EE] text-primary">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">경기를 운영할게요</p>
                <h2 className="mt-1 text-2xl font-bold">팀 만들기</h2>
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
                  <option value="book">독서/정기 활동</option>
                </select>
              </label>
              <SubmitButton
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-bold text-white shadow-card transition hover:bg-[#12843D]"
                pendingLabel="팀 생성 중"
              >
                <Plus size={18} />
                팀 만들고 Owner로 시작
              </SubmitButton>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F3FF] text-strategy">
                <UserRoundPlus size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-strategy">초대받은 경기에 참석할게요</p>
                <h2 className="mt-1 text-2xl font-bold">초대 코드 참여</h2>
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
              <SubmitButton
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-navy px-5 text-base font-bold text-white shadow-card transition hover:bg-[#243244]"
                pendingLabel="참여 중"
              >
                <LogIn size={18} />
                Member로 참석 시작
              </SubmitButton>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}

function OperatorDashboard({
  team
}: {
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;

  return (
    <AppShell activePath="/">
      <TopBar title="홈" />
      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-appMuted">{team.role === "owner" ? "Owner" : "Manager"}</p>
            <h1 className="mt-1 text-[30px] font-black leading-tight text-white">{team.name}</h1>
          </div>
          <InviteCodeCopyButton inviteCode={team.inviteCode} />
        </div>

        {nextMeeting ? (
          <>
            <p className="mt-8 text-sm font-black text-appTextSoft">오늘 해야 할 일</p>
            <h2 className="mt-1 text-[28px] font-black leading-tight text-white">경기 운영</h2>
            <ScreenCard className="mt-4">
              <RoutePendingLink className="block" href={`/meetings/${nextMeeting.id}`}>
                <p className="text-xs font-black text-appMuted">{formatMeetingDateTime(nextMeeting.startsAt)}</p>
                <h3 className="mt-2 text-xl font-black leading-7 text-white">{nextMeeting.title}</h3>
                {nextMeeting.opponentName ? <p className="mt-1 text-sm font-bold text-cobalt">vs {nextMeeting.opponentName}</p> : null}
                <p className="mt-2 text-sm font-bold text-appTextSoft">{nextMeeting.locationNote ?? "장소 미정"}</p>
              </RoutePendingLink>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {getUpcomingMeetingActions(nextMeeting.attendanceSummary).slice(0, 4).map((action) => (
                  <StatCard active={action.label === "참석"} key={action.label} label={action.label} value={action.value} />
                ))}
              </div>
              <div className="mt-4">
                <PrimaryAction href={`/meetings/${nextMeeting.id}`}>경기 허브 보기</PrimaryAction>
              </div>
            </ScreenCard>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ActionRow icon="clipboardCheck" title="빠른 체크인" description="현장 출석 확인" href={`/meetings/${nextMeeting.id}/attendance`} />
              <ActionRow icon="users" title="라인업 작성" description="확정자 기준 편집" href={`/meetings/${nextMeeting.id}/lineup`} />
              <ActionRow icon="userPlus" title="용병 관리" description="초대와 참석 상태" href={`/meetings/${nextMeeting.id}/guests`} />
              <ActionRow icon="trophy" title="기록 입력" description="결과와 개인 기록" href={`/meetings/${nextMeeting.id}/record`} />
            </div>
          </>
        ) : (
          <ScreenCard className="mt-8">
            <h2 className="text-xl font-black text-white">아직 등록된 경기가 없습니다</h2>
            <div className="mt-4">
              <PrimaryAction href="/meetings/new">첫 경기 만들기</PrimaryAction>
            </div>
          </ScreenCard>
        )}

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white">팀 일정</h2>
            <RoutePendingLink className="text-xs font-black text-cobalt" href="/meetings">
              전체 보기
            </RoutePendingLink>
          </div>
          <DashboardMeetingList emptyState="operator" meetings={team.meetings} selectFirst />
        </section>
      </section>
    </AppShell>
  );
}

function MemberDashboard({
  team
}: {
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;
  const reliabilityDisplay = getReliabilityDisplay(team.reliability);

  return (
    <AppShell activePath="/">
      <TopBar title="홈" />
      <section className="mt-6">
        <p className="text-xs font-black uppercase tracking-wide text-appMuted">{teamRoleLabel(team.role)} 홈</p>
        <h1 className="mt-1 text-[30px] font-black leading-tight text-white">{team.name}</h1>

        {nextMeeting ? (
          <div className="mt-6 grid gap-4">
            <ScreenCard>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-lime">다음 경기</p>
                  <RoutePendingLink className="mt-2 block truncate text-2xl font-black text-white" href={`/meetings/${nextMeeting.id}`}>
                    {nextMeeting.title}
                  </RoutePendingLink>
                  {nextMeeting.opponentName ? <p className="mt-1 text-sm font-bold text-cobalt">vs {nextMeeting.opponentName}</p> : null}
                  <p className="mt-3 text-sm font-bold text-appTextSoft">
                    {formatMeetingDateTime(nextMeeting.startsAt)} · {nextMeeting.locationNote ?? "장소 미정"}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-appCardSoft px-3 py-2 text-xs font-black text-appTextSoft">
                  <UserCheck size={15} />
                  {attendanceStatusLabel(nextMeeting.myAttendanceStatus)}
                </span>
              </div>
            </ScreenCard>
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionRow icon="clipboardCheck" title="참석 응답" description="참석 상태 변경" href={`/meetings/${nextMeeting.id}/attendance`} />
              <ActionRow icon="users" title="내 라인업" description="공유된 배치 확인" href={`/meetings/${nextMeeting.id}/lineup`} />
            </div>
          </div>
        ) : (
          <MemberEmptyState />
        )}

        <section className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-white">참석 신뢰도</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${reliabilityToneClass(reliabilityDisplay.tone)}`}>
              {reliabilityDisplay.label}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatCard active label="신뢰도" value={`${team.reliability.score}`} />
            <StatCard label="참석률" value={`${team.reliability.attendanceRate}%`} />
            <StatCard label="연속" value={`${team.reliability.currentStreak}회`} />
          </div>
        </section>

        <section className="mt-5">
          <h2 className="mb-3 text-lg font-black text-white">팀 일정</h2>
          <DashboardMeetingList emptyState="member" meetings={team.meetings} />
        </section>
      </section>
    </AppShell>
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
    <RoutePendingLink
      className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition lg:justify-start ${
        active ? "bg-[#E8F7EE] text-primary" : "text-secondary hover:bg-surfaceAlt hover:text-ink"
      }`}
      href={href}
    >
      <Icon size={18} />
      <span>{label}</span>
    </RoutePendingLink>
  );
}

function AuthActions({ nickname }: { nickname: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-4 text-sm font-semibold text-secondary">
        {nickname}
      </span>
      <RoutePendingLink
        className="inline-flex h-11 min-w-[96px] items-center justify-center rounded-xl bg-surfaceAlt px-4 text-sm font-semibold text-secondary transition hover:bg-line"
        href="/profile"
      >
        내 정보
      </RoutePendingLink>
    </div>
  );
}

function ReliabilityPill({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${dark ? "bg-white/10" : "bg-surfaceAlt"}`}>
      <span className={`block text-xs ${dark ? "text-white/60" : "text-muted"}`}>{label}</span>
      <span className={`mt-1 block text-lg font-black ${dark ? "text-white" : "text-ink"}`}>{value}</span>
    </div>
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

function MemberEmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-lineStrong bg-surfaceAlt p-6 text-center">
      <p className="text-lg font-bold">예정된 경기가 없습니다</p>
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
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white px-2 py-2 shadow-raised lg:hidden">
      {activeNavItems.map(({ label, href }) => {
        const Icon = navIconByLabel[label];
        const active = href === "/";
        return (
        <RoutePendingLink
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${
            active ? "text-primary" : "text-muted"
          }`}
          href={href}
          key={label}
        >
          <Icon size={19} />
          {label}
        </RoutePendingLink>
        );
      })}
    </nav>
  );
}

function operatorActionToneClass(tone: DashboardTone) {
  const classes: Record<DashboardTone, string> = {
    success: "bg-[#E8F7EE] text-primary",
    info: "bg-[#E8F3FF] text-strategy",
    warning: "bg-[#FFF4E5] text-warning",
    danger: "bg-[#FFF1F1] text-danger",
    muted: "bg-white/10 text-white"
  };

  return classes[tone];
}

function reliabilityToneClass(tone: DashboardTone) {
  const classes: Record<DashboardTone, string> = {
    success: "bg-[#E8F7EE] text-primary",
    info: "bg-[#E8F3FF] text-strategy",
    warning: "bg-[#FFF4E5] text-warning",
    danger: "bg-[#FFF1F1] text-danger",
    muted: "bg-white/10 text-white"
  };

  return classes[tone];
}
