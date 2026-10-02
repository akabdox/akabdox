import { Badge } from './ui/badge'
import { formatMoney } from '@/lib/money'
import { getI18n } from '@/i18n/server'
import type { ListingStatus, ReadingStatus, TransactionStatus } from '@/lib/types'

export async function ReadingBadge({ status }: { status: ReadingStatus }) {
  const { t } = await getI18n()
  if (status === 'reading') return <Badge tone="outline" dot>{t.reading.reading}</Badge>
  return <Badge tone="muted">{t.reading[status]}</Badge>
}

export async function SwapBadge() {
  const { t } = await getI18n()
  return <Badge tone="dashed">{t.badges.swap}</Badge>
}

export async function SaleBadge({ priceMinor, currency }: { priceMinor: number; currency: string }) {
  const { locale, t } = await getI18n()
  return <Badge tone="solid">{t.badges.forSale(formatMoney(priceMinor, currency, locale))}</Badge>
}

export async function ListingBadge({ status }: { status: ListingStatus }) {
  const { t } = await getI18n()
  return <Badge tone={status === 'active' ? 'solid' : status === 'reserved' ? 'outline' : 'muted'}>{t.listingStatus[status]}</Badge>
}

export async function TransactionBadge({ status }: { status: TransactionStatus }) {
  const { t } = await getI18n()
  const tone = status === 'paid' ? 'solid' : status === 'pending' ? 'outline' : status === 'refund_due' ? 'danger' : 'muted'
  return <Badge tone={tone}>{t.txStatus[status]}</Badge>
}
