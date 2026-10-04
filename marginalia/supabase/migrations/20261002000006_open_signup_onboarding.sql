-- Fahrasa: open sign up and first-visit onboarding.
-- Anyone can join: no member cap, no invite link. The founder email still
-- becomes admin. check_signup now returns a short code the app translates.

drop function public.check_signup(text, text, text);

create function public.check_signup(p_username text) returns text
language sql stable security definer set search_path = ''
as $$
  select case
    when lower(coalesce(p_username, '')) !~ '^[a-z0-9_]{3,24}$' then 'username_invalid'
    when exists (select 1 from public.profiles where username = lower(p_username)) then 'username_taken'
  end
$$;

revoke execute on function public.check_signup(text) from public;
grant execute on function public.check_signup(text) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_display text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  v_founder text;
begin
  select founder_email into v_founder from public.settings;

  v_username := coalesce(v_username, 'reader_' || substr(replace(new.id::text, '-', ''), 1, 8));

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    v_username,
    coalesce(v_display, v_username),
    case when v_founder is not null and lower(new.email) = lower(v_founder)
      then 'admin'::public.member_role else 'member'::public.member_role end
  );
  return new;
end $$;

-- Invite links are retired. The table stays as history.
drop function public.create_invite(integer, integer);
drop function public.close_invite(text);
drop function public.invite_is_open(text);

-- Onboarding: null until the member closes the welcome guide.
alter table public.profiles add column onboarded_at timestamptz;
update public.profiles set onboarded_at = now();

create function public.set_onboarded(p_done boolean default true) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in first';
  end if;
  update public.profiles
  set onboarded_at = case when p_done then now() end
  where id = (select auth.uid());
end $$;

revoke execute on function public.set_onboarded(boolean) from public, anon;
grant execute on function public.set_onboarded(boolean) to authenticated;
