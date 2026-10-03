// Mirror of public.commission_for() in Postgres. The database value is the
// one charged; this copy only powers live previews in the UI.

export function commissionFor(amountMinor: number, bps: number): number {
  return Math.floor((amountMinor * bps + 5000) / 10000)
}

export function breakdown(amountMinor: number, bps: number) {
  const commission = commissionFor(amountMinor, bps)
  return { amount: amountMinor, commission, sellerNet: amountMinor - commission }
}

export function formatRate(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`
}
