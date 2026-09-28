-- Marginalia: invites become owner-only, shareable links.
-- One link can seat several people (max_uses) until it expires.
-- Members no longer invite; the owner (admin) controls every seat.

alter table public.invites
  add column max_uses integer not null default 1 check (max_uses between 1 and 1000),
  add column uses integer not null default 0 check (uses >= 0),
  add constraint invites_uses_within_max check (uses <= max_uses);

-- Carry over single-use invites already claimed.
update public.invites set uses = 1 where used_by is not null;

-- used_by and used_at now record the most recent person to join through the link.
alter table public.invites drop constraint if exists invites_used_by_key;

update public.settings set invites_per_member = 0;

create or replace function public.invite_is_open(p_code text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.invites
    where code = upper(trim(p_code)) and uses < max_uses and expires_at > now()
  )
$$;

create or replace function public.check_signup(p_code text, p_username text, p_email text) returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_cap integer;
  v_founder text;
begin
  select member_cap, founder_email into v_cap, v_founder from public.settings;
  if (select count(*) from public.profiles) >= v_cap then
    return 'The library is full. Every one of the ' || v_cap || ' seats is taken.';
  end if;
  if lower(p_username) !~ '^[a-z0-9_]{3,24}$' then
    return 'Usernames are 3 to 24 characters: letters, numbers and underscores.';
  end if;
  if exists (select 1 from public.profiles where username = lower(p_username)) then
    return 'That username is taken.';
  end if;
  if v_founder is not null and lower(trim(p_email)) = lower(v_founder) then
    return null;
  end if;
  if coalesce(trim(p_code), '') = '' then
    return 'Membership is by invitation. Open the invite link the owner sent you.';
  end if;
  if not public.invite_is_open(p_code) then
    return 'This invite link has expired or is full. Ask the owner for a new one.';
  end if;
  return null;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_code text := upper(trim(new.raw_user_meta_data ->> 'invite_code'));
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
  v_display text := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');
  v_settings public.settings;
  v_founder boolean;
begin
  -- Serialise sign-ups so two people cannot take the last seat at once.
  perform pg_advisory_xact_lock(hashtext('marginalia.signup'));

  select * into v_settings from public.settings;
  v_founder := v_settings.founder_email is not null
    and lower(new.email) = lower(v_settings.founder_email);

  if (select count(*) from public.profiles) >= v_settings.member_cap then
    raise exception 'The library is full';
  end if;

  if not v_founder then
    perform 1 from public.invites
    where code = v_code and uses < max_uses and expires_at > now()
    for update;
    if not found then
      raise exception 'Invalid or expired invite link';
    end if;
  end if;

  v_username := coalesce(v_username, 'reader_' || substr(replace(new.id::text, '-', ''), 1, 8));

  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    v_username,
    coalesce(v_display, v_username),
    case when v_founder then 'admin'::public.member_role else 'member'::public.member_role end
  );

  if not v_founder then
    update public.invites
    set uses = uses + 1, used_by = new.id, used_at = now()
    where code = v_code;
  end if;

  return new;
end $$;

drop function public.create_invite();

create function public.create_invite(p_max_uses integer default 1, p_valid_days integer default 30)
returns public.invites
language plpgsql security definer set search_path = ''
as $$
declare
  v_invite public.invites;
begin
  if not public.is_admin() then
    raise exception 'Only the owner can create invite links';
  end if;
  if p_max_uses is null or p_max_uses not between 1 and 1000 then
    raise exception 'A link can seat between 1 and 1000 people';
  end if;
  if p_valid_days is null or p_valid_days not between 1 and 365 then
    raise exception 'A link can stay open between 1 and 365 days';
  end if;
  insert into public.invites (created_by, max_uses, expires_at)
  values ((select auth.uid()), p_max_uses, now() + make_interval(days => p_valid_days))
  returning * into v_invite;
  return v_invite;
end $$;

create or replace function public.close_invite(p_code text) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only the owner can close invite links';
  end if;
  update public.invites set expires_at = now() where code = p_code and expires_at > now();
end $$;

-- Deny by default, as in 20260927000003_security.sql.
revoke execute on function
  public.invite_is_open(text),
  public.create_invite(integer, integer),
  public.close_invite(text)
from public, anon, authenticated;

grant execute on function public.create_invite(integer, integer), public.close_invite(text) to authenticated;
