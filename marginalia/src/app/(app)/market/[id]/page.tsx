import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PriceBreakdown } from '@/components/price-breakdown'
import { ListingBadge } from '@/components/status'
import { ActionForm } from '@/components/ui/action-form'
import { BookCover } from '@/components/ui/book-cover'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { LISTING_SELECT } from '@/lib/queries'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import { isUuid } from '@/lib/uuid'
import type { ListingWithBook } from '@/lib/types'
import { buy } from '../actions'
import { openDirect } from '../../chat/actions'

export const metadata: Metadata = { title: 'Listing' }

const conditionLabel = { new: 'New', fine: 'Fine', good: 'Good', worn: 'Worn' }

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const viewer = await requireViewer()
  const supabase = await createClient()

  const [{ data }, { data: settings }] = await Promise.all([
    supabase.from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle(),
    supabase.from('settings').select('commission_bps').maybeSingle(),
  ])
  if (!data) notFound()
  const listing = data as unknown as ListingWithBook
  const own = listing.seller_id === viewer.id

  return (
    <div className="grid gap-10">
      <Link href="/market" className="eyebrow hover:text-ink">
        ← Market
      </Link>

      <div className="grid gap-10 md:grid-cols-[auto_1fr]">
        <BookCover title={listing.book.title} author={listing.book.author} coverUrl={listing.book.cover_url} size="lg" className="w-56" />

        <div className="grid content-start gap-6">
          <div className="grid gap-2">
            <ListingBadge status={listing.status} />
            <h1 className="text-[36px]">{listing.book.title}</h1>
            <p className="text-[16px] text-ink-2">
              {listing.book.author}
              {listing.book.published_year ? `, ${listing.book.published_year}` : ''}
            </p>
          </div>

          <p className="tabular text-[28px] font-medium">{formatMoney(listing.price_minor, listing.currency)}</p>

          <dl className="grid max-w-sm grid-cols-[120px_1fr] gap-y-2 text-[14px]">
            <dt className="eyebrow self-center">Seller</dt>
            <dd>
              <Link href={`/u/${listing.seller.username}`} className="hover:underline">
                {listing.seller.display_name}
              </Link>
            </dd>
            <dt className="eyebrow self-center">Format</dt>
            <dd className="capitalize">{listing.format}</dd>
            {listing.condition ? (
              <>
                <dt className="eyebrow self-center">Condition</dt>
                <dd>{conditionLabel[listing.condition]}</dd>
              </>
            ) : null}
            <dt className="eyebrow self-center">Listed</dt>
            <dd>{formatDate(listing.created_at)}</dd>
          </dl>

          {listing.description ? <p className="reading max-w-lg whitespace-pre-line">{listing.description}</p> : null}

          {own ? (
            <div className="max-w-sm border border-rule bg-surface p-5">
              <p className="eyebrow mb-4">Your listing</p>
              <PriceBreakdown amountMinor={listing.price_minor} bps={settings?.commission_bps ?? 700} currency={listing.currency} />
            </div>
          ) : listing.status === 'active' ? (
            <div className="flex flex-wrap items-start gap-3">
              <ActionForm action={buy}>
                <input type="hidden" name="listing_id" value={listing.id} />
                <SubmitButton pendingLabel="Reserving">Buy this copy</SubmitButton>
              </ActionForm>
              <form action={openDirect}>
                <input type="hidden" name="user_id" value={listing.seller_id} />
                <Button type="submit" variant="secondary">
                  Message seller
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-ink-3">This copy is no longer available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
