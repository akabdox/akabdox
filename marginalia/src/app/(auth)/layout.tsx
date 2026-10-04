import Link from 'next/link'
import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Wordmark } from '@/components/wordmark'
import { getDict } from '@/i18n/server'
import { site } from '@/lib/site'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getDict()
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-container px-4 py-12">
      <div className="grid w-full max-w-md gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" aria-label={site.name}>
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle labels={{ light: t.theme.light, dark: t.theme.dark }} />
          </div>
        </div>
        <div className="animate-rise grid gap-8 rounded-xl bg-surface p-6 shadow-e1 sm:p-10">{children}</div>
      </div>
    </main>
  )
}
