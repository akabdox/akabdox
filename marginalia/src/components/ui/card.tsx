import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

// Material 3 cards: filled (tonal), outlined, elevated.
const variants = {
  filled: 'bg-surface-highest',
  outlined: 'border border-outline-variant bg-surface',
  elevated: 'bg-surface-low shadow-e1',
  tonal: 'bg-surface-low',
}

export function Card({ variant = 'tonal', className, ...props }: ComponentProps<'div'> & { variant?: keyof typeof variants }) {
  return <div className={cn('rounded-md', variants[variant], className)} {...props} />
}
