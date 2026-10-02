import type { CSSProperties, ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ListingCard } from '@/components/listing-card'
import { MessageLine } from '@/components/message-line'
import { PriceBreakdown } from '@/components/price-breakdown'
import { ShelfCard } from '@/components/shelf-card'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/viewer'
import { formatRate } from '@/lib/commission'
import { formatMoney } from '@/lib/money'
import { site } from '@/lib/site'
import { cn } from '@/lib/cn'
import { intlTag, type Locale } from '@/i18n/config'
import { getI18n } from '@/i18n/server'
import type { ListingWithBook, ShelfItem } from '@/lib/types'

// Counts only appear once they help: a page that says "4 readers" sells nothing.
const PROOF_FROM = 30

const spines = [
  ['Nedjma', 'h-44', 'bg-ink text-paper'],
  ['The Stranger', 'h-36', 'bg-ink-2 text-paper'],
  ['Invisible Cities', 'h-52', 'border border-ink'],
  ['Stoner', 'h-32', 'bg-ink text-paper'],
  ['The Big House', 'h-40', 'border border-ink'],
  ['Season of Migration', 'h-52', 'bg-ink-2 text-paper'],
  ['Ficciones', 'h-36', 'bg-ink text-paper'],
  ['The Plague', 'h-44', 'border border-ink'],
  ['Palace Walk', 'h-40', 'bg-ink text-paper'],
  ['Pedro Páramo', 'h-32', 'bg-ink-2 text-paper'],
  ['Things Fall Apart', 'h-48', 'border border-ink'],
  ['Solaris', 'h-36', 'bg-ink text-paper'],
] as const

// Sample books in the reader's own script.
const samples: Record<Locale, { title: string; author: string }[]> = {
  ar: [
    { title: 'نجمة', author: 'كاتب ياسين' },
    { title: 'الدار الكبيرة', author: 'محمد ديب' },
    { title: 'موسم الهجرة إلى الشمال', author: 'الطيب صالح' },
    { title: 'الغريب', author: 'ألبير كامو' },
  ],
  fr: [
    { title: 'Nedjma', author: 'Kateb Yacine' },
    { title: 'La Grande Maison', author: 'Mohammed Dib' },
    { title: 'Saison de la migration vers le nord', author: 'Tayeb Salih' },
    { title: 'L’Étranger', author: 'Albert Camus' },
  ],
  en: [
    { title: 'Nedjma', author: 'Kateb Yacine' },
    { title: 'The Big House', author: 'Mohammed Dib' },
    { title: 'Season of Migration to the North', author: 'Tayeb Salih' },
    { title: 'The Stranger', author: 'Albert Camus' },
  ],
}

// The hero's front cover, named in the reader's language.
const heroTitle: Record<Locale, string> = { ar: 'مقدمة ابن خلدون', fr: 'La Muqaddima', en: 'The Muqaddimah' }

const coverStyle = 'h-auto w-full rounded-[1px] shadow-[0_1px_0_rgba(0,0,0,0.06),0_22px_40px_-20px_rgba(0,0,0,0.55)]'

const stagger = (i: number) => ({ '--i': i }) as CSSProperties

function Section({ id, eyebrow, title, children, className }: { id?: string; eyebrow: string; title: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={cn('scroll-mt-20 border-t border-rule', className)}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid max-w-2xl gap-4">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="text-[30px] sm:text-[44px]">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  )
}

// A short run of spines, one of them dashed: the system's sign for "open to swap".
function MiniShelf({ city, swapAt, heights }: { city: string; swapAt: number; heights: string[] }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-1 border-b border-ink">
        {heights.map((h, i) => (
          <div
            key={i}
            className={cn(
              'w-7 rounded-t-[2px] sm:w-8',
              h,
              i === swapAt ? 'border border-dashed border-ink bg-transparent' : i % 3 === 0 ? 'bg-ink' : i % 3 === 1 ? 'bg-ink-2' : 'border border-ink',
            )}
          />
        ))}
      </div>
      <p className="eyebrow">{city}</p>
    </div>
  )
}

async function publicStats(): Promise<{ members: number; books: number; listings: number } | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('public_stats')
  if (error || !data) return null
  return data as { members: number; books: number; listings: number }
}

export default async function Home() {
  if (await getViewer()) redirect('/feed')
  const [{ locale, t }, stats] = await Promise.all([getI18n(), publicStats()])
  const L = t.landing
  const books = samples[locale]
  const number = new Intl.NumberFormat(intlTag[locale])
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
    book: { id: 'b0', isbn: null, published_year: 1956, cover_url: null, ...books[0] },
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
    book: { id: `b${i + 1}`, isbn: null, published_year: null, cover_url: null, ...b },
    seller: { username: 'yacine', display_name: 'Yacine' },
  }))
  const breakdownLabels = { buyerPays: t.sell.buyerPays, commission: t.sell.commission(formatRate(700)), youReceive: t.sell.youReceive }

  return (
    <div className="min-h-dvh">
      {/* Header: the join button never leaves the screen. */}
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/" lang="en" className="text-[15px] font-medium uppercase tracking-[0.28em]">
            {site.name}
          </Link>
          <div className="hidden items-center gap-6 xl:flex">
            {(['how', 'inside', 'story', 'faq'] as const).map((k) => (
              <a key={k} href={`#${k}`} className="eyebrow whitespace-nowrap transition-colors hover:text-ink">
                {L.links[k]}
              </a>
            ))}
          </div>
          <div className="ms-auto flex items-center gap-3 sm:gap-5">
            <LanguageSwitcher className="hidden md:flex" />
            <ThemeToggle labels={themeLabels} />
            <Link href="/login" className="eyebrow hidden whitespace-nowrap transition-colors hover:text-ink sm:inline">
              {L.signIn}
            </Link>
            <ButtonLink href="/join" size="sm">
              {L.joinShort}
            </ButtonLink>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-14 sm:px-6 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid content-center gap-7">
            <p className="eyebrow animate-rise">{L.eyebrow}</p>
            <h1 className="animate-rise text-[42px] font-medium uppercase leading-[1.02] tracking-[0.03em] sm:text-[68px]" style={stagger(1)}>
              {L.title}
            </h1>
            <p className="animate-rise max-w-md text-[17px] text-ink-2" style={stagger(2)}>
              {L.body}
            </p>
            <div className="animate-rise grid gap-3" style={stagger(3)}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <ButtonLink href="/join">{L.join}</ButtonLink>
                <a href="#how" className="eyebrow text-ink-2 transition-colors hover:text-ink">
                  {t.more(L.seeHow)}
                </a>
              </div>
              <p className="text-[13px] text-ink-3">{L.joinNote}</p>
            </div>
            {stats && stats.members >= PROOF_FROM ? (
              <dl className="animate-rise tabular flex flex-wrap gap-x-10 gap-y-4 border-t border-rule pt-6" style={stagger(4)}>
                {(['members', 'books', 'listings'] as const).map((k) => (
                  <div key={k} className="grid gap-0.5">
                    <dd className="text-[26px] font-medium">{number.format(stats[k])}</dd>
                    <dt className="text-[13px] text-ink-3">{L.proof[k]}</dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          {/* Two real covers, a price, a line of talk: the product in one glance. */}
          <div aria-hidden className="relative mx-auto h-[420px] w-full max-w-[400px] sm:h-[470px]">
            <div className="animate-rise absolute start-4 top-0 w-36 sm:start-6 sm:w-44" style={stagger(3)}>
              <Image src="/covers/shurut-al-nahda.webp" alt="" width={800} height={1175} sizes="(min-width: 640px) 176px, 144px" priority className={coverStyle} />
            </div>
            <div className="animate-rise absolute end-4 top-14 w-44 sm:end-6 sm:w-52" style={stagger(4)}>
              <Image src="/covers/muqaddimat-ibn-khaldun.webp" alt="" width={640} height={816} sizes="(min-width: 640px) 208px, 176px" priority className={coverStyle} />
            </div>
            <div className="animate-rise absolute start-0 top-[228px] w-[170px] sm:top-[280px] sm:w-[200px]" style={stagger(5)}>
              <div className="grid gap-1.5 border border-rule bg-surface px-3.5 py-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]">
                <span className="text-[11px] font-medium text-ink-3">{L.inside.messages[2][0]}</span>
                <span className="text-[14px] leading-snug">{L.inside.messages[2][1]}</span>
              </div>
            </div>
            <div
              className="animate-rise absolute end-0 bottom-0 w-[180px] border border-rule bg-surface p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] sm:w-[210px]"
              style={stagger(6)}
            >
              <p className="mb-1 truncate text-[13px] font-medium">{heroTitle[locale]}</p>
              <p className="tabular mb-3 text-[22px] font-medium">{formatMoney(90000, 'DZD', locale)}</p>
              <span className="inline-flex h-6 items-center rounded-full border border-dashed border-ink-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-2">
                {t.badges.swap}
              </span>
            </div>
          </div>
        </div>

        <LanguageSwitcher className="mx-auto mb-8 max-w-6xl px-4 md:hidden" />

        <div aria-hidden lang="en" className="overflow-hidden border-b border-ink">
          <div className="mx-auto flex max-w-6xl items-end gap-1.5 px-4 sm:px-6">
            {spines.map(([title, height, style], i) => (
              <div
                key={title}
                className={cn('animate-rise flex w-11 shrink-0 items-center justify-center rounded-t-[2px] sm:w-14', height, style)}
                style={stagger(i + 4)}
              >
                <span className="rotate-180 text-[10px] font-medium uppercase tracking-[0.2em] [font-variant-ligatures:none] [writing-mode:vertical-rl]">
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 01 · The problem */}
      <Section eyebrow={L.problem.eyebrow} title={L.problem.title} className="border-t-0">
        <div className="grid items-end gap-14 md:grid-cols-2">
          <p className="max-w-lg text-[17px] leading-relaxed text-ink-2">{L.problem.body}</p>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end gap-6 sm:gap-10">
              <MiniShelf city={L.problem.cityA} swapAt={3} heights={['h-24', 'h-20', 'h-28', 'h-24', 'h-16', 'h-24']} />
              <span aria-hidden className="mb-14 hidden h-px flex-1 border-t border-dashed border-ink-2 sm:block" />
              <MiniShelf city={L.problem.cityB} swapAt={1} heights={['h-20', 'h-28', 'h-24', 'h-16', 'h-24', 'h-20']} />
            </div>
            <p className="text-[13px] text-ink-3">{L.problem.swapNote}</p>
          </div>
        </div>
      </Section>

      {/* 02 · How it works */}
      <Section id="how" eyebrow={L.how.eyebrow} title={L.how.title}>
        <ol className="grid gap-px border border-rule bg-rule md:grid-cols-3">
          {L.how.steps.map(([title, body], i) => (
            <li key={title} className="grid content-start gap-4 bg-paper p-7 sm:p-8">
              <span className="tabular text-[56px] font-medium leading-none text-ink-3">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-[22px]">{title}</h3>
              <p className="text-[15px] text-ink-2">{body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 03 · Inside */}
      <Section id="inside" eyebrow={L.inside.eyebrow} title={L.inside.title}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="grid content-start gap-2 border border-rule bg-surface p-5">
            <p className="eyebrow">{L.inside.shelf}</p>
            <ShelfCard item={shelfItem} />
          </div>
          <div className="grid content-start gap-5 border border-rule bg-surface p-5">
            <p className="eyebrow">{L.inside.market}</p>
            <div className="grid grid-cols-2 gap-4">
              {listings.map((l, i) => (
                <ListingCard key={l.id} listing={l} locale={locale} index={i} />
              ))}
            </div>
            <div className="border-t border-rule pt-4">
              <PriceBreakdown amountMinor={75000} bps={700} currency="DZD" locale={locale} labels={breakdownLabels} />
            </div>
          </div>
          <div className="grid content-start gap-5 border border-rule bg-surface p-5">
            <p className="eyebrow">{L.inside.chat}</p>
            <div className="grid gap-4">
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
          </div>
        </div>
      </Section>

      {/* 04 · The name */}
      <section id="story" className="scroll-mt-20 border-t border-rule bg-sunken">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_1fr]">
          <p lang="ar" dir="rtl" aria-hidden className="text-center text-[120px] font-medium leading-none sm:text-[180px] lg:text-[200px]">
            فهرسة
          </p>
          <div className="grid gap-5">
            <p className="eyebrow">{L.story.eyebrow}</p>
            <h2 className="text-[28px] sm:text-[38px]">{L.story.title}</h2>
            <p className="max-w-lg text-[17px] leading-relaxed text-ink-2">{L.story.body}</p>
          </div>
        </div>
      </section>

      {/* 05 · Questions */}
      <Section id="faq" eyebrow={L.faq.eyebrow} title={L.faq.title}>
        <div className="border-t border-ink">
          {L.faq.items.map(([q, a]) => (
            <details key={q} className="group border-b border-rule">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="text-[22px] font-normal text-ink-3 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-[15px] text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Last call */}
      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl justify-items-start gap-7 px-4 py-24 sm:px-6 sm:py-32">
          <h2 className="max-w-3xl text-[36px] font-medium uppercase leading-[1.05] tracking-[0.03em] sm:text-[60px]">{L.final.title}</h2>
          <p className="text-[17px] opacity-75">{L.final.body}</p>
          <ButtonLink href="/join" variant="inverse">
            {L.join}
          </ButtonLink>
          <p className="text-[13px] opacity-60">{L.joinNote}</p>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-10 sm:px-6">
          <span lang="en" className="text-[13px] font-medium uppercase tracking-[0.28em]">
            {site.name}
          </span>
          <span className="text-[13px] text-ink-3">{L.footer}</span>
          <LanguageSwitcher className="ms-auto" />
          <Link href="/login" className="eyebrow hover:text-ink">
            {L.signIn}
          </Link>
        </div>
      </footer>
    </div>
  )
}
