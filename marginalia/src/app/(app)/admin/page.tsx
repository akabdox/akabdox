import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { CopyButton } from '@/components/copy-button'
import { TransactionBadge } from '@/components/status'
import { Badge } from '@/components/ui/badge'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/viewer'
import { TRANSACTION_SELECT } from '@/lib/queries'
import { formatMoney } from '@/lib/money'
import { formatDate } from '@/lib/time'
import { siteUrl } from '@/lib/site'
import type { ActionState } from '@/lib/form'
import type { Transaction } from '@/lib/types'
import { cancel, closeInviteLink, createInviteLink, markPaidOut, markRefunded, setCommission, settle } from './actions'

export const metadata: Metadata = { title: 'Admin' }

type InviteLink = { code: string; max_uses: number; uses: number; expires_at: string; created_at: string }

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
  const [{ data: summaryRow }, { data: rows }, { data: inviteRows }] = await Promise.all([
    supabase.rpc('admin_summary'),
    supabase.from('transactions').select(TRANSACTION_SELECT).order('created_at', { ascending: false }).limit(100),
    supabase.from('invites').select('code, max_uses, uses, expires_at, created_at').order('created_at', { ascending: false }).limit(50),
  ])
  const links = (inviteRows ?? []) as InviteLink[]
  const now = Date.now()
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
    <div className="grid gap-6">
      <PageHeader eyebrow="Founder" title="Admin" />

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
          <Icon name="link" className="text-primary" />
          Invite links
        </h2>
        <p className="-mt-2 max-w-lg type-body-md text-on-surface-variant">
          Only you can invite. Create a link, choose how many people it can seat and how long it stays open, then share it.
        </p>
        <ActionForm action={createInviteLink} className="max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seats">
              <Input name="max_uses" type="number" min="1" max="1000" defaultValue={10} required />
            </Field>
            <Field label="Open for (days)">
              <Input name="valid_days" type="number" min="1" max="365" defaultValue={14} required />
            </Field>
          </div>
          <SubmitButton icon="add" className="justify-self-start" pendingLabel="Creating">
            Create link
          </SubmitButton>
        </ActionForm>
        {links.map((l) => {
          const url = `${siteUrl()}/join?code=${l.code}`
          const open = l.uses < l.max_uses && Date.parse(l.expires_at) > now
          return (
            <div key={l.code} className="grid gap-3 rounded-md bg-surface-container p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="grid min-w-0 gap-1">
                <span className="truncate type-title-sm">{url}</span>
                <span className="tabular type-body-sm text-on-surface-variant">
                  {l.uses} of {l.max_uses} seats used · {open ? `open until ${formatDate(l.expires_at)}` : `closed ${formatDate(l.expires_at)}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {open ? (
                  <>
                    <CopyButton text={url} />
                    <ActionForm action={closeInviteLink} className="gap-1">
                      <input type="hidden" name="code" value={l.code} />
                      <SubmitButton size="sm" variant="danger">
                        Close
                      </SubmitButton>
                    </ActionForm>
                  </>
                ) : (
                  <Badge tone="muted">{l.uses >= l.max_uses ? 'Full' : 'Closed'}</Badge>
                )}
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-5 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="payments" className="text-primary" />
          Commission
        </h2>
        <ActionForm action={setCommission} className="max-w-sm">
          <Field label="Platform rate (%)" hint="Snapshotted per order. Changing it never rewrites past sales.">
            <Input name="percent" type="number" step="0.25" min="0" max="20" defaultValue={s.commission_bps / 100} />
          </Field>
          <SubmitButton size="sm" className="justify-self-start">
            Update rate
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-4 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="receipt_long" className="text-primary" />
          Ledger
        </h2>
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-8 sm:px-8">
          <table className="tabular w-full min-w-[820px] text-left type-body-md">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Date', 'Book', 'Buyer → Seller', 'Amount', 'Commission', 'Seller net', 'Status', ''].map((h) => (
                  <th key={h} className="py-3 pr-4 type-label-lg text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map((t) => (
                <tr key={t.id} className="border-b border-outline-variant align-top">
                  <td className="py-3 pr-4 text-on-surface-variant">{formatDate(t.created_at)}</td>
                  <td className="py-3 pr-4 type-title-sm">{t.listing.book.title}</td>
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
                        <span className="type-label-sm text-on-surface-variant">{t.paid_out_at ? 'Paid out' : 'Payout owed'}</span>
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
          {txs.length === 0 ? <p className="py-10 text-center type-body-lg text-on-surface-variant">No transactions yet.</p> : null}
        </div>
      </section>
    </div>
  )
}
