import { cn } from '@/lib/cn'

export function Rule({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn('border-outline-variant', className)} />
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="type-title-sm text-on-surface-variant">{label}</span>
      <span className="h-px flex-1 bg-outline-variant" />
    </div>
  )
}
