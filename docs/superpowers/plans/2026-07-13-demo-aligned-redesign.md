# Demo-Aligned Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild MoIja's authenticated UI around the approved dark mobile sports app design from the demo.

**Architecture:** Introduce a small reusable app UI layer, then migrate the dashboard, meeting, team, profile, and ranking surfaces onto it. Keep Supabase data access and existing server actions intact; this is a presentation-layer redesign.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, lucide-react, Supabase SSR, Node test runner.

## Global Constraints

- Mobile first.
- No horizontal scroll on any screen.
- Core actions must be reachable in 1-2 taps on mobile.
- Attendance response and operator attendance confirmation must remain visually and functionally separate.
- Owner, Manager, Coach, Member, Guest permission boundaries must remain clear.
- No DB schema, RLS, Supabase function, or migration changes in this plan.
- QR/GPS are prepared UI states only; manual/operator confirmation remains the MVP flow.
- Run Next process checks before `npm run typecheck` and `npm run build`.

---

## File Structure

- Create `src/components/app-shell.tsx`: shared dark mobile shell, top bar, bottom nav, stat/action/segmented components.
- Create `src/app/ranking/page.tsx`: read-only ranking tab backed by existing dashboard session reliability data.
- Modify `tailwind.config.ts`: add demo-aligned dark tokens while keeping existing semantic names usable.
- Modify `src/app/globals.css`: dark body background, field styles, app-safe overflow rules.
- Modify `src/lib/dashboard-ux.ts`: replace bottom nav items with `홈 / 경기 / 랭킹 / 팀 / MY`; keep filtering helpers.
- Modify `src/lib/dashboard-ux.test.ts`: assert new nav shape and current filter behavior.
- Modify `src/app/page.tsx`: use shared shell for public, onboarding, operator, and member dashboard surfaces.
- Modify `src/components/dashboard-meeting-list.tsx`: demo-style compact list cards and filter segmented control.
- Modify `src/app/meetings/new/page.tsx` and `src/components/meeting-create-form.tsx`: settings-card create flow.
- Modify `src/app/meetings/[id]/page.tsx`, `src/components/managed-attendance-panel.tsx`, `src/components/match-cycle-panel.tsx`: dark meeting detail, attendance, and lineup presentation.
- Modify `src/app/team/page.tsx` and `src/components/team-management-panel.tsx`: team profile summary and action-row management.
- Modify `src/app/profile/page.tsx`: MY screen profile summary and action rows.

---

### Task 1: Shared App UI And Tokens

**Files:**
- Create: `src/components/app-shell.tsx`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/lib/dashboard-ux.ts`
- Test: `src/lib/dashboard-ux.test.ts`

**Interfaces:**
- Produces: `AppShell`, `TopBar`, `BottomNav`, `StatCard`, `ActionRow`, `PrimaryAction`, `SegmentedControl`, `ScreenCard`, `DemoDesktopAside`.
- Produces: `getActiveDashboardNavItems(): DashboardNavItem[]` returning labels `홈`, `경기`, `랭킹`, `팀`, `MY`.
- Consumes: `RoutePendingLink` for internal navigation.

- [ ] **Step 1: Update the nav test first**

Add or update this assertion in `src/lib/dashboard-ux.test.ts`:

```ts
test("returns demo-aligned bottom navigation items", () => {
  assert.deepEqual(getActiveDashboardNavItems(), [
    { label: "홈", href: "/" },
    { label: "경기", href: "/meetings" },
    { label: "랭킹", href: "/ranking" },
    { label: "팀", href: "/team" },
    { label: "MY", href: "/profile" }
  ]);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run typecheck`

Expected: FAIL until `DashboardNavItem` and `getActiveDashboardNavItems` are updated.

- [ ] **Step 3: Update dashboard nav types**

Change `src/lib/dashboard-ux.ts`:

```ts
export type DashboardNavItem = {
  label: "홈" | "경기" | "랭킹" | "팀" | "MY";
  href: string;
};

export function getActiveDashboardNavItems(): DashboardNavItem[] {
  return [
    { label: "홈", href: "/" },
    { label: "경기", href: "/meetings" },
    { label: "랭킹", href: "/ranking" },
    { label: "팀", href: "/team" },
    { label: "MY", href: "/profile" }
  ];
}
```

- [ ] **Step 4: Extend Tailwind tokens**

Add dark app tokens to `tailwind.config.ts`:

```ts
colors: {
  app: "#050A13",
  appPanel: "#0B1220",
  appCard: "#111A2B",
  appCardSoft: "#17223A",
  appLine: "#22304A",
  appLineStrong: "#33415F",
  appText: "#F8FAFC",
  appTextSoft: "#B6C1D5",
  appMuted: "#7E8AA3",
  lime: "#D7FF5C",
  cobalt: "#4F63FF",
  // keep existing semantic colors for existing code during migration
  surface: "#FFFFFF",
  surfaceAlt: "#F2F4F6",
  line: "#E5E8EB",
  lineStrong: "#D1D6DB",
  ink: "#191F28",
  secondary: "#4E5968",
  muted: "#8B95A1",
  disabled: "#B0B8C1",
  primary: "#16A34A",
  strategy: "#2563EB",
  navy: "#0F172A",
  success: "#03B26C",
  warning: "#FE9800",
  danger: "#F04452",
  tactical: "#7C3AED"
}
```

- [ ] **Step 5: Update global CSS**

Set dark defaults in `src/app/globals.css`:

```css
:root {
  color-scheme: dark;
  background: #050a13;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(79, 99, 255, 0.16), transparent 34rem),
    #050a13;
  color: #f8fafc;
  font-family:
    Pretendard,
    "Noto Sans KR",
    "Apple SD Gothic Neo",
    "Malgun Gothic",
    system-ui,
    sans-serif;
  font-variant-numeric: tabular-nums;
  max-width: 100%;
  overflow-x: hidden;
}
```

Update `.field-input` to dark:

```css
.field-input {
  @apply h-[52px] rounded-xl border border-appLine bg-appCard px-4 text-sm font-semibold text-appText outline-none transition placeholder:text-appMuted focus:border-lime focus:ring-4 focus:ring-lime/10;
}
```

- [ ] **Step 6: Create shared components**

Create `src/components/app-shell.tsx` with these exports:

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Bell, CalendarDays, ChevronRight, Crown, Home, LucideIcon, Shield, User, Users } from "lucide-react";
import { RoutePendingLink } from "@/components/pending-ui";
import { getActiveDashboardNavItems } from "@/lib/dashboard-ux";

const navIcons = {
  홈: Home,
  경기: CalendarDays,
  랭킹: Crown,
  팀: Users,
  MY: User
} as const;

type NavLabel = keyof typeof navIcons;

export function AppShell({ children, activePath = "/" }: { children: React.ReactNode; activePath?: string }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-app pb-24 text-appText lg:pb-0">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[minmax(0,430px)_1fr] lg:items-center lg:gap-20 lg:px-8">
        <section className="min-h-screen w-full border-appLine bg-app/95 px-4 py-5 lg:min-h-[760px] lg:rounded-[28px] lg:border lg:px-5 lg:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          {children}
        </section>
        <DemoDesktopAside />
      </div>
      <BottomNav activePath={activePath} />
    </main>
  );
}

export function DemoDesktopAside() {
  return (
    <aside className="hidden lg:block">
      <p className="text-lg font-black text-cobalt">MoIja</p>
      <h2 className="mt-3 max-w-md text-[40px] font-black leading-[1.1] text-white">
        운영부터 기록까지, 한 팀의 모든 흐름
      </h2>
      <p className="mt-4 max-w-sm text-base font-semibold leading-7 text-appTextSoft">
        참석 신뢰도와 경기 데이터를 연결하는 모바일 팀 운영 경험입니다.
      </p>
    </aside>
  );
}

export function TopBar({ title, backHref, right }: { title: string; backHref?: string; right?: React.ReactNode }) {
  return (
    <header className="flex h-12 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <RoutePendingLink aria-label={`${title}에서 뒤로가기`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-appCardSoft text-appText" href={backHref}>
            <ArrowLeft size={20} />
          </RoutePendingLink>
        ) : (
          <Link className="flex items-center gap-3" href="/">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-sm font-black text-app">M</span>
            <span className="text-xl font-black italic text-white">MoIja</span>
          </Link>
        )}
        {backHref ? <p className="truncate text-base font-black">{title}</p> : null}
      </div>
      {right ?? (
        <button aria-label="알림" className="grid h-10 w-10 place-items-center rounded-full bg-transparent text-appText" type="button">
          <Bell size={20} />
        </button>
      )}
    </header>
  );
}

export function BottomNav({ activePath }: { activePath: string }) {
  const items = getActiveDashboardNavItems();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-appLine bg-app/95 px-2 py-2 backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = navIcons[item.label as NavLabel];
        const active = activePath === item.href || (item.href !== "/" && activePath.startsWith(item.href));
        return (
          <RoutePendingLink className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-black ${active ? "text-lime" : "text-appMuted"}`} href={item.href} key={item.href}>
            {active ? <span className="absolute -top-2 h-1 w-8 rounded-full bg-lime" /> : null}
            <Icon size={19} />
            {item.label}
          </RoutePendingLink>
        );
      })}
    </nav>
  );
}

export function ScreenCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-appLine bg-appCard p-4 ${className}`}>{children}</section>;
}

export function StatCard({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${active ? "border-lime text-lime" : "border-appLine bg-appCardSoft text-appText"}`}>
      <p className="text-[11px] font-bold text-appTextSoft">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

export function ActionRow({ icon: Icon = Shield, title, description, href }: { icon?: LucideIcon; title: string; description: string; href: string }) {
  return (
    <RoutePendingLink className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-appLine bg-appCard px-4 py-3 text-left" href={href}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-appCardSoft text-lime"><Icon size={18} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-appText">{title}</span>
        <span className="mt-1 block truncate text-xs font-bold text-appMuted">{description}</span>
      </span>
      <ChevronRight className="text-appMuted" size={18} />
    </RoutePendingLink>
  );
}

export function PrimaryAction({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <RoutePendingLink className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-lime px-5 text-sm font-black text-app shadow-[0_12px_30px_rgba(215,255,92,0.16)]" href={href}>
      {children}
    </RoutePendingLink>
  );
}

export function SegmentedControl({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <button className={`h-10 rounded-xl border text-xs font-black ${item === active ? "border-lime bg-lime text-app" : "border-appLine bg-appCardSoft text-appTextSoft"}`} key={item} type="button">
          {item}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Run focused verification**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add tailwind.config.ts src/app/globals.css src/lib/dashboard-ux.ts src/lib/dashboard-ux.test.ts src/components/app-shell.tsx
git commit -m "공통 모바일 앱 디자인 시스템 추가"
```

---

### Task 2: Dashboard And Meeting List Migration

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/dashboard-meeting-list.tsx`

**Interfaces:**
- Consumes: `AppShell`, `TopBar`, `ScreenCard`, `StatCard`, `ActionRow`, `PrimaryAction`.
- Produces: demo-aligned home dashboard and meeting list cards.

- [ ] **Step 1: Replace icon map labels**

In `src/app/page.tsx`, use icons for the new labels:

```ts
const navIconByLabel = {
  홈: Grid2X2,
  경기: CalendarPlus,
  랭킹: ShieldCheck,
  팀: Users,
  MY: ShieldCheck
} as const;
```

- [ ] **Step 2: Wrap authenticated dashboards in `AppShell`**

Change `OperatorDashboard` and `MemberDashboard` root elements from full-width light layouts to:

```tsx
<AppShell activePath="/">
  <TopBar title="홈" />
  {/* existing dashboard content migrated into compact dark sections */}
</AppShell>
```

- [ ] **Step 3: Rebuild operator next-match card**

Use this structure inside `OperatorDashboard`:

```tsx
<section className="mt-6">
  <p className="text-sm font-black text-appTextSoft">다음 경기</p>
  <h1 className="mt-1 text-[28px] font-black leading-tight">라인업 준비</h1>
  <ScreenCard className="mt-4">
    <RoutePendingLink className="block" href={`/meetings/${nextMeeting.id}`}>
      <p className="text-xs font-black text-appMuted">{formatMeetingDateTime(nextMeeting.startsAt)}</p>
      <h2 className="mt-2 text-xl font-black text-white">{nextMeeting.title}</h2>
      <p className="mt-1 text-sm font-bold text-appTextSoft">{nextMeeting.locationNote ?? "장소 미정"}</p>
    </RoutePendingLink>
    <div className="mt-4 grid grid-cols-4 gap-2">
      {getUpcomingMeetingActions(nextMeeting.attendanceSummary).slice(0, 4).map((action) => (
        <StatCard key={action.label} label={action.label} value={action.value} active={action.label === "참석"} />
      ))}
    </div>
    <div className="mt-4">
      <PrimaryAction href={`/meetings/${nextMeeting.id}`}>라인업 보기</PrimaryAction>
    </div>
  </ScreenCard>
</section>
```

- [ ] **Step 4: Add operator quick actions**

Add two action rows below the next-match card:

```tsx
<div className="mt-3 grid grid-cols-2 gap-3">
  <ActionRow icon={ClipboardCheck} title="빠른 체크인" description="현장 출석 확인" href={`/meetings/${nextMeeting.id}#attendance`} />
  <ActionRow icon={Users} title="라인업 작성" description="확정자 기준 편집" href={`/meetings/${nextMeeting.id}#cycle`} />
</div>
```

- [ ] **Step 5: Rebuild member dashboard summary**

For `MemberDashboard`, keep `AttendanceResponsePanel`, but place it under a dark next-match card and add StatCards for reliability:

```tsx
<div className="mt-4 grid grid-cols-3 gap-2">
  <StatCard label="신뢰도" value={`${team.reliability.score}`} active />
  <StatCard label="참석률" value={`${team.reliability.attendanceRate}%`} />
  <StatCard label="연속 참석" value={`${team.reliability.currentStreak}회`} />
</div>
```

- [ ] **Step 6: Restyle `DashboardMeetingList`**

Change list cards to dark compact cards:

```tsx
<RoutePendingLink
  className={`rounded-2xl border bg-appCard p-3.5 transition ${
    selected ? "border-lime" : "border-appLine hover:border-appLineStrong"
  }`}
  href={`/meetings/${meeting.id}`}
>
```

Change `MeetingFilterBar` active state:

```tsx
active ? "bg-lime text-app" : "bg-appCardSoft text-appTextSoft hover:text-white"
```

- [ ] **Step 7: Run verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/app/page.tsx src/components/dashboard-meeting-list.tsx
git commit -m "홈과 경기 목록을 데모 스타일로 변경"
```

---

### Task 3: Meeting Detail, Attendance, And Create Flow

**Files:**
- Modify: `src/app/meetings/[id]/page.tsx`
- Modify: `src/components/managed-attendance-panel.tsx`
- Modify: `src/components/match-cycle-panel.tsx`
- Modify: `src/app/meetings/new/page.tsx`
- Modify: `src/components/meeting-create-form.tsx`

**Interfaces:**
- Consumes: shared app components.
- Produces: dark meeting detail, operator attendance management, lineup board, and settings-style create screen.

- [ ] **Step 1: Wrap meeting detail in `AppShell`**

Use:

```tsx
<AppShell activePath="/meetings">
  <TopBar title="경기 상세" backHref="/" right={canManageAttendance ? <MeetingAdminMenu meetingId={currentMeeting.id} /> : undefined} />
  {/* detail content */}
</AppShell>
```

- [ ] **Step 2: Build the detail hero**

Replace the light summary article with:

```tsx
<ScreenCard className="mt-6 bg-gradient-to-br from-appCardSoft to-appCard">
  <span className="inline-flex rounded-lg bg-lime px-2 py-1 text-[11px] font-black text-app">D-0</span>
  <p className="mt-5 text-sm font-bold text-appTextSoft">{formatMeetingDateTime(currentMeeting.starts_at)}</p>
  <h1 className="mt-2 text-2xl font-black leading-tight text-white">{currentMeeting.title}</h1>
  <p className="mt-3 text-sm font-bold text-appTextSoft">{currentMeeting.location_note ?? "장소 미정"}</p>
</ScreenCard>
```

- [ ] **Step 3: Add detail tabs as segmented control**

Use:

```tsx
<div className="mt-5">
  <SegmentedControl items={["정보", `참석 ${attendanceSummary.responseCount}`, "라인업"]} active="정보" />
</div>
```

- [ ] **Step 4: Restyle member response**

Keep `AttendanceResponsePanel` behavior. Change its surrounding section to dark card styling in the component if needed:

```tsx
<section id="response" className="scroll-mt-4 rounded-2xl border border-appLine bg-appCard p-4">
```

- [ ] **Step 5: Restyle `ManagedAttendancePanel`**

Change root:

```tsx
<article className="rounded-2xl border border-appLine bg-appCard p-4">
```

Change `StatusCard`:

```tsx
<button className="flex min-w-0 flex-col items-start rounded-xl border border-appLine bg-appCardSoft px-3 py-2.5 text-left transition hover:border-lime" ...>
```

Keep modal light/dark consistent by using `bg-appCard text-appText`, `border-appLine`, and `text-appMuted`.

- [ ] **Step 6: Restyle lineup panel**

Keep formation and save logic unchanged. Change panels and buttons to dark tokens. Keep the board green:

```tsx
className="rounded-2xl border border-appLine bg-appCard p-4"
```

Use `bg-lime text-app` for save and `border border-appLine bg-appCardSoft text-appText` for secondary actions.

- [ ] **Step 7: Wrap new meeting page in `AppShell`**

Use:

```tsx
<AppShell activePath="/meetings">
  <TopBar title="경기 만들기" backHref="/" />
  <p className="mt-8 text-sm font-black text-appTextSoft">운영자만 볼 수 있는 설정입니다</p>
  <h1 className="mt-2 text-[30px] font-black">새 경기 만들기</h1>
  <section className="mt-6">
    <MeetingCreateForm action={createMeeting} />
  </section>
</AppShell>
```

- [ ] **Step 8: Restyle create form into settings cards**

In `MeetingCreateForm`, use dark field containers:

```tsx
<label className="grid gap-2 rounded-2xl border border-appLine bg-appCard px-4 py-3">
  <span className="text-xs font-bold text-appMuted">경기 이름</span>
  <input className="bg-transparent text-sm font-black text-appText outline-none" ... />
</label>
```

For submit:

```tsx
className="mt-2 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-cobalt px-5 text-sm font-black text-white"
```

- [ ] **Step 9: Run verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 10: Commit**

```powershell
git add src/app/meetings/[id]/page.tsx src/components/managed-attendance-panel.tsx src/components/match-cycle-panel.tsx src/app/meetings/new/page.tsx src/components/meeting-create-form.tsx
git commit -m "경기 상세과 출석 운영 화면을 데모 스타일로 변경"
```

---

### Task 4: Team, MY, And Ranking Surfaces

**Files:**
- Create: `src/app/ranking/page.tsx`
- Modify: `src/app/team/page.tsx`
- Modify: `src/components/team-management-panel.tsx`
- Modify: `src/app/profile/page.tsx`

**Interfaces:**
- Consumes: `AppShell`, `TopBar`, `ScreenCard`, `StatCard`, `ActionRow`, `SegmentedControl`.
- Produces: team tab, MY tab, and read-only ranking tab.

- [ ] **Step 1: Create ranking page**

Create `src/app/ranking/page.tsx`:

```tsx
import { AppShell, ScreenCard, SegmentedControl, StatCard, TopBar } from "@/components/app-shell";
import { getDashboardSession } from "@/lib/server/dashboard-data";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await getDashboardSession();
  const reliability = session.team?.reliability;

  return (
    <AppShell activePath="/ranking">
      <TopBar title="시즌 랭킹" backHref="/" />
      <p className="mt-8 text-sm font-black text-appTextSoft">2026 Summer Season</p>
      <h1 className="mt-2 text-[30px] font-black">시즌 랭킹</h1>
      <div className="mt-6">
        <SegmentedControl items={["출석왕", "득점왕", "도움왕", "신뢰도"]} active="신뢰도" />
      </div>
      <ScreenCard className="mt-5">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="신뢰도" value={reliability ? `${reliability.score}` : "-"} active />
          <StatCard label="참석률" value={reliability ? `${reliability.attendanceRate}%` : "-"} />
          <StatCard label="연속" value={reliability ? `${reliability.currentStreak}회` : "-"} />
        </div>
        <p className="mt-4 text-sm font-bold text-appTextSoft">
          첫 버전은 내 신뢰도 지표를 기준으로 보여줍니다. 팀 전체 랭킹은 기록 데이터가 쌓인 뒤 확장합니다.
        </p>
      </ScreenCard>
    </AppShell>
  );
}
```

- [ ] **Step 2: Restyle team page shell**

Wrap `TeamPage` authorized and fallback surfaces with:

```tsx
<AppShell activePath="/team">
  <TopBar title="팀" backHref="/" />
  <TeamManagementPanel ... />
</AppShell>
```

- [ ] **Step 3: Restyle team management panel**

In `TeamManagementPanel`, start with team profile summary:

```tsx
<ScreenCard className="mt-6">
  <p className="text-xs font-black text-appMuted">{team.name}</p>
  <h1 className="mt-1 text-xl font-black text-white">축구를 더 오래, 더 즐겁게</h1>
</ScreenCard>
```

Change member/role rows to dark cards and action buttons to `bg-lime text-app` or `bg-appCardSoft text-appText`.

- [ ] **Step 4: Restyle profile page**

Wrap with:

```tsx
<AppShell activePath="/profile">
  <TopBar title="내 정보" backHref="/" />
  <ScreenCard className="mt-6 text-center">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-appCardSoft text-lg font-black text-white">
      {session.nickname.slice(0, 1)}
    </div>
    <h1 className="mt-4 text-3xl font-black">{session.nickname}</h1>
    <p className="mt-2 text-sm font-bold text-appMuted">{session.team?.name ?? "소속 팀 없음"}</p>
  </ScreenCard>
</AppShell>
```

Add stat cards for reliability when a team exists and keep logout button.

- [ ] **Step 5: Run verification**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/app/ranking/page.tsx src/app/team/page.tsx src/components/team-management-panel.tsx src/app/profile/page.tsx
git commit -m "팀 MY 랭킹 화면을 데모 스타일로 변경"
```

---

### Task 5: Final Build Verification

**Files:**
- No source changes expected unless verification reveals defects.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified redesign branch.

- [ ] **Step 1: Check for active Next processes**

Run:

```powershell
Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object { $_.CommandLine -like '*mo-ija*next*dev*' -or $_.CommandLine -like '*mo-ija*next*build*' } |
  Select-Object ProcessId,CommandLine
```

Expected: no active `next dev` or `next build` process. If processes exist, stop only those matching `mo-ija*next*dev` or `mo-ija*next*build`.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Inspect changed files**

Run:

```powershell
git status --short
git diff --stat HEAD
```

Expected: no unstaged source changes after final commits, or only intentional follow-up fixes already reviewed.

- [ ] **Step 5: Final commit if verification fixes were needed**

If fixes were made:

```powershell
git add <changed-files>
git commit -m "리디자인 검증 오류 수정"
```

If no fixes were made, do not create an empty commit.

---

## Self-Review

- Spec coverage: shared dark mobile design, home, meetings, create/edit pattern, detail, attendance, lineup, ranking, team, MY, QR/GPS prepared state, and verification are covered.
- Placeholder scan: no TBD/TODO/fill-in placeholders remain.
- Type consistency: shared component names and dashboard nav labels are defined in Task 1 and consumed in later tasks.
