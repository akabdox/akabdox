import { breakdown } from '@/lib/commission'
import { formatMoney } from '@/lib/money'
import type { Locale } from '@/i18n/config'

export type BreakdownLabels = { buyerPays: string; commission: string; youReceive: string }

// What the buyer pays, what the platform keeps, what the seller receives.
// Plain props so it renders on the server and inside the client sell form.
export function PriceBreakdown({
  amountMinor,
  bps,
  currency,
  locale,
  labels,
}: {
  amountMinor: number
  bps: number
  currency: string
  locale: Locale
  labels: BreakdownLabels
}) {
  const b = breakdown(amountMinor, bps)
  return (
    <dl className="tabular grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-[14px]">
      <dt className="text-ink-2">{labels.buyerPays}</dt>
      <dd className="text-end">{formatMoney(b.amount, currency, locale)}</dd>
      <dt className="text-ink-2">{labels.commission}</dt>
      <dd className="text-end text-ink-2">− {formatMoney(b.commission, currency, locale)}</dd>
      <dt className="border-t border-rule pt-2 font-medium">{labels.youReceive}</dt>
      <dd className="border-t border-rule pt-2 text-end font-medium">{formatMoney(b.sellerNet, currency, locale)}</dd>
    </dl>
  )
}
