import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Empty } from '@/components/ui/empty'
import { Monogram } from '@/components/ui/monogram'
import { Icon } from '@/components/ui/icon'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { describeInterval } from '@/lib/time'
import type { Author, Room } from '@/lib/types'
import { getDict, getI18n } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).chat.title }
}

type RoomRow = Room & { room_members: { user_id: string; profile: Author }[] }

export default async function ChatPage() {
  const viewer = await requireViewer()
  const { locale, t } = await getI18n()
  const supabase = await createClient()
  const { data } = await supabase
    .from('rooms')
    .select('id, kind, name, description, message_ttl, room_members(user_id, profile:profiles(username, display_name))')
    .order('created_at')
  const rooms = (data ?? []) as unknown as RoomRow[]
  const publicRooms = rooms.filter((r) => r.kind === 'public')
  const direct = rooms.filter((r) => r.kind === 'direct')

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t.chat.eyebrow} title={t.chat.title}>
        {t.chat.intro}
      </PageHeader>

      <h2 className="mb-3 type-title-md text-on-surface-variant">{t.chat.rooms}</h2>
      <ul className="grid gap-1 overflow-hidden rounded-xl bg-surface-low p-1">
        {publicRooms.map((r) => (
          <li key={r.id}>
            <Link href={`/chat/${r.id}`} className="state-layer flex items-center gap-4 rounded-lg px-4 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container">
                <Icon name="forum" size={20} />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="type-title-md">{(r.name && t.chat.roomNames[r.name]) ?? r.name}</span>
                {r.description ? <span className="truncate type-body-md text-on-surface-variant">{t.chat.roomDescriptions[r.description] ?? r.description}</span> : null}
              </span>
              <span className="hidden items-center gap-1 type-label-md text-on-surface-variant sm:inline-flex">
                <Icon name="timer" size={16} />
                {t.chat.clearsEvery(describeInterval(r.message_ttl, locale))}
              </span>
              <Icon name="chevron_right" className="flip-rtl text-on-surface-variant" />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 mb-3 type-title-md text-on-surface-variant">{t.chat.direct}</h2>
      {direct.length === 0 ? (
        <Empty icon="chat" title={t.chat.noDirect}>
          {t.chat.noDirectBody}
        </Empty>
      ) : (
        <ul className="grid gap-1 overflow-hidden rounded-xl bg-surface-low p-1">
          {direct.map((r) => {
            const other = r.room_members.find((m) => m.user_id !== viewer.id)?.profile
            return (
              <li key={r.id}>
                <Link href={`/chat/${r.id}`} className="state-layer flex items-center gap-4 rounded-lg px-4 py-3">
                  <Monogram name={other?.display_name ?? '?'} />
                  <span className="grid min-w-0 flex-1">
                    <span className="type-title-md">{other?.display_name ?? t.chat.formerMember}</span>
                    <span dir="ltr" className="justify-self-start type-body-md text-on-surface-variant">
                      @{other?.username}
                    </span>
                  </span>
                  <Icon name="chevron_right" className="flip-rtl text-on-surface-variant" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
