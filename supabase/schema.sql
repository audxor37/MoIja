create type team_role as enum ('owner', 'manager', 'coach', 'member');
create type attendance_method as enum ('manual', 'qr', 'gps', 'gps_approval');
create type attendance_status as enum ('attending', 'absent', 'waitlisted', 'no_show');
create type guest_status as enum ('invited', 'accepted', 'declined', 'checked_in', 'confirmed', 'no_show');
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

create table match_invites (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_by uuid not null references profiles(id),
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  default_status guest_status not null default 'invited',
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (max_uses is null or max_uses > 0),
  check (used_count >= 0),
  check (max_uses is null or used_count <= max_uses)
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  check (length(trim(display_name)) > 0)
);

create table match_guests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  guest_id uuid not null references guests(id) on delete cascade,
  status guest_status not null default 'invited',
  invite_id uuid references match_invites(id) on delete set null,
  checked_in_at timestamptz,
  confirmed_by uuid references profiles(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (match_id, guest_id)
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
  attendance_rate integer not null default 0 check (attendance_rate between 0 and 100),
  no_show_rate integer not null default 0 check (no_show_rate between 0 and 100),
  current_streak integer not null default 0 check (current_streak >= 0),
  attended_count integer not null default 0 check (attended_count >= 0),
  absent_count integer not null default 0 check (absent_count >= 0),
  no_show_count integer not null default 0 check (no_show_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
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
      and profile_id = (select auth.uid())
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

create or replace function public.join_match_by_guest_invite_code(input_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  normalized_code text;
  target_invite match_invites%rowtype;
  target_guest_id uuid;
  target_match_guest_id uuid;
  target_display_name text;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception 'auth_required';
  end if;

  normalized_code := upper(regexp_replace(coalesce(input_invite_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if normalized_code = '' then
    raise exception 'guest_invite_code_required';
  end if;

  select *
    into target_invite
    from match_invites
   where code = normalized_code
     and revoked_at is null
     and (expires_at is null or expires_at > now())
   limit 1;

  if target_invite.id is null then
    raise exception 'guest_invite_not_found';
  end if;

  select match_guests.id
    into target_match_guest_id
    from match_guests
    join guests on guests.id = match_guests.guest_id
   where match_guests.match_id = target_invite.match_id
     and guests.created_by = actor_id
   limit 1;

  if target_match_guest_id is not null then
    update match_guests
       set status = 'confirmed',
           invite_id = target_invite.id,
           confirmed_by = actor_id
     where id = target_match_guest_id;

    return target_match_guest_id;
  end if;

  if target_invite.max_uses is not null and target_invite.used_count >= target_invite.max_uses then
    raise exception 'guest_invite_unavailable';
  end if;

  select guests.id
    into target_guest_id
    from guests
   where guests.created_by = actor_id
   order by guests.created_at asc
   limit 1;

  if target_guest_id is null then
    select coalesce(nullif(trim(profiles.nickname), ''), '용병')
      into target_display_name
      from profiles
     where profiles.id = actor_id;

    insert into guests (display_name, created_by)
    values (coalesce(target_display_name, '용병'), actor_id)
    returning id into target_guest_id;
  end if;

  insert into match_guests (match_id, guest_id, status, invite_id, confirmed_by)
  values (target_invite.match_id, target_guest_id, 'confirmed', target_invite.id, actor_id)
  returning id into target_match_guest_id;

  update match_invites
     set used_count = used_count + 1
   where id = target_invite.id;

  return target_match_guest_id;
end;
$$;

revoke all on function public.join_match_by_guest_invite_code(text) from public;
grant execute on function public.join_match_by_guest_invite_code(text) to authenticated;

create or replace function public.refresh_member_reliability_score(
  input_team_id uuid,
  input_profile_id uuid,
  input_season_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attended_count integer;
  v_absent_count integer;
  v_no_show_count integer;
  v_total_count integer;
  v_attendance_rate integer;
  v_no_show_rate integer;
  v_current_streak integer;
  v_calculated_score integer;
  snapshot_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not private.is_team_member(input_team_id, array['owner', 'manager']::team_role[]) then
    raise exception 'manager permission required';
  end if;

  if not exists (
    select 1
    from team_members
    where team_id = input_team_id
      and profile_id = input_profile_id
  ) then
    raise exception 'profile is not a team member';
  end if;

  select
    count(*) filter (where match_attendances.status = 'attending'),
    count(*) filter (where match_attendances.status = 'absent'),
    count(*) filter (where match_attendances.status = 'no_show'),
    count(*)
  into v_attended_count, v_absent_count, v_no_show_count, v_total_count
  from match_attendances
  join matches on matches.id = match_attendances.match_id
  left join match_records on match_records.match_id = matches.id
  where matches.team_id = input_team_id
    and match_attendances.profile_id = input_profile_id
    and match_attendances.status in ('attending', 'absent', 'no_show')
    and (input_season_id is null or match_records.season_id = input_season_id);

  v_attendance_rate := case
    when v_total_count > 0 then round((v_attended_count::numeric / v_total_count::numeric) * 100)::integer
    else 0
  end;

  v_no_show_rate := case
    when v_attended_count + v_no_show_count > 0 then round((v_no_show_count::numeric / (v_attended_count + v_no_show_count)::numeric) * 100)::integer
    else 0
  end;

  with ordered_attendances as (
    select
      match_attendances.status,
      row_number() over (order by matches.starts_at desc) as row_number
    from match_attendances
    join matches on matches.id = match_attendances.match_id
    left join match_records on match_records.match_id = matches.id
    where matches.team_id = input_team_id
      and match_attendances.profile_id = input_profile_id
      and match_attendances.status in ('attending', 'absent', 'no_show')
      and (input_season_id is null or match_records.season_id = input_season_id)
    order by matches.starts_at desc
  ),
  streak_break as (
    select coalesce(min(row_number), (select count(*) + 1 from ordered_attendances)) as break_row
    from ordered_attendances
    where status <> 'attending'
  )
  select greatest(break_row - 1, 0) into v_current_streak
  from streak_break;

  v_calculated_score := case
    when v_total_count = 0 then 50
    else least(greatest(round(v_attendance_rate * 0.7 + (100 - v_no_show_rate) * 0.2 + least(v_current_streak * 2, 10))::integer, 0), 100)
  end;

  update reliability_scores
  set
    score = v_calculated_score,
    attendance_rate = v_attendance_rate,
    no_show_rate = v_no_show_rate,
    current_streak = v_current_streak,
    attended_count = v_attended_count,
    absent_count = v_absent_count,
    no_show_count = v_no_show_count,
    total_count = v_total_count,
    calculated_at = now()
  where reliability_scores.team_id = input_team_id
    and reliability_scores.profile_id = input_profile_id
    and (
      reliability_scores.season_id = input_season_id
      or (reliability_scores.season_id is null and input_season_id is null)
    )
  returning id into snapshot_id;

  if snapshot_id is null then
    insert into reliability_scores (
      team_id,
      profile_id,
      season_id,
      score,
      attendance_rate,
      no_show_rate,
      current_streak,
      attended_count,
      absent_count,
      no_show_count,
      total_count,
      calculated_at
    )
    values (
      input_team_id,
      input_profile_id,
      input_season_id,
      v_calculated_score,
      v_attendance_rate,
      v_no_show_rate,
      v_current_streak,
      v_attended_count,
      v_absent_count,
      v_no_show_count,
      v_total_count,
      now()
    )
    returning id into snapshot_id;
  end if;

  return snapshot_id;
end;
$$;

revoke all on function public.refresh_member_reliability_score(uuid, uuid, uuid) from public;
grant execute on function public.refresh_member_reliability_score(uuid, uuid, uuid) to authenticated;

create or replace function public.respond_to_meeting_attendance(
  input_match_id uuid,
  input_status attendance_status
)
returns attendance_status
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_profile_id uuid;
  target_match_id uuid;
  target_allow_waitlist boolean;
  previous_status attendance_status;
  saved_attendance_id uuid;
begin
  current_profile_id := (select auth.uid());

  if current_profile_id is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;

  if input_status not in ('attending', 'absent', 'waitlisted') then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  select id, allow_waitlist
    into target_match_id, target_allow_waitlist
    from matches
   where id = input_match_id;

  if target_match_id is null then
    raise exception 'missing_meeting' using errcode = 'P0001';
  end if;

  if input_status = 'waitlisted' and target_allow_waitlist is false then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  select status
    into previous_status
    from match_attendances
   where match_id = input_match_id
     and profile_id = current_profile_id;

  insert into match_attendances (
    match_id,
    profile_id,
    status
  )
  values (
    input_match_id,
    current_profile_id,
    input_status
  )
  on conflict (match_id, profile_id)
  do update set
    status = excluded.status,
    updated_at = now()
  returning id into saved_attendance_id;

  if previous_status is distinct from input_status then
    insert into attendance_events (
      attendance_id,
      previous_status,
      next_status,
      changed_by
    )
    values (
      saved_attendance_id,
      previous_status,
      input_status,
      current_profile_id
    );
  end if;

  return input_status;
end;
$$;

revoke all on function public.respond_to_meeting_attendance(uuid, attendance_status) from public;
revoke all on function public.respond_to_meeting_attendance(uuid, attendance_status) from anon;
revoke all on function public.respond_to_meeting_attendance(uuid, attendance_status) from service_role;
grant execute on function public.respond_to_meeting_attendance(uuid, attendance_status) to authenticated;

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

create trigger match_guests_touch_updated_at
before update on match_guests
for each row execute function private.touch_updated_at();

alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table venues enable row level security;
alter table matches enable row level security;
alter table match_attendances enable row level security;
alter table match_invites enable row level security;
alter table guests enable row level security;
alter table match_guests enable row level security;
alter table attendance_events enable row level security;
alter table seasons enable row level security;
alter table match_records enable row level security;
alter table positions enable row level security;
alter table member_positions enable row level security;
alter table player_match_records enable row level security;
alter table reliability_scores enable row level security;

create unique index if not exists reliability_scores_team_profile_key
  on reliability_scores (team_id, profile_id)
  where season_id is null;

create unique index if not exists reliability_scores_team_profile_season_key
  on reliability_scores (team_id, profile_id, season_id)
  where season_id is not null;

create index if not exists match_invites_match_id_idx on match_invites (match_id);
create index if not exists match_guests_match_id_status_idx on match_guests (match_id, status);
create index if not exists guests_created_by_idx on guests (created_by);
create index if not exists reliability_scores_team_score_idx on reliability_scores (team_id, score desc);
create index if not exists attendance_events_attendance_id_idx on attendance_events (attendance_id);
create index if not exists attendance_events_changed_by_idx on attendance_events (changed_by);
create index if not exists match_attendances_profile_match_idx on match_attendances (profile_id, match_id);
create index if not exists match_guests_guest_id_idx on match_guests (guest_id);
create index if not exists match_guests_invite_id_idx on match_guests (invite_id);
create index if not exists match_guests_confirmed_by_idx on match_guests (confirmed_by);
create index if not exists seasons_team_id_idx on seasons (team_id);
create index if not exists venues_team_id_idx on venues (team_id);
create index if not exists reliability_scores_profile_id_idx on reliability_scores (profile_id);
create index if not exists reliability_scores_season_id_idx on reliability_scores (season_id);
create index if not exists match_invites_created_by_idx on match_invites (created_by);
create index if not exists match_records_match_id_idx on match_records (match_id);
create index if not exists match_records_recorded_by_idx on match_records (recorded_by);
create index if not exists match_records_season_id_idx on match_records (season_id);
create index if not exists matches_created_by_idx on matches (created_by);
create index if not exists matches_venue_id_idx on matches (venue_id);
create index if not exists member_positions_assigned_by_idx on member_positions (assigned_by);
create index if not exists member_positions_position_code_idx on member_positions (position_code);
create index if not exists member_positions_profile_id_idx on member_positions (profile_id);
create index if not exists player_match_records_match_id_idx on player_match_records (match_id);
create index if not exists player_match_records_profile_id_idx on player_match_records (profile_id);

create policy "profiles_select_own"
on profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "profiles_insert_own"
on profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy "profiles_update_own"
on profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "teams_select_member"
on teams for select
to authenticated
using (created_by = (select auth.uid()) or private.is_team_member(id));

create policy "teams_insert_owner"
on teams for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "teams_update_manager"
on teams for update
to authenticated
using (private.is_team_member(id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(id, array['owner', 'manager']::team_role[]));

create policy "team_members_select_team"
on team_members for select
to authenticated
using (profile_id = (select auth.uid()) or private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[]));

create policy "team_members_insert_authorized"
on team_members for insert
to authenticated
with check (
  (
    role <> 'owner'
    and private.is_team_member(team_id, array['owner', 'manager']::team_role[])
  )
  or (
    profile_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1
      from teams
      where teams.id = team_members.team_id
        and teams.created_by = (select auth.uid())
    )
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
  profile_id = (select auth.uid())
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

create policy "attendances_insert_authorized"
on match_attendances for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "attendances_update_own_or_manager"
on match_attendances for update
to authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from matches
    where matches.id = match_attendances.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "match_invites_select_manager"
on match_invites for select
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_invites.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

create policy "match_invites_insert_manager"
on match_invites for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from matches
    where matches.id = match_invites.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "match_invites_update_manager"
on match_invites for update
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_invites.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from matches
    where matches.id = match_invites.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "match_invites_delete_manager"
on match_invites for delete
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_invites.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "guests_select_match_manager"
on guests for select
to authenticated
using (
  exists (
    select 1
    from match_guests
    join matches on matches.id = match_guests.match_id
    where match_guests.guest_id = guests.id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

create policy "guests_insert_manager"
on guests for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy "guests_update_creator_or_manager"
on guests for update
to authenticated
using (
  created_by = (select auth.uid())
  or exists (
    select 1
    from match_guests
    join matches on matches.id = match_guests.match_id
    where match_guests.guest_id = guests.id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  created_by = (select auth.uid())
  or exists (
    select 1
    from match_guests
    join matches on matches.id = match_guests.match_id
    where match_guests.guest_id = guests.id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "match_guests_select_manager"
on match_guests for select
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_guests.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

create policy "match_guests_insert_manager"
on match_guests for insert
to authenticated
with check (
  exists (
    select 1
    from matches
    where matches.id = match_guests.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "match_guests_update_manager"
on match_guests for update
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_guests.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  exists (
    select 1
    from matches
    where matches.id = match_guests.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
);

create policy "match_guests_delete_manager"
on match_guests for delete
to authenticated
using (
  exists (
    select 1
    from matches
    where matches.id = match_guests.match_id
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

create policy "attendance_events_insert_authorized"
on attendance_events for insert
to authenticated
with check (
  changed_by = (select auth.uid())
  and (
    exists (
      select 1
      from match_attendances
      where match_attendances.id = attendance_events.attendance_id
        and match_attendances.profile_id = (select auth.uid())
    )
    or exists (
      select 1
      from match_attendances
      join matches on matches.id = match_attendances.match_id
      where match_attendances.id = attendance_events.attendance_id
        and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
    )
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
  recorded_by = (select auth.uid())
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
  assigned_by = (select auth.uid())
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
using (profile_id = (select auth.uid()) or private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[]));

create policy "reliability_scores_manage_manager"
on reliability_scores for all
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));

-- Minimum match cycle additions: guests, lineup board, and official records.
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

alter table player_match_records alter column profile_id drop not null;
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

create table match_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  formation text not null default '2-2',
  board_note text,
  updated_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id)
);

create table match_lineup_players (
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

create policy "match_lineups_select_team"
on match_lineups for select
to authenticated
using (
  exists (
    select 1 from matches
    where matches.id = match_lineups.match_id
      and private.is_team_member(matches.team_id)
  )
);

create policy "match_lineups_manage_coach"
on match_lineups for all
to authenticated
using (
  exists (
    select 1 from matches
    where matches.id = match_lineups.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
)
with check (
  exists (
    select 1 from matches
    where matches.id = match_lineups.match_id
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
  )
);

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

  insert into match_invites (match_id, created_by, default_status)
  values (created_match_id, actor_id, 'confirmed');

  return created_match_id;
end;
$$;

revoke all on function public.create_match_with_default_attendances(text, timestamptz, integer, attendance_method, timestamptz, text, text, boolean) from public;
grant execute on function public.create_match_with_default_attendances(text, timestamptz, integer, attendance_method, timestamptz, text, text, boolean) to authenticated;
