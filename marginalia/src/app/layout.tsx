import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Inter } from 'next/font/google'
import { site } from '@/lib/site'
import { dirOf } from '@/i18n/config'
import { getI18n } from '@/i18n/server'
import './globals.css'

// Inter for Latin script. Inter has no Arabic glyphs, so the browser falls
// through to IBM Plex Sans Arabic for Arabic text, letter by letter.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600'],
  variable: '--font-arabic',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    title: { default: site.name, template: `%s · ${site.name}` },
    description: t.meta.tagline,
    robots: { index: false, follow: false },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f2' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1c' },
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
      className={`${inter.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
