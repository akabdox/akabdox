-- Fahrasa: full database setup in one file, for the Supabase SQL editor.
-- Generated from supabase/migrations. Paste it all, then edit and run the last line.

-- ============================================================
-- migrations/20260927000001_schema.sql
-- ============================================================
-- Marginalia: core schema.
-- Money is stored as integer minor units (centimes / cents). Never floats.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('member', 'admin');
create type public.reading_status as enum ('unread', 'reading', 'read');
create type public.book_format as enum ('physical', 'digital');
create type public.book_condition as enum ('new', 'fine', 'good', 'worn');
create type public.post_kind as enum ('thought', 'review', 'idea');
create type public.listing_status as enum ('active', 'reserved', 'sold', 'withdrawn');
create type public.transaction_status as enum ('pending', 'paid', 'cancelled', 'refund_due', 'refunded');
create type public.room_kind as enum ('public', 'direct');

-- ---------------------------------------------------------------------------
-- Platform settings (singleton row)
-- ---------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  commission_bps integer not null default 700 check (commission_bps between 0 and 2000),
  currency text not null default 'DZD' check (currency ~ '^[A-Z]{3}$'),
  member_cap integer not null default 1000 check (member_cap > 0),
  invites_per_member integer not null default 3 check (invites_per_member >= 0),
  direct_message_ttl interval not null default '7 days'
    check (direct_message_ttl between interval '1 hour' and interval '30 days'),
  founder_email text,
  updated_at timestamptz not null default now()
);

insert into public.settings default values;

create function public.platform_currency() returns text
language sql stable security definer set search_path = ''
as $$ select currency from public.settings $$;

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text check (char_length(bio) <= 280),
  city text check (char_length(city) <= 60),
  avatar_url text,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now()
);

create table public.invites (
  code text primary key
    default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_by uuid references public.profiles (id) on delete set null,
  used_by uuid unique references public.profiles (id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

create index invites_created_by_idx on public.invites (created_by);

-- ---------------------------------------------------------------------------
-- Books and personal shelves
-- ---------------------------------------------------------------------------
create table public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text unique check (isbn ~ '^([0-9]{9}[0-9X]|[0-9]{13})$'),
  title text not null check (char_length(title) between 1 and 300),
  author text not null check (char_length(author) between 1 and 200),
  published_year smallint check (published_year between 0 and 2100),
  cover_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Without an ISBN, one catalogue entry per title + author.
create unique index books_title_author_no_isbn_idx
  on public.books (lower(title), lower(author)) where isbn is null;

-- One row per physical (or digital) copy a member owns.
-- "For sale" is not stored here: it is derived from an open listing,
-- so the shelf and the market can never disagree.
create table public.shelf_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  reading_status public.reading_status not null default 'unread',
  open_to_swap boolean not null default false,
  format public.book_format not null default 'physical',
  condition public.book_condition,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shelf_items_owner_idx on public.shelf_items (owner_id, created_at desc);
create index shelf_items_book_idx on public.shelf_items (book_id);
create index shelf_items_swap_idx on public.shelf_items (book_id) where open_to_swap;

-- ---------------------------------------------------------------------------
-- Marketplace
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  shelf_item_id uuid references public.shelf_items (id) on delete set null,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete restrict,
  price_minor integer not null check (price_minor > 0),
  currency text not null default public.platform_currency() check (currency ~ '^[A-Z]{3}$'),
  format public.book_format not null,
  condition public.book_condition,
  description text check (char_length(description) <= 1000),
  status public.listing_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A copy can only be on the market once at a time.
create unique index listings_open_per_copy_idx
  on public.listings (shelf_item_id) where status in ('active', 'reserved');
create index listings_active_idx on public.listings (created_at desc) where status = 'active';
create index listings_seller_idx on public.listings (seller_id);

-- The ledger. Commission rate is snapshotted per transaction so changing
-- the platform rate never rewrites history.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  amount_minor integer not null check (amount_minor > 0),
  commission_bps integer not null check (commission_bps between 0 and 2000),
  commission_minor integer not null check (commission_minor >= 0),
  seller_net_minor integer generated always as (amount_minor - commission_minor) stored,
  currency text not null,
  status public.transaction_status not null default 'pending',
  provider text not null default 'manual' check (provider in ('manual', 'chargily')),
  provider_ref text unique,
  checkout_url text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  paid_out_at timestamptz,
  check (commission_minor <= amount_minor),
  check (buyer_id <> seller_id)
);

create unique index transactions_one_pending_per_listing_idx
  on public.transactions (listing_id) where status = 'pending';
create index transactions_buyer_idx on public.transactions (buyer_id, created_at desc);
create index transactions_seller_idx on public.transactions (seller_id, created_at desc);
create index transactions_status_idx on public.transactions (status, created_at);

-- ---------------------------------------------------------------------------
-- Community feed
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind public.post_kind not null default 'thought',
  book_id uuid references public.books (id) on delete set null,
  rating smallint check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  check (rating is null or kind = 'review')
);

create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_book_idx on public.posts (book_id) where book_id is not null;

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

-- ---------------------------------------------------------------------------
-- Ephemeral chat
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  kind public.room_kind not null,
  name text check (char_length(name) <= 60),
  description text check (char_length(description) <= 200),
  direct_key text unique,
  message_ttl interval not null default '24 hours'
    check (message_ttl between interval '1 hour' and interval '30 days'),
  created_at timestamptz not null default now(),
  check (
    (kind = 'public' and name is not null and direct_key is null)
    or (kind = 'direct' and direct_key is not null)
  )
);

create table public.room_members (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index room_members_user_idx on public.room_members (user_id);

create table public.messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  -- Set by trigger from the room's TTL. Clients cannot choose it.
  expires_at timestamptz not null
);

create index messages_room_idx on public.messages (room_id, created_at desc);
create index messages_expiry_idx on public.messages (expires_at);

insert into public.rooms (kind, name, description, message_ttl) values
  ('public', 'The Reading Room', 'What is on your nightstand today. Clears every 24 hours.', '24 hours'),
  ('public', 'The Swap Desk', 'Trades, wants and haves. Clears every 7 days.', '7 days');

-- ============================================================
-- migrations/20260927000002_functions.sql
-- ============================================================
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

-- ============================================================
-- migrations/20260927000003_security.sql
-- ============================================================
-- Marginalia: access control.
-- Deny by default. Supabase grants ALL on new public tables and functions to
-- anon and authenticated, so we revoke everything and grant back only what
-- each role needs. Row Level Security then decides which rows.
-- Note: tables added in later migrations get Supabase's default grants again,
-- so revoke and re-grant in those migrations too.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Table privileges (authenticated members only; anon sees nothing)
-- ---------------------------------------------------------------------------
grant select (id, commission_bps, currency, member_cap, invites_per_member, direct_message_ttl, updated_at)
  on public.settings to authenticated;
grant update (commission_bps, member_cap, invites_per_member, direct_message_ttl)
  on public.settings to authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, bio, city, avatar_url) on public.profiles to authenticated;

grant select on public.invites to authenticated;

grant select on public.books to authenticated;
grant update (isbn, title, author, published_year, cover_url) on public.books to authenticated;

grant select, delete on public.shelf_items to authenticated;
grant update (reading_status, open_to_swap, format, condition, note) on public.shelf_items to authenticated;

grant select on public.listings to authenticated;
grant update (price_minor, description) on public.listings to authenticated;

grant select on public.transactions to authenticated;

grant select, insert, delete on public.posts to authenticated;
grant update (body) on public.posts to authenticated;

grant select, insert, delete on public.comments to authenticated;

grant select on public.rooms to authenticated;
grant select on public.room_members to authenticated;
grant select, insert, delete on public.messages to authenticated;

-- ---------------------------------------------------------------------------
-- Function privileges
-- ---------------------------------------------------------------------------
grant execute on function public.check_signup(text, text, text) to anon, authenticated;

grant execute on function
  public.is_admin(),
  public.can_access_room(uuid),
  public.create_invite(),
  public.add_to_shelf(text, text, text, integer, public.reading_status, public.book_format, public.book_condition, boolean),
  public.list_for_sale(uuid, integer, text),
  public.withdraw_listing(uuid),
  public.create_order(uuid),
  public.cancel_my_order(uuid),
  public.open_direct_room(uuid),
  public.admin_settle(uuid),
  public.admin_cancel(uuid),
  public.admin_mark_paid_out(uuid),
  public.admin_mark_refunded(uuid),
  public.admin_summary()
to authenticated;

-- Payment webhooks and scheduled jobs only.
grant execute on function
  public.settle_checkout(text),
  public.release_checkout(text),
  public.release_order(uuid),
  public.purge_expired_messages(),
  public.expire_stale_orders()
to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.books enable row level security;
alter table public.shelf_items enable row level security;
alter table public.listings enable row level security;
alter table public.transactions enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;

create policy "members read settings" on public.settings
  for select to authenticated using (true);
create policy "admins change settings" on public.settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "members read profiles" on public.profiles
  for select to authenticated using (true);
create policy "members edit own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "members read own invites" on public.invites
  for select to authenticated
  using (created_by = (select auth.uid()) or public.is_admin());

create policy "members read books" on public.books
  for select to authenticated using (true);
create policy "admins fix books" on public.books
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "members read shelves" on public.shelf_items
  for select to authenticated using (true);
create policy "owners edit shelf" on public.shelf_items
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owners remove from shelf" on public.shelf_items
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "members read listings" on public.listings
  for select to authenticated using (true);
create policy "sellers edit active listings" on public.listings
  for update to authenticated
  using (seller_id = (select auth.uid()) and status = 'active')
  with check (seller_id = (select auth.uid()) and status = 'active');

create policy "parties read their transactions" on public.transactions
  for select to authenticated
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());

create policy "members read posts" on public.posts
  for select to authenticated using (true);
create policy "members write posts" on public.posts
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy "authors edit posts" on public.posts
  for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "authors and admins delete posts" on public.posts
  for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

create policy "members read comments" on public.comments
  for select to authenticated using (true);
create policy "members write comments" on public.comments
  for insert to authenticated with check (author_id = (select auth.uid()));
create policy "authors and admins delete comments" on public.comments
  for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

create policy "members see their rooms" on public.rooms
  for select to authenticated using (public.can_access_room(id));
create policy "members see room members" on public.room_members
  for select to authenticated using (public.can_access_room(room_id));

-- Expired messages vanish the moment they expire, even before the purge job runs.
create policy "members read live messages" on public.messages
  for select to authenticated
  using (expires_at > now() and public.can_access_room(room_id));
create policy "members post in their rooms" on public.messages
  for insert to authenticated
  with check (author_id = (select auth.uid()) and public.can_access_room(room_id));
create policy "authors and admins delete messages" on public.messages
  for delete to authenticated using (author_id = (select auth.uid()) or public.is_admin());

-- ============================================================
-- migrations/20260927000004_realtime_cron.sql
-- ============================================================
-- Marginalia: live chat and scheduled housekeeping.

-- Stream new chat messages. Realtime applies the RLS policies above per subscriber.
alter publication supabase_realtime add table public.messages;

-- Expired messages are already invisible through RLS; this job reclaims the rows.
-- Stale checkouts release their reserved books back to the market.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('marginalia-purge-messages', '*/10 * * * *', 'select public.purge_expired_messages()');
select cron.schedule('marginalia-expire-orders', '*/5 * * * *', 'select public.expire_stale_orders()');

-- ============================================================
-- migrations/20260928000005_owner_invite_links.sql
-- ============================================================
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

-- ============================================================
-- migrations/20261002000006_open_signup_onboarding.sql
-- ============================================================
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

-- Make yourself the owner: put your email between the quotes, then run this line.
update public.settings set founder_email = 'YOUR_EMAIL_HERE';
