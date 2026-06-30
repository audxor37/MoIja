create index if not exists team_members_manager_lookup_idx
  on team_members (profile_id, joined_at)
  include (team_id, role)
  where role in ('owner', 'manager');

create or replace function public.create_match_for_current_manager(
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
  current_profile_id uuid;
  target_team_id uuid;
  created_match_id uuid;
begin
  current_profile_id := (select auth.uid());

  if current_profile_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select team_id
    into target_team_id
    from team_members
   where profile_id = current_profile_id
     and role in ('owner', 'manager')
   order by joined_at asc
   limit 1;

  if target_team_id is null then
    raise exception 'owner or manager permission required' using errcode = '42501';
  end if;

  insert into matches (
    team_id,
    title,
    starts_at,
    capacity,
    attendance_method,
    attendance_closes_at,
    created_by,
    location_note,
    memo,
    allow_waitlist
  )
  values (
    target_team_id,
    input_title,
    input_starts_at,
    input_capacity,
    input_attendance_method,
    input_attendance_closes_at,
    current_profile_id,
    input_location_note,
    input_memo,
    input_allow_waitlist
  )
  returning id into created_match_id;

  return created_match_id;
end;
$$;

revoke all on function public.create_match_for_current_manager(
  text,
  timestamptz,
  integer,
  attendance_method,
  timestamptz,
  text,
  text,
  boolean
) from public;

grant execute on function public.create_match_for_current_manager(
  text,
  timestamptz,
  integer,
  attendance_method,
  timestamptz,
  text,
  text,
  boolean
) to authenticated;
