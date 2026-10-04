import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { PriceBreakdown } from '@/components/price-breakdown'
import { ListingBadge } from '@/components/status'
import { ActionForm } from '@/components/ui/action-form'
import { BookCover } from '@/components/ui/book-cover'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { LISTING_SELECT } from '@/lib/queries'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import { isUuid } from '@/lib/uuid'
import type { ListingWithBook } from '@/lib/types'
import { buy } from '../actions'
import { paymentsEnabled } from '@/lib/features'
import { openDirect } from '../../chat/actions'
import { formatRate } from '@/lib/commission'
import { getDict, getI18n } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).market.listing }
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const viewer = await requireViewer()
  const { locale, t } = await getI18n()
  const supabase = await createClient()

  const [{ data }, { data: settings }] = await Promise.all([
    supabase.from('listings').select(LISTING_SELECT).eq('id', id).maybeSingle(),
    supabase.from('settings').select('commission_bps').maybeSingle(),
  ])
  if (!data) notFound()
  const listing = data as unknown as ListingWithBook
  const own = listing.seller_id === viewer.id
  const bps = settings?.commission_bps ?? 700

  return (
    <div className="grid gap-6">
      <BackLink href="/market">{t.nav.market}</BackLink>

      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="animate-rise grid place-items-center rounded-xl bg-surface-container p-8 sm:p-12 md:self-start">
          <BookCover title={listing.book.title} author={listing.book.author} coverUrl={listing.book.cover_url} size="lg" className="w-44 sm:w-56" />
        </div>

        <div className="animate-rise grid content-start gap-6 [--i:1]">
          <div className="grid gap-3">
            <ListingBadge status={listing.status} />
            <h1 dir="auto" className="type-display-sm">
              {listing.book.title}
            </h1>
            <p dir="auto" className="type-body-lg text-on-surface-variant">
              {listing.book.author}
              {listing.book.published_year ? `, ${listing.book.published_year}` : ''}
            </p>
          </div>

          <p className="tabular type-headline-lg text-primary">{formatMoney(listing.price_minor, listing.currency, locale)}</p>

          <dl className="grid max-w-md grid-cols-[110px_1fr] gap-y-3 rounded-md bg-surface-low p-5 type-body-lg">
            <dt className="self-center type-label-lg text-on-surface-variant">{t.market.seller}</dt>
            <dd>
              <Link href={`/u/${listing.seller.username}`} className="hover:underline">
                {listing.seller.display_name}
              </Link>
            </dd>
            <dt className="self-center type-label-lg text-on-surface-variant">{t.market.format}</dt>
            <dd>{t.formats[listing.format]}</dd>
            {listing.condition ? (
              <>
                <dt className="self-center type-label-lg text-on-surface-variant">{t.market.condition}</dt>
                <dd>{t.conditions[listing.condition]}</dd>
              </>
            ) : null}
            <dt className="self-center type-label-lg text-on-surface-variant">{t.market.listed}</dt>
            <dd>{formatDate(listing.created_at, locale)}</dd>
          </dl>

          {listing.description ? <p dir="auto" className="reading max-w-lg whitespace-pre-line">{listing.description}</p> : null}

          {own ? (
            <div className="grid max-w-md gap-3">
              <p className="type-title-md">{t.market.yourListing}</p>
              {paymentsEnabled ? (
                <PriceBreakdown
                  amountMinor={listing.price_minor}
                  bps={bps}
                  currency={listing.currency}
                  locale={locale}
                  labels={{ buyerPays: t.sell.buyerPays, commission: t.sell.commission(formatRate(bps)), youReceive: t.sell.youReceive }}
                />
              ) : (
                <p className="type-body-md text-on-surface-variant">{t.market.soldHint}</p>
              )}
            </div>
          ) : listing.status === 'active' ? (
            <div className="grid max-w-md gap-3">
              <div className="flex flex-wrap items-start gap-3">
                {paymentsEnabled ? (
                  <ActionForm action={buy}>
                    <input type="hidden" name="listing_id" value={listing.id} />
                    <SubmitButton pendingLabel={t.market.reserving} size="lg" icon="payments">
                      {t.market.buy}
                    </SubmitButton>
                  </ActionForm>
                ) : null}
                <form action={openDirect}>
                  <input type="hidden" name="user_id" value={listing.seller_id} />
                  <Button type="submit" size="lg" icon="chat" variant={paymentsEnabled ? 'secondary' : 'primary'}>
                    {t.market.messageSeller}
                  </Button>
                </form>
              </div>
              {paymentsEnabled ? null : (
                <p className="flex items-start gap-2 type-body-md text-on-surface-variant">
                  <Icon name="info" size={18} className="mt-px text-primary" />
                  {t.market.contactNote}
                </p>
              )}
            </div>
          ) : (
            <p className="type-body-lg text-on-surface-variant">{t.market.unavailable}</p>
          )}
        </div>
      </div>
    </div>
  )
}
