'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { field, friendlyError, optionalField, type ActionState } from '@/lib/form'
import { parseMoney } from '@/lib/money'

async function refreshShelf() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const { data: me } = await supabase.from('profiles').select('username').eq('id', data?.claims?.sub ?? '').maybeSingle()
  if (me) revalidatePath(`/u/${me.username}`)
  revalidatePath('/market')
}

export async function addBook(_: ActionState, form: FormData): Promise<ActionState> {
  const year = Number(field(form, 'year'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('add_to_shelf', {
    p_title: field(form, 'title'),
    p_author: field(form, 'author'),
    p_isbn: optionalField(form, 'isbn'),
    p_year: Number.isInteger(year) && year > 0 ? year : null,
    p_reading_status: field(form, 'reading_status') || 'unread',
    p_format: field(form, 'format') || 'physical',
    p_condition: optionalField(form, 'condition'),
    p_open_to_swap: form.get('open_to_swap') === 'on',
  })
  if (error) return { error: friendlyError(error) }
  await refreshShelf()
  return { ok: 'Added to your shelf.' }
}

export async function updateShelfItem(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shelf_items')
    .update({
      reading_status: field(form, 'reading_status'),
      open_to_swap: form.get('open_to_swap') === 'on',
      condition: optionalField(form, 'condition'),
      note: optionalField(form, 'note'),
    })
    .eq('id', field(form, 'id'))
  if (error) return { error: friendlyError(error) }
  await refreshShelf()
  return { ok: 'Saved.' }
}

export async function removeShelfItem(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.from('shelf_items').delete().eq('id', field(form, 'id'))
  if (error) return { error: friendlyError(error) }
  await refreshShelf()
  return null
}

export async function listForSale(_: ActionState, form: FormData): Promise<ActionState> {
  const price = parseMoney(field(form, 'price'))
  if (!price || price < 10000) return { error: 'Set a price of at least 100.' }
  const supabase = await createClient()
  const { error } = await supabase.rpc('list_for_sale', {
    p_shelf_item: field(form, 'shelf_item_id'),
    p_price_minor: price,
    p_description: optionalField(form, 'description'),
  })
  if (error) return { error: friendlyError(error) }
  await refreshShelf()
  return { ok: 'Listed on the market.' }
}

export async function withdrawListing(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('withdraw_listing', { p_listing: field(form, 'listing_id') })
  if (error) return { error: friendlyError(error) }
  await refreshShelf()
  return null
}
