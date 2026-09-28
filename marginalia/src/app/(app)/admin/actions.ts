'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { field, friendlyError, type ActionState } from '@/lib/form'

async function done(error: { code?: string; message: string } | null, ok?: string): Promise<ActionState> {
  if (error) return { error: friendlyError(error) }
  revalidatePath('/admin')
  return ok ? { ok } : null
}

export async function setCommission(_: ActionState, form: FormData): Promise<ActionState> {
  const percent = Number(field(form, 'percent'))
  if (!Number.isFinite(percent) || percent < 0 || percent > 20) return { error: 'Use a rate between 0 and 20%.' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .update({ commission_bps: Math.round(percent * 100) })
    .eq('id', true)
  return done(error, 'Rate updated. It applies to new orders only.')
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

export async function createInviteLink(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_invite', {
    p_max_uses: Number(field(form, 'max_uses')),
    p_valid_days: Number(field(form, 'valid_days')),
  })
  return done(error, 'Link created. Copy it below and share it.')
}

export async function closeInviteLink(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('close_invite', { p_code: field(form, 'code') })
  return done(error)
}
