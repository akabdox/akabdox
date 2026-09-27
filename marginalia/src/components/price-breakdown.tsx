import { breakdown, formatRate } from '@/lib/commission'
import { formatMoney } from '@/lib/money'

// What the buyer pays, what the platform keeps, what the seller receives.
export function PriceBreakdown({ amountMinor, bps, currency }: { amountMinor: number; bps: number; currency: string }) {
  const b = breakdown(amountMinor, bps)
  return (
    <dl className="tabular grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-[14px]">
      <dt className="text-ink-2">Buyer pays</dt>
      <dd className="text-right">{formatMoney(b.amount, currency)}</dd>
      <dt className="text-ink-2">Platform commission ({formatRate(bps)})</dt>
      <dd className="text-right text-ink-2">− {formatMoney(b.commission, currency)}</dd>
      <dt className="border-t border-rule pt-2 font-medium">You receive</dt>
      <dd className="border-t border-rule pt-2 text-right font-medium">{formatMoney(b.sellerNet, currency)}</dd>
    </dl>
  )
}
