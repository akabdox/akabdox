import type { CSSProperties } from 'react'
import Link from 'next/link'
import { BookCover } from './ui/book-cover'
import { formatMoney } from '@/lib/money'
import type { ListingWithBook } from '@/lib/types'

export function ListingCard({ listing, index = 0 }: { listing: ListingWithBook; index?: number }) {
  return (
    <Link
      href={`/market/${listing.id}`}
      className="animate-rise group grid content-start gap-3 rounded-md p-2 transition-colors duration-200 hover:bg-surface-low"
      style={{ '--i': index } as CSSProperties}
    >
      <BookCover
        title={listing.book.title}
        author={listing.book.author}
        coverUrl={listing.book.cover_url}
        size="lg"
        className="w-full transition-[transform,box-shadow] duration-300 ease-[var(--ease-emphasized)] group-hover:-translate-y-1.5 group-hover:shadow-e3"
      />
      <div className="grid gap-0.5 px-1">
        <p className="line-clamp-1 type-title-sm">{listing.book.title}</p>
        <p className="line-clamp-1 type-body-sm text-on-surface-variant">{listing.book.author}</p>
        <p className="tabular mt-1.5 type-title-md text-primary">{formatMoney(listing.price_minor, listing.currency)}</p>
      </div>
    </Link>
  )
}
