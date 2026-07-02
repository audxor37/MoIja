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
