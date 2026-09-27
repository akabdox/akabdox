-- Marginalia: live chat and scheduled housekeeping.

-- Stream new chat messages. Realtime applies the RLS policies above per subscriber.
alter publication supabase_realtime add table public.messages;

-- Expired messages are already invisible through RLS; this job reclaims the rows.
-- Stale checkouts release their reserved books back to the market.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('marginalia-purge-messages', '*/10 * * * *', 'select public.purge_expired_messages()');
select cron.schedule('marginalia-expire-orders', '*/5 * * * *', 'select public.expire_stale_orders()');
