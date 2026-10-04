import type { ReactNode } from 'react'
import { BookCover } from './ui/book-cover'
import { ReadingBadge, SaleBadge, SwapBadge } from './status'
import type { ShelfItem } from '@/lib/types'

export function ShelfCard({ item, children }: { item: ShelfItem; children?: ReactNode }) {
  const listing = item.listings.find((l) => l.status === 'active' || l.status === 'reserved')
  return (
    <article className="flex gap-4 rounded-md bg-surface-low p-4 sm:gap-6 sm:p-5">
      <BookCover title={item.book.title} author={item.book.author} coverUrl={item.book.cover_url} size="md" />
      <div className="grid min-w-0 flex-1 content-start gap-3">
        <div className="grid gap-0.5">
          <h3 className="type-title-lg">{item.book.title}</h3>
          <p className="type-body-md text-on-surface-variant">
            {item.book.author}
            {item.book.published_year ? `, ${item.book.published_year}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReadingBadge status={item.reading_status} />
          {item.open_to_swap ? <SwapBadge /> : null}
          {listing ? <SaleBadge priceMinor={listing.price_minor} currency={listing.currency} /> : null}
        </div>
        {item.note ? <p className="type-body-md text-on-surface-variant">{item.note}</p> : null}
        {children}
      </div>
    </article>
  )
}
