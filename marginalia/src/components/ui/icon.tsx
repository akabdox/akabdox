import { cn } from '@/lib/cn'

// Material Symbols Rounded. Add new names to the sorted list in app/layout.tsx.
// Google's stylesheet sets display on the glyph class, so layout classes
// (hidden, inline-block...) go on a wrapper where utilities can win.
export function Icon({ name, filled = false, size = 24, className }: { name: string; filled?: boolean; size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn('inline-grid shrink-0 place-items-center leading-none', className)} style={{ width: size, height: size }}>
      <span
        className="material-symbols-rounded"
        style={{ fontSize: size, fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" ${Math.min(Math.max(size, 20), 48)}` }}
      >
        {name}
      </span>
    </span>
  )
}
