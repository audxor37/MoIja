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

drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;

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

drop policy if exists "team_members_insert_manager" on team_members;
drop policy if exists "team_members_insert_owner_after_create" on team_members;
drop policy if exists "team_members_insert_authorized" on team_members;

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

drop policy if exists "attendances_select_team" on match_attendances;
drop policy if exists "attendances_insert_own" on match_attendances;
drop policy if exists "attendances_insert_manager" on match_attendances;
drop policy if exists "attendances_update_own_or_manager" on match_attendances;
drop policy if exists "attendances_insert_authorized" on match_attendances;

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

drop policy if exists "attendance_events_insert_manager" on attendance_events;
drop policy if exists "attendance_events_insert_own_response" on attendance_events;
drop policy if exists "attendance_events_insert_authorized" on attendance_events;

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

drop policy if exists "match_invites_manage_manager" on match_invites;
drop policy if exists "match_invites_insert_manager" on match_invites;
drop policy if exists "match_invites_update_manager" on match_invites;
drop policy if exists "match_invites_delete_manager" on match_invites;

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

drop policy if exists "guests_insert_manager" on guests;
drop policy if exists "guests_update_creator_or_manager" on guests;

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

drop policy if exists "match_guests_manage_manager" on match_guests;
drop policy if exists "match_guests_insert_manager" on match_guests;
drop policy if exists "match_guests_update_manager" on match_guests;
drop policy if exists "match_guests_delete_manager" on match_guests;

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
