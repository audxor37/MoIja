create index if not exists team_members_profile_joined_at_idx
  on team_members (profile_id, joined_at);

create index if not exists matches_team_starts_at_idx
  on matches (team_id, starts_at);

create index if not exists teams_created_by_idx
  on teams (created_by);
