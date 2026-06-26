alter table teams
add column if not exists invite_code text;

update teams
   set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
 where invite_code is null;

alter table teams
alter column invite_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

alter table teams
alter column invite_code set not null;

create unique index if not exists teams_invite_code_key
on teams(invite_code);

create or replace function public.join_team_by_invite_code(input_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  target_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  normalized_code := upper(regexp_replace(coalesce(input_invite_code, ''), '[^a-zA-Z0-9]', '', 'g'));

  if normalized_code = '' then
    raise exception 'invite code required';
  end if;

  select id
    into target_team_id
    from teams
   where invite_code = normalized_code;

  if target_team_id is null then
    raise exception 'team invite code not found';
  end if;

  insert into team_members (team_id, profile_id, role)
  values (target_team_id, auth.uid(), 'member')
  on conflict (team_id, profile_id) do nothing;

  return target_team_id;
end;
$$;

revoke all on function public.join_team_by_invite_code(text) from public;
grant execute on function public.join_team_by_invite_code(text) to authenticated;
