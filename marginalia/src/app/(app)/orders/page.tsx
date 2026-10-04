import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { TransactionBadge } from '@/components/status'
import { ActionForm } from '@/components/ui/action-form'
import { ButtonLink, buttonClass } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Icon } from '@/components/ui/icon'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { TRANSACTION_SELECT } from '@/lib/queries'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import type { Transaction } from '@/lib/types'
import { getDict, getI18n } from '@/i18n/server'
import { cancelOrder } from '../market/actions'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).orders.title }
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const { placed } = await searchParams
  const viewer = await requireViewer()
  const { locale, t } = await getI18n()
  const supabase = await createClient()
  const manualInstructions = process.env.MANUAL_PAYMENT_INSTRUCTIONS ?? t.orders.manual
  const money = (minor: number, currency: string) => formatMoney(minor, currency, locale)

  const { data } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .or(`buyer_id.eq.${viewer.id},seller_id.eq.${viewer.id}`)
    .order('created_at', { ascending: false })
    .limit(100)
  const all = (data ?? []) as unknown as Transaction[]
  const purchases = all.filter((tx) => tx.buyer_id === viewer.id)
  const sales = all.filter((tx) => tx.seller_id === viewer.id)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t.orders.eyebrow} title={t.orders.title} />

      {placed ? (
        <p role="status" className="mb-8 flex items-start gap-3 rounded-md bg-primary-container px-4 py-3 type-body-lg text-on-primary-container">
          <Icon name="check_circle" filled className="mt-px" />
          {t.orders.placed}
        </p>
      ) : null}

      <h2 className="mb-3 type-title-md text-on-surface-variant">{t.orders.purchases}</h2>
      {purchases.length === 0 ? (
        <Empty icon="receipt_long" title={t.orders.noPurchases}>
          <ButtonLink href="/market" variant="ghost" iconEnd="arrow_forward" className="mt-1">
            {t.orders.browse}
          </ButtonLink>
        </Empty>
      ) : (
        <div className="grid gap-3">
        {purchases.map((tx) => (
          <article key={tx.id} className="grid gap-4 rounded-md bg-surface-low p-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="grid gap-1">
              <p dir="auto" className="type-title-md">{tx.listing.book.title}</p>
              <p className="type-body-md text-on-surface-variant">
                {t.orders.from}{' '}
                <Link href={`/u/${tx.seller.username}`} className="hover:underline">
                  {tx.seller.display_name}
                </Link>{' '}
                · {formatDate(tx.created_at, locale)} · {t.orders.ref} <span dir="ltr">{tx.id.slice(0, 8).toUpperCase()}</span>
              </p>
              {tx.status === 'pending' && tx.provider === 'manual' ? (
                <p className="mt-3 flex max-w-md items-start gap-2 rounded-sm bg-surface-container p-3 type-body-md text-on-surface-variant">
                  <Icon name="info" size={18} className="mt-px text-primary" />
                  {manualInstructions}
                </p>
              ) : null}
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular type-title-lg">{money(tx.amount_minor, tx.currency)}</p>
              <TransactionBadge status={tx.status} />
              {tx.status === 'pending' ? (
                <div className="flex gap-2">
                  {tx.checkout_url ? (
                    <a href={tx.checkout_url} className={buttonClass('primary', 'sm')}>
                      {t.orders.payNow}
                    </a>
                  ) : null}
                  <ActionForm action={cancelOrder}>
                    <input type="hidden" name="id" value={tx.id} />
                    <SubmitButton size="sm" variant="ghost">
                      {t.orders.cancel}
                    </SubmitButton>
                  </ActionForm>
                </div>
              ) : null}
            </div>
          </article>
        ))}
        </div>
      )}

      <h2 className="mt-10 mb-3 type-title-md text-on-surface-variant">{t.orders.sales}</h2>
      {sales.length === 0 ? (
        <Empty icon="sell" title={t.orders.noSales}>
          {t.orders.noSalesBody}
        </Empty>
      ) : (
        <div className="grid gap-3">
        {sales.map((tx) => (
          <article key={tx.id} className="grid gap-4 rounded-md bg-surface-low p-5 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <p dir="auto" className="type-title-md">{tx.listing.book.title}</p>
              <p className="type-body-md text-on-surface-variant">
                {t.orders.to(tx.buyer.display_name)} · {formatDate(tx.created_at, locale)}
              </p>
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular type-body-md text-on-surface-variant">
                {money(tx.amount_minor, tx.currency)} − {money(tx.commission_minor, tx.currency)} {t.orders.commission}
              </p>
              <p className="tabular type-title-lg text-primary">{t.orders.toYou(money(tx.seller_net_minor, tx.currency))}</p>
              <TransactionBadge status={tx.status} />
              {tx.status === 'paid' ? (
                <p className="type-body-sm text-on-surface-variant">
                  {tx.paid_out_at ? t.orders.paidOut(formatDate(tx.paid_out_at, locale)) : t.orders.payoutPending}
                </p>
              ) : null}
            </div>
          </article>
        ))}
        </div>
      )}
    </div>
  )
}
