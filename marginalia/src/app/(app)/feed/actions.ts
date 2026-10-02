'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { field, friendlyError, optionalField, type ActionState } from '@/lib/form'
import { getDict } from '@/i18n/server'

export async function createPost(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const kind = field(form, 'kind') || 'thought'
  const body = field(form, 'body')
  if (!body) return { error: t.feed.writeFirst }

  const rating = kind === 'review' ? Number(field(form, 'rating')) || null : null
  const supabase = await createClient()
  const { error } = await supabase.from('posts').insert({
    kind,
    body,
    rating,
    book_id: optionalField(form, 'book_id'),
  })
  if (error) return { error: friendlyError(error, t) }
  revalidatePath('/feed')
  return null
}

export async function deletePost(form: FormData) {
  const supabase = await createClient()
  await supabase.from('posts').delete().eq('id', field(form, 'id'))
  revalidatePath('/feed')
  redirect('/feed')
}

export async function addComment(_: ActionState, form: FormData): Promise<ActionState> {
  const t = await getDict()
  const postId = field(form, 'post_id')
  const body = field(form, 'body')
  if (!body) return { error: t.feed.replyFirst }
  const supabase = await createClient()
  const { error } = await supabase.from('comments').insert({ post_id: postId, body })
  if (error) return { error: friendlyError(error, t) }
  revalidatePath(`/feed/${postId}`)
  return null
}

export async function deleteComment(form: FormData) {
  const supabase = await createClient()
  await supabase.from('comments').delete().eq('id', field(form, 'id'))
  revalidatePath(`/feed/${field(form, 'post_id')}`)
}
