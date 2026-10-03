import Link from 'next/link'
import { NavLink } from './nav-link'
import { ThemeToggle } from './theme-toggle'
import { Monogram } from './ui/monogram'
import { site } from '@/lib/site'
import type { Profile } from '@/lib/types'
import { getDict } from '@/i18n/server'
import { paymentsEnabled } from '@/lib/features'

export async function Nav({ viewer }: { viewer: Profile }) {
  const t = await getDict()
  const shelf = `/u/${viewer.username}`
  const links = [
    { href: '/feed', label: t.nav.feed },
    { href: shelf, label: t.nav.shelf, match: shelf },
    { href: '/market', label: t.nav.market },
    { href: '/chat', label: t.nav.chat },
  ]

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-4 sm:px-6">
          <Link href="/feed" lang="en" className="text-[15px] font-medium uppercase tracking-[0.28em]">
            {site.name}
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} match={l.match}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="ms-auto flex items-center gap-6">
            {viewer.role === 'admin' ? (
              <NavLink href="/admin" className="hidden md:inline">
                {t.nav.admin}
              </NavLink>
            ) : null}
            {paymentsEnabled ? (
              <NavLink href="/orders" className="hidden md:inline">
                {t.nav.orders}
              </NavLink>
            ) : null}
            <ThemeToggle labels={{ light: t.theme.light, dark: t.theme.dark }} />
            <Link href="/settings" aria-label={t.nav.settings}>
              <Monogram name={viewer.display_name} size="sm" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile: thumb-reach tab bar. */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid h-14 grid-cols-4">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} match={l.match} className="grid place-items-center">
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
