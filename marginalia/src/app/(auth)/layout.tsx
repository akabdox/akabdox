import Link from 'next/link'
import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { site } from '@/lib/site'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-sm content-center gap-10 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" lang="en" className="text-[15px] font-medium uppercase tracking-[0.28em]">
          {site.name}
        </Link>
        <LanguageSwitcher />
      </div>
      {children}
    </main>
  )
}
