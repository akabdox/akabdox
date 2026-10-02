'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/field'
import type { BookDetails } from '@/lib/isbn'

export type IsbnLabels = { isbn: string; hint: string; lookup: string; lookingUp: string }

// Optional ISBN with a Fill button. Copies found details into the title,
// author and year fields of the same form; the member can still edit them.
export function IsbnField({
  labels,
  lookup,
}: {
  labels: IsbnLabels
  lookup: (isbn: string) => Promise<{ book?: BookDetails; error?: string }>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function fill() {
    const el = input.current
    if (!el?.value.trim()) return
    setMessage(null)
    start(async () => {
      const { book, error } = await lookup(el.value)
      if (!book) return setMessage(error ?? null)
      const set = (name: string, value: string) => {
        const target = el.form?.elements.namedItem(name)
        if (target instanceof HTMLInputElement) target.value = value
      }
      set('title', book.title)
      set('author', book.author)
      if (book.year) set('year', String(book.year))
    })
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor="isbn" className="eyebrow">
        {labels.isbn}
      </label>
      <div className="flex gap-2">
        <Input ref={input} id="isbn" name="isbn" inputMode="numeric" dir="ltr" />
        <Button size="sm" variant="secondary" className="h-11" onClick={fill} disabled={pending}>
          {pending ? labels.lookingUp : labels.lookup}
        </Button>
      </div>
      <span className="text-[13px] text-ink-3" role={message ? 'status' : undefined}>
        {message ?? labels.hint}
      </span>
    </div>
  )
}
