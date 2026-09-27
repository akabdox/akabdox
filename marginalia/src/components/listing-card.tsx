import type { CSSProperties } from 'react'
import Link from 'next/link'
import { BookCover } from './ui/book-cover'
import { formatMoney } from '@/lib/money'
import type { ListingWithBook } from '@/lib/types'

export function ListingCard({ listing, index = 0 }: { listing: ListingWithBook; index?: number }) {
  return (
    <Link
      href={`/market/${listing.id}`}
      className="animate-rise group grid gap-3"
      style={{ '--i': index } as CSSProperties}
    >
      <BookCover
        title={listing.book.title}
        author={listing.book.author}
        coverUrl={listing.book.cover_url}
        size="lg"
        className="w-full transition-transform duration-300 group-hover:-translate-y-1"
      />
      <div className="grid gap-0.5">
        <p className="line-clamp-1 text-[14px] font-medium">{listing.book.title}</p>
        <p className="line-clamp-1 text-[13px] text-ink-3">{listing.book.author}</p>
        <p className="tabular mt-1 text-[14px] font-medium">{formatMoney(listing.price_minor, listing.currency)}</p>
      </div>
    </Link>
  )
}
