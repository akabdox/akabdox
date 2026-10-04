import { site } from '@/lib/site'
import { cn } from '@/lib/cn'

// Latin name set in the brand face, the first letter of فهرسة as a seal.
// Marked lang="en" so the RTL tracking reset leaves the Latin name alone.
export function Wordmark({ compact = false, className }: { compact?: boolean; className?: string }) {
  const seal = (
    <span lang="ar" dir="rtl" className="font-[family-name:var(--font-arabic)] leading-none font-semibold">
      {site.arabic.slice(0, 1)}
    </span>
  )
  if (compact) {
    return <span className={cn('grid size-12 place-items-center rounded-md bg-primary text-[18px] text-on-primary', className)}>{seal}</span>
  }
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="grid size-8 place-items-center rounded-sm bg-primary text-[15px] text-on-primary">{seal}</span>
      <span lang="en" dir="ltr" className="font-[family-name:var(--font-brand)] text-[22px] leading-none tracking-[-0.01em]">
        {site.name}
      </span>
    </span>
  )
}
