drop policy if exists "match_records_select_team" on match_records;
drop policy if exists "match_records_manage_manager" on match_records;
drop policy if exists "player_match_records_select_team" on player_match_records;
drop policy if exists "player_match_records_manage_manager" on player_match_records;

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
      and (
        matches.created_by = (select auth.uid())
        or private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
      )
  )
)
with check (
  recorded_by = (select auth.uid())
  and exists (
    select 1
    from matches
    where matches.id = match_records.match_id
      and (
        matches.created_by = (select auth.uid())
        or private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
      )
  )
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
      and (
        matches.created_by = (select auth.uid())
        or private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
      )
  )
)
with check (
  exists (
    select 1
    from matches
    where matches.id = player_match_records.match_id
      and (
        matches.created_by = (select auth.uid())
        or private.is_team_member(matches.team_id, array['owner', 'manager']::team_role[])
      )
  )
);
