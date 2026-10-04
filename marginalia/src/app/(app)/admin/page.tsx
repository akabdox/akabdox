import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { TransactionBadge } from '@/components/status'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/viewer'
import { TRANSACTION_SELECT } from '@/lib/queries'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import type { ActionState } from '@/lib/form'
import type { Transaction } from '@/lib/types'
import { cancel, markPaidOut, markRefunded, setCommission, settle } from './actions'
import { getDict, getI18n } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).admin.title }
}

type Summary = {
  currency: string
  commission_bps: number
  members: number
  gross_minor: number
  commission_minor: number
  owed_to_sellers_minor: number
  sales: number
  pending: number
  refund_due: number
}

function RowAction({ id, label, action }: { id: string; label: string; action: (s: ActionState, f: FormData) => Promise<ActionState> }) {
  return (
    <ActionForm action={action} className="gap-1">
      <input type="hidden" name="id" value={id} />
      <SubmitButton size="sm" variant="secondary">
        {label}
      </SubmitButton>
    </ActionForm>
  )
}

export default async function AdminPage() {
  await requireAdmin()
  const { locale, t } = await getI18n()
  const supabase = await createClient()
  const [{ data: summaryRow }, { data: rows }] = await Promise.all([
    supabase.rpc('admin_summary'),
    supabase.from('transactions').select(TRANSACTION_SELECT).order('created_at', { ascending: false }).limit(100),
  ])
  const s = summaryRow as Summary
  const txs = (rows ?? []) as unknown as Transaction[]
  const money = (minor: number) => formatMoney(minor, s.currency, locale)

  const stats = [
    [t.admin.stats.commission, money(s.commission_minor)],
    [t.admin.stats.gross, money(s.gross_minor)],
    [t.admin.stats.owed, money(s.owed_to_sellers_minor)],
    [t.admin.stats.members, String(s.members)],
    [t.admin.stats.sales, String(s.sales)],
    [t.admin.stats.pending, String(s.pending)],
    [t.admin.stats.refunds, String(s.refund_due)],
    [t.admin.stats.rate, `${s.commission_bps / 100}%`],
  ]

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={t.admin.eyebrow} title={t.admin.title} />

      <dl className="tabular grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value], i) => (
          <div key={label} className={i === 0 ? 'grid gap-2 rounded-md bg-primary-container p-5 text-on-primary-container' : 'grid gap-2 rounded-md bg-surface-low p-5'}>
            <dt className={i === 0 ? 'type-label-lg' : 'type-label-lg text-on-surface-variant'}>{label}</dt>
            <dd className="type-headline-sm">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-5 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="payments" className="text-primary" />
          {t.admin.commission}
        </h2>
        <ActionForm action={setCommission} className="max-w-sm">
          <Field label={t.admin.rateLabel} hint={t.admin.rateHint}>
            <Input name="percent" type="number" step="0.25" min="0" max="20" defaultValue={s.commission_bps / 100} />
          </Field>
          <SubmitButton size="sm" className="justify-self-start">
            {t.admin.updateRate}
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-4 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="receipt_long" className="text-primary" />
          {t.admin.ledger}
        </h2>
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
          <table className="tabular w-full min-w-[760px] text-start type-body-md">
            <thead>
              <tr className="border-b border-outline-variant">
                {t.admin.columns.map((h, i) => (
                  <th key={i} className="py-3 pe-4 text-start type-label-lg text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((tx) => (
                <tr key={tx.id} className="border-b border-outline-variant align-top">
                  <td className="py-3 pe-4 text-on-surface-variant">{formatDate(tx.created_at, locale)}</td>
                  <td className="py-3 pe-4 font-medium">{tx.listing.book.title}</td>
                  <td className="py-3 pe-4">
                    <span dir="ltr">
                      @{tx.buyer.username} → @{tx.seller.username}
                    </span>
                  </td>
                  <td className="py-3 pe-4">{money(tx.amount_minor)}</td>
                  <td className="py-3 pe-4">{money(tx.commission_minor)}</td>
                  <td className="py-3 pe-4">{money(tx.seller_net_minor)}</td>
                  <td className="py-3 pe-4">
                    <div className="grid justify-items-start gap-1">
                      <TransactionBadge status={tx.status} />
                      {tx.status === 'paid' ? (
                        <span className="type-label-sm text-on-surface-variant">{tx.paid_out_at ? t.admin.paidOut : t.admin.payoutOwed}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {tx.status === 'pending' ? (
                        <>
                          <RowAction id={tx.id} label={t.admin.confirmPaid} action={settle} />
                          <RowAction id={tx.id} label={t.admin.cancel} action={cancel} />
                        </>
                      ) : null}
                      {tx.status === 'paid' && !tx.paid_out_at ? <RowAction id={tx.id} label={t.admin.markPaidOut} action={markPaidOut} /> : null}
                      {tx.status === 'refund_due' ? <RowAction id={tx.id} label={t.admin.markRefunded} action={markRefunded} /> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {txs.length === 0 ? <p className="py-10 text-center text-on-surface-variant">{t.admin.noTransactions}</p> : null}
        </div>
      </section>
    </div>
  )
}
