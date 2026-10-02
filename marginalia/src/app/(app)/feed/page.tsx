import type { Metadata } from 'next'
import Link from 'next/link'
import { PostCard } from '@/components/post-card'
import { PageHeader } from '@/components/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { Empty } from '@/components/ui/empty'
import { Field, Segmented, Select, Textarea } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { POST_SELECT } from '@/lib/queries'
import type { BookRef, Post } from '@/lib/types'
import { createPost } from './actions'
import { getDict } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).feed.title }
}

const PAGE = 30

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  const { before } = await searchParams
  const viewer = await requireViewer()
  const t = await getDict()
  const supabase = await createClient()

  let query = supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(PAGE)
  if (before) query = query.lt('created_at', before)

  const [{ data: posts }, { data: shelf }] = await Promise.all([
    query,
    supabase.from('shelf_items').select('book:books!shelf_items_book_id_fkey(id, title, author)').eq('owner_id', viewer.id),
  ])

  const list = (posts ?? []) as unknown as Post[]
  const books = [...new Map(((shelf ?? []) as unknown as { book: BookRef }[]).map((s) => [s.book.id, s.book])).values()]

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t.feed.eyebrow} title={t.feed.title} />

      <ActionForm action={createPost} className="composer border border-rule bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            name="kind"
            defaultValue="thought"
            options={[
              { value: 'thought', label: t.kinds.thought },
              { value: 'review', label: t.kinds.review },
              { value: 'idea', label: t.kinds.idea },
            ]}
          />
        </div>
        <Textarea name="body" required maxLength={4000} rows={3} placeholder={t.feed.placeholder} aria-label={t.feed.postLabel} dir="auto" />
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label={t.feed.aboutBook}>
            <Select name="book_id" defaultValue="">
              <option value="">{t.feed.none}</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}, {b.author}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.feed.rating} className="review-only">
            <Select name="rating" defaultValue="4">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {t.feed.ratingOption(n)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <SubmitButton className="justify-self-end" pendingLabel={t.feed.posting}>
          {t.feed.post}
        </SubmitButton>
      </ActionForm>

      <div className="mt-6">
        {list.length === 0 ? (
          <Empty title={t.feed.emptyTitle}>{t.feed.emptyBody}</Empty>
        ) : (
          list.map((post, i) => <PostCard key={post.id} post={post} index={i} />)
        )}
      </div>

      {list.length === PAGE ? (
        <Link
          href={`/feed?before=${encodeURIComponent(list[list.length - 1].created_at)}`}
          className="eyebrow mt-8 inline-block hover:text-ink"
        >
          {t.more(t.feed.older)}
        </Link>
      ) : null}
    </div>
  )
}
