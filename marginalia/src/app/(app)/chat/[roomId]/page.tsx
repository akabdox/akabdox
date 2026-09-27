import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChatRoom } from '@/components/chat-room'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { describeInterval } from '@/lib/time'
import { isUuid } from '@/lib/uuid'
import type { Author, Message, Room } from '@/lib/types'

export const metadata: Metadata = { title: 'Chat' }

type Row = Message & { author: Author }

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  if (!isUuid(roomId)) notFound()
  const viewer = await requireViewer()
  const supabase = await createClient()

  const [{ data: room }, { data: members }, { data: rows }] = await Promise.all([
    supabase.from('rooms').select('id, kind, name, description, message_ttl').eq('id', roomId).maybeSingle(),
    supabase.from('room_members').select('user_id, profile:profiles(username, display_name)').eq('room_id', roomId),
    supabase
      .from('messages')
      .select('id, room_id, author_id, body, created_at, expires_at, author:profiles(username, display_name)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(150),
  ])
  if (!room) notFound()

  const r = room as Room
  const messages = ((rows ?? []) as unknown as Row[]).reverse()
  const people: Record<string, Author> = {}
  for (const m of messages) people[m.author_id] = m.author
  const memberRows = (members ?? []) as unknown as { user_id: string; profile: Author }[]
  for (const m of memberRows) people[m.user_id] = m.profile
  const other = memberRows.find((m) => m.user_id !== viewer.id)?.profile

  const title = r.kind === 'public' ? r.name : (other?.display_name ?? 'Conversation')

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <header className="grid gap-2">
        <Link href="/chat" className="eyebrow hover:text-ink">
          ← Chat
        </Link>
        <h1 className="text-[30px]">{title}</h1>
        <p className="text-[13px] text-ink-3">Messages disappear {describeInterval(r.message_ttl)} after they are sent.</p>
      </header>
      <ChatRoom
        roomId={r.id}
        viewerId={viewer.id}
        initialMessages={messages.map(({ author: _author, ...m }) => m)}
        initialPeople={people}
      />
    </div>
  )
}
