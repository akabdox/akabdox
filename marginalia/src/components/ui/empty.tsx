import type { ReactNode } from 'react'

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 border border-dashed border-rule-strong px-6 py-14 text-center">
      <p className="text-[17px] font-medium">{title}</p>
      {children ? <div className="max-w-sm text-[14px] text-ink-3">{children}</div> : null}
    </div>
  )
}
