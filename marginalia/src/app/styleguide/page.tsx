import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { BookCover } from '@/components/ui/book-cover'
import { Button, IconButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { Checkbox, Field, Input, Segmented, Select, Textarea } from '@/components/ui/field'
import { Monogram } from '@/components/ui/monogram'
import { Rating } from '@/components/ui/rating'
import { ListingBadge, ReadingBadge, SaleBadge, SwapBadge, TransactionBadge } from '@/components/status'
import { PriceBreakdown } from '@/components/price-breakdown'
import { PostCard } from '@/components/post-card'
import { ShelfCard } from '@/components/shelf-card'
import { ListingCard } from '@/components/listing-card'
import { MessageLine } from '@/components/message-line'
import { Wordmark } from '@/components/wordmark'
import type { ListingWithBook, Post, ShelfItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Design system', robots: { index: false, follow: false } }

const roles = [
  ['primary', 'on-primary', 'Primary', 'Filled buttons, prices, active states'],
  ['primary-container', 'on-primary-container', 'Primary container', 'FAB, highlight cards'],
  ['secondary-container', 'on-secondary-container', 'Secondary container', 'Tonal buttons, nav indicator, chips'],
  ['tertiary-container', 'on-tertiary-container', 'Tertiary container', 'Chat, contrast accents'],
  ['error-container', 'on-error-container', 'Error container', 'Refunds due, failures'],
  ['inverse-surface', 'inverse-on-surface', 'Inverse surface', 'Number band, snackbars'],
] as const

const surfaces = [
  ['surface', 'Surface'],
  ['surface-container-low', 'Container low'],
  ['surface-container', 'Container'],
  ['surface-container-high', 'Container high'],
  ['surface-container-highest', 'Container highest'],
] as const

const typeScale = [
  ['type-display-lg', 'Display large', 'Read slowly.'],
  ['type-display-md', 'Display medium', 'A thousand readers'],
  ['type-headline-lg', 'Headline large', 'Season of Migration'],
  ['type-headline-sm', 'Headline small', 'Keep a shelf of what you own'],
  ['type-title-lg', 'Title large', 'The Stranger, Albert Camus'],
  ['type-title-md', 'Title medium', 'Listed by Yacine B.'],
  ['type-body-lg', 'Body large', 'Pencil notes in chapter two, the spine is cracked but every page is there.'],
  ['type-body-md', 'Body medium', 'Rooms clear on a timer. Direct messages fade after a week.'],
  ['type-label-lg', 'Label large', 'Claim your seat'],
  ['type-label-md', 'Label medium', 'Open to swap'],
] as const

const shapes = [
  ['rounded-xs', 'Extra small, 4'],
  ['rounded-sm', 'Small, 8'],
  ['rounded-md', 'Medium, 12'],
  ['rounded-lg', 'Large, 16'],
  ['rounded-xl', 'Extra large, 28'],
  ['rounded-full', 'Full'],
] as const

const books = [
  { title: 'The Stranger', author: 'Albert Camus' },
  { title: 'Nedjma', author: 'Kateb Yacine' },
  { title: 'Season of Migration to the North', author: 'Tayeb Salih' },
  { title: 'Invisible Cities', author: 'Italo Calvino' },
  { title: 'The Big House', author: 'Mohammed Dib' },
  { title: 'Stoner', author: 'John Williams' },
]

const sampleBook = { id: 'b1', isbn: null, published_year: 1942, cover_url: null, ...books[0] }

const samplePost: Post = {
  id: 'p1',
  author_id: 'u1',
  kind: 'review',
  rating: 4,
  body: 'Read it in one sitting on the train to Béjaïa. Meursault is still the coldest narrator I know, and the second half hits harder than I remembered. The courtroom is where the book really lives.',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  author: { username: 'amina', display_name: 'Amina Kaci' },
  book: { id: 'b1', title: 'The Stranger', author: 'Albert Camus' },
  comments: [{ count: 4 }],
}

const sampleShelf: ShelfItem = {
  id: 's1',
  owner_id: 'u1',
  reading_status: 'read',
  open_to_swap: true,
  format: 'physical',
  condition: 'good',
  note: 'Pencil notes in chapter two.',
  created_at: new Date().toISOString(),
  book: sampleBook,
  listings: [{ id: 'l1', status: 'active', price_minor: 90000, currency: 'DZD' }],
}

const sampleListings: ListingWithBook[] = books.slice(1, 5).map((b, i) => ({
  id: `l${i}`,
  shelf_item_id: null,
  seller_id: 'u1',
  book_id: `b${i}`,
  price_minor: [120000, 75000, 150000, 60000][i],
  currency: 'DZD',
  format: 'physical',
  condition: 'good',
  description: null,
  status: 'active',
  created_at: new Date().toISOString(),
  book: { id: `b${i}`, isbn: null, published_year: null, cover_url: null, ...b },
  seller: { username: 'yacine', display_name: 'Yacine B.' },
}))

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t border-outline-variant py-12">
      <div className="grid gap-1">
        <h2 className="type-headline-md">{title}</h2>
        {note ? <p className="max-w-xl type-body-lg text-on-surface-variant">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
      <header className="grid justify-items-start gap-5 py-16">
        <Wordmark />
        <p className="eyebrow">Design system · Material 3</p>
        <h1 lang="en" className="type-display-lg max-w-[14ch]">Bookcloth green, set in Fraunces and Roboto Flex.</h1>
        <p className="max-w-xl type-body-lg text-on-surface-variant">
          Colour roles are a tonal spot scheme generated from one seed, #35614F. Status is carried by form as well as colour: fill, outline,
          dash, tint.
        </p>
      </header>

      <Section title="Colour roles" note="Each container pairs with its on colour. Dark mode is the same seed's dark scheme.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(([bg, fg, name, use]) => (
            <div key={bg} className="grid h-32 content-between rounded-md p-4" style={{ background: `var(--md-${bg})`, color: `var(--md-${fg})` }}>
              <p className="type-title-md">{name}</p>
              <p className="type-body-sm opacity-80">{use}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {surfaces.map(([token, name]) => (
            <div key={token} className="grid h-24 content-end rounded-md border border-outline-variant p-3" style={{ background: `var(--md-${token})` }}>
              <p className="type-label-md text-on-surface-variant">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type scale" note="Fraunces is the brand face for display and headline roles. Roboto Flex carries everything you read and tap.">
        <div className="grid gap-5">
          {typeScale.map(([cls, name, sample]) => (
            <div key={cls} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-baseline sm:gap-6">
              <p className="type-label-md text-on-surface-variant">{name}</p>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shape" note="The M3 corner scale. Buttons and chips are full or small; cards medium; hero blocks extra large.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {shapes.map(([cls, name]) => (
            <div key={cls} className="grid gap-2">
              <div className={`h-20 bg-primary-container ${cls}`} />
              <p className="type-label-md text-on-surface-variant">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons" note="Filled for the one main action on a screen, tonal and outlined for the rest, text for low emphasis.">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Filled</Button>
          <Button variant="tonal">Tonal</Button>
          <Button variant="elevated">Elevated</Button>
          <Button variant="secondary">Outlined</Button>
          <Button variant="ghost">Text</Button>
          <Button variant="danger" icon="logout">
            Sign out
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" iconEnd="arrow_forward">
            Claim your seat
          </Button>
          <Button size="sm" icon="add">
            Add
          </Button>
          <IconButton icon="settings" label="Settings" />
          <IconButton icon="search" label="Search" />
        </div>
      </Section>

      <Section title="Status chips" note="Readable in greyscale: solid means for sale or paid, outline means in progress, dashed means open to swap.">
        <div className="flex flex-wrap gap-2">
          <ReadingBadge status="reading" />
          <ReadingBadge status="read" />
          <ReadingBadge status="unread" />
          <SwapBadge />
          <SaleBadge priceMinor={90000} currency="DZD" />
          <ListingBadge status="reserved" />
          <TransactionBadge status="paid" />
          <TransactionBadge status="pending" />
          <TransactionBadge status="refund_due" />
          <Badge tone="outline" dot>
            Founder
          </Badge>
        </div>
      </Section>

      <Section title="Fields" note="Filled text fields. The active indicator thickens and turns primary on focus.">
        <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <Field label="Title">
            <Input placeholder="The Stranger" />
          </Field>
          <Field label="Status">
            <Select defaultValue="reading">
              <option value="unread">Unread</option>
              <option value="reading">Reading</option>
              <option value="read">Read</option>
            </Select>
          </Field>
          <Field label="Note" hint="Up to 500 characters." className="sm:col-span-2">
            <Textarea rows={3} placeholder="Condition, edition, where you can hand it over" />
          </Field>
          <Checkbox label="Open to swap" defaultChecked className="sm:col-span-2" />
          <div className="sm:col-span-2">
          <Segmented
            name="kind"
            defaultValue="review"
            options={[
              { value: 'thought', label: 'Thought' },
              { value: 'review', label: 'Review' },
              { value: 'idea', label: 'Idea' },
            ]}
          />
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card variant="tonal" className="p-5 type-title-md">Tonal</Card>
          <Card variant="elevated" className="p-5 type-title-md">Elevated</Card>
          <Card variant="outlined" className="p-5 type-title-md">Outlined</Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <PostCard post={samplePost} />
          <ShelfCard item={sampleShelf} />
        </div>
        <div className="-mx-2 grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-4">
          {sampleListings.map((l, i) => (
            <ListingCard key={l.id} listing={l} locale="en" index={i} />
          ))}
        </div>
      </Section>

      <Section title="Jackets and avatars" note="Typographic covers in the scheme's tonal roles. A real cover image sits on top when one exists.">
        <div className="flex flex-wrap items-end gap-4">
          {books.map((b) => (
            <BookCover key={b.title} {...b} size="md" />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Monogram name="Amina" size="lg" />
          <Monogram name="Yacine" />
          <Monogram name="Lina" size="sm" />
          <Rating value={4} label="4 out of 5" />
        </div>
      </Section>

      <Section title="Market and chat">
        <div className="grid gap-6 lg:grid-cols-2">
          <PriceBreakdown amountMinor={120000} bps={700} currency="DZD" locale="en" labels={{ buyerPays: 'Buyer pays', commission: 'Platform commission (7%)', youReceive: 'You receive' }} />
          <div className="grid gap-4 rounded-xl bg-surface-low p-5">
            <MessageLine author="Amina" body="Anyone finished Nedjma yet?" time="21:04" expiresIn="5h" expiresLabel="disappears in 5h" mine={false} life={0.2} />
            <MessageLine author="You" body="Last night. Swap for your Dib?" time="21:06" expiresIn="6h" expiresLabel="disappears in 6h" mine life={0.9} />
          </div>
        </div>
      </Section>

      <Section title="Empty state">
        <Empty title="Your shelf is empty.">Add the books you own. Mark what you would swap or sell.</Empty>
      </Section>

      <Section title="Motion" note="M3 easing tokens through Motion. Emphasized for movement on screen, emphasized decelerate for entrances. Everything respects reduced motion.">
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ['Emphasized', 'cubic-bezier(0.2, 0, 0, 1)', 'Nav indicator, accordions, cover fan'],
            ['Decelerate', 'cubic-bezier(0.05, 0.7, 0.1, 1)', 'Page enter, reveals, new messages'],
            ['Accelerate', 'cubic-bezier(0.3, 0, 0.8, 0.15)', 'Exits'],
          ].map(([name, curve, use]) => (
            <div key={name} className="grid gap-1 rounded-md bg-surface-low p-5">
              <dt className="type-title-md">{name}</dt>
              <dd className="type-body-sm text-on-surface-variant">{curve}</dd>
              <dd className="type-body-md">{use}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </main>
  )
}
