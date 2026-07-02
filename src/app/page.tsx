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
  UserCheck,
  Timer,
  Trophy,
  UserRoundPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { createOrganizerTeam, joinTeamByInvite } from "@/app/onboarding/actions";
import { DashboardCacheHydrator } from "@/components/dashboard-cache-hydrator";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { attendanceStatusLabel } from "@/lib/attendance";
import type { DashboardMeeting } from "@/lib/dashboard-session";
import { formatMeetingDateTime } from "@/lib/meetings";
import { getDashboardSession, type TeamSession } from "@/lib/server/dashboard-data";
import { canManageTeamRole, teamRoleLabel } from "@/lib/team-management";

export const dynamic = "force-dynamic";

const navItems = [
  { label: "대시보드", icon: Grid2X2, href: "/", active: true },
  { label: "경기 생성", icon: CalendarPlus, href: "/meetings/new" },
  { label: "출석 체크", icon: ClipboardCheck, href: "/" },
  { label: "팀 관리", icon: Users, href: "/team" }
];

const bottomNav = [
  { label: "홈", icon: Grid2X2, href: "/", active: true },
  { label: "경기", icon: CalendarPlus, href: "/" },
  { label: "랭킹", icon: Trophy, href: "/" },
  { label: "팀", icon: Users, href: "/team" },
  { label: "내 정보", icon: ShieldCheck, href: "/profile" }
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
            경기 참석을 운영하려면 먼저 로그인하세요
          </h1>
          <p className="mt-4 text-base font-semibold leading-8 text-secondary">
            초대받은 경기의 참석 여부, 대기 상태, 리마인드, 내 기록을 로그인 후 바로 확인할 수 있습니다.
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
                <p className="text-sm font-bold text-primary">경기를 운영할게요</p>
                <h2 className="mt-1 text-2xl font-bold">새 팀을 만들고 참석 관리를 시작합니다</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
                  팀 이름과 종목만 먼저 저장합니다. 장소와 경기는 다음 단계에서 확장합니다.
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
  team
}: {
  team: TeamSession;
}) {
  return (
    <main className="min-h-screen bg-app pb-24 text-ink lg:pb-0">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-white px-4 py-3 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-5">
          <Brand />
          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-6 lg:grid-cols-1">
            {navItems.map((item) => (
              <NavButton key={item.label} {...item} />
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
                <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                  경기별 참석 현황을 빠르게 확인하고 상세 화면에서 운영합니다.
                </p>
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

            <section className="mt-5 rounded-2xl bg-white p-4 shadow-card sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">경기 목록</h2>
                  <p className="mt-1 text-sm text-secondary">카드를 선택하면 상세 화면에서 참석 현황과 운영 도구를 확인합니다.</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surfaceAlt px-3 py-1 text-xs font-bold text-secondary">
                  <Timer size={14} />
                  경기별 마감 표시
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {team.meetings.length > 0 ? (
                  team.meetings.map((meeting, index) => (
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
  team
}: {
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;

  return (
    <main className="min-h-screen bg-app pb-24 text-ink lg:pb-0">
      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-6">
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
        <p className="text-xs font-semibold text-muted">경기 참석 운영 플랫폼</p>
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

function MeetingCard({ meeting, selected }: { meeting: DashboardMeeting; selected?: boolean }) {
  const summary = meeting.attendanceSummary;

  return (
    <Link
      className={`rounded-2xl border bg-white p-4 transition ${
        selected ? "border-primary shadow-card" : "border-line hover:border-lineStrong"
      }`}
      href={`/meetings/${meeting.id}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold transition">
              {meeting.title}
            </span>
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
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-secondary sm:grid-cols-4">
        <StatusPill label="응답률" value={`${summary.responseRate}%`} />
        <StatusPill label="미응답" value={`${summary.unansweredCount}명`} />
        <StatusPill label="대기" value={`${summary.waitlistedCount}명`} />
        <StatusPill label="확정필요" value={`${summary.confirmationNeededCount}명`} />
      </div>
    </Link>
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
      <p className="mt-2 text-sm font-semibold leading-6 text-secondary">
        새 경기를 만들면 참석 마감과 운영 규칙이 이곳에 표시됩니다.
      </p>
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
      {bottomNav.map(({ label, icon: Icon, href, active }) => (
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
