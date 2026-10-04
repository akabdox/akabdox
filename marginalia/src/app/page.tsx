import type { CSSProperties, ReactNode } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Faq } from '@/components/landing/faq'
import { HeroStage } from '@/components/landing/hero-stage'
import { TopBar } from '@/components/landing/top-bar'
import { CountUp } from '@/components/motion/count-up'
import { Reveal } from '@/components/motion/reveal'
import { ButtonLink } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ListingCard } from '@/components/listing-card'
import { MessageLine } from '@/components/message-line'
import { PriceBreakdown } from '@/components/price-breakdown'
import { ShelfCard } from '@/components/shelf-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Wordmark } from '@/components/wordmark'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'
import { formatRate } from '@/lib/commission'
import { formatMoney } from '@/lib/money'
import { site } from '@/lib/site'
import { cn } from '@/lib/cn'
import { intlTag, type Locale } from '@/i18n/config'
import { getI18n } from '@/i18n/server'
import { paymentsEnabled } from '@/lib/features'
import type { ListingWithBook, ShelfItem } from '@/lib/types'

// Counts only appear once they help: a page that says "4 readers" sells nothing.
const PROOF_FROM = 30

// Decorative spines in the scheme's tonal roles. Latin titles, marked lang="en".
const spines = [
  ['Nedjma', 'h-44', 'bg-primary text-on-primary'],
  ['The Stranger', 'h-36', 'bg-secondary-container text-on-secondary-container'],
  ['Invisible Cities', 'h-52', 'bg-tertiary text-on-tertiary'],
  ['Stoner', 'h-32', 'bg-primary-container text-on-primary-container'],
  ['The Big House', 'h-40', 'border border-dashed border-primary text-primary'],
  ['Season of Migration', 'h-52', 'bg-inverse-surface text-inverse-on-surface'],
  ['Ficciones', 'h-36', 'bg-primary text-on-primary'],
  ['The Plague', 'h-44', 'bg-tertiary-container text-on-tertiary-container'],
  ['Palace Walk', 'h-40', 'bg-secondary text-on-secondary'],
  ['Pedro Páramo', 'h-32', 'bg-primary-container text-on-primary-container'],
  ['Things Fall Apart', 'h-48', 'bg-primary text-on-primary'],
  ['Solaris', 'h-36', 'bg-secondary-container text-on-secondary-container'],
] as const

// Sample books in the reader's own script.
// The three real covers in public/covers, named in the reader's language.
const samples: Record<Locale, { title: string; author: string; cover: string; year: number }[]> = {
  ar: [
    { title: 'الإخوة كارامازوف', author: 'دوستويفسكي', cover: '/covers/brothers-karamazov.webp', year: 1880 },
    { title: 'مقدمة ابن خلدون', author: 'ابن خلدون', cover: '/covers/muqaddimat-ibn-khaldun.webp', year: 1377 },
    { title: 'شروط النهضة', author: 'مالك بن نبي', cover: '/covers/shurut-al-nahda.webp', year: 1949 },
  ],
  fr: [
    { title: 'Les Frères Karamazov', author: 'Fiodor Dostoïevski', cover: '/covers/brothers-karamazov.webp', year: 1880 },
    { title: 'La Muqaddima', author: 'Ibn Khaldoun', cover: '/covers/muqaddimat-ibn-khaldun.webp', year: 1377 },
    { title: 'Les Conditions de la renaissance', author: 'Malek Bennabi', cover: '/covers/shurut-al-nahda.webp', year: 1949 },
  ],
  en: [
    { title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', cover: '/covers/brothers-karamazov.webp', year: 1880 },
    { title: 'The Muqaddimah', author: 'Ibn Khaldun', cover: '/covers/muqaddimat-ibn-khaldun.webp', year: 1377 },
    { title: 'The Conditions of Renaissance', author: 'Malek Bennabi', cover: '/covers/shurut-al-nahda.webp', year: 1949 },
  ],
}

// The hero's front cover, named in the reader's language.
const heroTitle: Record<Locale, string> = { ar: 'مقدمة ابن خلدون', fr: 'La Muqaddima', en: 'The Muqaddimah' }

const coverStyle = 'h-auto w-full rounded-e-sm rounded-s-[3px] shadow-e3'

const stagger = (i: number) => ({ '--i': i }) as CSSProperties

const stepIcons = ['shelves', 'swap_horiz', 'forum']

function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <Reveal className="grid max-w-2xl gap-3">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="type-display-sm">{title}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  )
}

// A short run of spines, one of them dashed: the system's sign for "open to swap".
function MiniShelf({ city, swapAt, heights }: { city: string; swapAt: number; heights: string[] }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-1 border-b-2 border-outline">
        {heights.map((h, i) => (
          <div
            key={i}
            className={cn(
              'w-6 rounded-t-xs sm:w-7',
              h,
              i === swapAt
                ? 'border-2 border-dashed border-primary bg-primary-container/40'
                : i % 3 === 0
                  ? 'bg-primary'
                  : i % 3 === 1
                    ? 'bg-secondary-container'
                    : 'bg-tertiary',
            )}
          />
        ))}
      </div>
      <p className="inline-flex items-center gap-1.5 type-label-lg text-on-surface-variant">
        <Icon name="local_shipping" size={18} className="text-primary" />
        {city}
      </p>
    </div>
  )
}

async function publicStats(): Promise<{ members: number; books: number; listings: number } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('public_stats')
  if (error || !data) return null
  return data as { members: number; books: number; listings: number }
}

export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function Home() {
  if (await getViewer()) redirect('/feed')
  const [{ locale, t }, stats] = await Promise.all([getI18n(), publicStats()])
  const L = t.landing
  const books = samples[locale]
  const now = new Date().toISOString()
  const themeLabels = { light: t.theme.light, dark: t.theme.dark }

  const shelfItem: ShelfItem = {
    id: 's1',
    owner_id: 'u1',
    reading_status: 'read',
    open_to_swap: true,
    format: 'physical',
    condition: 'good',
    note: L.inside.shelfNote,
    created_at: now,
    book: { id: 'b0', isbn: null, published_year: books[0].year, cover_url: books[0].cover, title: books[0].title, author: books[0].author },
    listings: [{ id: 'l0', status: 'active', price_minor: 90000, currency: 'DZD' }],
  }
  const listings: ListingWithBook[] = books.slice(1, 3).map((b, i) => ({
    id: `l${i + 1}`,
    shelf_item_id: null,
    seller_id: 'u2',
    book_id: `b${i + 1}`,
    price_minor: [75000, 120000][i],
    currency: 'DZD',
    format: 'physical',
    condition: 'good',
    description: null,
    status: 'active',
    created_at: now,
    book: { id: `b${i + 1}`, isbn: null, published_year: null, cover_url: b.cover, title: b.title, author: b.author },
    seller: { username: 'yacine', display_name: 'Yacine' },
  }))
  const breakdownLabels = { buyerPays: t.sell.buyerPays, commission: t.sell.commission(formatRate(700)), youReceive: t.sell.youReceive }

  return (
    <div className="min-h-dvh overflow-x-clip">
      <TopBar
        home={site.name}
        links={(['how', 'inside', 'story', 'faq'] as const).map((k) => ({ href: `#${k}`, label: L.links[k] }))}
        signIn={L.signIn}
        join={L.joinShort}
        tools={
          <>
            <LanguageSwitcher className="hidden md:flex" />
            <ThemeToggle labels={themeLabels} />
          </>
        }
      />

      {/* Hero */}
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:px-8 lg:pb-24">
          <div className="grid content-center justify-items-start gap-6">
            <p className="animate-rise inline-flex items-center gap-2 rounded-sm bg-secondary-container px-3 py-1.5 type-label-lg text-on-secondary-container">
              <Icon name="verified" size={18} />
              {L.eyebrow}
            </p>
            <h1 className="animate-rise type-display-lg max-w-[14ch]" style={stagger(1)}>
              {L.title}
            </h1>
            <p className="animate-rise max-w-[46ch] type-body-lg text-on-surface-variant sm:text-[1.125rem] sm:leading-7" style={stagger(2)}>
              {L.body}
            </p>
            <div className="animate-rise grid gap-3 pt-2" style={stagger(3)}>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonLink href="/join" size="lg" iconEnd="arrow_forward">
                  {L.join}
                </ButtonLink>
                <ButtonLink href="#how" size="lg" variant="secondary">
                  {L.seeHow}
                </ButtonLink>
              </div>
              <p className="inline-flex items-center gap-1.5 type-body-md text-on-surface-variant">
                <Icon name="check_circle" size={18} className="text-primary" />
                {L.joinNote}
              </p>
            </div>
            {stats && stats.members >= PROOF_FROM ? (
              <dl className="animate-rise tabular flex flex-wrap gap-3 pt-2" style={stagger(4)}>
                {(['members', 'books', 'listings'] as const).map((k) => (
                  <div key={k} className="grid gap-0.5 rounded-md bg-surface-low px-5 py-3">
                    <dd className="type-headline-sm text-primary">
                      <CountUp to={stats[k]} locale={intlTag[locale]} />
                    </dd>
                    <dt className="type-body-sm text-on-surface-variant">{L.proof[k]}</dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          {/* Two real covers, a price, a line of talk: the product in one glance. */}
          <HeroStage
            pieces={[
              {
                className: 'absolute start-4 top-0 w-36 sm:start-6 sm:w-44',
                rotate: -4,
                node: <Image src="/covers/shurut-al-nahda.webp" alt="" width={800} height={1175} sizes="(min-width: 640px) 176px, 144px" priority className={coverStyle} />,
              },
              {
                className: 'absolute end-4 top-14 w-44 sm:end-6 sm:w-52',
                rotate: 3,
                depth: 1,
                node: <Image src="/covers/muqaddimat-ibn-khaldun.webp" alt="" width={640} height={816} sizes="(min-width: 640px) 208px, 176px" priority className={coverStyle} />,
              },
              {
                className: 'absolute start-0 top-[228px] w-[180px] sm:top-[290px] sm:w-[210px]',
                depth: 1,
                node: (
                  <div className="grid gap-1 rounded-[20px] rounded-es-xs bg-surface-lowest px-4 py-3 shadow-e3">
                    <span className="type-label-md text-primary">{L.inside.messages[2][0]}</span>
                    <span className="type-body-md">{L.inside.messages[2][1]}</span>
                  </div>
                ),
              },
              {
                className: 'absolute end-0 bottom-0 w-[190px] sm:w-[220px]',
                node: (
                  <div className="grid gap-2 rounded-lg bg-surface-lowest p-4 shadow-e3">
                    <p className="truncate type-title-sm">{heroTitle[locale]}</p>
                    <p className="tabular type-headline-sm text-primary">{formatMoney(90000, 'DZD', locale)}</p>
                    <span className="inline-flex h-7 w-fit items-center rounded-sm border border-dashed border-tertiary px-3 type-label-md text-tertiary">{t.badges.swap}</span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <LanguageSwitcher className="mx-auto mb-8 max-w-6xl px-4 md:hidden" />

        <div aria-hidden lang="en" dir="ltr" className="overflow-hidden border-b-2 border-outline-variant">
          <div className="mx-auto flex max-w-6xl items-end gap-1.5 px-4 sm:px-6 lg:px-8">
            {spines.map(([title, height, style], i) => (
              <div key={title} className={cn('animate-rise flex w-11 shrink-0 items-center justify-center rounded-t-sm sm:w-14', height, style)} style={stagger(i + 4)}>
                <span className="rotate-180 font-[family-name:var(--font-brand)] text-[13px] tracking-[0.04em] italic [writing-mode:vertical-rl]">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 01 · The problem */}
      <Section eyebrow={L.problem.eyebrow} title={L.problem.title}>
        <div className="grid items-end gap-12 md:grid-cols-2">
          <Reveal>
            <p className="max-w-lg type-body-lg text-on-surface-variant sm:text-[1.125rem] sm:leading-8">{L.problem.body}</p>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-4 rounded-xl bg-surface-low p-6 sm:p-8">
            <div className="flex flex-wrap items-end gap-4 sm:gap-6">
              <MiniShelf city={L.problem.cityA} swapAt={3} heights={['h-24', 'h-20', 'h-28', 'h-24', 'h-16', 'h-24']} />
              <span aria-hidden className="mb-12 hidden h-0 flex-1 border-t-2 border-dashed border-primary sm:block" />
              <MiniShelf city={L.problem.cityB} swapAt={1} heights={['h-20', 'h-28', 'h-24', 'h-16', 'h-24', 'h-20']} />
            </div>
            <p className="type-body-sm text-on-surface-variant">{L.problem.swapNote}</p>
          </Reveal>
        </div>
      </Section>

      {/* 02 · How it works */}
      <Section id="how" eyebrow={L.how.eyebrow} title={L.how.title} className="bg-surface-low">
        <ol className="grid gap-4 md:grid-cols-3">
          {L.how.steps.map(([title, body], i) => (
            <Reveal key={title} delay={i * 0.1}>
              <li className="grid h-full content-start gap-4 rounded-xl bg-surface p-6 transition-shadow duration-300 hover:shadow-e2 sm:p-8">
                <span className="grid size-14 place-items-center rounded-lg bg-primary-container text-on-primary-container">
                  <Icon name={stepIcons[i]} size={28} />
                </span>
                <span className="tabular type-label-lg text-primary">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="type-headline-sm">{title}</h3>
                <p className="type-body-lg text-on-surface-variant">{body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* 03 · Inside */}
      <Section id="inside" eyebrow={L.inside.eyebrow} title={L.inside.title}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Reveal className="grid content-start gap-4 rounded-xl bg-surface-high p-4 sm:p-5">
            <p className="flex items-center gap-2 px-1 type-title-md">
              <Icon name="shelves" className="text-primary" />
              {L.inside.shelf}
            </p>
            <ShelfCard item={shelfItem} />
          </Reveal>
          <Reveal delay={0.1} className="grid content-start gap-4 rounded-xl bg-primary-container p-4 text-on-primary-container sm:p-5">
            <p className="flex items-center gap-2 px-1 type-title-md">
              <Icon name="storefront" />
              {L.inside.market}
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1 text-on-surface">
              {listings.map((l, i) => (
                <ListingCard key={l.id} listing={l} locale={locale} index={i} />
              ))}
            </div>
            {paymentsEnabled ? (
              <PriceBreakdown amountMinor={75000} bps={700} currency="DZD" locale={locale} labels={breakdownLabels} />
            ) : (
              <p className="flex items-start gap-2 px-1 type-body-md">
                <Icon name="info" size={18} className="mt-px" />
                {t.market.contactNote}
              </p>
            )}
          </Reveal>
          <Reveal delay={0.2} className="grid content-start gap-4 rounded-xl bg-tertiary-container p-4 text-on-tertiary-container sm:p-5">
            <p className="flex items-center gap-2 px-1 type-title-md">
              <Icon name="auto_delete" />
              {L.inside.chat}
            </p>
            <div className="grid gap-4 rounded-lg bg-surface p-4 text-on-surface">
              {L.inside.messages.map(([author, body, mine], i) => (
                <MessageLine
                  key={i}
                  author={author}
                  body={body}
                  time={['09:12', '11:40', '12:02'][i]}
                  expiresIn={['3h', '14h', '23h'][i]}
                  expiresLabel={t.chat.disappearsIn(['3h', '14h', '23h'][i])}
                  mine={mine}
                  life={[0.12, 0.6, 1][i]}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 04 · The name */}
      <section id="story" className="scroll-mt-20 bg-inverse-surface text-inverse-on-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:px-8">
          <Reveal y={40}>
            <p lang="ar" dir="rtl" aria-hidden className="text-center font-[family-name:var(--font-arabic)] text-[112px] leading-none font-semibold text-inverse-primary sm:text-[168px] lg:text-[196px]">
              {site.arabic}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="grid gap-5">
            <p className="eyebrow text-inverse-primary">{L.story.eyebrow}</p>
            <h2 className="type-headline-lg sm:type-display-sm">{L.story.title}</h2>
            <p className="max-w-lg type-body-lg opacity-80 sm:text-[1.125rem] sm:leading-8">{L.story.body}</p>
          </Reveal>
        </div>
      </section>

      {/* 05 · Questions */}
      <section id="faq" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1fr_1.6fr] lg:px-8">
          <Reveal className="grid content-start gap-3">
            <p className="eyebrow">{L.faq.eyebrow}</p>
            <h2 className="type-display-sm">{L.faq.title}</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq items={L.faq.items.map(([q, a]) => ({ q, a }))} />
          </Reveal>
        </div>
      </section>

      {/* Last call */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-28 lg:px-8">
        <Reveal className="grid justify-items-center gap-6 rounded-xl bg-primary px-6 py-16 text-center text-on-primary sm:py-20">
          <h2 className="type-display-md max-w-[18ch]">{L.final.title}</h2>
          <p className="max-w-md type-body-lg opacity-85">{L.final.body}</p>
          <ButtonLink href="/join" size="lg" variant="inverse" iconEnd="arrow_forward">
            {L.join}
          </ButtonLink>
          <p className="type-body-md opacity-75">{L.joinNote}</p>
        </Reveal>
      </section>

      <footer className="border-t border-outline-variant">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-4 px-4 py-10 sm:px-6 lg:px-8">
          <Wordmark />
          <span className="type-body-md text-on-surface-variant">{L.footer}</span>
          <LanguageSwitcher className="ms-auto" />
          <Link href="/login" className="state-layer rounded-full px-3 py-2 type-label-lg text-primary">
            {L.signIn}
          </Link>
        </div>
      </footer>
    </div>
  )
}
