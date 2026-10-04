import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <header className="animate-rise flex flex-wrap items-end justify-between gap-x-6 gap-y-4 pb-8">
      <div className="grid gap-2">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="type-display-sm sm:type-display-md">{title}</h1>
        {children ? <div className="max-w-xl type-body-lg text-on-surface-variant">{children}</div> : null}
      </div>
      {action}
    </header>
  )
}
