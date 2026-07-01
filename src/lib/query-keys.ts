export const queryKeys = {
  profile: ["profile"] as const,
  myTeams: ["teams", "mine"] as const,
  dashboardSession: ["dashboard-session"] as const,
  team: (teamId: string) => ["team", teamId] as const,
  teamMembers: (teamId: string) => ["team-members", teamId] as const,
  events: (teamId: string) => ["events", teamId] as const,
  attendances: (eventId: string) => ["attendances", eventId] as const,
  settings: ["settings"] as const
};
