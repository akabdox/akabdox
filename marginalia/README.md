# Fahrasa

An open community for readers, in Arabic, French and English. Anyone can join free. Members post thoughts and reviews, keep a shelf of the books they own, sell or swap copies to each other, and talk in chat rooms that clear themselves.

Working name. Rename it in `src/lib/site.ts`.

Live: https://fahrasa.vercel.app (Vercel project `fahrasa`, root directory `marginalia`). The old Netlify site is frozen and no longer updated.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript | Server components keep the client bundle small; server actions replace an API layer |
| Styling | Tailwind CSS 4, Material 3 tokens | Colour roles, type scale, shape, elevation and state layers from M3, as CSS variables and Tailwind utilities |
| Motion | Motion (motion.dev) | Nav indicator, page enter, hero, scroll reveals, accordions, chat bubbles. M3 easing tokens, honours reduced motion |
| Data, auth, realtime | Supabase (Postgres, RLS, Realtime, pg_cron) | Business rules live in Postgres functions, so a buggy client cannot move money |
| Payments | Chargily Pay v2 (CIB, Edahabia) or manual | Stripe does not onboard Algerian businesses. Manual mode covers CCP, BaridiMob and cash |
| Type | Fraunces and Roboto Flex, with IBM Plex Sans Arabic | M3 brand face for display and headline, plain face for the rest. Neither has Arabic glyphs, so Arabic falls through to Plex Arabic |
| Languages | Arabic (default, right to left), French, English | Cookie based, no URL prefix. Dictionaries in `src/i18n/dictionaries` |

## Design system

Material 3. Colour roles are a tonal spot scheme generated from one seed, bookcloth green `#35614F`, with `material-color-utilities`. Dark mode is the same seed's dark scheme.

Status is carried by form as well as colour: solid fill (for sale, paid), outline (reading, reserved), dashed outline (open to swap), tonal tint (read, closed). It survives greyscale printing and colour blindness.

Navigation follows M3 window classes: a navigation bar under 768px, a navigation rail with a FAB from 768px up. The rail sits on the inline start, so it moves to the right in Arabic.

See it live at `/styleguide`. Tokens are in `src/app/globals.css`, motion tokens in `src/lib/motion.ts`, components in `src/components/ui`. Icons are Material Symbols Rounded, subset in `src/app/layout.tsx`: add a name to that sorted list before using it. Arrows that point the reading way take the `flip-rtl` class.

**Light and dark.** The device setting decides until a member presses the theme button in the header; the choice is saved in the `theme` cookie and set on `<html>` before the page paints.

**Landing page.** A funnel in five sections: problem, how it works, inside, the name, questions, then a last call to join. Live counts (readers, books, copies for sale) appear only from 30 members, through `public_stats()`.

**Arabic.** The site is right to left when Arabic is chosen. Use logical Tailwind classes (`ms-`, `pe-`, `text-start`, `border-s`) instead of left and right ones. Letter spacing is removed for Arabic text because it breaks the joins; Latin pieces marked `lang="en"` keep it.

## Structure

```
supabase/
  migrations/      schema, business logic, security, realtime + cron
  tests/           smoke test for the whole money flow on plain Postgres
  seed.sql         local founder email
src/
  app/
    (auth)/        join (open), login
    (app)/         feed, u/[username] (shelf), market, orders, chat, settings, admin
    api/payments/  Chargily webhook
    styleguide/    design system page
  components/ui/   buttons, fields, badges, covers, monograms, forms
  lib/             Supabase clients, commission math, money, queries, types
  proxy.ts         session refresh and member gate (Next 16's middleware)
```

## Data model

| Table | Holds |
| --- | --- |
| `profiles` | Members. Created by a trigger on sign up. `onboarded_at` stays empty until the welcome guide is closed |
| `invites` | Retired invite links, kept as history. Sign up is open |
| `books` | Shared catalogue, deduplicated by ISBN or by title and author |
| `shelf_items` | One row per copy a member owns: reading status, open to swap, condition |
| `listings` | A copy on the market. One open listing per copy |
| `transactions` | The ledger. Price, commission rate snapshot, commission, seller net, payout date |
| `posts`, `comments` | Feed and discussion |
| `rooms`, `room_members`, `messages` | Public rooms and direct messages, each with a time to live |
| `settings` | Singleton: commission rate, currency, chat timing. The old member cap and invite quota columns are no longer used |

"For sale" is not a shelf status. It is derived from an open listing, so the shelf and the market can never disagree. Reading status and swap availability are separate fields, because a book can be read and for swap at once.

## How the money works

1. Seller lists a copy. The form previews the split live: price, commission, what they receive.
2. Buyer presses Buy. `create_order()` locks the listing, reserves it, and writes a pending transaction with the commission computed from the current rate. The rate is stored on the transaction, so changing it later never rewrites history.
3. Payment:
   * **Chargily**: the buyer is sent to checkout. The webhook calls `settle_checkout()`, which is idempotent.
   * **Manual**: the buyer transfers by CCP or BaridiMob with a reference. The founder presses Confirm paid in `/admin`.
4. On settlement the listing is marked sold and the copy moves to the buyer's shelf.
5. The platform holds the full amount. The founder pays the seller their net and presses Mark paid out.

Unpaid checkouts release the book after 45 minutes. A payment that arrives after the book was sold to someone else is flagged `refund_due`, never lost.

Commission is rounded half up in integer minor units. `src/lib/commission.ts` mirrors the Postgres function for the live preview; both are tested against the same cases.

## Ephemeral chat

Every message gets `expires_at` from its room: 24 hours in The Reading Room, 7 days in The Swap Desk and in direct messages. The client cannot set it. Row Level Security hides a message the instant it expires; a pg_cron job deletes the rows every 10 minutes. In the UI, messages fade in the last quarter of their life.

## Security

Deny by default. The migrations revoke every table and function privilege Supabase grants automatically, then grant back only what each role needs, down to the column: a member can edit their shelf's reading status but not its owner, a listing's price but not its status. Anonymous visitors can call exactly one function, the username check on the join page. Money and ownership changes only happen inside `security definer` functions.

## Setup

1. Create a Supabase project.
2. Apply the migrations: `npx supabase link --project-ref <ref>` then `npx supabase db push`. Or paste `supabase/setup.sql` into the SQL editor. If you already ran an older setup, run only the newer files in `supabase/migrations`.
3. In the SQL editor, set the founder: `update public.settings set founder_email = 'you@yourdomain.com';`
4. Copy `.env.example` to `.env.local` and fill it in.
5. `npm install && npm run dev`
6. Open `/join` and sign up with the founder email. You become admin. Everyone else signs up at `/join` too and sees the welcome guide on first visit.

**Payments are off by default.** The market works like classifieds: buyers message the seller and agree on payment and delivery directly, and Fahrasa takes no commission. To turn on checkout, commission and the Orders page later, set `PAYMENTS_ENABLED=true`.

For payments, add `CHARGILY_SECRET_KEY` and set the webhook URL in the Chargily dashboard to `https://<your domain>/api/payments/chargily`. Without a key the app runs in manual mode.

## Checks

```
npm test          # commission math, language detection
npm run db:check  # every migration + smoke test on a throwaway Postgres 16
npm run typecheck
npm run build
```

## Known gaps

Deferred work with verification steps is tracked in `TODO.md`.

* **Digital resale.** Listings accept a digital format, but reselling a commercial ebook is usually piracy under its licence. Restrict digital listings to public domain or self published works, or remove the option before launch.
* **Commission leakage.** Members can agree a trade in DMs and pay cash in person. At this scale that is normal, so expect commission to be a small income line.
* **Arabic.** The type stack covers Latin and French. Arabic posts will fall back to a system font until an Arabic face is added.
* **Uploads.** No avatar or cover uploads by design. Covers come from Open Library by ISBN, with a typographic jacket as fallback.
