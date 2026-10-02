'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { field, friendlyError, optionalField, type ActionState } from '@/lib/form'
import { getDict } from '@/i18n/server'

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: field(form, 'display_name'),
      city: optionalField(form, 'city'),
      bio: optionalField(form, 'bio'),
    })
    .eq('id', data?.claims?.sub ?? '')
  if (error) return { error: friendlyError(error, t) }
  revalidatePath('/', 'layout')
  return { ok: t.settings.saved }
}
