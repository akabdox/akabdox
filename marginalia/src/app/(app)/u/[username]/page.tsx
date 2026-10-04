import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShelfCard } from '@/components/shelf-card'
import { SellForm } from '@/components/sell-form'
import { ActionForm } from '@/components/ui/action-form'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Empty } from '@/components/ui/empty'
import { Checkbox, Field, Input, Select } from '@/components/ui/field'
import { Monogram } from '@/components/ui/monogram'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { SHELF_SELECT } from '@/lib/queries'
import { formatDate } from '@/lib/time'
import { cn } from '@/lib/cn'
import type { Profile, Settings, ShelfItem } from '@/lib/types'
import { addBook, listForSale, removeShelfItem, updateShelfItem, withdrawListing } from '../../shelf/actions'
import { openDirect } from '../../chat/actions'

type Filter = 'all' | 'reading' | 'read' | 'swap' | 'sale'

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reading', label: 'Reading' },
  { key: 'read', label: 'Read' },
  { key: 'swap', label: 'Swap' },
  { key: 'sale', label: 'For sale' },
]

function isOpen(item: ShelfItem) {
  return item.listings.find((l) => l.status === 'active' || l.status === 'reserved')
}

function matches(item: ShelfItem, f: Filter) {
  if (f === 'reading' || f === 'read') return item.reading_status === f
  if (f === 'swap') return item.open_to_swap
  if (f === 'sale') return Boolean(isOpen(item))
  return true
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}` }
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ show?: string }>
}) {
  const [{ username }, { show }] = await Promise.all([params, searchParams])
  const viewer = await requireViewer()
  const supabase = await createClient()

  const { data: profileRow } = await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle()
  if (!profileRow) notFound()
  const profile = profileRow as Profile
  const own = profile.id === viewer.id

  const [{ data: shelfRows }, { data: settingsRow }] = await Promise.all([
    supabase.from('shelf_items').select(SHELF_SELECT).eq('owner_id', profile.id).order('created_at', { ascending: false }),
    supabase.from('settings').select('commission_bps, currency').maybeSingle(),
  ])
  const shelf = (shelfRows ?? []) as unknown as ShelfItem[]
  const settings = (settingsRow ?? { commission_bps: 700, currency: 'DZD' }) as Settings
  const filter = (filters.some((f) => f.key === show) ? show : 'all') as Filter
  const visible = shelf.filter((i) => matches(i, filter))

  const counts = {
    books: shelf.length,
    read: shelf.filter((i) => i.reading_status === 'read').length,
    swap: shelf.filter((i) => i.open_to_swap).length,
    sale: shelf.filter((i) => isOpen(i)).length,
  }

  return (
    <div className="grid gap-10">
      <header className="animate-rise grid gap-5 rounded-xl bg-surface-low p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-8">
        <Monogram name={profile.display_name} size="lg" />
        <div className="grid gap-1.5">
          <h1 className="flex flex-wrap items-center gap-3 type-headline-lg">
            {profile.display_name}
            {profile.role === 'admin' ? <Badge tone="outline">Founder</Badge> : null}
          </h1>
          <p className="type-body-md text-on-surface-variant">
            @{profile.username}
            {profile.city ? ` · ${profile.city}` : ''} · member since {formatDate(profile.created_at)}
          </p>
          {profile.bio ? <p className="mt-1 max-w-lg type-body-lg text-on-surface">{profile.bio}</p> : null}
        </div>
        {own ? (
          <ButtonLink href="/settings" variant="tonal" icon="edit" className="justify-self-start">
            Edit profile
          </ButtonLink>
        ) : (
          <form action={openDirect}>
            <input type="hidden" name="user_id" value={profile.id} />
            <Button type="submit" icon="chat">
              Message
            </Button>
          </form>
        )}
      </header>

      <dl className="tabular grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Books', counts.books],
            ['Read', counts.read],
            ['Swap', counts.swap],
            ['For sale', counts.sale],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="grid gap-1 rounded-md bg-surface-container px-5 py-4">
            <dd className="type-headline-md text-primary">{n}</dd>
            <dt className="type-label-lg text-on-surface-variant">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <nav className="flex flex-wrap gap-2" aria-label="Filter shelf">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={f.key === 'all' ? `/u/${profile.username}` : `/u/${profile.username}?show=${f.key}`}
                aria-current={filter === f.key ? 'true' : undefined}
                className={cn(
                  'state-layer inline-flex h-8 items-center gap-2 rounded-sm border px-4 type-label-lg',
                  filter === f.key ? 'border-transparent bg-secondary-container pl-2 text-on-secondary-container' : 'border-outline text-on-surface-variant',
                )}
              >
                {filter === f.key ? <Icon name="check" size={18} /> : null}
                {f.label}
              </Link>
            ))}
          </nav>

          {visible.length === 0 ? (
            <div className="mt-6">
              <Empty title={own ? 'Your shelf is empty.' : 'Nothing here yet.'}>
                {own ? 'Add the books you own. Mark what you would swap or sell.' : null}
              </Empty>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
            {visible.map((item) => {
              const listing = isOpen(item)
              return (
                <ShelfCard key={item.id} item={item}>
                  {own ? (
                    <details className="group mt-1">
                      <summary className="state-layer -ml-3 inline-flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-2 type-label-lg text-primary [&::-webkit-details-marker]:hidden">
                        <Icon name="edit" size={18} className="group-open:hidden" />
                        <Icon name="close" size={18} className="hidden group-open:inline-block" />
                        <span className="group-open:hidden">Manage</span>
                        <span className="hidden group-open:inline">Close</span>
                      </summary>
                      <div className="mt-3 grid gap-6 rounded-md bg-surface-container p-4 sm:p-5">
                        <ActionForm action={updateShelfItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Status">
                              <Select name="reading_status" defaultValue={item.reading_status}>
                                <option value="unread">Unread</option>
                                <option value="reading">Reading</option>
                                <option value="read">Read</option>
                              </Select>
                            </Field>
                            <Field label="Condition">
                              <Select name="condition" defaultValue={item.condition ?? ''}>
                                <option value="">Not set</option>
                                <option value="new">New</option>
                                <option value="fine">Fine</option>
                                <option value="good">Good</option>
                                <option value="worn">Worn</option>
                              </Select>
                            </Field>
                          </div>
                          <Field label="Note">
                            <Input name="note" defaultValue={item.note ?? ''} maxLength={500} />
                          </Field>
                          <Checkbox name="open_to_swap" label="Open to swap" defaultChecked={item.open_to_swap} />
                          <SubmitButton size="sm" variant="secondary" className="justify-self-start">
                            Save
                          </SubmitButton>
                        </ActionForm>

                        {listing ? (
                          listing.status === 'active' ? (
                            <ActionForm action={withdrawListing}>
                              <input type="hidden" name="listing_id" value={listing.id} />
                              <SubmitButton size="sm" variant="danger" className="justify-self-start">
                                Withdraw from market
                              </SubmitButton>
                            </ActionForm>
                          ) : (
                            <p className="type-body-md text-on-surface-variant">A buyer is checking out. The copy is reserved.</p>
                          )
                        ) : (
                          <SellForm shelfItemId={item.id} bps={settings.commission_bps} currency={settings.currency} action={listForSale} />
                        )}

                        {!listing || listing.status === 'active' ? (
                          <ActionForm action={removeShelfItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <SubmitButton size="sm" variant="ghost" icon="delete" className="justify-self-start text-error">
                              Remove from shelf
                            </SubmitButton>
                          </ActionForm>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                </ShelfCard>
              )
            })}
            </div>
          )}
        </section>

        {own ? (
          <aside id="add" className="h-fit scroll-mt-24 rounded-xl bg-surface-low p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="mb-5 flex items-center gap-2 type-title-lg">
              <Icon name="add" className="text-primary" />
              Add a book
            </h2>
            <ActionForm action={addBook}>
              <Field label="Title">
                <Input name="title" required maxLength={300} />
              </Field>
              <Field label="Author">
                <Input name="author" required maxLength={200} />
              </Field>
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field label="ISBN" hint="Pulls the cover">
                  <Input name="isbn" inputMode="numeric" />
                </Field>
                <Field label="Year">
                  <Input name="year" inputMode="numeric" maxLength={4} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <Select name="reading_status" defaultValue="unread">
                    <option value="unread">Unread</option>
                    <option value="reading">Reading</option>
                    <option value="read">Read</option>
                  </Select>
                </Field>
                <Field label="Format">
                  <Select name="format" defaultValue="physical">
                    <option value="physical">Physical</option>
                    <option value="digital">Digital</option>
                  </Select>
                </Field>
              </div>
              <Field label="Condition">
                <Select name="condition" defaultValue="">
                  <option value="">Not set</option>
                  <option value="new">New</option>
                  <option value="fine">Fine</option>
                  <option value="good">Good</option>
                  <option value="worn">Worn</option>
                </Select>
              </Field>
              <Checkbox name="open_to_swap" label="Open to swap" />
              <SubmitButton pendingLabel="Adding" icon="add" className="mt-1">
                Add to shelf
              </SubmitButton>
            </ActionForm>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
