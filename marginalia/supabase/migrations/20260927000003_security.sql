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
