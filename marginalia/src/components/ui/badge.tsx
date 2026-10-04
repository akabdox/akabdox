import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Status chips. Form still carries meaning (fill, outline, dash, tint),
// colour reinforces it.
export type BadgeTone = 'solid' | 'outline' | 'dashed' | 'muted' | 'danger'

const tones: Record<BadgeTone, string> = {
  solid: 'bg-primary text-on-primary border-primary',
  outline: 'border-outline text-on-surface',
  dashed: 'border-dashed border-tertiary text-tertiary',
  muted: 'bg-surface-highest border-transparent text-on-surface-variant',
  danger: 'bg-error-container border-transparent text-on-error-container',
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
        'inline-flex h-7 w-fit items-center gap-1.5 whitespace-nowrap rounded-sm border px-3 type-label-md',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-2 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  )
}
