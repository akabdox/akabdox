import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-[2px] border border-rule bg-surface text-[15px] text-ink placeholder:text-ink-3 outline-none transition-colors hover:border-rule-strong focus:border-ink'

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn('grid gap-1.5', className)}>
      <span className="eyebrow">{label}</span>
      {children}
      {hint ? <span className="text-[13px] text-ink-3">{hint}</span> : null}
    </label>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11 px-3', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(control, 'resize-y px-3 py-2.5 leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(control, 'select-chevron h-11 appearance-none ps-3 pe-9', className)} {...props}>
      {children}
    </select>
  )
}

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-2', className)}>
      <input type="checkbox" className="size-4 accent-ink" {...props} />
      {label}
    </label>
  )
}

// Segmented radio group, e.g. post kind. Pure CSS state via :has.
export function Segmented({
  name,
  options,
  defaultValue,
}: {
  name: string
  options: { value: string; label: string }[]
  defaultValue: string
}) {
  return (
    <div className="inline-flex rounded-[2px] border border-rule p-0.5" role="radiogroup">
      {options.map((o) => (
        <label
          key={o.value}
          className="cursor-pointer rounded-[1px] px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink has-[:checked]:bg-ink has-[:checked]:text-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink"
        >
          <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="sr-only" />
          {o.label}
        </label>
      ))}
    </div>
  )
}
