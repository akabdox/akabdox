import { Badge } from './ui/badge'
import { formatMoney } from '@/lib/money'
import type { ListingStatus, ReadingStatus, TransactionStatus } from '@/lib/types'

export function ReadingBadge({ status }: { status: ReadingStatus }) {
  if (status === 'reading') return <Badge tone="outline" dot>Reading</Badge>
  if (status === 'read') return <Badge tone="muted">Read</Badge>
  return <Badge tone="muted">Unread</Badge>
}

export function SwapBadge() {
  return <Badge tone="dashed">Open to swap</Badge>
}

export function SaleBadge({ priceMinor, currency }: { priceMinor: number; currency: string }) {
  return <Badge tone="solid">For sale · {formatMoney(priceMinor, currency)}</Badge>
}

const listingLabels: Record<ListingStatus, string> = {
  active: 'On the market',
  reserved: 'Reserved',
  sold: 'Sold',
  withdrawn: 'Withdrawn',
}

export function ListingBadge({ status }: { status: ListingStatus }) {
  return <Badge tone={status === 'active' ? 'solid' : status === 'reserved' ? 'outline' : 'muted'}>{listingLabels[status]}</Badge>
}

const txLabels: Record<TransactionStatus, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  cancelled: 'Cancelled',
  refund_due: 'Refund due',
  refunded: 'Refunded',
}

export function TransactionBadge({ status }: { status: TransactionStatus }) {
  const tone = status === 'paid' ? 'solid' : status === 'pending' ? 'outline' : status === 'refund_due' ? 'danger' : 'muted'
  return <Badge tone={tone}>{txLabels[status]}</Badge>
}
