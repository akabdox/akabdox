import type { ReactNode } from 'react'
import { BookCover } from './ui/book-cover'
import { ReadingBadge, SaleBadge, SwapBadge } from './status'
import type { ShelfItem } from '@/lib/types'

export function ShelfCard({ item, children }: { item: ShelfItem; children?: ReactNode }) {
  const listing = item.listings.find((l) => l.status === 'active' || l.status === 'reserved')
  return (
    <article className="flex gap-5 border-b border-rule py-6">
      <BookCover title={item.book.title} author={item.book.author} coverUrl={item.book.cover_url} size="md" />
      <div className="grid min-w-0 flex-1 content-start gap-3">
        <div className="grid gap-0.5">
          <h3 className="text-[18px]">{item.book.title}</h3>
          <p className="text-[14px] text-ink-3">
            {item.book.author}
            {item.book.published_year ? `, ${item.book.published_year}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <ReadingBadge status={item.reading_status} />
          {item.open_to_swap ? <SwapBadge /> : null}
          {listing ? <SaleBadge priceMinor={listing.price_minor} currency={listing.currency} /> : null}
        </div>
        {item.note ? <p className="text-[14px] text-ink-2">{item.note}</p> : null}
        {children}
      </div>
    </article>
  )
}
