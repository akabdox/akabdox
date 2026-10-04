import { site } from '@/lib/site'
import { cn } from '@/lib/cn'

// Latin name set in the brand face, the Arabic فهرسة as a seal beside it.
export function Wordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <span className={cn('grid size-12 place-items-center rounded-md bg-primary text-on-primary', className)}>
        <span lang="ar" dir="rtl" className="font-[family-name:var(--font-arabic)] text-[15px] leading-none font-bold">
          {site.arabic.slice(0, 1)}
        </span>
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-sm bg-primary text-on-primary">
        <span lang="ar" dir="rtl" className="font-[family-name:var(--font-arabic)] text-[13px] leading-none font-bold">
          {site.arabic.slice(0, 1)}
        </span>
      </span>
      <span className="font-[family-name:var(--font-brand)] text-[22px] leading-none tracking-[-0.01em]">{site.name}</span>
    </span>
  )
}
