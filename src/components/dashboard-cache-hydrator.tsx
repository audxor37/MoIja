"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardSession } from "@/lib/server/dashboard-data";

async function fetchDashboardSession() {
  const response = await fetch("/api/dashboard/session", {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("대시보드 정보를 불러오지 못했습니다.");
  }

  return (await response.json()) as DashboardSession;
}

export function DashboardCacheHydrator({ initialData }: { initialData: DashboardSession }) {
  useQuery({
    queryKey: queryKeys.dashboardSession,
    queryFn: fetchDashboardSession,
    initialData,
    refetchOnMount: false
  });

  return null;
}
