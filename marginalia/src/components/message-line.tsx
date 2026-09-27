import { cn } from '@/lib/cn'

// One chat message. `life` runs 1 -> 0 as the message nears expiry:
// the text fades like ink in the last quarter of its life.
export function MessageLine({
  author,
  body,
  time,
  expiresIn,
  mine,
  life = 1,
}: {
  author: string
  body: string
  time: string
  expiresIn: string
  mine: boolean
  life?: number
}) {
  const opacity = life > 0.25 ? 1 : 0.35 + 0.65 * (life / 0.25)
  return (
    <div className={cn('grid max-w-[85%] gap-1', mine ? 'justify-self-end justify-items-end' : 'justify-items-start')} style={{ opacity }}>
      <p className="flex gap-2 text-[11px] text-ink-3">
        {!mine ? <span className="font-medium text-ink-2">{author}</span> : null}
        <span>{time}</span>
        <span aria-label={`disappears in ${expiresIn}`}>· {expiresIn}</span>
      </p>
      <p
        className={cn(
          'whitespace-pre-line rounded-[2px] px-3.5 py-2 text-[15px] leading-relaxed',
          mine ? 'bg-ink text-paper' : 'border border-rule bg-surface',
        )}
      >
        {body}
      </p>
    </div>
  )
}
