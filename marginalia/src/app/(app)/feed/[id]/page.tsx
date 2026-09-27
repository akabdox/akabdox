import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/post-card'
import { ActionForm } from '@/components/ui/action-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { Monogram } from '@/components/ui/monogram'
import { Rule } from '@/components/ui/rule'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { timeAgo } from '@/lib/time'
import { isUuid } from '@/lib/uuid'
import type { Comment, Post } from '@/lib/types'
import { POST_SELECT } from '@/lib/queries'
import { addComment, deleteComment, deletePost } from '../actions'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) notFound()
  const viewer = await requireViewer()
  const supabase = await createClient()

  const [{ data: post }, { data: comments }] = await Promise.all([
    supabase.from('posts').select(POST_SELECT).eq('id', id).maybeSingle(),
    supabase
      .from('comments')
      .select('id, body, created_at, author_id, author:profiles(username, display_name)')
      .eq('post_id', id)
      .order('created_at'),
  ])
  if (!post) notFound()

  const p = post as unknown as Post
  const replies = (comments ?? []) as unknown as Comment[]
  const canDelete = p.author_id === viewer.id || viewer.role === 'admin'

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/feed" className="eyebrow hover:text-ink">
        ← Feed
      </Link>
      <PostCard post={p} full />
      {canDelete ? (
        <form action={deletePost} className="mt-3">
          <input type="hidden" name="id" value={p.id} />
          <Button type="submit" variant="ghost" className="text-[11px]">
            Delete post
          </Button>
        </form>
      ) : null}

      <Rule label={`${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`} className="mt-10 mb-2" />

      {replies.map((c) => (
        <div key={c.id} className="grid grid-cols-[auto_1fr] gap-3 border-b border-rule py-5">
          <Monogram name={c.author.display_name} size="sm" />
          <div className="grid gap-1">
            <p className="flex items-center gap-3 text-[13px]">
              <Link href={`/u/${c.author.username}`} className="font-medium hover:underline">
                {c.author.display_name}
              </Link>
              <span className="text-ink-3">{timeAgo(c.created_at)}</span>
              {c.author_id === viewer.id || viewer.role === 'admin' ? (
                <form action={deleteComment} className="ml-auto">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="post_id" value={p.id} />
                  <button type="submit" className="eyebrow hover:text-danger">
                    Delete
                  </button>
                </form>
              ) : null}
            </p>
            <p className="reading whitespace-pre-line">{c.body}</p>
          </div>
        </div>
      ))}

      <ActionForm action={addComment} className="mt-6">
        <input type="hidden" name="post_id" value={p.id} />
        <Textarea name="body" required maxLength={2000} rows={3} placeholder="Add to the conversation" aria-label="Reply" />
        <SubmitButton className="justify-self-end" pendingLabel="Replying">
          Reply
        </SubmitButton>
      </ActionForm>
    </div>
  )
}
