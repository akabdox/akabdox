import { cn } from '@/lib/cn'

const sizes = {
  sm: 'w-12 p-1.5 text-[6px]',
  md: 'w-24 p-2.5 text-[9px] sm:w-28',
  lg: 'w-44 p-4 text-[13px]',
}

// Bookcloth jackets drawn from the scheme's tonal roles.
const styles = [
  'bg-primary text-on-primary',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary text-on-tertiary',
  'bg-primary-container text-on-primary-container',
  'bg-inverse-surface text-inverse-on-surface',
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
    <div className={cn('relative aspect-[2/3] shrink-0 overflow-hidden rounded-r-sm rounded-l-[3px] shadow-e2', sizes[size], pick(title + author), className)}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-[6%] bg-black/15" />
      <div className="relative flex h-full flex-col justify-between pl-[6%]">
        <span className="line-clamp-5 font-[family-name:var(--font-brand)] text-[1.35em] leading-[1.1]">{title}</span>
        <span className="line-clamp-2 border-t border-current/30 pt-1 uppercase tracking-[0.1em] opacity-80">{author}</span>
      </div>
      {coverUrl ? <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${coverUrl}")` }} /> : null}
    </div>
  )
}
