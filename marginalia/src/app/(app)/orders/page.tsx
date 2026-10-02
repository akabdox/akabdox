import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { TransactionBadge } from '@/components/status'
import { ActionForm } from '@/components/ui/action-form'
import { ButtonLink } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Rule } from '@/components/ui/rule'
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
        <p role="status" className="mb-8 border border-ink px-4 py-3 text-[14px]">
          {t.orders.placed}
        </p>
      ) : null}

      <Rule label={t.orders.purchases} className="mb-2" />
      {purchases.length === 0 ? (
        <div className="my-6">
          <Empty title={t.orders.noPurchases}>
            <ButtonLink href="/market" variant="ghost">
              {t.more(t.orders.browse)}
            </ButtonLink>
          </Empty>
        </div>
      ) : (
        purchases.map((tx) => (
          <article key={tx.id} className="grid gap-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="grid gap-1">
              <p className="font-medium">{tx.listing.book.title}</p>
              <p className="text-[13px] text-ink-3">
                {t.orders.from}{' '}
                <Link href={`/u/${tx.seller.username}`} className="hover:underline">
                  {tx.seller.display_name}
                </Link>{' '}
                · {formatDate(tx.created_at, locale)} · {t.orders.ref} <span dir="ltr">{tx.id.slice(0, 8).toUpperCase()}</span>
              </p>
              {tx.status === 'pending' && tx.provider === 'manual' ? (
                <p className="mt-2 max-w-md text-[13px] text-ink-2">{manualInstructions}</p>
              ) : null}
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular font-medium">{money(tx.amount_minor, tx.currency)}</p>
              <TransactionBadge status={tx.status} />
              {tx.status === 'pending' ? (
                <div className="flex gap-2">
                  {tx.checkout_url ? (
                    <a href={tx.checkout_url} className="eyebrow text-ink hover:underline">
                      {t.orders.payNow}
                    </a>
                  ) : null}
                  <ActionForm action={cancelOrder}>
                    <input type="hidden" name="id" value={tx.id} />
                    <SubmitButton size="sm" variant="ghost" className="text-[10.5px]">
                      {t.orders.cancel}
                    </SubmitButton>
                  </ActionForm>
                </div>
              ) : null}
            </div>
          </article>
        ))
      )}

      <Rule label={t.orders.sales} className="mt-12 mb-2" />
      {sales.length === 0 ? (
        <div className="my-6">
          <Empty title={t.orders.noSales}>{t.orders.noSalesBody}</Empty>
        </div>
      ) : (
        sales.map((tx) => (
          <article key={tx.id} className="grid gap-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <p className="font-medium">{tx.listing.book.title}</p>
              <p className="text-[13px] text-ink-3">
                {t.orders.to(tx.buyer.display_name)} · {formatDate(tx.created_at, locale)}
              </p>
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular text-[13px] text-ink-3">
                {money(tx.amount_minor, tx.currency)} − {money(tx.commission_minor, tx.currency)} {t.orders.commission}
              </p>
              <p className="tabular font-medium">{t.orders.toYou(money(tx.seller_net_minor, tx.currency))}</p>
              <TransactionBadge status={tx.status} />
              {tx.status === 'paid' ? (
                <p className="text-[12px] text-ink-3">
                  {tx.paid_out_at ? t.orders.paidOut(formatDate(tx.paid_out_at, locale)) : t.orders.payoutPending}
                </p>
              ) : null}
            </div>
          </article>
        ))
      )}
    </div>
  )
}
