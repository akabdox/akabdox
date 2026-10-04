import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
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
    <div className="grid gap-6">
      <BackLink href="/market">Market</BackLink>

      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="animate-rise grid place-items-center rounded-xl bg-surface-container p-8 sm:p-12 md:self-start">
          <BookCover title={listing.book.title} author={listing.book.author} coverUrl={listing.book.cover_url} size="lg" className="w-44 sm:w-56" />
        </div>

        <div className="animate-rise grid content-start gap-6" style={{ '--i': 1 } as CSSProperties}>
          <div className="grid gap-3">
            <ListingBadge status={listing.status} />
            <h1 className="type-display-sm">{listing.book.title}</h1>
            <p className="type-body-lg text-on-surface-variant">
              {listing.book.author}
              {listing.book.published_year ? `, ${listing.book.published_year}` : ''}
            </p>
          </div>

          <p className="tabular type-headline-lg text-primary">{formatMoney(listing.price_minor, listing.currency)}</p>

          <dl className="grid max-w-md grid-cols-[110px_1fr] gap-y-3 rounded-md bg-surface-low p-5 type-body-lg">
            <dt className="type-label-lg self-center text-on-surface-variant">Seller</dt>
            <dd>
              <Link href={`/u/${listing.seller.username}`} className="hover:underline">
                {listing.seller.display_name}
              </Link>
            </dd>
            <dt className="type-label-lg self-center text-on-surface-variant">Format</dt>
            <dd className="capitalize">{listing.format}</dd>
            {listing.condition ? (
              <>
                <dt className="type-label-lg self-center text-on-surface-variant">Condition</dt>
                <dd>{conditionLabel[listing.condition]}</dd>
              </>
            ) : null}
            <dt className="type-label-lg self-center text-on-surface-variant">Listed</dt>
            <dd>{formatDate(listing.created_at)}</dd>
          </dl>

          {listing.description ? <p className="reading max-w-lg whitespace-pre-line">{listing.description}</p> : null}

          {own ? (
            <div className="grid max-w-md gap-3">
              <p className="type-title-md">Your listing</p>
              <PriceBreakdown amountMinor={listing.price_minor} bps={settings?.commission_bps ?? 700} currency={listing.currency} />
            </div>
          ) : listing.status === 'active' ? (
            <div className="flex flex-wrap items-start gap-3">
              <ActionForm action={buy}>
                <input type="hidden" name="listing_id" value={listing.id} />
                <SubmitButton pendingLabel="Reserving" size="lg" icon="payments">
                  Buy this copy
                </SubmitButton>
              </ActionForm>
              <form action={openDirect}>
                <input type="hidden" name="user_id" value={listing.seller_id} />
                <Button type="submit" variant="secondary" size="lg" icon="chat">
                  Message seller
                </Button>
              </form>
            </div>
          ) : (
            <p className="type-body-lg text-on-surface-variant">This copy is no longer available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
