-- End-to-end smoke test: membership, shelf, marketplace money flow, chat expiry,
-- and the RLS / grant boundaries between them. Run via scripts/db-check.sh.

\set founder '00000000-0000-0000-0000-00000000000a'
\set seller  '00000000-0000-0000-0000-00000000000b'
\set buyer   '00000000-0000-0000-0000-00000000000c'
\set other   '00000000-0000-0000-0000-00000000000d'

create function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_user::text, ''), false);
  if p_user is null then
    set role anon;
  else
    set role authenticated;
  end if;
end $$;

create function pg_temp.check(p_ok boolean, p_what text) returns void language plpgsql as $$
begin
  if p_ok is not true then
    raise exception 'check failed: %', p_what;
  end if;
end $$;

create function pg_temp.expect_error(p_sql text, p_like text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected an error matching "%" from: %', p_like, p_sql;
exception when others then
  if sqlerrm not ilike '%' || p_like || '%' then
    raise exception 'wrong error for %: got "%", wanted "%"', p_sql, sqlerrm, p_like;
  end if;
end $$;

-- ---------------------------------------------------------------- membership
update public.settings set founder_email = 'founder@example.com';

insert into auth.users (id, email, raw_user_meta_data)
values (:'founder', 'Founder@example.com', '{"username": "Founder", "display_name": "The Founder"}');

do $$ begin
  assert (select role from public.profiles where username = 'founder') = 'admin', 'founder is admin';
end $$;

select pg_temp.expect_error(
  $$ insert into auth.users (email, raw_user_meta_data) values ('x@example.com', '{"username": "nope"}') $$,
  'invite');

select pg_temp.act_as(:'founder');
select code as invite_a from public.create_invite() \gset
select code as invite_b from public.create_invite() \gset
select code as invite_c from public.create_invite() \gset
reset role;

do $$ begin
  assert public.check_signup('BADCODE', 'someone', 'a@b.c') ilike '%invite%', 'bad code reported';
  assert public.check_signup((select code from public.invites limit 1), 'founder', 'a@b.c') ilike '%taken%', 'taken username reported';
  assert public.check_signup((select code from public.invites limit 1), 'fresh_name', 'a@b.c') is null, 'valid signup passes';
end $$;

insert into auth.users (id, email, raw_user_meta_data) values
  (:'seller', 's@example.com', json_build_object('invite_code', lower(:'invite_a'), 'username', 'seller')::jsonb),
  (:'buyer',  'b@example.com', json_build_object('invite_code', :'invite_b', 'username', 'buyer')::jsonb),
  (:'other',  'o@example.com', json_build_object('invite_code', :'invite_c', 'username', 'other')::jsonb);

select pg_temp.expect_error(
  format($$ insert into auth.users (email, raw_user_meta_data) values ('y@example.com', '{"invite_code": "%s", "username": "reuse"}') $$, :'invite_a'),
  'invite');

do $$ begin
  assert (select count(*) from public.profiles) = 4, 'four members';
  assert (select count(*) from public.invites where used_by is not null) = 3, 'three invites used';
end $$;

-- member invite quota (3 by default)
select pg_temp.act_as(:'seller');
select public.create_invite();
select public.create_invite();
select public.create_invite();
select pg_temp.expect_error($$ select public.create_invite() $$, 'used all');

-- anon sees nothing
select pg_temp.act_as(null);
select pg_temp.expect_error($$ select * from public.profiles $$, 'permission denied');
reset role;

-- ------------------------------------------------------------------- shelf
select pg_temp.act_as(:'seller');
select public.add_to_shelf('The Stranger', 'Albert Camus', '978-0-679-72020-1', 1942, 'read', 'physical', 'good', true) as copy_1 \gset
select public.add_to_shelf('Nedjma', 'Kateb Yacine') as copy_2 \gset
-- same book again by another member resolves to the same catalogue row
select pg_temp.act_as(:'buyer');
select public.add_to_shelf('the stranger', 'albert camus', '9780679720201');
do $$ begin
  assert (select count(*) from public.books) = 2, 'books are deduplicated';
end $$;

-- column grants: members cannot reassign ownership
select pg_temp.act_as(:'seller');
select pg_temp.expect_error(
  format($$ update public.shelf_items set owner_id = '%s' where id = '%s' $$, :'buyer', :'copy_1'),
  'permission denied');
select pg_temp.expect_error($$ update public.profiles set role = 'admin' $$, 'permission denied');
update public.shelf_items set reading_status = 'reading' where id = :'copy_2';

-- --------------------------------------------------------------- marketplace
select public.list_for_sale(:'copy_1', 90000, 'Pencil notes in chapter two.') as listing_1 \gset
select pg_temp.expect_error(format($$ select public.list_for_sale('%s', 90000) $$, :'copy_1'), 'already on the market');
select pg_temp.expect_error(format($$ select public.create_order('%s') $$, :'listing_1'), 'your own');
select pg_temp.expect_error(
  format($$ update public.listings set status = 'sold' where id = '%s' $$, :'listing_1'), 'permission denied');

select pg_temp.act_as(:'buyer');
select id as tx_1 from public.create_order(:'listing_1') \gset
select pg_temp.act_as(:'other');
select pg_temp.expect_error(format($$ select public.create_order('%s') $$, :'listing_1'), 'no longer available');
select pg_temp.expect_error(format($$ select public.settle_checkout('x') $$), 'permission denied');
select pg_temp.expect_error(format($$ select public.admin_settle('%s') $$, :'tx_1'), 'admins only');
do $$ begin
  assert (select count(*) from public.transactions) = 0, 'outsiders cannot see the transaction';
end $$;
reset role;

do $$
declare
  v public.transactions;
begin
  select * into v from public.transactions;
  assert v.commission_bps = 700, 'rate snapshot';
  assert v.commission_minor = 6300, '7% of 900.00 is 63.00';
  assert v.seller_net_minor = 83700, 'seller nets 837.00';
  assert (select status from public.listings where id = v.listing_id) = 'reserved', 'listing reserved';
  assert public.commission_for(1, 5000) = 1, 'half rounds up';
  assert public.commission_for(149, 700) = 10, '10.43 rounds to 10';
end $$;

-- payment webhook (service role) settles and moves the copy to the buyer
update public.transactions set provider = 'chargily', provider_ref = 'chk_test_1' where id = :'tx_1';
set role service_role;
select public.settle_checkout('chk_test_1');
select public.settle_checkout('chk_test_1');  -- webhook retry is harmless
reset role;

do $$ begin
  assert (select status from public.transactions where provider_ref = 'chk_test_1') = 'paid', 'paid';
  assert (select status from public.listings where id = (select listing_id from public.transactions where provider_ref = 'chk_test_1')) = 'sold', 'sold';
  assert (select owner_id from public.shelf_items where id = (select shelf_item_id from public.listings where status = 'sold'))
    = '00000000-0000-0000-0000-00000000000c', 'copy moved to buyer shelf';
end $$;

-- abandoned checkout is released, then a late payment reclaims the copy
select pg_temp.act_as(:'seller');
select public.list_for_sale(:'copy_2', 50000) as listing_2 \gset
select pg_temp.act_as(:'buyer');
select id as tx_2 from public.create_order(:'listing_2') \gset
reset role;
update public.transactions set created_at = now() - interval '1 hour' where id = :'tx_2';
set role service_role;
select public.expire_stale_orders();
reset role;
do $$ begin
  assert (select status from public.listings where status in ('active', 'reserved')) = 'active', 'listing back on market';
end $$;
select pg_temp.act_as(:'founder');
select public.admin_settle(:'tx_2');
reset role;
do $$ begin
  assert (select count(*) from public.transactions where status = 'paid') = 2, 'late payment still settles';
end $$;

-- a late payment for a copy already sold again is flagged, not lost
select pg_temp.act_as(:'buyer');
select public.list_for_sale(:'copy_2', 60000) as listing_3 \gset
select pg_temp.act_as(:'other');
select id as tx_3 from public.create_order(:'listing_3') \gset
select public.cancel_my_order(:'tx_3');
select id as tx_4 from public.create_order(:'listing_3') \gset
select pg_temp.act_as(:'founder');
select public.admin_settle(:'tx_4');
select pg_temp.check(public.admin_settle(:'tx_3') = 'refund_due', 'late payment flagged for refund');
reset role;

select pg_temp.act_as(:'founder');
select public.admin_mark_paid_out(:'tx_1');
select pg_temp.check(
  (s ->> 'sales')::int = 3 and (s ->> 'refund_due')::int = 1
    and (s ->> 'commission_minor')::int = 6300 + 3500 + 4200
    and (s ->> 'owed_to_sellers_minor')::int = (50000 - 3500) + (60000 - 4200),
  'admin summary: ' || s::text)
from public.admin_summary() s;
select pg_temp.act_as(:'seller');
select pg_temp.expect_error($$ select public.admin_summary() $$, 'admins only');
reset role;

-- shelf removal withdraws an active listing
select pg_temp.act_as(:'seller');
select public.add_to_shelf('L''Étranger', 'Albert Camus') as copy_3 \gset
select public.list_for_sale(:'copy_3', 70000) as listing_4 \gset
delete from public.shelf_items where id = :'copy_3';
reset role;
do $$ begin
  assert (select status from public.listings where shelf_item_id is null and price_minor = 70000) = 'withdrawn', 'withdrawn on delete';
end $$;

-- ---------------------------------------------------------------------- chat
select pg_temp.act_as(:'seller');
insert into public.messages (room_id, body, expires_at)
select id, 'Anyone reading Dib?', now() + interval '100 years' from public.rooms where name = 'The Reading Room';
do $$ begin
  assert (select expires_at < now() + interval '25 hours' from public.messages) , 'client cannot choose expiry';
end $$;

select public.open_direct_room(:'buyer') as dm \gset
select pg_temp.act_as(:'buyer');
select pg_temp.check(public.open_direct_room(:'seller') = :'dm'::uuid, 'direct room is reused');
insert into public.messages (room_id, body) values (:'dm', 'Is the Camus still available?');
select pg_temp.act_as(:'other');
select pg_temp.expect_error(format($$ insert into public.messages (room_id, body) values ('%s', 'hi') $$, :'dm'), 'row-level security');
do $$ begin
  assert (select count(*) from public.messages) = 1, 'outsider sees only the public message';
end $$;
reset role;

update public.messages set expires_at = now() - interval '1 second' where body like 'Anyone%';
select pg_temp.act_as(:'seller');
do $$ begin
  assert (select count(*) from public.messages) = 1, 'expired message is invisible before purge';
end $$;
reset role;
set role service_role;
select pg_temp.check(public.purge_expired_messages() = 1, 'one message purged');
reset role;
do $$ begin
  assert (select count(*) from public.messages) = 1, 'purge removed only the expired message';
end $$;
