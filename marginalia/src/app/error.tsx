'use client'

import { Button } from '@/components/ui/button'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-md content-center justify-items-start gap-5 px-4">
      <p className="eyebrow">Something tore</p>
      <h1 className="text-[32px]">This page did not load.</h1>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
