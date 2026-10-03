import Link from 'next/link'
import type { ReactNode } from 'react'
import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { getDict } from '@/i18n/server'
import { site } from '@/lib/site'

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const t = await getDict()
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-sm content-center gap-10 px-4 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" lang="en" className="text-[15px] font-medium uppercase tracking-[0.28em]">
          {site.name}
        </Link>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle labels={{ light: t.theme.light, dark: t.theme.dark }} />
        </div>
      </div>
      {children}
    </main>
  )
}
