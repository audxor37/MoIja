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

alter table teams enable row level security;
alter table team_members enable row level security;

drop policy if exists "teams_select_member" on teams;
drop policy if exists "teams_insert_owner" on teams;
drop policy if exists "teams_update_manager" on teams;
drop policy if exists "team_members_select_team" on team_members;
drop policy if exists "team_members_insert_owner_after_create" on team_members;
drop policy if exists "team_members_insert_manager" on team_members;
drop policy if exists "team_members_update_manager" on team_members;

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
using (
  profile_id = auth.uid()
  or private.is_team_member(team_id, array['owner', 'manager', 'coach']::team_role[])
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

create policy "team_members_insert_manager"
on team_members for insert
to authenticated
with check (
  role <> 'owner'
  and private.is_team_member(team_id, array['owner', 'manager']::team_role[])
);

create policy "team_members_update_manager"
on team_members for update
to authenticated
using (private.is_team_member(team_id, array['owner', 'manager']::team_role[]))
with check (private.is_team_member(team_id, array['owner', 'manager']::team_role[]));
