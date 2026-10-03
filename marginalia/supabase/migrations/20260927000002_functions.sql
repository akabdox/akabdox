-- Marginalia: business logic. Anything involving money, ownership or
-- membership runs here, inside one transaction, never in the client.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  )
$$;

create function public.can_access_room(p_room uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.rooms r
    where r.id = p_room
      and (
        r.kind = 'public'
        or exists (
          select 1 from public.room_members m
          where m.room_id = r.id and m.user_id = (select auth.uid())
        )
      )
  )
$$;

-- Commission, rounded half up, in integer arithmetic.
-- Mirrored in src/lib/commission.ts for display only; this one is authoritative.
create function public.commission_for(p_amount_minor integer, p_bps integer) returns integer
language sql immutable
as $$ select ((p_amount_minor::bigint * p_bps + 5000) / 10000)::integer $$;

create function public.touch_updated_at() returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger shelf_items_touch before update on public.shelf_items
  for each row execute function public.touch_updated_at();
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Membership: invite-only, capped
-- ---------------------------------------------------------------------------

-- Called before sign-up so the form can show a real error instead of
-- Supabase's generic "Database error saving new user".
create function public.check_signup(p_code text, p_username text, p_email text) returns text
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
  if not exists (
    select 1 from public.invites
    where code = upper(trim(p_code)) and used_by is null and used_at is null and expires_at > now()
  ) then
    return 'That invite code is not valid or has expired.';
  end if;
  return null;
end $$;

create function public.handle_new_user() returns trigger
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
    where code = v_code and used_by is null and used_at is null and expires_at > now()
    for update;
    if not found then
      raise exception 'Invalid or expired invite code';
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
    update public.invites set used_by = new.id, used_at = now() where code = v_code;
  end if;

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.create_invite() returns public.invites
language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_quota integer;
  v_invite public.invites;
begin
  if v_me is null then
    raise exception 'Sign in first';
  end if;
  if not public.is_admin() then
    select invites_per_member into v_quota from public.settings;
    if (select count(*) from public.invites where created_by = v_me) >= v_quota then
      raise exception 'You have used all % of your invites', v_quota;
    end if;
  end if;
  insert into public.invites (created_by) values (v_me) returning * into v_invite;
  return v_invite;
end $$;

-- ---------------------------------------------------------------------------
-- Shelf
-- ---------------------------------------------------------------------------

-- Finds or creates the catalogue entry, then puts a copy on the caller's shelf.
create function public.add_to_shelf(
  p_title text,
  p_author text,
  p_isbn text default null,
  p_year integer default null,
  p_reading_status public.reading_status default 'unread',
  p_format public.book_format default 'physical',
  p_condition public.book_condition default null,
  p_open_to_swap boolean default false
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_isbn text := nullif(upper(regexp_replace(coalesce(p_isbn, ''), '[^0-9Xx]', '', 'g')), '');
  v_title text := nullif(trim(p_title), '');
  v_author text := nullif(trim(p_author), '');
  v_book uuid;
  v_item uuid;
begin
  if v_me is null then
    raise exception 'Sign in first';
  end if;
  if v_title is null or v_author is null then
    raise exception 'A book needs a title and an author';
  end if;

  if v_isbn is not null then
    select id into v_book from public.books where isbn = v_isbn;
  else
    select id into v_book from public.books
    where isbn is null and lower(title) = lower(v_title) and lower(author) = lower(v_author);
  end if;

  if v_book is null then
    insert into public.books (isbn, title, author, published_year, cover_url, created_by)
    values (
      v_isbn,
      v_title,
      v_author,
      p_year,
      case when v_isbn is not null
        then 'https://covers.openlibrary.org/b/isbn/' || v_isbn || '-M.jpg?default=false'
      end,
      v_me
    )
    returning id into v_book;
  end if;

  insert into public.shelf_items (owner_id, book_id, reading_status, format, condition, open_to_swap)
  values (v_me, v_book, p_reading_status, p_format, p_condition, p_open_to_swap)
  returning id into v_item;

  return v_item;
end $$;

-- Removing a copy pulls it from the market; a copy mid-checkout cannot be removed.
create function public.shelf_item_before_delete() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.listings where shelf_item_id = old.id and status = 'reserved'
  ) then
    raise exception 'This copy is in the middle of a sale';
  end if;
  update public.listings set status = 'withdrawn'
  where shelf_item_id = old.id and status = 'active';
  return old;
end $$;

create trigger shelf_items_before_delete before delete on public.shelf_items
  for each row execute function public.shelf_item_before_delete();

-- ---------------------------------------------------------------------------
-- Marketplace
-- ---------------------------------------------------------------------------
create function public.list_for_sale(
  p_shelf_item uuid,
  p_price_minor integer,
  p_description text default null
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_item public.shelf_items;
  v_listing uuid;
begin
  select * into v_item from public.shelf_items where id = p_shelf_item for update;
  if not found or v_item.owner_id is distinct from v_me then
    raise exception 'That copy is not on your shelf';
  end if;
  if p_price_minor is null or p_price_minor <= 0 then
    raise exception 'Set a price above zero';
  end if;
  if exists (
    select 1 from public.listings
    where shelf_item_id = p_shelf_item and status in ('active', 'reserved')
  ) then
    raise exception 'This copy is already on the market';
  end if;

  insert into public.listings (shelf_item_id, seller_id, book_id, price_minor, format, condition, description)
  values (
    v_item.id, v_me, v_item.book_id, p_price_minor, v_item.format, v_item.condition,
    nullif(trim(p_description), '')
  )
  returning id into v_listing;

  return v_listing;
end $$;

create function public.withdraw_listing(p_listing uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.listings set status = 'withdrawn'
  where id = p_listing and seller_id = (select auth.uid()) and status = 'active';
  if not found then
    raise exception 'Only an active listing of yours can be withdrawn';
  end if;
end $$;

-- Reserves the listing and opens a pending transaction with the commission
-- computed from the current platform rate.
create function public.create_order(p_listing uuid) returns public.transactions
language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_listing public.listings;
  v_bps integer;
  v_tx public.transactions;
begin
  if v_me is null then
    raise exception 'Sign in first';
  end if;

  select * into v_listing from public.listings where id = p_listing for update;
  if not found or v_listing.status <> 'active' then
    raise exception 'This book is no longer available';
  end if;
  if v_listing.seller_id = v_me then
    raise exception 'You cannot buy your own book';
  end if;

  select commission_bps into v_bps from public.settings;

  update public.listings set status = 'reserved' where id = p_listing;

  insert into public.transactions (
    listing_id, buyer_id, seller_id, amount_minor, commission_bps, commission_minor, currency
  ) values (
    p_listing, v_me, v_listing.seller_id, v_listing.price_minor, v_bps,
    public.commission_for(v_listing.price_minor, v_bps), v_listing.currency
  )
  returning * into v_tx;

  return v_tx;
end $$;

-- Internal: marks a transaction paid and moves the copy to the buyer's shelf.
-- Idempotent, so webhook retries are harmless.
create function public._settle(p_tx uuid) returns public.transaction_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_tx public.transactions;
  v_listing public.listings;
begin
  select * into v_tx from public.transactions where id = p_tx for update;
  if not found then
    raise exception 'Transaction not found';
  end if;
  if v_tx.status in ('paid', 'refund_due', 'refunded') then
    return v_tx.status;
  end if;

  select * into v_listing from public.listings where id = v_tx.listing_id for update;

  -- Paid late, after the reservation lapsed and someone else took the copy:
  -- money was captured, so flag it for a refund instead of dropping it.
  if not (
    (v_tx.status = 'pending' and v_listing.status = 'reserved')
    or (v_tx.status = 'cancelled' and v_listing.status = 'active')
  ) then
    update public.transactions set status = 'refund_due', paid_at = now() where id = p_tx;
    return 'refund_due';
  end if;

  update public.transactions set status = 'paid', paid_at = now() where id = p_tx;
  update public.listings set status = 'sold' where id = v_listing.id;

  if v_listing.shelf_item_id is not null then
    update public.shelf_items
    set owner_id = v_tx.buyer_id, reading_status = 'unread', open_to_swap = false, note = null
    where id = v_listing.shelf_item_id;
  else
    insert into public.shelf_items (owner_id, book_id, format, condition)
    values (v_tx.buyer_id, v_listing.book_id, v_listing.format, v_listing.condition);
  end if;

  return 'paid';
end $$;

-- Internal: cancels a pending transaction and puts the listing back on the market.
create function public._release(p_tx uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_tx public.transactions;
begin
  select * into v_tx from public.transactions where id = p_tx for update;
  if not found or v_tx.status <> 'pending' then
    return;
  end if;
  update public.transactions set status = 'cancelled' where id = p_tx;
  update public.listings set status = 'active' where id = v_tx.listing_id and status = 'reserved';
end $$;

-- Payment webhook entry points (service role only).
create function public.settle_checkout(p_provider_ref text) returns public.transaction_status
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.transactions where provider_ref = p_provider_ref;
  if v_id is null then
    raise exception 'Unknown checkout %', p_provider_ref;
  end if;
  return public._settle(v_id);
end $$;

create function public.release_checkout(p_provider_ref text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id from public.transactions where provider_ref = p_provider_ref;
  if v_id is not null then
    perform public._release(v_id);
  end if;
end $$;

create function public.release_order(p_tx uuid) returns void
language sql security definer set search_path = ''
as $$ select public._release(p_tx) $$;

create function public.cancel_my_order(p_tx uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.transactions
    where id = p_tx and buyer_id = (select auth.uid()) and status = 'pending'
  ) then
    raise exception 'Only your own pending order can be cancelled';
  end if;
  perform public._release(p_tx);
end $$;

-- Admin: manual payments (cash, CCP, BaridiMob), cancellations, payouts.
create function public.admin_settle(p_tx uuid) returns public.transaction_status
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  return public._settle(p_tx);
end $$;

create function public.admin_cancel(p_tx uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  perform public._release(p_tx);
end $$;

create function public.admin_mark_paid_out(p_tx uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.transactions set paid_out_at = now()
  where id = p_tx and status = 'paid' and paid_out_at is null;
  if not found then
    raise exception 'Only a paid, unsettled sale can be marked as paid out';
  end if;
end $$;

create function public.admin_mark_refunded(p_tx uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  update public.transactions set status = 'refunded' where id = p_tx and status = 'refund_due';
  if not found then
    raise exception 'Only a transaction flagged for refund can be marked refunded';
  end if;
end $$;

create function public.admin_summary() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;
  select jsonb_build_object(
    'currency', (select currency from public.settings),
    'commission_bps', (select commission_bps from public.settings),
    'member_cap', (select member_cap from public.settings),
    'members', (select count(*) from public.profiles),
    'gross_minor', coalesce(sum(amount_minor) filter (where status = 'paid'), 0),
    'commission_minor', coalesce(sum(commission_minor) filter (where status = 'paid'), 0),
    'owed_to_sellers_minor', coalesce(sum(seller_net_minor) filter (where status = 'paid' and paid_out_at is null), 0),
    'sales', count(*) filter (where status = 'paid'),
    'pending', count(*) filter (where status = 'pending'),
    'refund_due', count(*) filter (where status = 'refund_due')
  ) into v_result
  from public.transactions;
  return v_result;
end $$;

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------
create function public.set_message_expiry() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.created_at := now();
  new.expires_at := now() + (select message_ttl from public.rooms where id = new.room_id);
  return new;
end $$;

create trigger messages_set_expiry before insert on public.messages
  for each row execute function public.set_message_expiry();

create function public.open_direct_room(p_other uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_me uuid := (select auth.uid());
  v_key text;
  v_room uuid;
begin
  if v_me is null then
    raise exception 'Sign in first';
  end if;
  if p_other = v_me then
    raise exception 'You cannot message yourself';
  end if;
  if not exists (select 1 from public.profiles where id = p_other) then
    raise exception 'Member not found';
  end if;

  v_key := least(v_me::text, p_other::text) || ':' || greatest(v_me::text, p_other::text);

  insert into public.rooms (kind, direct_key, message_ttl)
  values ('direct', v_key, (select direct_message_ttl from public.settings))
  on conflict (direct_key) do nothing
  returning id into v_room;

  if v_room is null then
    select id into v_room from public.rooms where direct_key = v_key;
  else
    insert into public.room_members (room_id, user_id) values (v_room, v_me), (v_room, p_other);
  end if;

  return v_room;
end $$;

-- ---------------------------------------------------------------------------
-- Housekeeping (run by pg_cron)
-- ---------------------------------------------------------------------------
create function public.purge_expired_messages() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.messages where expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- A buyer who abandons checkout should not lock a book forever.
create function public.expire_stale_orders() returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_tx uuid;
  v_count integer := 0;
begin
  for v_tx in
    select id from public.transactions
    where status = 'pending' and created_at < now() - interval '45 minutes'
  loop
    perform public._release(v_tx);
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;
