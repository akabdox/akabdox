import type { CSSProperties } from 'react'
import Link from 'next/link'
import { Icon } from './ui/icon'
import { Monogram } from './ui/monogram'
import { Rating } from './ui/rating'
import { timeAgo } from '@/lib/time'
import type { Post } from '@/lib/types'

const kindLabel = { thought: 'Thought', review: 'Review', idea: 'Idea' }

export function PostCard({ post, index = 0, full = false }: { post: Post; index?: number; full?: boolean }) {
  const comments = post.comments?.[0]?.count ?? 0
  return (
    <article className="animate-rise grid gap-4 rounded-md bg-surface-low p-5 sm:p-6" style={{ '--i': index } as CSSProperties}>
      <header className="flex items-center gap-3">
        <Monogram name={post.author.display_name} />
        <div className="grid min-w-0">
          <Link href={`/u/${post.author.username}`} className="truncate type-title-sm hover:underline">
            {post.author.display_name}
          </Link>
          <time dateTime={post.created_at} className="type-body-sm text-on-surface-variant">
            {timeAgo(post.created_at)}
          </time>
        </div>
        <span className="ml-auto rounded-sm bg-secondary-container px-2.5 py-1 type-label-md text-on-secondary-container">{kindLabel[post.kind]}</span>
      </header>

      {post.book ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm bg-surface-container px-3 py-2 type-body-md text-on-surface-variant">
          <Icon name="menu_book" size={18} className="text-primary" />
          <span className="type-title-sm text-on-surface">{post.book.title}</span>
          <span>{post.book.author}</span>
          {post.rating ? <Rating value={post.rating} className="ml-auto" /> : null}
        </p>
      ) : null}

      <div className={full ? 'reading whitespace-pre-line' : 'reading line-clamp-6 whitespace-pre-line'}>{post.body}</div>

      {!full ? (
        <Link href={`/feed/${post.id}`} className="state-layer -ml-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 type-label-lg text-primary">
          <Icon name="chat" size={18} />
          {comments === 0 ? 'Reply' : `${comments} ${comments === 1 ? 'reply' : 'replies'}`}
        </Link>
      ) : null}
    </article>
  )
}
