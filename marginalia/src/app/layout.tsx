import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Noto_Kufi_Arabic, Roboto_Flex } from 'next/font/google'
import { MotionProvider } from '@/components/motion/provider'
import { site } from '@/lib/site'
import './globals.css'

// Material 3 pairing: Roboto Flex is the plain face, Fraunces the brand face
// for display and headline roles. Noto Kufi Arabic only draws the wordmark.
const plain = Roboto_Flex({ subsets: ['latin'], variable: '--font-plain', display: 'swap' })
const brand = Fraunces({ subsets: ['latin'], axes: ['opsz', 'SOFT'], style: ['normal', 'italic'], variable: '--font-display', display: 'swap' })
const kufi = Noto_Kufi_Arabic({ subsets: ['arabic'], weight: ['500', '700'], variable: '--font-kufi', display: 'swap' })

// Material Symbols, subset to the icons the app uses. Keep the list sorted.
const icons = [
  'add', 'admin_panel_settings', 'arrow_back', 'arrow_forward', 'auto_delete', 'auto_stories', 'bookmark', 'chat',
  'check', 'check_circle', 'chevron_right', 'close', 'content_copy', 'delete', 'dynamic_feed', 'edit', 'error',
  'expand_more', 'forum', 'group', 'history', 'info', 'inventory_2', 'link', 'local_shipping', 'lock', 'logout',
  'mail', 'menu_book', 'payments', 'person', 'receipt_long', 'schedule', 'search', 'sell', 'send', 'settings',
  'shelves', 'star', 'storefront', 'swap_horiz', 'timer', 'verified',
]
const symbolsHref = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${icons.join(',')}&display=block`

export const metadata: Metadata = {
  title: { default: `${site.name}, ${site.tagline}`, template: `%s · ${site.name}` },
  description: 'An invite only community for readers in Algeria. Share what you read, keep a shelf of what you own, and swap or sell books to each other.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5fbf5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1512' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plain.variable} ${brand.variable} ${kufi.variable}`}>
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
