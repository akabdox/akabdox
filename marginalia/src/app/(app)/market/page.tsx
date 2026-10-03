import type { Metadata } from 'next'
import { ListingCard } from '@/components/listing-card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/field'
import { createClient } from '@/lib/supabase/server'
import { LISTING_SELECT } from '@/lib/queries'
import type { ListingWithBook } from '@/lib/types'
import { getDict, getI18n } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).market.title }
}

export default async function MarketPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const { locale, t } = await getI18n()
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
      <PageHeader eyebrow={t.market.eyebrow} title={t.market.title}>
        {t.market.intro}
      </PageHeader>

      <form className="mb-10 flex max-w-md gap-2" role="search">
        <Input name="q" defaultValue={term} placeholder={t.market.searchPlaceholder} aria-label={t.market.searchLabel} dir="auto" />
        <Button type="submit" variant="secondary">
          {t.market.search}
        </Button>
      </form>

      {listings.length === 0 ? (
        <Empty title={term ? t.market.noMatch(term) : t.market.empty}>
          {t.market.emptyBody}
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {listings.map((l, i) => (
            <ListingCard key={l.id} listing={l} locale={locale} index={i} />
          ))}
        </div>
      )}
    </>
  )
}
