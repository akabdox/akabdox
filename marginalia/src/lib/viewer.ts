import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'
import type { Profile } from './types'

// The signed-in member, once per request.
export const getViewer = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const id = data?.claims?.sub
  if (!id) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  return (profile as Profile | null) ?? null
})

export async function requireViewer(): Promise<Profile> {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  return viewer
}

export async function requireAdmin(): Promise<Profile> {
  const viewer = await requireViewer()
  if (viewer.role !== 'admin') redirect('/feed')
  return viewer
}
