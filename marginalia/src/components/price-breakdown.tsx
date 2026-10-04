import { breakdown, formatRate } from '@/lib/commission'
import { formatMoney } from '@/lib/money'

// What the buyer pays, what the platform keeps, what the seller receives.
export function PriceBreakdown({ amountMinor, bps, currency }: { amountMinor: number; bps: number; currency: string }) {
  const b = breakdown(amountMinor, bps)
  return (
    <dl className="tabular grid grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 rounded-md bg-surface-container p-4 type-body-md">
      <dt className="text-on-surface-variant">Buyer pays</dt>
      <dd className="text-right">{formatMoney(b.amount, currency)}</dd>
      <dt className="text-on-surface-variant">Platform commission ({formatRate(bps)})</dt>
      <dd className="text-right text-on-surface-variant">−{formatMoney(b.commission, currency)}</dd>
      <dt className="border-t border-outline-variant pt-2.5 type-title-sm">You receive</dt>
      <dd className="border-t border-outline-variant pt-2.5 text-right type-title-sm text-primary">{formatMoney(b.sellerNet, currency)}</dd>
    </dl>
  )
}
