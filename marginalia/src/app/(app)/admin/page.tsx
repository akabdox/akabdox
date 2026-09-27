import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { TransactionBadge } from '@/components/status'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { Rule } from '@/components/ui/rule'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/viewer'
import { TRANSACTION_SELECT } from '@/lib/queries'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import type { ActionState } from '@/lib/form'
import type { Transaction } from '@/lib/types'
import { cancel, markPaidOut, markRefunded, setCommission, settle } from './actions'

export const metadata: Metadata = { title: 'Admin' }

type Summary = {
  currency: string
  commission_bps: number
  member_cap: number
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
  const supabase = await createClient()
  const [{ data: summaryRow }, { data: rows }] = await Promise.all([
    supabase.rpc('admin_summary'),
    supabase.from('transactions').select(TRANSACTION_SELECT).order('created_at', { ascending: false }).limit(100),
  ])
  const s = summaryRow as Summary
  const txs = (rows ?? []) as unknown as Transaction[]
  const money = (minor: number) => formatMoney(minor, s.currency)

  const stats = [
    ['Commission earned', money(s.commission_minor)],
    ['Gross sales', money(s.gross_minor)],
    ['Owed to sellers', money(s.owed_to_sellers_minor)],
    ['Members', `${s.members} / ${s.member_cap}`],
    ['Sales', String(s.sales)],
    ['Awaiting payment', String(s.pending)],
    ['Refunds due', String(s.refund_due)],
    ['Commission rate', `${s.commission_bps / 100}%`],
  ]

  return (
    <div className="grid gap-12">
      <PageHeader eyebrow="Founder" title="Admin" />

      <dl className="tabular grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="grid gap-2 bg-paper p-5">
            <dt className="eyebrow">{label}</dt>
            <dd className="text-[24px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="grid max-w-sm gap-4">
        <Rule label="Commission" />
        <ActionForm action={setCommission}>
          <Field label="Platform rate (%)" hint="Snapshotted per order. Changing it never rewrites past sales.">
            <Input name="percent" type="number" step="0.25" min="0" max="20" defaultValue={s.commission_bps / 100} />
          </Field>
          <SubmitButton size="sm" className="justify-self-start">
            Update rate
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-2">
        <Rule label="Ledger" />
        <div className="overflow-x-auto">
          <table className="tabular w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-rule">
                {['Date', 'Book', 'Buyer → Seller', 'Amount', 'Commission', 'Seller net', 'Status', ''].map((h) => (
                  <th key={h} className="eyebrow py-3 pr-4 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-rule align-top">
                  <td className="py-3 pr-4 text-ink-3">{formatDate(t.created_at)}</td>
                  <td className="py-3 pr-4 font-medium">{t.listing.book.title}</td>
                  <td className="py-3 pr-4">
                    @{t.buyer.username} → @{t.seller.username}
                  </td>
                  <td className="py-3 pr-4">{money(t.amount_minor)}</td>
                  <td className="py-3 pr-4">{money(t.commission_minor)}</td>
                  <td className="py-3 pr-4">{money(t.seller_net_minor)}</td>
                  <td className="py-3 pr-4">
                    <div className="grid justify-items-start gap-1">
                      <TransactionBadge status={t.status} />
                      {t.status === 'paid' ? (
                        <span className="text-[11px] text-ink-3">{t.paid_out_at ? 'Paid out' : 'Payout owed'}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {t.status === 'pending' ? (
                        <>
                          <RowAction id={t.id} label="Confirm paid" action={settle} />
                          <RowAction id={t.id} label="Cancel" action={cancel} />
                        </>
                      ) : null}
                      {t.status === 'paid' && !t.paid_out_at ? <RowAction id={t.id} label="Mark paid out" action={markPaidOut} /> : null}
                      {t.status === 'refund_due' ? <RowAction id={t.id} label="Mark refunded" action={markRefunded} /> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {txs.length === 0 ? <p className="py-10 text-center text-ink-3">No transactions yet.</p> : null}
        </div>
      </section>
    </div>
  )
}
