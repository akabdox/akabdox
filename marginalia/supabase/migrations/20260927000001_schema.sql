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
