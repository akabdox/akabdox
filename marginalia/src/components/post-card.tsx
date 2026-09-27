import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Monogram } from './ui/monogram'
import { Rating } from './ui/rating'
import { timeAgo } from '@/lib/time'
import type { Post } from '@/lib/types'

const kindLabel = { thought: 'Thought', review: 'Review', idea: 'Idea' }

export function PostCard({ post, index = 0, full = false }: { post: Post; index?: number; full?: boolean }) {
  const comments = post.comments?.[0]?.count ?? 0
  return (
    <article className="animate-rise grid gap-4 border-b border-rule py-7" style={{ '--i': index } as CSSProperties}>
      <header className="flex items-center gap-3">
        <Monogram name={post.author.display_name} size="sm" />
        <Link href={`/u/${post.author.username}`} className="text-[14px] font-medium hover:underline">
          {post.author.display_name}
        </Link>
        <span className="eyebrow">{kindLabel[post.kind]}</span>
        <time dateTime={post.created_at} className="ml-auto text-[12px] text-ink-3">
          {timeAgo(post.created_at)}
        </time>
      </header>

      {post.book ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
          <span className="font-medium uppercase tracking-[0.1em] text-ink">{post.book.title}</span>
          <span>{post.book.author}</span>
          {post.rating ? <Rating value={post.rating} /> : null}
        </p>
      ) : null}

      <div className={full ? 'reading whitespace-pre-line' : 'reading line-clamp-6 whitespace-pre-line'}>{post.body}</div>

      {!full ? (
        <Link href={`/feed/${post.id}`} className="eyebrow w-fit hover:text-ink">
          {comments === 0 ? 'Reply' : `${comments} ${comments === 1 ? 'reply' : 'replies'}`} →
        </Link>
      ) : null}
    </article>
  )
}
