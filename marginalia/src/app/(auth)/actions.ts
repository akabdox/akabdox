'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { field, type ActionState } from '@/lib/form'
import { siteUrl } from '@/lib/site'
import { getDict } from '@/i18n/server'

function safeNext(next: string): string {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/feed'
}

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: field(form, 'email'),
    password: field(form, 'password'),
  })
  if (error?.code === 'email_not_confirmed') return { error: t.auth.errors.unconfirmed }
  if (error) return { error: t.auth.errors.mismatch }
  redirect(safeNext(field(form, 'next')))
}

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const supabase = await createClient()
  const username = field(form, 'username').toLowerCase()
  const email = field(form, 'email')
  const password = field(form, 'password')

  if (password.length < 8) return { error: t.auth.errors.shortPassword }

  const { data, error: checkError } = await supabase.rpc('check_signup', { p_username: username })
  if (checkError) return { error: t.auth.errors.checkFailed }
  const problem = data as string | null
  if (problem === 'username_invalid' || problem === 'username_taken') return { error: t.auth.errors[problem] }

  const { data: signup, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: { username, display_name: field(form, 'display_name') },
    },
  })
  if (error) return { error: error.message }
  if (!signup.session) return { ok: t.auth.checkInbox }
  redirect('/feed')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
