"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export function RouteQueryInvalidator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const hasMeetingChange = searchParams.has("meeting_message") || searchParams.has("attendance_message");
    const hasTeamChange = searchParams.has("team_message");

    if (hasMeetingChange) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });

      if (pathname.startsWith("/meetings/")) {
        const meetingId = pathname.split("/")[2];
        if (meetingId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.attendances(meetingId) });
        }
      }
    }

    if (hasTeamChange) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSession });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myTeams });
    }
  }, [pathname, queryClient, searchParams]);

  return null;
}
