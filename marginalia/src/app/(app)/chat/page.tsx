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

export const metadata: Metadata = { title: 'Chat' }

type RoomRow = Room & { room_members: { user_id: string; profile: Author }[] }

export default async function ChatPage() {
  const viewer = await requireViewer()
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
      <PageHeader eyebrow="Ephemeral" title="Chat">
        Nothing here is kept. Rooms clear themselves; direct messages fade after a week.
      </PageHeader>

      <h2 className="mb-3 type-title-md text-on-surface-variant">Rooms</h2>
      <ul className="grid gap-1 overflow-hidden rounded-xl bg-surface-low p-1">
        {publicRooms.map((r) => (
          <li key={r.id}>
            <Link href={`/chat/${r.id}`} className="state-layer flex items-center gap-4 rounded-lg px-4 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tertiary-container text-on-tertiary-container">
                <Icon name="forum" size={20} />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="type-title-md">{r.name}</span>
                {r.description ? <span className="truncate type-body-md text-on-surface-variant">{r.description}</span> : null}
              </span>
              <span className="hidden items-center gap-1 type-label-md text-on-surface-variant sm:inline-flex">
                <Icon name="timer" size={16} />
                {describeInterval(r.message_ttl)}
              </span>
              <Icon name="chevron_right" className="text-on-surface-variant" />
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 mb-3 type-title-md text-on-surface-variant">Direct</h2>
      {direct.length === 0 ? (
        <Empty icon="chat" title="No conversations.">Open a member's shelf and press Message.</Empty>
      ) : (
        <ul className="grid gap-1 overflow-hidden rounded-xl bg-surface-low p-1">
          {direct.map((r) => {
            const other = r.room_members.find((m) => m.user_id !== viewer.id)?.profile
            return (
              <li key={r.id}>
                <Link href={`/chat/${r.id}`} className="state-layer flex items-center gap-4 rounded-lg px-4 py-3">
                  <Monogram name={other?.display_name ?? '?'} />
                  <span className="grid min-w-0 flex-1">
                    <span className="type-title-md">{other?.display_name ?? 'Former member'}</span>
                    <span className="type-body-md text-on-surface-variant">@{other?.username}</span>
                  </span>
                  <Icon name="chevron_right" className="text-on-surface-variant" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
