'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { field } from '@/lib/form'

export async function finishWelcome(form: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_onboarded', { p_done: true })
  if (error) throw new Error(`Could not close the welcome guide: ${error.message}`)
  revalidatePath('/', 'layout')
  const next = field(form, 'next')
  if (next.startsWith('/') && !next.startsWith('//')) redirect(next)
}

export async function reopenWelcome() {
  const supabase = await createClient()
  const { error } = await supabase.rpc('set_onboarded', { p_done: false })
  if (error) throw new Error(`Could not reopen the welcome guide: ${error.message}`)
  revalidatePath('/', 'layout')
  redirect('/feed')
}
