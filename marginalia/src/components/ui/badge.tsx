import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Monochrome status language: fill, outline, dash, tint.
export type BadgeTone = 'solid' | 'outline' | 'dashed' | 'muted' | 'danger'

const tones: Record<BadgeTone, string> = {
  solid: 'bg-ink text-paper border-ink',
  outline: 'border-ink text-ink',
  dashed: 'border-dashed border-ink-2 text-ink-2',
  muted: 'bg-sunken border-transparent text-ink-2',
  danger: 'border-danger text-danger',
}

export function Badge({
  tone = 'muted',
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-medium uppercase leading-none tracking-[0.14em] whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  )
}
