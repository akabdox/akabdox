import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

// Material 3 filled text field: tonal container, active indicator that
// thickens and turns primary on focus.
const control =
  'w-full rounded-t-xs border-0 border-b border-on-surface-variant bg-surface-highest type-body-lg text-on-surface placeholder:text-on-surface-variant/70 outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:bg-[color-mix(in_srgb,var(--md-on-surface)_8%,var(--md-surface-container-highest))] focus:border-primary focus:shadow-[inset_0_-1px_0_var(--md-primary)] focus-visible:outline-none'

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
      <span className="type-label-lg text-on-surface-variant">{label}</span>
      {children}
      {hint ? <span className="type-body-sm text-on-surface-variant">{hint}</span> : null}
    </label>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-14 px-4', className)} {...props} />
}

export function Textarea({ className, rows = 4, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(control, 'resize-y px-4 py-4', className)} {...props} />
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <select className={cn(control, 'select-chevron h-14 appearance-none ps-4 pe-11', className)} {...props}>
      {children}
    </select>
  )
}

export function Checkbox({ label, className, ...props }: ComponentProps<'input'> & { label: string }) {
  return (
    <label className={cn('inline-flex min-h-10 cursor-pointer items-center gap-3 type-body-lg text-on-surface', className)}>
      <input type="checkbox" className="size-[18px] rounded-[2px] accent-[var(--md-primary)]" {...props} />
      {label}
    </label>
  )
}

// M3 segmented button. Pure CSS state via :has.
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
    <div className="inline-flex h-10 w-fit max-w-full overflow-hidden rounded-full border border-outline" role="radiogroup">
      {options.map((o) => (
        <label
          key={o.value}
          className="state-layer flex cursor-pointer items-center gap-2 border-s border-outline px-4 type-label-lg text-on-surface first:border-s-0 has-[:checked]:bg-secondary-container has-[:checked]:text-on-secondary-container has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-secondary sm:px-5"
        >
          <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="peer sr-only" />
          <span aria-hidden className="hidden peer-checked:inline-grid">
            <span className="material-symbols-rounded text-[18px]">check</span>
          </span>
          {o.label}
        </label>
      ))}
    </div>
  )
}
