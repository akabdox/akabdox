'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chargilyEnabled, createCheckout } from '@/lib/payments/chargily'
import { field, friendlyError, type ActionState } from '@/lib/form'
import { siteUrl } from '@/lib/site'
import { getDict } from '@/i18n/server'
import { paymentsEnabled } from '@/lib/features'

export async function buy(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  if (!paymentsEnabled) return { error: t.market.contactNote }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_order', { p_listing: field(form, 'listing_id') })
  if (error || !data) return { error: friendlyError(error, t) }
  const order = data as { id: string; amount_minor: number }

  // Manual mode: the admin confirms the transfer from the dashboard.
  if (!chargilyEnabled()) redirect(`/orders?placed=${order.id}`)

  const admin = createAdminClient()
  let checkoutUrl: string
  try {
    const origin = siteUrl()
    const checkout = await createCheckout({
      amountMinor: order.amount_minor,
      successUrl: `${origin}/orders?placed=${order.id}`,
      failureUrl: `${origin}/orders`,
      webhookUrl: `${origin}/api/payments/chargily`,
      description: `Fahrasa order ${order.id.slice(0, 8)}`,
    })
    const { error: saveError } = await admin
      .from('transactions')
      .update({ provider: 'chargily', provider_ref: checkout.id, checkout_url: checkout.checkout_url })
      .eq('id', order.id)
    if (saveError) throw saveError
    checkoutUrl = checkout.checkout_url
  } catch {
    await admin.rpc('release_order', { p_tx: order.id })
    return { error: t.market.checkoutFailed }
  }
  redirect(checkoutUrl)
}

export async function cancelOrder(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_my_order', { p_tx: field(form, 'id') })
  if (error) return { error: friendlyError(error, t) }
  revalidatePath('/orders')
  revalidatePath('/market')
  return { ok: t.market.cancelled }
}
