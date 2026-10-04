import { NavShell, type Dest } from './nav-shell'
import { ThemeToggle } from './theme-toggle'
import { site } from '@/lib/site'
import type { Profile } from '@/lib/types'
import { getDict } from '@/i18n/server'
import { paymentsEnabled } from '@/lib/features'

export async function Nav({ viewer }: { viewer: Profile }) {
  const t = await getDict()
  const shelf = `/u/${viewer.username}`
  const dests: Dest[] = [
    { href: '/feed', label: t.nav.feed, icon: 'dynamic_feed' },
    { href: shelf, label: t.nav.shelf, icon: 'shelves', match: shelf },
    { href: '/market', label: t.nav.market, icon: 'storefront' },
    { href: '/chat', label: t.nav.chat, icon: 'forum' },
  ]
  if (paymentsEnabled) dests.push({ href: '/orders', label: t.nav.orders, icon: 'receipt_long' })
  const admin = viewer.role === 'admin' ? { href: '/admin', label: t.nav.admin, icon: 'admin_panel_settings' } : undefined

  return (
    <NavShell
      dests={dests}
      admin={admin}
      name={viewer.display_name}
      labels={{ settings: t.nav.settings, newPost: t.feed.post, home: site.name }}
      actions={<ThemeToggle labels={{ light: t.theme.light, dark: t.theme.dark }} />}
    />
  )
}
