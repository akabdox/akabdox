import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { Fraunces, IBM_Plex_Sans_Arabic, Roboto_Flex } from 'next/font/google'
import { MotionProvider } from '@/components/motion/provider'
import { site, siteUrl } from '@/lib/site'
import { dirOf } from '@/i18n/config'
import { getI18n } from '@/i18n/server'
import './globals.css'

// Material 3 pairing: Roboto Flex is the plain face, Fraunces the brand face
// for display and headline roles. Neither has Arabic glyphs, so Arabic text
// falls through to IBM Plex Sans Arabic, letter by letter.
const plain = Roboto_Flex({ subsets: ['latin', 'latin-ext'], variable: '--font-plain', display: 'swap' })
const brand = Fraunces({ subsets: ['latin', 'latin-ext'], axes: ['opsz', 'SOFT'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' })
const arabic = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600'], variable: '--font-arabic', display: 'swap' })

// Material Symbols, subset to the icons the app uses. Keep the list sorted.
const icons = [
  'add', 'admin_panel_settings', 'arrow_back', 'arrow_forward', 'auto_delete', 'auto_stories', 'bookmark', 'chat',
  'check', 'check_circle', 'chevron_right', 'close', 'content_copy', 'dark_mode', 'delete', 'dynamic_feed', 'edit',
  'error', 'expand_more', 'forum', 'group', 'history', 'info', 'inventory_2', 'language', 'light_mode', 'link',
  'local_shipping', 'lock', 'logout', 'mail', 'menu_book', 'payments', 'person', 'receipt_long', 'schedule', 'search',
  'sell', 'send', 'settings', 'shelves', 'star', 'storefront', 'swap_horiz', 'timer', 'verified',
]
const symbolsHref = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${icons.join(',')}&display=block`

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getI18n()
  const title = `${site.name} · ${t.meta.tagline}`
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${site.name}` },
    description: t.landing.body,
    applicationName: site.name,
    keywords: ['Fahrasa', 'فهرسة', 'books', 'كتب', 'livres', 'Algeria', 'الجزائر', 'Algérie', 'book swap', 'تبادل الكتب', 'bouquiniste', 'readers'],
    openGraph: {
      type: 'website',
      siteName: site.name,
      title,
      description: t.landing.body,
      locale: { ar: 'ar_DZ', fr: 'fr_DZ', en: 'en_US' }[locale],
    },
    twitter: { card: 'summary_large_image', title, description: t.landing.body },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5fbf5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1512' },
  ],
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale } = await getI18n()
  const theme = (await cookies()).get('theme')?.value
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-theme={theme === 'light' || theme === 'dark' ? theme : undefined}
      className={`${plain.variable} ${brand.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={symbolsHref} />
      </head>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  )
}
