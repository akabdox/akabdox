import Link from 'next/link'
import type { ReactNode } from 'react'
import { Wordmark } from '@/components/wordmark'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-container px-4 py-12">
      <div className="grid w-full max-w-md gap-8">
        <Link href="/" className="justify-self-center">
          <Wordmark />
        </Link>
        <div className="animate-rise grid gap-8 rounded-xl bg-surface p-6 shadow-e1 sm:p-10">{children}</div>
      </div>
    </main>
  )
}
