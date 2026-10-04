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
import { addBook, listForSale, lookupIsbn, removeShelfItem, updateShelfItem, withdrawListing } from '../../shelf/actions'
import { IsbnField } from '@/components/isbn-field'
import { formatRate } from '@/lib/commission'
import { currencyLabel } from '@/lib/money'
import { getI18n } from '@/i18n/server'
import { paymentsEnabled } from '@/lib/features'
import { openDirect } from '../../chat/actions'

type Filter = 'all' | 'reading' | 'read' | 'swap' | 'sale'

const filters: Filter[] = ['all', 'reading', 'read', 'swap', 'sale']

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
  const { locale, t } = await getI18n()
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
  const filter = (filters.includes(show as Filter) ? show : 'all') as Filter
  const visible = shelf.filter((i) => matches(i, filter))

  const counts = {
    books: shelf.length,
    read: shelf.filter((i) => i.reading_status === 'read').length,
    swap: shelf.filter((i) => i.open_to_swap).length,
    sale: shelf.filter((i) => isOpen(i)).length,
  }

  const readingOptions = (['unread', 'reading', 'read'] as const).map((r) => (
    <option key={r} value={r}>
      {t.reading[r]}
    </option>
  ))
  const conditionOptions = [
    <option key="" value="">
      {t.shelf.notSet}
    </option>,
    ...(['new', 'fine', 'good', 'worn'] as const).map((c) => (
      <option key={c} value={c}>
        {t.conditions[c]}
      </option>
    )),
  ]
  const sellLabels = {
    price: t.sell.price(currencyLabel(settings.currency, locale)),
    note: t.sell.note,
    notePlaceholder: t.sell.notePlaceholder,
    submit: t.sell.submit,
    pending: t.sell.pending,
    buyerPays: t.sell.buyerPays,
    commission: t.sell.commission(formatRate(settings.commission_bps)),
    youReceive: t.sell.youReceive,
  }

  return (
    <div className="grid gap-6">
      <header className="animate-rise grid gap-5 rounded-xl bg-surface-low p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-8">
        <Monogram name={profile.display_name} size="lg" />
        <div className="grid gap-1.5">
          <h1 className="flex flex-wrap items-center gap-3 type-headline-lg">
            {profile.display_name}
            {profile.role === 'admin' ? <Badge tone="outline">{t.badges.founder}</Badge> : null}
          </h1>
          <p className="type-body-md text-on-surface-variant">
            <span dir="ltr">@{profile.username}</span>
            {profile.city ? ` · ${profile.city}` : ''} · {t.shelf.memberSince(formatDate(profile.created_at, locale))}
          </p>
          {profile.bio ? (
            <p dir="auto" className="mt-1 max-w-lg type-body-lg text-on-surface">
              {profile.bio}
            </p>
          ) : null}
        </div>
        {own ? (
          <ButtonLink href="/settings" variant="tonal" icon="edit" className="justify-self-start">
            {t.shelf.editProfile}
          </ButtonLink>
        ) : (
          <form action={openDirect}>
            <input type="hidden" name="user_id" value={profile.id} />
            <Button type="submit" icon="chat">
              {t.shelf.message}
            </Button>
          </form>
        )}
      </header>

      <dl className="tabular grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            [t.shelf.stats.books, counts.books],
            [t.shelf.stats.read, counts.read],
            [t.shelf.stats.swap, counts.swap],
            [t.shelf.stats.sale, counts.sale],
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
          <nav className="flex flex-wrap gap-2" aria-label={t.shelf.filterLabel}>
            {filters.map((f) => (
              <Link
                key={f}
                href={f === 'all' ? `/u/${profile.username}` : `/u/${profile.username}?show=${f}`}
                aria-current={filter === f ? 'true' : undefined}
                className={cn(
                  'state-layer inline-flex h-8 items-center gap-2 rounded-sm border px-4 type-label-lg',
                  filter === f ? 'border-transparent bg-secondary-container ps-2 text-on-secondary-container' : 'border-outline text-on-surface-variant',
                )}
              >
                {filter === f ? <Icon name="check" size={18} /> : null}
                {t.shelf.filters[f]}
              </Link>
            ))}
          </nav>

          {visible.length === 0 ? (
            <div className="mt-6">
              <Empty title={own ? t.shelf.emptyOwn : t.shelf.emptyOther}>
                {own ? t.shelf.emptyOwnBody : null}
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
                      <summary className="state-layer -ms-3 inline-flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-2 type-label-lg text-primary [&::-webkit-details-marker]:hidden">
                        <Icon name="edit" size={18} className="group-open:hidden" />
                        <Icon name="close" size={18} className="hidden group-open:inline-grid" />
                        <span className="group-open:hidden">{t.shelf.manage}</span>
                        <span className="hidden group-open:inline">{t.shelf.close}</span>
                      </summary>
                      <div className="mt-3 grid gap-6 rounded-md bg-surface-container p-4 sm:p-5">
                        <ActionForm action={updateShelfItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label={t.shelf.status}>
                              <Select name="reading_status" defaultValue={item.reading_status}>
                                {readingOptions}
                              </Select>
                            </Field>
                            <Field label={t.shelf.condition}>
                              <Select name="condition" defaultValue={item.condition ?? ''}>
                                {conditionOptions}
                              </Select>
                            </Field>
                          </div>
                          <Field label={t.shelf.note}>
                            <Input name="note" defaultValue={item.note ?? ''} maxLength={500} dir="auto" />
                          </Field>
                          <Checkbox name="open_to_swap" label={t.shelf.openToSwap} defaultChecked={item.open_to_swap} />
                          <SubmitButton size="sm" variant="secondary" className="justify-self-start">
                            {t.shelf.save}
                          </SubmitButton>
                        </ActionForm>

                        {listing ? (
                          listing.status === 'active' ? (
                            <ActionForm action={withdrawListing}>
                              <input type="hidden" name="listing_id" value={listing.id} />
                              <SubmitButton size="sm" variant="danger" className="justify-self-start">
                                {t.shelf.withdraw}
                              </SubmitButton>
                            </ActionForm>
                          ) : (
                            <p className="type-body-md text-on-surface-variant">{t.shelf.reservedNote}</p>
                          )
                        ) : (
                          <SellForm
                            shelfItemId={item.id}
                            bps={settings.commission_bps}
                            currency={settings.currency}
                            locale={locale}
                            labels={sellLabels}
                            showBreakdown={paymentsEnabled}
                            action={listForSale}
                          />
                        )}

                        {!listing || listing.status === 'active' ? (
                          <ActionForm action={removeShelfItem}>
                            <input type="hidden" name="id" value={item.id} />
                            <SubmitButton size="sm" variant="ghost" icon="delete" className="justify-self-start text-error">
                              {t.shelf.remove}
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
              {t.shelf.addTitle}
            </h2>
            <ActionForm action={addBook}>
              <IsbnField
                lookup={lookupIsbn}
                labels={{ isbn: t.shelf.isbn, hint: t.shelf.isbnHint, lookup: t.shelf.lookup, lookingUp: t.shelf.lookingUp }}
              />
              <Field label={t.shelf.title}>
                <Input name="title" required maxLength={300} dir="auto" />
              </Field>
              <Field label={t.shelf.author}>
                <Input name="author" required maxLength={200} dir="auto" />
              </Field>
              <div className="grid grid-cols-[96px_1fr] gap-3">
                <Field label={t.shelf.year}>
                  <Input name="year" inputMode="numeric" maxLength={4} dir="ltr" />
                </Field>
                <Field label={t.shelf.format}>
                  <Select name="format" defaultValue="physical">
                    <option value="physical">{t.formats.physical}</option>
                    <option value="digital">{t.formats.digital}</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.shelf.status}>
                  <Select name="reading_status" defaultValue="unread">
                    {readingOptions}
                  </Select>
                </Field>
                <Field label={t.shelf.condition}>
                  <Select name="condition" defaultValue="">
                    {conditionOptions}
                  </Select>
                </Field>
              </div>
              <Checkbox name="open_to_swap" label={t.shelf.openToSwap} />
              <SubmitButton pendingLabel={t.shelf.adding} icon="add" className="mt-1">
                {t.shelf.add}
              </SubmitButton>
            </ActionForm>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
