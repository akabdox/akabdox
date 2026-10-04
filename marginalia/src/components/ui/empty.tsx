import type { ReactNode } from 'react'
import { Icon } from './icon'

export function Empty({ title, icon = 'auto_stories', children }: { title: string; icon?: string; children?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-xl bg-surface-low px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-secondary-container text-on-secondary-container">
        <Icon name={icon} />
      </span>
      <p className="type-title-lg">{title}</p>
      {children ? <div className="max-w-sm type-body-md text-on-surface-variant">{children}</div> : null}
    </div>
  )
}
