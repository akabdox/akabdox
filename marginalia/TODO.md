# Deferred work

Paused on 27 Sep 2026. The code for items 1 to 3 is written and committed, but could not be verified in the build container. Item 4 needs a decision before any code changes.

## Where things stand

* Branch `claude/book-community-platform-xc3yp1`, folder `marginalia/`.
* Passing: `npm test`, `npm run db:check`, `npm run typecheck`, `npm run build`.
* A full run with two members passed against real Supabase Auth (GoTrue) and PostgREST: sign up, shelving, listing, purchase in manual payment mode, admin confirmation, ownership transfer, feed replies, chat rooms, direct messages.
* That local stack and the browser test script were throwaway tools and are not in the repo. When resuming, use `npx supabase start` (needs Docker) or a hosted Supabase project.

## 1. Supabase Realtime for instant chat

**Built:** migration `20260927000004_realtime_cron.sql` adds `public.messages` to the `supabase_realtime` publication. `src/components/chat-room.tsx` subscribes to inserts for the open room and merges them into the list.

**Not verified:** no Realtime server ran in the container. Messages currently show up on page load; live push is untested.

* [ ] After `supabase db push`, confirm `messages` is listed under Database > Publications > `supabase_realtime`.
* [ ] Open the same public room as two members in two browsers. A message sent in one should appear in the other within a second, without a reload.
* [ ] Privacy check: a third member must not receive messages from a direct room they are not in (RLS applies to Realtime subscribers).
* [ ] Leave a room open for over an hour. If messages stop arriving after the token refresh, pass the new token to `supabase.realtime.setAuth()` on auth state change in `chat-room.tsx`.

## 2. Chargily payments and webhook

**Built:** `src/lib/payments/chargily.ts` (create checkout, verify signature), `buy()` in `src/app/(app)/market/actions.ts`, webhook at `src/app/api/payments/chargily/route.ts`. Settlement in Postgres is idempotent and covered by `supabase/tests/smoke.sql`.

**Not verified:** the container could not reach `pay.chargily.net`. The request body, header name and event names follow Chargily Pay v2 as I know it, and have not been checked against the live API. Manual mode (CCP, BaridiMob, cash) works today and was tested end to end.

* [ ] Create a Chargily account and get the test secret key.
* [ ] Set `CHARGILY_SECRET_KEY` and `CHARGILY_MODE=test`. Deploy to a public HTTPS URL, or use a tunnel, because the webhook must reach the app.
* [ ] Set the webhook URL in the Chargily dashboard to `https://<domain>/api/payments/chargily`.
* [ ] Buy a listing with a test card. Expect: redirect to checkout, `provider_ref` saved on the transaction, webhook received, signature accepted, transaction `paid`, copy moved to the buyer's shelf.
* [ ] Cancel a checkout on the payment page. Expect the listing back on the market.
* [ ] Check against a real payload: the signature header name (`signature`), the event names (`checkout.paid`, `checkout.failed`, `checkout.canceled`, `checkout.expired`), and that `data.id` is the checkout id.
* [ ] Confirm the minimum amount (the UI enforces 100 DZD) and whether Chargily accepts only whole dinars.

## 3. Scheduler for message cleanup and order release

**Built:** the same migration enables `pg_cron` and schedules two jobs. `purge_expired_messages()` runs every 10 minutes; `expire_stale_orders()` runs every 5 minutes and releases checkouts older than 45 minutes. Both functions pass in `smoke.sql`.

**Not verified:** pg_cron is not available on plain Postgres, so the test stubbed the scheduling call. The jobs themselves have never fired.

* [ ] If `db push` fails on `create extension pg_cron`, enable it under Database > Extensions and push again.
* [ ] Run `select jobname, schedule from cron.job;` and expect `marginalia-purge-messages` and `marginalia-expire-orders`.
* [ ] After 10 minutes, `select status, start_time from cron.job_run_details order by start_time desc limit 5;` should show `succeeded`.
* [ ] Order release: place an order, then `update transactions set created_at = now() - interval '1 hour' where status = 'pending';`. Within 5 minutes the order should be `cancelled` and the listing `active` again.
* [ ] Message purge: set one message's `expires_at` to the past and confirm the row is gone within 10 minutes.

Priority note: expired messages are already hidden by RLS the moment they expire, so a broken purge only costs storage. A broken order release leaves books stuck as reserved, so check that job first.

## 4. Digital book resale

**Current state:** a shelf copy can be `digital`, and `list_for_sale()` copies that format onto the listing with no restriction.

**Risk:** reselling a commercial ebook usually breaks its licence. The platform takes a commission on each sale, so it would be exposed too.

Decide one of:

* [ ] **A. Physical only market (recommended for launch).** Members can still track digital books on their shelf. Change: in `list_for_sale()` raise `'Only physical copies can be sold'` when the copy is digital, hide the sell form for digital copies in `src/app/(app)/u/[username]/page.tsx`, and add a failing case to `smoke.sql`.
* [ ] **B. Allow with an attestation.** The seller confirms the work is public domain or self published. This needs a checkbox, a stored flag and moderation.
* [ ] **C. Keep as is.** Get local legal advice first.

## Resuming

```
cd marginalia
npm install
npm test && npm run db:check && npm run typecheck && npm run build
```

Then follow the Setup section in `README.md` against a real Supabase project and work through items 3, 1 and 2 in that order. Item 4 can be decided at any time.
