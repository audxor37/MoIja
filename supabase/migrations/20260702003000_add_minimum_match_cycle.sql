alter table match_records
  add column if not exists opponent_name text,
  add column if not exists formation text,
  add column if not exists memo text;

create unique index if not exists match_records_match_id_unique
  on match_records (match_id);

alter table player_match_records
  add column if not exists guest_id uuid references guests(id) on delete cascade,
  add column if not exists position_code text references positions(code),
  add column if not exists lineup_slot text,
  add column if not exists minutes_played integer not null default 0 check (minutes_played >= 0),
  add column if not exists note text;

alter table player_match_records
  alter column profile_id drop not null;

alter table player_match_records
  drop constraint if exists player_match_records_one_player_check;

alter table player_match_records
  add constraint player_match_records_one_player_check
  check (
    (profile_id is not null and guest_id is null)
    or (profile_id is null and guest_id is not null)
  );

create unique index if not exists player_match_records_member_unique
  on player_match_records (match_id, profile_id)
  where profile_id is not null;

create unique index if not exists player_match_records_guest_unique
  on player_match_records (match_id, guest_id)
  where guest_id is not null;

create table if not exists match_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  formation text not null default '2-2',
  board_note text,
  updated_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

create table if not exists match_lineup_players (
  id uuid primary key default gen_random_uuid(),
  lineup_id uuid not null references match_lineups(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  guest_id uuid references guests(id) on delete cascade,
  display_name text not null,
  player_kind text not null check (player_kind in ('member', 'guest')),
  position_code text references positions(code),
  squad_label text,
  x_percent integer not null default 50 check (x_percent between 0 and 100),
  y_percent integer not null default 50 check (y_percent between 0 and 100),
  is_starter boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (player_kind = 'member' and profile_id is not null and guest_id is null)
    or (player_kind = 'guest' and guest_id is not null and profile_id is null)
  )
);

alter table match_lineups enable row level security;
alter table match_lineup_players enable row level security;

create index if not exists match_lineups_match_id_idx on match_lineups (match_id);
create index if not exists match_lineup_players_lineup_id_idx on match_lineup_players (lineup_id);
create index if not exists match_lineup_players_profile_id_idx on match_lineup_players (profile_id);
create index if not exists match_lineup_players_guest_id_idx on match_lineup_players (guest_id);

drop policy if exists "match_lineups_select_team" on match_lineups;
create policy "match_lineups_select_team"
on match_lineups for select
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_lineups.match_id
      and private.is_team_member(matches.team_id)
  )
);

drop policy if exists "match_lineups_manage_coach" on match_lineups;
create policy "match_lineups_manage_coach"
on match_lineups for all
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_lineups.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
)
with check (
  exists (
    select 1
    from matches
    where matches.id = match_lineups.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

drop policy if exists "match_lineup_players_select_team" on match_lineup_players;
create policy "match_lineup_players_select_team"
on match_lineup_players for select
to authenticated
using (
  exists (
    select 1
    from match_lineups
    join matches on matches.id = match_lineups.match_id
    where match_lineups.id = match_lineup_players.lineup_id
      and private.is_team_member(matches.team_id)
  )
);

drop policy if exists "match_lineup_players_manage_coach" on match_lineup_players;
create policy "match_lineup_players_manage_coach"
on match_lineup_players for all
to authenticated
using (
  exists (
    select 1
    from match_lineups
    join matches on matches.id = match_lineups.match_id
    where match_lineups.id = match_lineup_players.lineup_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
)
with check (
  exists (
    select 1
    from match_lineups
    join matches on matches.id = match_lineups.match_id
    where match_lineups.id = match_lineup_players.lineup_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

create or replace function public.create_match_with_default_attendances(
  input_title text,
  input_starts_at timestamptz,
  input_capacity integer,
  input_attendance_method attendance_method,
  input_attendance_closes_at timestamptz,
  input_location_note text default null,
  input_memo text default null,
  input_allow_waitlist boolean default true
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid;
  target_team_id uuid;
  created_match_id uuid;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception 'auth_required';
  end if;

  select team_members.team_id
    into target_team_id
    from team_members
   where team_members.profile_id = actor_id
     and team_members.role in ('owner', 'manager')
   order by team_members.joined_at asc
   limit 1;

  if target_team_id is null then
    raise exception 'permission_denied';
  end if;

  insert into matches (
    team_id,
    title,
    starts_at,
    capacity,
    attendance_method,
    attendance_closes_at,
    location_note,
    memo,
    allow_waitlist,
    created_by
  )
  values (
    target_team_id,
    input_title,
    input_starts_at,
    input_capacity,
    input_attendance_method,
    input_attendance_closes_at,
    input_location_note,
    input_memo,
    input_allow_waitlist,
    actor_id
  )
  returning id into created_match_id;

  insert into match_attendances (match_id, profile_id, status)
  select created_match_id, team_members.profile_id, 'attending'
    from team_members
   where team_members.team_id = target_team_id
  on conflict (match_id, profile_id) do nothing;

  return created_match_id;
end;
$$;

revoke all on function public.create_match_with_default_attendances(text, timestamptz, integer, attendance_method, timestamptz, text, text, boolean) from public;
grant execute on function public.create_match_with_default_attendances(text, timestamptz, integer, attendance_method, timestamptz, text, text, boolean) to authenticated;
