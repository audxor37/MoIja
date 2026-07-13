"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronRight,
  Crown,
  Home,
  type LucideIcon,
  Shield,
  User,
  Users
} from "lucide-react";
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

export function AppShell({
  children,
  activePath = "/"
}: {
  children: React.ReactNode;
  activePath?: string;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-app pb-24 text-appText lg:pb-0">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-[minmax(0,430px)_1fr] lg:items-center lg:gap-20 lg:px-8">
        <section className="min-h-screen w-full bg-app/95 px-4 py-5 lg:min-h-[760px] lg:rounded-[28px] lg:border lg:border-appLine lg:px-5 lg:shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
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

export function TopBar({
  title,
  backHref,
  right
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex h-12 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <RoutePendingLink
            aria-label={`${title}에서 뒤로가기`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-appCardSoft text-appText"
            href={backHref}
          >
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
          <RoutePendingLink
            className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-black ${
              active ? "text-lime" : "text-appMuted"
            }`}
            href={item.href}
            key={item.href}
          >
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

export function StatCard({
  label,
  value,
  active = false
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${active ? "border-lime text-lime" : "border-appLine bg-appCardSoft text-appText"}`}>
      <p className="text-[11px] font-bold text-appTextSoft">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

export function ActionRow({
  icon: Icon = Shield,
  title,
  description,
  href
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <RoutePendingLink className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-appLine bg-appCard px-4 py-3 text-left" href={href}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-appCardSoft text-lime">
        <Icon size={18} />
      </span>
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
    <RoutePendingLink
      className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-lime px-5 text-sm font-black text-app shadow-[0_12px_30px_rgba(215,255,92,0.16)]"
      href={href}
    >
      {children}
    </RoutePendingLink>
  );
}

export function SegmentedControl({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => (
        <button
          className={`h-10 rounded-xl border text-xs font-black ${
            item === active ? "border-lime bg-lime text-app" : "border-appLine bg-appCardSoft text-appTextSoft"
          }`}
          key={item}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
