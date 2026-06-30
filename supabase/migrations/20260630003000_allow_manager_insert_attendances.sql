drop policy if exists "attendances_select_team" on match_attendances;
drop policy if exists "attendances_insert_own" on match_attendances;
drop policy if exists "attendances_insert_manager" on match_attendances;
drop policy if exists "attendances_update_own_or_manager" on match_attendances;
drop policy if exists "attendance_events_select_team" on attendance_events;
drop policy if exists "attendance_events_insert_manager" on attendance_events;

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

create policy "attendances_insert_manager"
on match_attendances for insert
to authenticated
with check (
  exists (
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
      and private.is_team_member(matches.team_id, array['owner', 'manager', 'coach']::team_role[])
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
