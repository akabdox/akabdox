'use client'

import { useState } from 'react'
import { ActionForm } from './ui/action-form'
import { Field, Input, Textarea } from './ui/field'
import { SubmitButton } from './ui/submit-button'
import { PriceBreakdown, type BreakdownLabels } from './price-breakdown'
import { parseMoney } from '@/lib/money'
import type { ActionState } from '@/lib/form'
import type { Locale } from '@/i18n/config'

export type SellLabels = BreakdownLabels & { price: string; note: string; notePlaceholder: string; submit: string; pending: string }

// Live commission preview as the seller types a price.
export function SellForm({
  shelfItemId,
  bps,
  currency,
  locale,
  labels,
  action,
}: {
  shelfItemId: string
  bps: number
  currency: string
  locale: Locale
  labels: SellLabels
  action: (state: ActionState, form: FormData) => Promise<ActionState>
}) {
  const [price, setPrice] = useState('')
  const minor = parseMoney(price) ?? 0

  return (
    <ActionForm action={action}>
      <input type="hidden" name="shelf_item_id" value={shelfItemId} />
      <Field label={labels.price}>
        <Input name="price" inputMode="decimal" required placeholder="900" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" />
      </Field>
      <Field label={labels.note}>
        <Textarea name="description" rows={2} maxLength={1000} placeholder={labels.notePlaceholder} />
      </Field>
      {minor > 0 ? <PriceBreakdown amountMinor={minor} bps={bps} currency={currency} locale={locale} labels={labels} /> : null}
      <SubmitButton pendingLabel={labels.pending}>{labels.submit}</SubmitButton>
    </ActionForm>
  )
}
