alter table matches
  add column if not exists location_note text,
  add column if not exists memo text,
  add column if not exists allow_waitlist boolean not null default true;

drop policy if exists "matches_read_team" on matches;
drop policy if exists "matches_manage_manager" on matches;
drop policy if exists "matches_insert_manager" on matches;
drop policy if exists "matches_update_manager" on matches;
drop policy if exists "matches_delete_manager" on matches;

create policy "matches_read_team"
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
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));

create policy "matches_delete_manager"
on matches for delete
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));
