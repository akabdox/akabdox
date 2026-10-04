import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BackLink } from '@/components/back-link'
import { ChatRoom } from '@/components/chat-room'
import { Icon } from '@/components/ui/icon'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { describeInterval } from '@/lib/time'
import { isUuid } from '@/lib/uuid'
import type { Author, Message, Room } from '@/lib/types'
import { getDict, getI18n } from '@/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).chat.title }
}

type Row = Message & { author: Author }

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  if (!isUuid(roomId)) notFound()
  const viewer = await requireViewer()
  const { locale, t } = await getI18n()
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

  const title = r.kind === 'public' ? ((r.name && t.chat.roomNames[r.name]) ?? r.name) : (other?.display_name ?? t.chat.conversation)

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <header className="grid gap-2">
        <BackLink href="/chat">{t.nav.chat}</BackLink>
        <h1 className="type-headline-lg">{title}</h1>
        <p className="inline-flex items-center gap-2 type-body-md text-on-surface-variant">
          <Icon name="timer" size={18} />
          {t.chat.disappears(describeInterval(r.message_ttl, locale))}
        </p>
      </header>
      <ChatRoom
        roomId={r.id}
        viewerId={viewer.id}
        initialMessages={messages.map(({ author: _author, ...m }) => m)}
        initialPeople={people}
        locale={locale}
        labels={{
          empty: t.chat.empty,
          placeholder: t.chat.placeholder,
          messageLabel: t.chat.messageLabel,
          send: t.chat.send,
          notSent: t.chat.notSent,
          disappearsIn: t.chat.disappearsIn('{span}'),
        }}
      />
    </div>
  )
}
