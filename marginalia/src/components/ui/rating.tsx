import { cn } from '@/lib/cn'

// Five geometric dots. No icon font.
export function Rating({ value, label, className }: { value: number; label: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden
          className={cn('size-2 rounded-full border border-ink', n <= value ? 'bg-ink' : 'bg-transparent')}
        />
      ))}
    </span>
  )
}
