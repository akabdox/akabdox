'use client'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md content-center justify-items-start gap-4 px-4">
      <span className="grid size-14 place-items-center rounded-full bg-error-container text-on-error-container">
        <Icon name="error" />
      </span>
      <p className="eyebrow">Something tore</p>
      <h1 className="type-headline-lg">This page did not load.</h1>
      <Button onClick={reset} icon="history" className="mt-2">
        Try again
      </Button>
    </main>
  )
}
