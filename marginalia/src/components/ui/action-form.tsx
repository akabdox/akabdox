'use client'

import { useActionState, type ReactNode } from 'react'
import type { ActionState } from '@/lib/form'
import { cn } from '@/lib/cn'

// Wraps a server action so its returned error or confirmation shows inline.
export function ActionForm({
  action,
  className,
  children,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>
  className?: string
  children: ReactNode
}) {
  const [state, formAction] = useActionState(action, null)
  return (
    <form action={formAction} className={cn('grid gap-4', className)}>
      {children}
      {state?.error ? (
        <p role="alert" className="type-body-md text-error">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="type-body-md text-primary">
          {state.ok}
        </p>
      ) : null}
    </form>
  )
}
