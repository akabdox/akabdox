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
import { cancelOrder } from '../market/actions'

export const metadata: Metadata = { title: 'Orders' }

const manualInstructions =
  process.env.MANUAL_PAYMENT_INSTRUCTIONS ??
  'Send the amount to the library by CCP or BaridiMob and quote the reference. The admin confirms it within a day.'

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ placed?: string }> }) {
  const { placed } = await searchParams
  const viewer = await requireViewer()
  const supabase = await createClient()

  const { data } = await supabase
    .from('transactions')
    .select(TRANSACTION_SELECT)
    .or(`buyer_id.eq.${viewer.id},seller_id.eq.${viewer.id}`)
    .order('created_at', { ascending: false })
    .limit(100)
  const all = (data ?? []) as unknown as Transaction[]
  const purchases = all.filter((t) => t.buyer_id === viewer.id)
  const sales = all.filter((t) => t.seller_id === viewer.id)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Ledger" title="Orders" />

      {placed ? (
        <p role="status" className="mb-8 flex items-start gap-3 rounded-md bg-primary-container px-4 py-3 type-body-lg text-on-primary-container">
          <Icon name="check_circle" filled className="mt-px" />
          Order placed. The copy is reserved for you for 45 minutes while payment clears.
        </p>
      ) : null}

      <h2 className="mb-3 type-title-md text-on-surface-variant">Purchases</h2>
      {purchases.length === 0 ? (
        <Empty icon="receipt_long" title="No purchases yet.">
          <ButtonLink href="/market" variant="ghost" iconEnd="arrow_forward" className="mt-1">
            Browse the market
          </ButtonLink>
        </Empty>
      ) : (
        <div className="grid gap-3">
        {purchases.map((t) => (
          <article key={t.id} className="grid gap-4 rounded-md bg-surface-low p-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="grid gap-1">
              <p className="type-title-md">{t.listing.book.title}</p>
              <p className="type-body-md text-on-surface-variant">
                from{' '}
                <Link href={`/u/${t.seller.username}`} className="hover:underline">
                  {t.seller.display_name}
                </Link>{' '}
                · {formatDate(t.created_at)} · ref {t.id.slice(0, 8).toUpperCase()}
              </p>
              {t.status === 'pending' && t.provider === 'manual' ? (
                <p className="mt-3 flex max-w-md items-start gap-2 rounded-sm bg-surface-container p-3 type-body-md text-on-surface-variant">
                  <Icon name="info" size={18} className="mt-px text-primary" />
                  {manualInstructions}
                </p>
              ) : null}
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular type-title-lg">{formatMoney(t.amount_minor, t.currency)}</p>
              <TransactionBadge status={t.status} />
              {t.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  {t.checkout_url ? (
                    <a href={t.checkout_url} className={buttonClass('primary', 'sm')}>
                      Pay now
                    </a>
                  ) : null}
                  <ActionForm action={cancelOrder}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton size="sm" variant="ghost">
                      Cancel
                    </SubmitButton>
                  </ActionForm>
                </div>
              ) : null}
            </div>
          </article>
        ))}
        </div>
      )}

      <h2 className="mt-10 mb-3 type-title-md text-on-surface-variant">Sales</h2>
      {sales.length === 0 ? (
        <Empty icon="sell" title="No sales yet.">List a copy from your shelf to sell it here.</Empty>
      ) : (
        <div className="grid gap-3">
        {sales.map((t) => (
          <article key={t.id} className="grid gap-4 rounded-md bg-surface-low p-5 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <p className="type-title-md">{t.listing.book.title}</p>
              <p className="type-body-md text-on-surface-variant">
                to {t.buyer.display_name} · {formatDate(t.created_at)}
              </p>
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular type-body-sm text-on-surface-variant">
                {formatMoney(t.amount_minor, t.currency)} − {formatMoney(t.commission_minor, t.currency)} commission
              </p>
              <p className="tabular type-title-lg text-primary">{formatMoney(t.seller_net_minor, t.currency)} to you</p>
              <TransactionBadge status={t.status} />
              {t.status === 'paid' ? (
                <p className="type-body-sm text-on-surface-variant">{t.paid_out_at ? `Paid out ${formatDate(t.paid_out_at)}` : 'Payout pending'}</p>
              ) : null}
            </div>
          </article>
        ))}
        </div>
      )}
    </div>
  )
}
