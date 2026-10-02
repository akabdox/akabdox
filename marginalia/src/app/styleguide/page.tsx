import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { BookCover } from '@/components/ui/book-cover'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Checkbox, Field, Input, Segmented, Select, Textarea } from '@/components/ui/field'
import { Monogram } from '@/components/ui/monogram'
import { Rating } from '@/components/ui/rating'
import { Rule } from '@/components/ui/rule'
import { ListingBadge, ReadingBadge, SaleBadge, SwapBadge, TransactionBadge } from '@/components/status'
import { PriceBreakdown } from '@/components/price-breakdown'
import { PostCard } from '@/components/post-card'
import { ShelfCard } from '@/components/shelf-card'
import { ListingCard } from '@/components/listing-card'
import { MessageLine } from '@/components/message-line'
import { site } from '@/lib/site'
import type { ListingWithBook, Post, ShelfItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Design system' }

const colors = [
  ['paper', '--paper', 'Background'],
  ['surface', '--surface', 'Cards, inputs'],
  ['sunken', '--sunken', 'Muted fills'],
  ['ink', '--ink', 'Text, primary'],
  ['ink-2', '--ink-2', 'Secondary text'],
  ['ink-3', '--ink-3', 'Meta, labels'],
  ['rule', '--rule', 'Hairlines'],
  ['rule-strong', '--rule-strong', 'Hover borders'],
  ['danger', '--danger', 'Errors only'],
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
    <section className="grid gap-6 border-t border-rule py-12">
      <div className="grid gap-1">
        <h2 className="text-[22px]">{title}</h2>
        {note ? <p className="max-w-lg text-[14px] text-ink-3">{note}</p> : null}
      </div>
      {children}
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
      <header className="grid gap-4 py-16">
        <p className="eyebrow">Design system · v0.1</p>
        <h1 className="text-[32px] uppercase tracking-[0.2em] sm:text-[72px]">{site.name}</h1>
        <p className="max-w-lg text-[17px] text-ink-2">
          Inter, two values, no hue. Status is carried by form: fill, outline, dash, tint.
        </p>
      </header>

      <Section title="Colour" note="Ink #1c1c1c on paper #f2f2f2. Dark mode swaps the pair.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {colors.map(([name, token, use]) => (
            <div key={name} className="grid gap-2">
              <div className="h-20 rounded-[2px] border border-rule" style={{ background: `var(${token})` }} />
              <p className="text-[13px] font-medium">{name}</p>
              <p className="-mt-2 text-[12px] text-ink-3">{use}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type" note="Inter for Latin script, IBM Plex Sans Arabic for Arabic.">
        <div className="grid gap-6">
          <p className="text-[56px] font-medium leading-none tracking-[-0.02em]">Read slowly.</p>
          <p className="text-[44px] leading-tight">Heading one, 44</p>
          <p className="text-[28px] leading-tight">Heading two, 28</p>
          <p className="text-[20px] font-medium">Heading three, 20</p>
          <p className="reading max-w-xl">
            Reading text, 17. The body of posts and reviews, set for long lines of thought. Every member here owns
            books, reads books and passes them on.
          </p>
          <p className="text-[15px] text-ink-2">Interface text, 15. Buttons, forms, meta.</p>
          <p className="eyebrow">Eyebrow label, 11, tracked 0.16em</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Buy this copy</Button>
          <Button variant="secondary">Message seller</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Remove</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="secondary">Edit</Button>
          <Button size="sm" variant="danger">Withdraw</Button>
        </div>
      </Section>

      <Section title="Fields">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Title">
            <Input placeholder="Season of Migration to the North" />
          </Field>
          <Field label="Reading status">
            <Select defaultValue="reading">
              <option value="unread">Unread</option>
              <option value="reading">Reading</option>
              <option value="read">Read</option>
            </Select>
          </Field>
          <Field label="Your thought" hint="Plain text. Line breaks are kept." className="sm:col-span-2">
            <Textarea placeholder="What stayed with you?" />
          </Field>
          <div className="flex flex-wrap items-center gap-6">
            <Segmented
              name="kind-demo"
              defaultValue="review"
              options={[
                { value: 'thought', label: 'Thought' },
                { value: 'review', label: 'Review' },
                { value: 'idea', label: 'Idea' },
              ]}
            />
            <Checkbox label="Open to swap" defaultChecked />
          </div>
        </div>
      </Section>

      <Section title="Status" note="Shelf, market and ledger states. No colour coding, so it survives greyscale and colour blindness.">
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <ReadingBadge status="reading" />
            <ReadingBadge status="read" />
            <ReadingBadge status="unread" />
            <SwapBadge />
            <SaleBadge priceMinor={90000} currency="DZD" />
          </div>
          <div className="flex flex-wrap gap-2">
            <ListingBadge status="active" />
            <ListingBadge status="reserved" />
            <ListingBadge status="sold" />
            <ListingBadge status="withdrawn" />
          </div>
          <div className="flex flex-wrap gap-2">
            <TransactionBadge status="pending" />
            <TransactionBadge status="paid" />
            <TransactionBadge status="refund_due" />
            <TransactionBadge status="cancelled" />
            <Badge tone="outline">Admin</Badge>
          </div>
        </div>
      </Section>

      <Section title="Covers" note="Typographic jackets. A real cover from Open Library layers on top when the ISBN has one.">
        <div className="flex flex-wrap items-end gap-5">
          {books.map((b, i) => (
            <BookCover key={b.title} {...b} size={i === 0 ? 'lg' : 'md'} />
          ))}
          <BookCover {...books[3]} size="sm" />
        </div>
      </Section>

      <Section title="Feed">
        <div className="max-w-2xl">
          <PostCard post={samplePost} />
        </div>
      </Section>

      <Section title="Shelf">
        <div className="max-w-2xl">
          <ShelfCard item={sampleShelf} />
        </div>
      </Section>

      <Section title="Market" note="Seller view shows the commission split live as they type the price.">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
            {sampleListings.map((l, i) => (
              <ListingCard key={l.id} listing={l} locale="en" index={i} />
            ))}
          </div>
          <div className="h-fit border border-rule bg-surface p-5">
            <p className="eyebrow mb-4">Seller receives</p>
            <PriceBreakdown
              amountMinor={90000}
              bps={700}
              currency="DZD"
              locale="en"
              labels={{ buyerPays: 'Buyer pays', commission: 'Platform commission (7%)', youReceive: 'You receive' }}
            />
          </div>
        </div>
      </Section>

      <Section title="Chat" note="Messages fade in the last quarter of their life, then disappear.">
        <div className="grid max-w-xl gap-4 border border-rule p-5">
          <MessageLine author="Yacine B." body="Anyone reading Dib this week?" time="09:12" expiresIn="3h" expiresLabel="disappears in 3h" mine={false} life={0.12} />
          <MessageLine author="You" body="Halfway through The Big House. Slow start, worth it." time="11:40" expiresIn="14h" expiresLabel="disappears in 14h" mine life={0.6} />
          <MessageLine author="Amina Kaci" body="I have a spare copy if anyone wants to swap." time="12:02" expiresIn="23h" expiresLabel="disappears in 23h" mine={false} />
        </div>
      </Section>

      <Section title="Pieces">
        <div className="flex flex-wrap items-center gap-6">
          <Monogram name="Amina" size="lg" />
          <Monogram name="Yacine" />
          <Monogram name="Lina" size="sm" />
          <Rating value={4} label="4 out of 5" />
          <Rating value={2} label="2 out of 5" />
        </div>
        <Rule label="Chapter two" />
        <Empty title="Your shelf is empty.">Add the books you own. Mark what you would swap or sell.</Empty>
      </Section>
    </main>
  )
}
