import { cn } from '@/lib/cn'

export function Rule({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn('border-rule', className)} />
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className="eyebrow">{label}</span>
      <span className="h-px flex-1 bg-rule" />
    </div>
  )
}
