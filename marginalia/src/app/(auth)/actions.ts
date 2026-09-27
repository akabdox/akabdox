'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { field, type ActionState } from '@/lib/form'
import { siteUrl } from '@/lib/site'

function safeNext(next: string): string {
  return next.startsWith('/') && !next.startsWith('//') ? next : '/feed'
}

export async function signIn(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: field(form, 'email'),
    password: field(form, 'password'),
  })
  if (error) return { error: 'That email and password do not match.' }
  redirect(safeNext(field(form, 'next')))
}

export async function signUp(_: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const code = field(form, 'invite_code')
  const username = field(form, 'username').toLowerCase()
  const email = field(form, 'email')
  const password = field(form, 'password')

  if (password.length < 8) return { error: 'Use at least 8 characters for your password.' }

  const { data: problem, error: checkError } = await supabase.rpc('check_signup', {
    p_code: code,
    p_username: username,
    p_email: email,
  })
  if (checkError) return { error: 'Could not check your invite. Try again.' }
  if (problem) return { error: problem as string }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: { invite_code: code, username, display_name: field(form, 'display_name') },
    },
  })
  if (error) return { error: error.message }
  if (!data.session) return { ok: 'Check your inbox to confirm your email, then sign in.' }
  redirect('/feed')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
