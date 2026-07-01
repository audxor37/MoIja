create type guest_status as enum ('invited', 'accepted', 'declined', 'checked_in', 'confirmed', 'no_show');

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

alter table reliability_scores
add column if not exists attendance_rate integer not null default 0 check (attendance_rate between 0 and 100),
add column if not exists no_show_rate integer not null default 0 check (no_show_rate between 0 and 100),
add column if not exists current_streak integer not null default 0 check (current_streak >= 0),
add column if not exists attended_count integer not null default 0 check (attended_count >= 0),
add column if not exists absent_count integer not null default 0 check (absent_count >= 0),
add column if not exists no_show_count integer not null default 0 check (no_show_count >= 0),
add column if not exists total_count integer not null default 0 check (total_count >= 0);

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

create schema if not exists private;

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

create trigger match_guests_touch_updated_at
before update on match_guests
for each row execute function private.touch_updated_at();

alter table match_invites enable row level security;
alter table guests enable row level security;
alter table match_guests enable row level security;

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

create policy "match_invites_manage_manager"
on match_invites for all
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
  created_by = auth.uid()
  and exists (
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
with check (created_by = auth.uid());

create policy "guests_update_creator_or_manager"
on guests for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from match_guests
    join matches on matches.id = match_guests.match_id
    where match_guests.guest_id = guests.id
      and private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
  )
)
with check (
  created_by = auth.uid()
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

create policy "match_guests_manage_manager"
on match_guests for all
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
