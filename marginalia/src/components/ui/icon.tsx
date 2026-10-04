import { cn } from '@/lib/cn'

// Material Symbols Rounded. Add new names to the sorted list in app/layout.tsx.
export function Icon({ name, filled = false, size = 24, className }: { name: string; filled?: boolean; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('material-symbols-rounded leading-none', className)}
      style={{ fontSize: size, fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" ${Math.min(Math.max(size, 20), 48)}` }}
    >
      {name}
    </span>
  )
}
