'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { field, friendlyError, type ActionState } from '@/lib/form'
import { getDict } from '@/i18n/server'

async function done(error: { code?: string; message: string } | null, ok?: string): Promise<ActionState> {
  if (error) return { error: friendlyError(error, await getDict()) }
  revalidatePath('/admin')
  return ok ? { ok } : null
}

export async function setCommission(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const percent = Number(field(form, 'percent'))
  if (!Number.isFinite(percent) || percent < 0 || percent > 20) return { error: t.admin.rateRange }
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .update({ commission_bps: Math.round(percent * 100) })
    .eq('id', true)
  return done(error, t.admin.rateUpdated)
}

export async function settle(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_settle', { p_tx: field(form, 'id') })
  return done(error)
}

export async function cancel(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_cancel', { p_tx: field(form, 'id') })
  return done(error)
}

export async function markPaidOut(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_mark_paid_out', { p_tx: field(form, 'id') })
  return done(error)
}

export async function markRefunded(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_mark_refunded', { p_tx: field(form, 'id') })
  return done(error)
}
