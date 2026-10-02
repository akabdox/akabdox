import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Empty } from '@/components/ui/empty'
import { Monogram } from '@/components/ui/monogram'
import { Rule } from '@/components/ui/rule'
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

      <Rule label={t.chat.rooms} className="mb-2" />
      {publicRooms.map((r) => (
        <Link key={r.id} href={`/chat/${r.id}`} className="group grid gap-1 border-b border-rule py-5">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-[18px] font-medium group-hover:underline">{(r.name && t.chat.roomNames[r.name]) ?? r.name}</span>
            <span className="eyebrow">{t.chat.clearsEvery(describeInterval(r.message_ttl, locale))}</span>
          </span>
          {r.description ? <span className="text-[14px] text-ink-3">{t.chat.roomDescriptions[r.description] ?? r.description}</span> : null}
        </Link>
      ))}

      <Rule label={t.chat.direct} className="mt-12 mb-2" />
      {direct.length === 0 ? (
        <div className="mt-6">
          <Empty title={t.chat.noDirect}>{t.chat.noDirectBody}</Empty>
        </div>
      ) : (
        direct.map((r) => {
          const other = r.room_members.find((m) => m.user_id !== viewer.id)?.profile
          return (
            <Link key={r.id} href={`/chat/${r.id}`} className="group flex items-center gap-3 border-b border-rule py-4">
              <Monogram name={other?.display_name ?? '?'} size="sm" />
              <span className="font-medium group-hover:underline">{other?.display_name ?? t.chat.formerMember}</span>
              <span className="text-[13px] text-ink-3">@{other?.username}</span>
            </Link>
          )
        })
      )}
    </div>
  )
}
