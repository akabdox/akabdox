import { Icon } from './icon'
import { cn } from '@/lib/cn'

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center text-primary', className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={16} filled={n <= value} className={n <= value ? '' : 'text-outline-variant'} />
      ))}
    </span>
  )
}
