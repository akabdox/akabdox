import { cn } from '@/lib/cn'

const sizes = { sm: 'size-7 text-[11px]', md: 'size-10 text-[14px]', lg: 'size-16 text-[22px]' }

// Typographic avatar: no uploads, no storage bill, always on brand.
export function Monogram({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: keyof typeof sizes
  className?: string
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-ink font-medium text-ink',
        sizes[size],
        className,
      )}
    >
      {initial}
    </span>
  )
}
