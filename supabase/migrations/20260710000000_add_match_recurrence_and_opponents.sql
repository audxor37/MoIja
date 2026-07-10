alter table matches
  add column if not exists opponent_name text,
  add column if not exists recurrence_group_id uuid,
  add column if not exists recurrence_type text not null default 'none',
  add column if not exists recurrence_index integer not null default 0,
  add column if not exists recurrence_count integer not null default 1;

alter table matches
  drop constraint if exists matches_recurrence_type_check,
  add constraint matches_recurrence_type_check
    check (recurrence_type in ('none', 'weekly'));

alter table matches
  drop constraint if exists matches_recurrence_index_check,
  add constraint matches_recurrence_index_check
    check (recurrence_index >= 0);

alter table matches
  drop constraint if exists matches_recurrence_count_check,
  add constraint matches_recurrence_count_check
    check (recurrence_count in (1, 8));

create index if not exists matches_recurrence_group_id_idx
  on matches (recurrence_group_id)
  where recurrence_group_id is not null;

create or replace function public.create_match_series_with_default_attendances(
  input_title text,
  input_starts_at timestamptz,
  input_capacity integer,
  input_attendance_method attendance_method,
  input_deadline_hours integer,
  input_location_note text default null,
  input_memo text default null,
  input_allow_waitlist boolean default true,
  input_repeat_count integer default 1,
  input_opponent_names text[] default array[]::text[]
)
returns uuid[]
language plpgsql
security invoker
set search_path = public
as $$
declare
  actor_id uuid;
  target_team_id uuid;
  series_group_id uuid;
  created_match_id uuid;
  created_match_ids uuid[] := array[]::uuid[];
  round_index integer;
  round_starts_at timestamptz;
  round_opponent_name text;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception 'auth_required';
  end if;

  if input_repeat_count not in (1, 8) then
    raise exception 'invalid_repeat_count';
  end if;

  if input_deadline_hours is null or input_deadline_hours < 1 then
    raise exception 'invalid_deadline_hours';
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

  series_group_id := case when input_repeat_count > 1 then gen_random_uuid() else null end;

  for round_index in 0..(input_repeat_count - 1) loop
    round_starts_at := input_starts_at + make_interval(days => round_index * 7);
    round_opponent_name := nullif(btrim(input_opponent_names[round_index + 1]), '');

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
      opponent_name,
      recurrence_group_id,
      recurrence_type,
      recurrence_index,
      recurrence_count,
      created_by
    )
    values (
      target_team_id,
      input_title,
      round_starts_at,
      input_capacity,
      input_attendance_method,
      round_starts_at - make_interval(hours => input_deadline_hours),
      input_location_note,
      input_memo,
      input_allow_waitlist,
      round_opponent_name,
      series_group_id,
      case when input_repeat_count > 1 then 'weekly' else 'none' end,
      round_index,
      input_repeat_count,
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

    created_match_ids := array_append(created_match_ids, created_match_id);
  end loop;

  return created_match_ids;
end;
$$;

revoke all on function public.create_match_series_with_default_attendances(
  text,
  timestamptz,
  integer,
  attendance_method,
  integer,
  text,
  text,
  boolean,
  integer,
  text[]
) from public;

grant execute on function public.create_match_series_with_default_attendances(
  text,
  timestamptz,
  integer,
  attendance_method,
  integer,
  text,
  text,
  boolean,
  integer,
  text[]
) to authenticated;
