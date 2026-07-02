create or replace function public.join_match_by_guest_invite_code(input_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid;
  normalized_code text;
  target_invite match_invites%rowtype;
  target_guest_id uuid;
  target_match_guest_id uuid;
  target_display_name text;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception 'auth_required';
  end if;

  normalized_code := upper(regexp_replace(coalesce(input_invite_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if normalized_code = '' then
    raise exception 'guest_invite_code_required';
  end if;

  select *
    into target_invite
    from match_invites
   where code = normalized_code
     and revoked_at is null
     and (expires_at is null or expires_at > now())
   limit 1;

  if target_invite.id is null then
    raise exception 'guest_invite_not_found';
  end if;

  select match_guests.id
    into target_match_guest_id
    from match_guests
    join guests on guests.id = match_guests.guest_id
   where match_guests.match_id = target_invite.match_id
     and guests.created_by = actor_id
   limit 1;

  if target_match_guest_id is not null then
    update match_guests
       set status = 'confirmed',
           invite_id = target_invite.id,
           confirmed_by = actor_id
     where id = target_match_guest_id;

    return target_match_guest_id;
  end if;

  if target_invite.max_uses is not null and target_invite.used_count >= target_invite.max_uses then
    raise exception 'guest_invite_unavailable';
  end if;

  select guests.id
    into target_guest_id
    from guests
   where guests.created_by = actor_id
   order by guests.created_at asc
   limit 1;

  if target_guest_id is null then
    select coalesce(nullif(trim(profiles.nickname), ''), '용병')
      into target_display_name
      from profiles
     where profiles.id = actor_id;

    insert into guests (display_name, created_by)
    values (coalesce(target_display_name, '용병'), actor_id)
    returning id into target_guest_id;
  end if;

  insert into match_guests (match_id, guest_id, status, invite_id, confirmed_by)
  values (target_invite.match_id, target_guest_id, 'confirmed', target_invite.id, actor_id)
  returning id into target_match_guest_id;

  update match_invites
     set used_count = used_count + 1
   where id = target_invite.id;

  return target_match_guest_id;
end;
$$;

revoke all on function public.join_match_by_guest_invite_code(text) from public;
grant execute on function public.join_match_by_guest_invite_code(text) to authenticated;

create or replace function public.create_match_with_default_attendances(
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
  actor_id uuid;
  target_team_id uuid;
  created_match_id uuid;
begin
  actor_id := auth.uid();

  if actor_id is null then
    raise exception 'auth_required';
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
    created_by
  )
  values (
    target_team_id,
    input_title,
    input_starts_at,
    input_capacity,
    input_attendance_method,
    input_attendance_closes_at,
    input_location_note,
    input_memo,
    input_allow_waitlist,
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

  return created_match_id;
end;
$$;

revoke all on function public.create_match_with_default_attendances(text, timestamptz, integer, attendance_method, timestamptz, text, text, boolean) from public;
grant execute on function public.create_match_with_default_attendances(text, timestamptz, integer, attendance_method, timestamptz, text, text, boolean) to authenticated;

insert into match_invites (match_id, created_by, default_status)
select matches.id, matches.created_by, 'confirmed'
  from matches
 where matches.created_by is not null
   and not exists (
     select 1
       from match_invites
      where match_invites.match_id = matches.id
   );
