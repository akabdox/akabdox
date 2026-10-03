'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { field } from '@/lib/form'
import { getDict } from '@/i18n/server'

export async function openDirect(form: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('open_direct_room', { p_other: field(form, 'user_id') })
  if (error || !data) throw new Error((await getDict()).chat.openFailed)
  redirect(`/chat/${data as string}`)
}
