'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeLeft } from '@/lib/time'
import type { Author, Message } from '@/lib/types'
import { AnimatePresence, motion } from 'motion/react'
import { MessageLine } from './message-line'
import { Icon } from './ui/icon'
import { ease } from '@/lib/motion'

const clock = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false })

export function ChatRoom({
  roomId,
  viewerId,
  initialMessages,
  initialPeople,
}: {
  roomId: string
  viewerId: string
  initialMessages: Message[]
  initialPeople: Record<string, Author>
}) {
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState(initialMessages)
  const [people, setPeople] = useState(initialPeople)
  const [now, setNow] = useState(() => Date.now())
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const add = (m: Message) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]))

  // Live inserts. RLS decides what this member may receive.
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) =>
        add(payload.new as Message),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, roomId])

  // Ticks the fade and drops expired messages without a reload.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Names for authors who joined after the page loaded.
  useEffect(() => {
    const missing = [...new Set(messages.map((m) => m.author_id))].filter((id) => !people[id])
    if (missing.length === 0) return
    supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', missing)
      .then(({ data }) => {
        if (data) setPeople((prev) => ({ ...prev, ...Object.fromEntries(data.map((p) => [p.id, p])) }))
      })
  }, [messages, people, supabase])

  const visible = messages.filter((m) => Date.parse(m.expires_at) > now)

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [visible.length])

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft('')
    setError(null)
    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, body })
      .select('id, room_id, author_id, body, created_at, expires_at')
      .single()
    if (error) {
      setDraft(body)
      setError('Not sent. Try again.')
      return
    }
    add(data as Message)
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid min-h-[55dvh] content-end gap-4 rounded-xl bg-surface-low p-4 sm:p-6">
        {visible.length === 0 ? <p className="py-16 text-center type-body-lg text-on-surface-variant">The room is empty. Say something.</p> : null}
        <AnimatePresence initial={false}>
          {visible.map((m) => {
            const created = Date.parse(m.created_at)
            const expires = Date.parse(m.expires_at)
            const mine = m.author_id === viewerId
            return (
              <motion.div
                key={m.id}
                layout
                className="grid"
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.6 } }}
                transition={{ duration: 0.35, ease: ease.decelerate }}
                style={{ transformOrigin: mine ? 'bottom right' : 'bottom left' }}
              >
                <MessageLine
                  author={people[m.author_id]?.display_name ?? '…'}
                  body={m.body}
                  time={clock.format(created)}
                  expiresIn={timeLeft(m.expires_at, now)}
                  mine={mine}
                  life={(expires - now) / (expires - created)}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={bottom} />
      </div>

      <form onSubmit={send} className="flex items-end gap-2 rounded-xl bg-surface-high p-2 pl-5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          maxLength={2000}
          placeholder="Write a message"
          aria-label="Message"
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2.5 type-body-lg text-on-surface outline-none placeholder:text-on-surface-variant [field-sizing:content] focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send"
          className="state-layer grid size-12 shrink-0 place-items-center rounded-lg bg-primary text-on-primary transition-opacity disabled:opacity-[0.38]"
        >
          <Icon name="send" filled />
        </button>
      </form>
      {error ? (
        <p role="alert" className="px-2 type-body-md text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
