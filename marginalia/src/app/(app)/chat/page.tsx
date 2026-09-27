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

      <Rule label="Rooms" className="mb-2" />
      {publicRooms.map((r) => (
        <Link key={r.id} href={`/chat/${r.id}`} className="group grid gap-1 border-b border-rule py-5">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-[18px] font-medium group-hover:underline">{r.name}</span>
            <span className="eyebrow">clears every {describeInterval(r.message_ttl)}</span>
          </span>
          {r.description ? <span className="text-[14px] text-ink-3">{r.description}</span> : null}
        </Link>
      ))}

      <Rule label="Direct" className="mt-12 mb-2" />
      {direct.length === 0 ? (
        <div className="mt-6">
          <Empty title="No conversations.">Open a member's shelf and press Message.</Empty>
        </div>
      ) : (
        direct.map((r) => {
          const other = r.room_members.find((m) => m.user_id !== viewer.id)?.profile
          return (
            <Link key={r.id} href={`/chat/${r.id}`} className="group flex items-center gap-3 border-b border-rule py-4">
              <Monogram name={other?.display_name ?? '?'} size="sm" />
              <span className="font-medium group-hover:underline">{other?.display_name ?? 'Former member'}</span>
              <span className="text-[13px] text-ink-3">@{other?.username}</span>
            </Link>
          )
        })
      )}
    </div>
  )
}
