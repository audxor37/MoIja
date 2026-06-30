create type team_role as enum ('owner', 'manager', 'coach', 'member');
create type attendance_method as enum ('manual', 'qr', 'gps', 'gps_approval');
create type attendance_status as enum ('attending', 'absent', 'waitlisted', 'no_show');
create type match_result as enum ('win', 'draw', 'loss');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  kakao_id text unique not null,
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sport_type text not null default 'futsal',
  invite_code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role team_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (team_id, profile_id)
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  address text not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  is_favorite boolean not null default false
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  venue_id uuid references venues(id),
  title text not null,
  location_note text,
  memo text,
  starts_at timestamptz not null,
  capacity integer,
  allow_waitlist boolean not null default true,
  attendance_method attendance_method not null default 'manual',
  attendance_closes_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table match_attendances (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status attendance_status not null default 'attending',
  checked_in_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (match_id, profile_id)
);

create table attendance_events (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references match_attendances(id) on delete cascade,
  previous_status attendance_status,
  next_status attendance_status not null,
  changed_by uuid not null references profiles(id),
  changed_at timestamptz not null default now()
);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null
);

create table match_records (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  season_id uuid references seasons(id),
  result match_result not null,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  recorded_by uuid not null references profiles(id),
  recorded_at timestamptz not null default now()
);

create table positions (
  code text primary key,
  label text not null
);

insert into positions (code, label) values
  ('GK', '골키퍼'),
  ('DF', '수비수'),
  ('MF', '미드필더'),
  ('FW', '공격수'),
  ('CAM', '공격형 미드필더')
on conflict do nothing;

create table member_positions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  position_code text not null references positions(code),
  is_primary boolean not null default false,
  assigned_by uuid not null references profiles(id),
  unique (team_id, profile_id, position_code)
);

create table player_match_records (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  goals integer not null default 0,
  assists integer not null default 0,
  is_mvp boolean not null default false
);

create table reliability_scores (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  season_id uuid references seasons(id),
  score integer not null check (score between 0 and 100),
  calculated_at timestamptz not null default now()
);

create schema if not exists private;

create or replace function private.is_team_member(
  target_team_id uuid,
  allowed_roles team_role[] default null
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from team_members
    where team_id = target_team_id
      and profile_id = auth.uid()
      and (allowed_roles is null or role = any(allowed_roles))
  );
$$;

grant execute on function private.is_team_member(uuid, team_role[]) to authenticated;

create or replace function public.join_team_by_invite_code(input_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  target_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  normalized_code := upper(regexp_replace(coalesce(input_invite_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if normalized_code = '' then
    raise exception 'invite code required';
  end if;

  select id
    into target_team_id
    from teams
   where invite_code = normalized_code;

  if target_team_id is null then
    raise exception 'team invite code not found';
  end if;

  insert into team_members (team_id, profile_id, role)
  values (target_team_id, auth.uid(), 'member')
  on conflict (team_id, profile_id) do nothing;

  return target_team_id;
end;
$$;

revoke all on function public.join_team_by_invite_code(text) from public;
grant execute on function public.join_team_by_invite_code(text) to authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on profiles
for each row execute function private.touch_updated_at();

create trigger match_attendances_touch_updated_at
before update on match_attendances
for each row execute function private.touch_updated_at();

alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table venues enable row level security;
alter table matches enable row level security;
alter table match_attendances enable row level security;
alter table attendance_events enable row level security;
alter table seasons enable row level security;
alter table match_records enable row level security;
alter table positions enable row level security;
alter table member_positions enable row level security;
alter table player_match_records enable row level security;
alter table reliability_scores enable row level security;

create policy "profiles_select_own"
on profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "teams_select_member"
on teams for select
to authenticated
using (created_by = auth.uid() or private.is_team_member(id));

create policy "teams_insert_owner"
on teams for insert
to authenticated
with check (created_by = auth.uid());

create policy "teams_update_manager"
on teams for update
to authenticated
using (private.is_team_member(id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(id, array['owner', 'manager']::team_role[]));

create policy "team_members_select_team"
on team_members for select
to authenticated
using (profile_id = auth.uid() or private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[]));

create policy "team_members_insert_manager"
on team_members for insert
to authenticated
with check (
  role <> 'owner'
  and private.is_team_member(team_id, array['owner', 'manager']::team_role[])
);

create policy "team_members_insert_owner_after_create"
on team_members for insert
to authenticated
with check (
  profile_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1
    from teams
    where teams.id = team_members.team_id
      and teams.created_by = auth.uid()
  )
);

create policy "team_members_update_manager"
on team_members for update
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));

create policy "venues_select_team"
on venues for select
to authenticated
using (private.is_team_member(team_id));

create policy "venues_manage_manager"
on venues for all
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));

create policy "matches_select_team"
on matches for select
to authenticated
using (private.is_team_member(team_id));

create policy "matches_insert_manager"
on matches for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_team_member(team_id, array['owner', 'manager']::team_role[])
);

create policy "matches_update_manager"
on matches for update
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_team_member(team_id, array['owner', 'manager']::team_role[])
)
with check (
  created_by = (select auth.uid())
  or private.is_team_member(team_id, array['owner', 'manager']::team_role[])
);

create policy "matches_delete_manager"
on matches for delete
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_team_member(team_id, array['owner', 'manager']::team_role[])
);

create policy "attendances_select_team"
on match_attendances for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

create policy "attendances_insert_own"
on match_attendances for insert
to authenticated
with check (profile_id = auth.uid());

create policy "attendances_update_own_or_manager"
on match_attendances for update
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  profile_id = auth.uid()
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "attendance_events_select_team"
on attendance_events for select
to authenticated
using (
  exists (
    select 1
    from match_attendances
    join matches on matches.id = match_attendances.match_id
    where match_attendances.id = attendance_events.attendance_id
      and private.is_team_member(matches.team_id)
  )
);

create policy "attendance_events_insert_manager"
on attendance_events for insert
to authenticated
with check (
  changed_by = auth.uid()
  and exists (
    select 1
    from match_attendances
    join matches on matches.id = match_attendances.match_id
    where match_attendances.id = attendance_events.attendance_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "seasons_select_team"
on seasons for select
to authenticated
using (private.is_team_member(team_id));

create policy "seasons_manage_manager"
on seasons for all
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));

create policy "match_records_select_team"
on match_records for select
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_records.match_id
      and private.is_team_member(matches.team_id)
  )
);

create policy "match_records_manage_manager"
on match_records for all
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_records.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  recorded_by = auth.uid()
  and exists (
    select 1
    from matches
    where matches.id = match_records.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "positions_select_authenticated"
on positions for select
to authenticated
using (true);

create policy "member_positions_select_team"
on member_positions for select
to authenticated
using (private.is_team_member(team_id));

create policy "member_positions_manage_coach"
on member_positions for all
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[]))
with check (
  assigned_by = auth.uid()
  and private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[])
);

create policy "player_match_records_select_team"
on player_match_records for select
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = player_match_records.match_id
      and private.is_team_member(matches.team_id)
  )
);

create policy "player_match_records_manage_manager"
on player_match_records for all
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = player_match_records.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  exists (
    select 1
    from matches
    where matches.id = player_match_records.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "reliability_scores_select_team"
on reliability_scores for select
to authenticated
using (profile_id = auth.uid() or private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[]));

create policy "reliability_scores_manage_manager"
on reliability_scores for all
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));
