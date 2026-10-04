import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { ListingCard } from '@/components/listing-card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Icon } from '@/components/ui/icon'
import { createClient } from '@/lib/supabase/server'
import { LISTING_SELECT } from '@/lib/queries'
import type { ListingWithBook } from '@/lib/types'

export const metadata: Metadata = { title: 'Market' }

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  // Keep search terms to characters that are safe inside a PostgREST filter.
  const term = (q ?? '').replace(/[^\p{L}\p{N}\s'-]/gu, '').trim().slice(0, 60)
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(LISTING_SELECT.replace('books!listings_book_id_fkey(', 'books!listings_book_id_fkey!inner('))
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)
  if (term) query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%`, { referencedTable: 'books' })

  const { data } = await query
  const listings = (data ?? []) as unknown as ListingWithBook[]

  return (
    <>
      <PageHeader eyebrow="Peer to peer" title="Market">
        Copies from members' shelves. Pay here, meet or ship, and the book moves to your shelf.
      </PageHeader>

      <form className="animate-rise mb-8 flex h-14 max-w-xl items-center gap-1 rounded-full bg-surface-high pr-1 pl-4 transition-shadow focus-within:shadow-e2" role="search" style={{ '--i': 1 } as CSSProperties}>
        <Icon name="search" className="text-on-surface-variant" />
        <input
          name="q"
          defaultValue={term}
          placeholder="Search by title or author"
          aria-label="Search the market"
          className="h-full min-w-0 flex-1 bg-transparent px-2 type-body-lg text-on-surface outline-none placeholder:text-on-surface-variant focus-visible:outline-none"
        />
        <Button type="submit" variant="tonal">
          Search
        </Button>
      </form>

      {listings.length === 0 ? (
        <Empty icon="storefront" title={term ? `Nothing matches “${term}”.` : 'The market is empty.'}>
          List a copy from your shelf and it shows up here.
        </Empty>
      ) : (
        <div className="-mx-2 grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {listings.map((l, i) => (
            <ListingCard key={l.id} listing={l} index={i} />
          ))}
        </div>
      )}
    </>
  )
}
