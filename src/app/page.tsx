import {
  Activity,
  BarChart3,
  Bell,
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
  Timer,
  Trash2,
  Trophy,
  UserRoundPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { createOrganizerTeam, joinTeamByInvite } from "@/app/onboarding/actions";
import { deleteMeeting } from "@/app/meetings/actions";
import { InviteCodeCopyButton } from "@/components/invite-code-copy-button";
import { canManageMeeting, formatMeetingDateTime } from "@/lib/meetings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navItems = [
  { label: "대시보드", icon: Grid2X2, href: "/", active: true },
  { label: "모임 생성", icon: CalendarPlus, href: "/meetings/new" },
  { label: "출석 체크", icon: ClipboardCheck, href: "/" },
  { label: "공지/리마인드", icon: Bell, href: "/" }
];

const authMessages: Record<string, string> = {
  callback_failed: "카카오 로그인 처리 중 문제가 발생했습니다. Supabase와 Kakao 설정을 확인해 주세요.",
  kakao_start_failed: "카카오 로그인 주소를 만들지 못했습니다. Kakao provider 설정을 확인해 주세요.",
  missing_code: "로그인 인증 코드가 전달되지 않았습니다. 다시 시도해 주세요.",
  profile_failed: "로그인은 완료됐지만 프로필 저장에 실패했습니다. profiles RLS와 스키마를 확인해 주세요.",
  user_missing: "로그인 세션을 확인하지 못했습니다. 다시 시도해 주세요.",
  supabase_env_missing: "Supabase 환경 변수가 아직 설정되지 않았습니다. .env.local을 먼저 준비해 주세요."
};

const onboardingErrors: Record<string, string> = {
  auth_required: "로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.",
  join_failed: "초대 코드를 찾지 못했습니다. 운영자에게 받은 코드를 다시 확인해 주세요.",
  owner_member_failed: "팀은 생성됐지만 운영자 권한 연결에 실패했습니다. team_members RLS를 확인해 주세요.",
  profile_failed: "프로필 저장에 실패했습니다. profiles RLS와 스키마를 확인해 주세요.",
  team_create_failed: "팀 생성에 실패했습니다. teams 스키마와 RLS를 확인해 주세요."
};

const meetingMessages: Record<string, string> = {
  auth_required: "로그인이 필요합니다. 다시 로그인해 주세요.",
  permission_denied: "모임을 관리할 Owner 또는 Manager 권한이 필요합니다.",
  create_failed: "모임 저장에 실패했습니다. Supabase 마이그레이션 적용 여부를 확인해 주세요.",
  update_failed: "모임 수정에 실패했습니다.",
  delete_failed: "모임 삭제에 실패했습니다.",
  missing_meeting: "모임 정보를 찾지 못했습니다."
};

const bottomNav = [
  { label: "홈", icon: Grid2X2, active: true },
  { label: "경기", icon: CalendarPlus },
  { label: "랭킹", icon: Trophy },
  { label: "팀", icon: Users },
  { label: "내 정보", icon: ShieldCheck }
];

type DashboardMeeting = {
  id: string;
  title: string;
  startsAt: string;
  locationNote: string | null;
  capacity: number | null;
  allowWaitlist: boolean;
  attendanceMethod: string;
  attendanceClosesAt: string | null;
  canManage: boolean;
};

type TeamSession = {
  id: string;
  name: string;
  role: string;
  inviteCode: string | null;
  meetings: DashboardMeeting[];
};

type MatchRow = {
  id: string;
  title: string;
  starts_at: string;
  created_by: string | null;
  location_note?: string | null;
  capacity: number | null;
  allow_waitlist?: boolean | null;
  attendance_method: string;
  attendance_closes_at: string | null;
};

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{
    auth_error?: string;
    onboarding_error?: string;
    onboarding_message?: string;
    meeting_error?: string;
    meeting_message?: string;
  }>;
}) {
  const params = await searchParams;
  const authMessage = params?.auth_error ? authMessages[params.auth_error] : null;
  const onboardingError = params?.onboarding_error ? onboardingErrors[params.onboarding_error] : null;
  const meetingError = params?.meeting_error ? meetingMessages[params.meeting_error] : null;
  const onboardingMessage = params?.onboarding_message ?? null;
  const meetingMessage = params?.meeting_message ?? null;
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
      message={authMessage || meetingError || meetingMessage}
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

          {authMessage ? (
            <Notice tone="warning" className="mt-5">
              {authMessage}
            </Notice>
          ) : null}

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

function OnboardingStart({ message, nickname }: { message: string | null; nickname: string }) {
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

          {message ? (
            <Notice tone="warning" className="mt-5">
              {message}
            </Notice>
          ) : null}
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
  message,
  nickname,
  team
}: {
  message: string | null;
  nickname: string;
  team: TeamSession;
}) {
  const nextMeeting = team.meetings[0] ?? null;
  const totalCapacity = team.meetings.reduce((sum, meeting) => sum + (meeting.capacity ?? 0), 0);

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
            {message ? (
              <Notice tone="warning" className="mb-6">
                {message}
              </Notice>
            ) : null}

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
              <SummaryCard label="등록된 모임" value={String(team.meetings.length)} unit="개" tone="success" note="운영 중" />
              <SummaryCard label="예상 정원" value={String(totalCapacity)} unit="명" tone="info" note="합산 기준" />
              <SummaryCard label="다음 모임" value={nextMeeting ? "1" : "0"} unit="개" tone="warning" note="가장 가까운 일정" />
              <SummaryCard label="출석 방식" value={nextMeeting ? attendanceMethodLabel(nextMeeting.attendanceMethod) : "-"} unit="" tone="neutral" note="다음 모임 기준" />
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
                    모임 생성, 수정, 삭제가 기록되면 다음 단계에서 참석 응답과 신뢰도 계산을 붙일 수 있습니다.
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

async function getCurrentSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return { nickname: null, team: null };
    }

    const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle();
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

    type TeamRecord = { id: string; name: string; invite_code: string | null };
    const typedMembership = membership as
      | {
          role?: string;
          teams?: TeamRecord | TeamRecord[] | null;
        }
      | null;
    const joinedTeam = Array.isArray(typedMembership?.teams)
      ? typedMembership?.teams[0]
      : typedMembership?.teams;

    if (!joinedTeam || !typedMembership?.role) {
      return { nickname, team: null };
    }

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, title, starts_at, created_by, location_note, capacity, allow_waitlist, attendance_method, attendance_closes_at")
      .eq("team_id", joinedTeam.id)
      .order("starts_at", { ascending: true });

    const { data: fallbackMatches } = matchesError
      ? await supabase
          .from("matches")
          .select("id, title, starts_at, created_by, capacity, attendance_method, attendance_closes_at")
          .eq("team_id", joinedTeam.id)
          .order("starts_at", { ascending: true })
      : { data: null };

    const matchRows = ((matches ?? fallbackMatches ?? []) as MatchRow[]);
    const meetings = matchRows.map((match) => ({
      id: match.id,
      title: match.title,
      startsAt: match.starts_at,
      locationNote: "location_note" in match ? match.location_note ?? null : null,
      capacity: match.capacity,
      allowWaitlist: "allow_waitlist" in match ? match.allow_waitlist ?? true : true,
      attendanceMethod: match.attendance_method,
      attendanceClosesAt: match.attendance_closes_at,
      canManage: canManageMeeting({
        currentUserId: user.id,
        createdBy: match.created_by,
        role: typedMembership.role
      })
    }));

    return {
      nickname,
      team: {
        id: joinedTeam.id,
        name: joinedTeam.name,
        role: typedMembership.role,
        inviteCode: joinedTeam.invite_code,
        meetings
      }
    };
  } catch {
    return { nickname: null, team: null };
  }
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

function Notice({
  children,
  className = ""
}: {
  children: React.ReactNode;
  tone: "warning";
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#FBD6A3] bg-[#FFF7E8] px-5 py-4 text-sm font-semibold text-[#8A5200] ${className}`}>
      {children}
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
            <h3 className="text-lg font-bold">{meeting.title}</h3>
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
          <form action={deleteMeeting}>
            <input name="meetingId" type="hidden" value={meeting.id} />
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#FFD7D7] bg-white px-4 text-sm font-bold text-danger transition hover:bg-[#FFF1F1] sm:w-auto"
              type="submit"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </form>
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

function attendanceMethodLabel(value: string) {
  const labels: Record<string, string> = {
    manual: "수동",
    qr: "QR",
    gps: "GPS",
    gps_approval: "GPS 승인"
  };

  return labels[value] ?? "수동";
}
