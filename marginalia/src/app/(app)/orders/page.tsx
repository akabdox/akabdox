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
        <p role="status" className="mb-8 border border-ink px-4 py-3 text-[14px]">
          Order placed. The copy is reserved for you for 45 minutes while payment clears.
        </p>
      ) : null}

      <Rule label="Purchases" className="mb-2" />
      {purchases.length === 0 ? (
        <div className="my-6">
          <Empty title="No purchases yet.">
            <ButtonLink href="/market" variant="ghost">
              Browse the market →
            </ButtonLink>
          </Empty>
        </div>
      ) : (
        purchases.map((t) => (
          <article key={t.id} className="grid gap-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="grid gap-1">
              <p className="font-medium">{t.listing.book.title}</p>
              <p className="text-[13px] text-ink-3">
                from{' '}
                <Link href={`/u/${t.seller.username}`} className="hover:underline">
                  {t.seller.display_name}
                </Link>{' '}
                · {formatDate(t.created_at)} · ref {t.id.slice(0, 8).toUpperCase()}
              </p>
              {t.status === 'pending' && t.provider === 'manual' ? (
                <p className="mt-2 max-w-md text-[13px] text-ink-2">{manualInstructions}</p>
              ) : null}
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular font-medium">{formatMoney(t.amount_minor, t.currency)}</p>
              <TransactionBadge status={t.status} />
              {t.status === 'pending' ? (
                <div className="flex gap-2">
                  {t.checkout_url ? (
                    <a href={t.checkout_url} className="eyebrow text-ink hover:underline">
                      Pay now
                    </a>
                  ) : null}
                  <ActionForm action={cancelOrder}>
                    <input type="hidden" name="id" value={t.id} />
                    <SubmitButton size="sm" variant="ghost" className="text-[10.5px]">
                      Cancel
                    </SubmitButton>
                  </ActionForm>
                </div>
              ) : null}
            </div>
          </article>
        ))
      )}

      <Rule label="Sales" className="mt-12 mb-2" />
      {sales.length === 0 ? (
        <div className="my-6">
          <Empty title="No sales yet.">List a copy from your shelf to sell it here.</Empty>
        </div>
      ) : (
        sales.map((t) => (
          <article key={t.id} className="grid gap-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <p className="font-medium">{t.listing.book.title}</p>
              <p className="text-[13px] text-ink-3">
                to {t.buyer.display_name} · {formatDate(t.created_at)}
              </p>
            </div>
            <div className="grid justify-items-start gap-2 sm:justify-items-end">
              <p className="tabular text-[13px] text-ink-3">
                {formatMoney(t.amount_minor, t.currency)} − {formatMoney(t.commission_minor, t.currency)} commission
              </p>
              <p className="tabular font-medium">{formatMoney(t.seller_net_minor, t.currency)} to you</p>
              <TransactionBadge status={t.status} />
              {t.status === 'paid' ? (
                <p className="text-[12px] text-ink-3">{t.paid_out_at ? `Paid out ${formatDate(t.paid_out_at)}` : 'Payout pending'}</p>
              ) : null}
            </div>
          </article>
        ))
      )}
    </div>
  )
}
