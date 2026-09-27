import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="grid gap-3 pb-8">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="text-[34px] sm:text-[44px]">{title}</h1>
      {children ? <div className="max-w-xl text-[15px] text-ink-2">{children}</div> : null}
    </header>
  )
}
