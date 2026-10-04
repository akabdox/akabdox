import { cn } from '@/lib/cn'

const sizes = { sm: 'size-8 type-label-lg', md: 'size-10 type-title-md', lg: 'size-20 text-[32px]' }

const tones = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
]

function pick(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return tones[Math.abs(h) % tones.length]
}

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
    <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-medium', sizes[size], pick(name), className)}>
      {initial}
    </span>
  )
}
