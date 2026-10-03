import { cn } from '@/lib/cn'

const sizes = {
  sm: 'w-12 text-[6px] p-1.5',
  md: 'w-28 text-[9px] p-2.5',
  lg: 'w-44 text-[13px] p-4',
}

const styles = [
  'bg-ink text-paper',
  'bg-ink-2 text-paper',
  'bg-surface text-ink border border-ink',
]

function pick(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return styles[Math.abs(h) % styles.length]
}

// A typographic jacket. If a real cover exists it is layered on top as a
// background image; when it fails to load the jacket simply shows through.
export function BookCover({
  title,
  author,
  coverUrl,
  size = 'md',
  className,
}: {
  title: string
  author: string
  coverUrl?: string | null
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative aspect-[2/3] shrink-0 overflow-hidden rounded-[1px] shadow-[0_1px_0_rgba(0,0,0,0.06),0_8px_20px_-12px_rgba(0,0,0,0.45)]',
        sizes[size],
        pick(title + author),
        className,
      )}
    >
      <div className="flex h-full flex-col justify-between">
        <span className="line-clamp-5 font-medium uppercase leading-[1.15] tracking-[0.08em]">{title}</span>
        <span className="border-t border-current/40 pt-1 uppercase tracking-[0.12em] opacity-80 line-clamp-2">{author}</span>
      </div>
      {coverUrl ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${coverUrl}")` }}
        />
      ) : null}
    </div>
  )
}
