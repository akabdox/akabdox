'use client'

import { useState } from 'react'
import { ActionForm } from './ui/action-form'
import { Field, Input, Textarea } from './ui/field'
import { SubmitButton } from './ui/submit-button'
import { PriceBreakdown } from './price-breakdown'
import { parseMoney } from '@/lib/money'
import type { ActionState } from '@/lib/form'

// Live commission preview as the seller types a price.
export function SellForm({
  shelfItemId,
  bps,
  currency,
  action,
}: {
  shelfItemId: string
  bps: number
  currency: string
  action: (state: ActionState, form: FormData) => Promise<ActionState>
}) {
  const [price, setPrice] = useState('')
  const minor = parseMoney(price) ?? 0

  return (
    <ActionForm action={action}>
      <input type="hidden" name="shelf_item_id" value={shelfItemId} />
      <Field label={`Price (${currency})`}>
        <Input name="price" inputMode="decimal" required placeholder="900" value={price} onChange={(e) => setPrice(e.target.value)} />
      </Field>
      <Field label="Note for buyers">
        <Textarea name="description" rows={2} maxLength={1000} placeholder="Condition, edition, where you can hand it over" />
      </Field>
      {minor > 0 ? <PriceBreakdown amountMinor={minor} bps={bps} currency={currency} /> : null}
      <SubmitButton pendingLabel="Listing">List for sale</SubmitButton>
    </ActionForm>
  )
}
