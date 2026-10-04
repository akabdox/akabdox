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
    <div className={cn('grid max-w-[85%] gap-1 sm:max-w-[70%]', mine ? 'justify-self-end justify-items-end' : 'justify-items-start')} style={{ opacity }}>
      <p className="flex gap-2 px-1 type-label-sm text-on-surface-variant">
        {!mine ? <span className="text-on-surface">{author}</span> : null}
        <span>{time}</span>
        <span aria-label={`disappears in ${expiresIn}`}>· {expiresIn}</span>
      </p>
      <p
        className={cn(
          'rounded-[20px] px-4 py-2.5 type-body-lg whitespace-pre-line',
          mine ? 'rounded-br-xs bg-primary text-on-primary' : 'rounded-bl-xs bg-surface-high text-on-surface',
        )}
      >
        {body}
      </p>
    </div>
  )
}
