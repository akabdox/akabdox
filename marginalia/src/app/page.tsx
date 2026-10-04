import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChatDemo } from '@/components/landing/chat-demo'
import { Faq } from '@/components/landing/faq'
import { HeroCovers } from '@/components/landing/hero-covers'
import { TopBar } from '@/components/landing/top-bar'
import { CountUp } from '@/components/motion/count-up'
import { Reveal } from '@/components/motion/reveal'
import { ReadingBadge, SaleBadge, SwapBadge } from '@/components/status'
import { ButtonLink } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Monogram } from '@/components/ui/monogram'
import { Rating } from '@/components/ui/rating'
import { Wordmark } from '@/components/wordmark'
import { breakdown, formatRate } from '@/lib/commission'
import { formatMoney } from '@/lib/money'
import { getViewer } from '@/lib/viewer'
import { site } from '@/lib/site'

// The public front door is the one page search engines may index.
export const metadata: Metadata = { robots: { index: true, follow: true } }

const titles = [
  'Nedjma', 'The Stranger', 'Invisible Cities', 'Stoner', 'The Big House', 'Season of Migration to the North', 'Ficciones',
  'The Plague', 'Palace Walk', 'Pedro Páramo', 'Things Fall Apart', 'Solaris', 'Les Hirondelles de Kaboul', 'Men in the Sun',
]

const steps = [
  { icon: 'dynamic_feed', title: 'Say what you are reading', body: 'Post a thought, a review or an idea. The feed is only members, newest first. No ads, no ranking.' },
  { icon: 'shelves', title: 'Keep a shelf of what you own', body: 'Every copy you own, with what you are reading now and what you would swap. Your shelf is your profile.' },
  { icon: 'swap_horiz', title: 'Swap it or sell it', body: 'Open a copy to swaps or list it for a price. When it sells, the book moves to the buyer’s shelf.' },
]

const faq = [
  {
    q: 'How do I join?',
    a: 'Fahrasah is invitation only. The owner shares invite links, each with a set number of seats. Open yours, choose a username and how you appear to other readers, and you are in.',
  },
  {
    q: 'How does selling a book work?',
    a: 'List a copy from your shelf and set a price. Before you confirm, you see the platform commission and exactly what you receive. When the buyer pays, the copy moves to their shelf.',
  },
  {
    q: 'How do I pay for a book?',
    a: 'Pay by CCP, BaridiMob or cash when you meet. Once the payment is confirmed, the order closes and the book is yours.',
  },
  {
    q: 'Why does chat disappear?',
    a: 'Rooms clear themselves on a timer and direct messages fade after a week. Talk freely. Nothing piles up and nothing is kept.',
  },
  {
    q: 'Who can see my shelf?',
    a: 'Only members. Your shelf, posts and listings sit behind sign in and are never indexed by search engines.',
  },
]

export default async function Home() {
  if (await getViewer()) redirect('/feed')

  const example = breakdown(120000, 700)

  return (
    <div className="overflow-x-clip">
      <TopBar />

      {/* Hero */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-28 pb-16 sm:px-6 md:pt-36 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-8 lg:pb-24">
          <div className="grid justify-items-start gap-6">
            <p className="animate-rise inline-flex items-center gap-2 rounded-sm bg-secondary-container px-3 py-1.5 type-label-lg text-on-secondary-container">
              <Icon name="lock" size={18} />
              By invitation, 1,000 seats
            </p>
            <h1 className="animate-rise type-display-lg max-w-[13ch]" style={{ '--i': 1 } as CSSProperties}>
              A private library of a thousand readers.
            </h1>
            <p className="animate-rise max-w-[46ch] type-body-lg text-on-surface-variant sm:text-[1.125rem] sm:leading-7" style={{ '--i': 2 } as CSSProperties}>
              Share what you are reading. Keep a shelf of what you own. Swap it, sell it, talk about it, and let the conversation fade by morning.
            </p>
            <div className="animate-rise flex flex-wrap gap-3 pt-2" style={{ '--i': 3 } as CSSProperties}>
              <ButtonLink href="/join" size="lg" iconEnd="arrow_forward">
                Claim your seat
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="secondary">
                Member sign in
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            <span
              aria-hidden
              lang="ar"
              dir="rtl"
              className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-[family-name:var(--font-arabic)] text-[96px] leading-none font-bold text-primary opacity-[0.07] select-none sm:text-[160px]"
            >
              {site.arabic}
            </span>
            <HeroCovers />
          </div>
        </div>
      </section>

      {/* Moving shelf */}
      <div aria-hidden className="border-y border-outline-variant bg-surface-low py-5">
        <div className="animate-marquee flex w-max gap-10 pr-10">
          {[...titles, ...titles].map((t, i) => (
            <span key={i} className="flex items-center gap-10 font-[family-name:var(--font-brand)] text-[1.375rem] whitespace-nowrap text-on-surface-variant italic">
              {t}
              <span className="size-1.5 rounded-full bg-primary" />
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <Reveal className="grid max-w-2xl gap-3">
          <p className="eyebrow">How it works</p>
          <h2 className="type-display-sm">Three things, done well.</h2>
        </Reveal>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <li className="grid h-full content-start gap-4 rounded-xl bg-surface-low p-6 transition-colors duration-300 hover:bg-surface-container sm:p-8">
                <span className="grid size-14 place-items-center rounded-lg bg-primary-container text-on-primary-container">
                  <Icon name={s.icon} size={28} />
                </span>
                <span className="type-label-lg text-primary">0{i + 1}</span>
                <h3 className="type-headline-sm">{s.title}</h3>
                <p className="type-body-lg text-on-surface-variant">{s.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Bento */}
      <section id="market" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
        <Reveal className="grid max-w-2xl gap-3">
          <p className="eyebrow">Inside</p>
          <h2 className="type-display-sm">Built for people who lend books.</h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {/* Market */}
          <Reveal className="md:col-span-4">
            <article className="grid h-full gap-8 rounded-xl bg-primary-container p-6 text-on-primary-container sm:p-10 md:grid-cols-2">
              <div className="grid content-start gap-3">
                <Icon name="storefront" size={32} />
                <h3 className="type-headline-md">A market with the math shown.</h3>
                <p className="type-body-lg opacity-85">Sellers see the commission and their payout before they list. Buyers see one price. No surprises on either side.</p>
              </div>
              <div className="grid content-center gap-3 rounded-lg bg-surface p-5 text-on-surface shadow-e1">
                <p className="type-label-md text-on-surface-variant">Example listing</p>
                <dl className="tabular grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 type-body-md">
                  <dt className="text-on-surface-variant">Buyer pays</dt>
                  <dd className="text-right">{formatMoney(example.amount, 'DZD')}</dd>
                  <dt className="text-on-surface-variant">Commission ({formatRate(700)})</dt>
                  <dd className="text-right text-on-surface-variant">−{formatMoney(example.commission, 'DZD')}</dd>
                  <dt className="border-t border-outline-variant pt-2.5 type-title-sm">You receive</dt>
                  <dd className="border-t border-outline-variant pt-2.5 text-right type-title-sm text-primary">{formatMoney(example.sellerNet, 'DZD')}</dd>
                </dl>
              </div>
            </article>
          </Reveal>

          {/* Status */}
          <Reveal className="md:col-span-2" delay={0.1}>
            <article className="grid h-full content-between gap-8 rounded-xl bg-surface-high p-6 sm:p-8">
              <div className="grid gap-3">
                <Icon name="bookmark" size={32} className="text-primary" />
                <h3 className="type-headline-sm">Every copy has a status.</h3>
                <p className="type-body-md text-on-surface-variant">Read by shape as well as colour, so it works in greyscale too.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReadingBadge status="reading" />
                <SwapBadge />
                <SaleBadge priceMinor={90000} currency="DZD" />
                <ReadingBadge status="read" />
              </div>
            </article>
          </Reveal>

          {/* Chat */}
          <Reveal className="md:col-span-3" delay={0.05}>
            <article className="grid h-full gap-6 rounded-xl bg-tertiary-container p-6 text-on-tertiary-container sm:p-8">
              <div className="grid gap-3">
                <Icon name="auto_delete" size={32} />
                <h3 className="type-headline-sm">Chat that fades like ink.</h3>
                <p className="type-body-md opacity-85">Rooms clear on a timer. Direct messages fade after a week.</p>
              </div>
              <ChatDemo />
            </article>
          </Reveal>

          {/* Feed */}
          <Reveal className="md:col-span-3" delay={0.15}>
            <article className="grid h-full content-start gap-6 rounded-xl bg-surface-high p-6 sm:p-8">
              <div className="grid gap-3">
                <Icon name="forum" size={32} className="text-primary" />
                <h3 className="type-headline-sm">A feed of readers, not reach.</h3>
                <p className="type-body-md text-on-surface-variant">Thoughts, reviews with ratings, and ideas. Newest first, always.</p>
              </div>
              <div aria-hidden className="grid gap-3 rounded-lg bg-surface p-5 shadow-e1">
                <div className="flex items-center gap-3">
                  <Monogram name="Yacine" size="sm" />
                  <span className="type-title-sm">Yacine</span>
                  <span className="rounded-xs bg-secondary-container px-2 py-0.5 type-label-sm text-on-secondary-container">Review</span>
                  <span className="ml-auto type-body-sm text-on-surface-variant">2h</span>
                </div>
                <p className="flex items-center gap-3 type-body-sm text-on-surface-variant">
                  <span className="type-title-sm text-on-surface">Invisible Cities</span>
                  <Rating value={5} />
                </p>
                <p className="type-body-md">Every chapter is a city and every city is Venice. I read it in one sitting and started again.</p>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* Numbers */}
      <section className="bg-inverse-surface text-inverse-on-surface">
        <dl className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-3 sm:px-6 md:py-20 lg:px-8">
          {[
            { n: 1000, label: 'seats in total. When they fill, the door closes.' },
            { n: 7, label: 'days before a direct message fades for good.' },
            { n: 0, label: 'ads, trackers or ranking algorithms.' },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="grid gap-2">
              <dt className="order-2 max-w-[28ch] type-body-lg opacity-80">{s.label}</dt>
              <dd className="order-1 type-display-lg text-inverse-primary">
                <CountUp to={s.n} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_1.6fr] lg:px-8">
        <Reveal className="grid content-start gap-3">
          <p className="eyebrow">Questions</p>
          <h2 className="type-display-sm">Before you open the door.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <Faq items={faq} />
        </Reveal>
      </section>

      {/* Final call */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
        <Reveal className="grid justify-items-center gap-6 rounded-xl bg-primary px-6 py-16 text-center text-on-primary sm:py-20">
          <h2 className="type-display-md max-w-[16ch]">Your seat is waiting on a shelf.</h2>
          <p className="max-w-md type-body-lg opacity-85">Got an invite link? Open it, claim your seat, and put your first book on the shelf tonight.</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <ButtonLink href="/join" size="lg" className="bg-on-primary text-primary" iconEnd="arrow_forward">
              Claim your seat
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary" className="border-on-primary/50 text-on-primary">
              Member sign in
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-10 sm:px-6 lg:px-8">
          <Wordmark />
          <p className="type-body-md text-on-surface-variant">{site.tagline}</p>
          <div className="ml-auto flex gap-6 type-label-lg text-on-surface-variant">
            <Link href="/login" className="hover:text-on-surface">
              Sign in
            </Link>
            <Link href="/join" className="hover:text-on-surface">
              Join
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
