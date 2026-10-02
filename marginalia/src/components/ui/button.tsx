import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] font-medium uppercase tracking-[0.14em] transition-[background-color,color,border-color,opacity,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-40'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-85',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-ink-2 hover:text-ink',
  danger: 'border border-rule-strong text-danger hover:border-danger',
  // For use on an ink background.
  inverse: 'bg-paper text-ink hover:opacity-90',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[10.5px]',
  md: 'h-11 px-5 text-[11.5px]',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], variant === 'ghost' ? 'px-0 h-auto' : sizes[size], className)
}

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size }

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size }

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />
}
