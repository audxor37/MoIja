drop policy if exists "matches_update_manager" on matches;
drop policy if exists "matches_delete_manager" on matches;

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
