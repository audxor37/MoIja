import {
  CalendarPlus,
  ClipboardCheck,
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
import Link from "next/link";
import { createOrganizerTeam, joinTeamByInvite } from "@/app/onboarding/actions";
import { AttendanceResponsePanel } from "@/components/attendance-response-panel";
import { DashboardCacheHydrator } from "@/components/dashboard-cache-hydrator";
import { HelpIcon } from "@/components/help-icon";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { attendanceStatusLabel } from "@/lib/attendance";
import type { DashboardMeeting } from "@/lib/dashboard-session";
import {
  filterDashboardMeetings,
  getActiveDashboardNavItems,
  getMeetingFocusMetrics,
  getReliabilityDisplay,
  getUpcomingMeetingActions,
  meetingListFilters,
  normalizeMeetingListFilter,
  type DashboardTone,
  type MeetingListFilter
} from "@/lib/dashboard-ux";
import { formatMeetingDateTime } from "@/lib/meetings";
import { getDashboardSession, type TeamSession } from "@/lib/server/dashboard-data";
import { canManageTeamRole, teamRoleLabel } from "@/lib/team-management";

export const dynamic = "force-dynamic";

const navIconByLabel = {
  홈: Grid2X2,
  "새 경기": CalendarPlus,
  팀: Users,
  "내 정보": ShieldCheck
} as const;

const activeNavItems = getActiveDashboardNavItems();

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ meetingFilter?: string }>;
}) {
  const params = await searchParams;
  const meetingFilter = normalizeMeetingListFilter(params?.meetingFilter);
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
      <OperatorDashboard meetingFilter={meetingFilter} team={session.team} />
    </>
  ) : (
    <>
      <DashboardCacheHydrator initialData={session} />
      <MemberDashboard meetingFilter={meetingFilter} team={session.team} />
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

      <section className="mx-auto flex w-full max-w-[460px] px-4 py-8 sm:px-6 lg:py-14">
        <section className="w-full rounded-2xl bg-white p-5 shadow-card sm:p-7">
          <h1 className="text-center text-[34px] font-black leading-[1.1] sm:text-[42px]">MoIja</h1>

          <div className="mt-8 grid gap-3">
            <Link
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#FEE500] px-5 text-base font-black text-[#191600] shadow-sm transition hover:brightness-95"
              href="/auth/kakao-login"
            >
              <MessageCircle size={20} />
              카카오로 시작하기
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
  meetingFilter,
  team
}: {
  meetingFilter: MeetingListFilter;
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;
  const nextMeetingMetrics = nextMeeting ? getMeetingFocusMetrics(nextMeeting.attendanceSummary) : [];
  const filteredMeetings = filterDashboardMeetings(team.meetings, meetingFilter);

  return (
    <main className="min-h-screen bg-app pb-24 text-ink lg:pb-0">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-white px-4 py-3 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
          <Brand />
          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-6 lg:grid-cols-1">
            {activeNavItems.map((item) => (
              <NavButton
                key={item.label}
                active={item.href === "/"}
                href={item.href}
                icon={navIconByLabel[item.label]}
                label={item.label}
              />
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <section className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
                  {team.role === "owner" ? "Owner 대시보드" : "팀 대시보드"}
                </span>
                <h1 className="mt-2 max-w-3xl text-[26px] font-bold leading-9 sm:text-[32px]">
                  {team.name} 경기 관리
                </h1>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <InviteCodeCopyButton inviteCode={team.inviteCode} />
                <Link
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-card transition hover:bg-[#12843D]"
                  href="/meetings/new"
                >
                  <Plus size={18} />
                  새 경기
                </Link>
              </div>
            </section>

            {nextMeeting ? (
              <section className="mt-5 overflow-hidden rounded-2xl bg-navy text-white shadow-card">
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white/70">오늘/다음 경기 운영</p>
                      <Link className="mt-1 block truncate text-2xl font-bold" href={`/meetings/${nextMeeting.id}`}>
                        {nextMeeting.title}
                      </Link>
                      <p className="mt-2 text-sm font-semibold text-white/70">
                        {formatMeetingDateTime(nextMeeting.startsAt)} · {nextMeeting.locationNote ?? "장소 미정"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
                      {nextMeetingMetrics.map((metric) => (
                        <Link
                          className={`min-h-16 rounded-xl px-3 py-2.5 ${operatorActionToneClass(metric.tone)}`}
                          href={`/meetings/${nextMeeting.id}`}
                          key={metric.label}
                        >
                          <span className="block text-[11px] font-bold opacity-75">{metric.label}</span>
                          <span className="mt-1 block text-2xl font-black leading-7">{metric.value}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {getUpcomingMeetingActions(nextMeeting.attendanceSummary).map((action) => (
                      <Link
                        className={`rounded-xl px-3 py-2 ${operatorActionToneClass(action.tone)}`}
                        href={`/meetings/${nextMeeting.id}`}
                        key={action.label}
                      >
                        <span className="block text-[11px] font-bold opacity-75">{action.label}</span>
                        <span className="mt-1 block text-lg font-black leading-6">{action.value}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[460px]">
                    <Link
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-navy"
                      href={`/meetings/${nextMeeting.id}#attendance`}
                    >
                      <ClipboardCheck size={17} />
                      출석 운영
                    </Link>
                    <Link
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold text-white"
                      href={`/meetings/${nextMeeting.id}#cycle`}
                    >
                      <Users size={17} />
                      용병/라인업
                    </Link>
                    <Link
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-bold text-white"
                      href={`/meetings/${nextMeeting.id}#attendance`}
                    >
                      <Siren size={17} />
                      노쇼 처리
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="mt-5 rounded-2xl bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">경기 목록</h2>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surfaceAlt px-3 py-1 text-xs font-bold text-secondary">
                  <Timer size={14} />
                  경기별 마감 표시
                </span>
              </div>
              <MeetingFilterBar activeFilter={meetingFilter} />
              <div className="mt-4 grid gap-3">
                {filteredMeetings.length > 0 ? (
                  filteredMeetings.map((meeting, index) => (
                    <MeetingCard key={meeting.id} meeting={meeting} selected={index === 0} />
                  ))
                ) : (
                  <EmptyMeetings />
                )}
              </div>
            </section>
          </section>
        </section>
      </div>
      <MobileBottomNav />
    </main>
  );
}

function MemberDashboard({
  meetingFilter,
  team
}: {
  meetingFilter: MeetingListFilter;
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;
  const reliabilityDisplay = getReliabilityDisplay(team.reliability);
  const filteredMeetings = filterDashboardMeetings(team.meetings, meetingFilter);

  return (
    <main className="min-h-screen bg-app pb-24 text-ink lg:pb-0">
      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-6">
        <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
          <span className="inline-flex h-7 items-center rounded-full bg-[#E8F3FF] px-3 text-xs font-bold text-strategy">
            {teamRoleLabel(team.role)} 홈
          </span>
          <h1 className="mt-3 text-[30px] font-bold leading-10">{team.name}의 내 다음 행동</h1>
          {nextMeeting ? (
            <div className="mt-6 grid gap-4">
              <article className="rounded-2xl border border-primary bg-[#F8FEFA] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-primary">다음 경기</p>
                    <Link className="mt-1 block text-2xl font-bold hover:text-primary" href={`/meetings/${nextMeeting.id}`}>
                      {nextMeeting.title}
                    </Link>
                    <p className="mt-3 text-sm font-semibold text-secondary">
                      {formatMeetingDateTime(nextMeeting.startsAt)} · {nextMeeting.locationNote ?? "장소 미정"}
                    </p>
                    <p className="mt-2 text-xs font-bold text-muted">
                      {nextMeeting.attendanceClosesAt ? `${formatMeetingDateTime(nextMeeting.attendanceClosesAt)} 마감` : "마감 미정"}
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-bold text-secondary">
                    <UserCheck size={16} />
                    {attendanceStatusLabel(nextMeeting.myAttendanceStatus)}
                  </span>
                </div>
              </article>
              <AttendanceResponsePanel
                allowWaitlist={nextMeeting.allowWaitlist}
                initialStatus={nextMeeting.myAttendanceStatus}
                meetingId={nextMeeting.id}
              />
              <section className="rounded-2xl bg-white p-4 shadow-card">
                <h2 className="text-lg font-bold">경기 목록</h2>
                <MeetingFilterBar activeFilter={meetingFilter} />
                <div className="mt-4 grid gap-3">
                  {filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))
                  ) : (
                    <EmptyMemberMeetings />
                  )}
                </div>
              </section>
            </div>
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">참석 신뢰도</h2>
                  <HelpIcon title="참석 신뢰도">
                    참석 응답과 실제 출석 흐름을 함께 보는 운영 지표입니다. 노쇼가 있으면 회복 상태로 표시됩니다.
                  </HelpIcon>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${reliabilityToneClass(reliabilityDisplay.tone)}`}>
                {reliabilityDisplay.label}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ReliabilityPill label="점수" value={`${team.reliability.score}점`} dark />
              <ReliabilityPill label="참석률" value={`${team.reliability.attendanceRate}%`} dark />
              <ReliabilityPill label="노쇼" value={`${team.reliability.noShowCount}회`} dark />
              <ReliabilityPill label="연속 참석" value={`${team.reliability.currentStreak}회`} dark />
            </div>
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
      <Link
        className="inline-flex h-11 min-w-[96px] items-center justify-center rounded-xl bg-surfaceAlt px-4 text-sm font-semibold text-secondary transition hover:bg-line"
        href="/profile"
      >
        내 정보
      </Link>
    </div>
  );
}

function MeetingFilterBar({ activeFilter }: { activeFilter: MeetingListFilter }) {
  return (
    <nav className="sticky top-0 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto border-y border-line bg-white px-4 py-2 sm:mx-0 sm:rounded-xl sm:border sm:bg-surfaceAlt">
      {meetingListFilters.map((filter) => {
        const active = filter.value === activeFilter;
        return (
          <Link
            className={`inline-flex h-9 shrink-0 items-center rounded-full px-3 text-xs font-black transition ${
              active ? "bg-ink text-white" : "bg-white text-secondary hover:text-ink"
            }`}
            href={filter.value === "upcoming" ? "/" : `/?meetingFilter=${filter.value}`}
            key={filter.value}
          >
            {filter.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MeetingCard({ meeting, selected }: { meeting: DashboardMeeting; selected?: boolean }) {
  const summary = meeting.attendanceSummary;
  const focusMetrics = getMeetingFocusMetrics(summary);

  return (
    <Link
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
    </Link>
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

function EmptyMeetings() {
  return (
    <div className="rounded-2xl border border-dashed border-lineStrong bg-surfaceAlt p-6 text-center">
      <p className="text-lg font-bold">아직 등록된 경기가 없습니다</p>
      <Link
        className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white"
        href="/meetings/new"
      >
        <Plus size={17} />
        첫 경기 만들기
      </Link>
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
        <Link
          className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold ${
            active ? "text-primary" : "text-muted"
          }`}
          href={href}
          key={label}
        >
          <Icon size={19} />
          {label}
        </Link>
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

function attendanceMethodLabel(value: string) {
  const labels: Record<string, string> = {
    manual: "수동",
    qr: "QR",
    gps: "GPS",
    gps_approval: "GPS 승인"
  };

  return labels[value] ?? "수동";
}
