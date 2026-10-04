import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { Icon } from './icon'
import { cn } from '@/lib/cn'

// Material 3 common buttons. `primary` is filled, `secondary` outlined,
// `ghost` text. `tonal` and `elevated` complete the set.
type Variant = 'primary' | 'tonal' | 'secondary' | 'elevated' | 'ghost' | 'danger' | 'inverse'
type Size = 'sm' | 'md' | 'lg'

const base =
  'state-layer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full type-label-lg transition-[box-shadow,background-color,color,transform] duration-200 ease-[var(--ease-standard)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-[0.38]'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:shadow-e1',
  tonal: 'bg-secondary-container text-on-secondary-container hover:shadow-e1',
  secondary: 'border border-outline text-primary',
  elevated: 'bg-surface-low text-primary shadow-e1 hover:shadow-e2',
  ghost: 'text-primary',
  danger: 'border border-outline text-error',
  // For use on a primary background.
  inverse: 'bg-on-primary text-primary hover:shadow-e1',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-4 type-label-md',
  md: 'h-10 px-6',
  lg: 'h-14 px-8 type-title-md',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], variant === 'ghost' && 'px-3', className)
}

// Arrows point the reading way in Arabic.
const directional = new Set(['arrow_forward', 'arrow_back', 'chevron_right'])

function Content({ icon, iconEnd, children }: { icon?: string; iconEnd?: string; children: ReactNode }) {
  return (
    <>
      {icon ? <Icon name={icon} size={18} className="-ms-1" /> : null}
      {children}
      {iconEnd ? <Icon name={iconEnd} size={18} className={cn('-me-1', directional.has(iconEnd) && 'flip-rtl')} /> : null}
    </>
  )
}

type Extra = { variant?: Variant; size?: Size; icon?: string; iconEnd?: string }

export function Button({ variant, size, icon, iconEnd, className, type = 'button', children, ...props }: ComponentProps<'button'> & Extra) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...props}>
      <Content icon={icon} iconEnd={iconEnd}>
        {children}
      </Content>
    </button>
  )
}

export function ButtonLink({ variant, size, icon, iconEnd, className, children, ...props }: ComponentProps<typeof Link> & Extra) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      <Content icon={icon} iconEnd={iconEnd}>
        {children}
      </Content>
    </Link>
  )
}

// M3 standard icon button.
export function IconButton({ icon, label, className, ...props }: ComponentProps<'button'> & { icon: string; label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('state-layer grid size-10 place-items-center rounded-full text-on-surface-variant', className)} {...props}>
      <Icon name={icon} />
    </button>
  )
}
