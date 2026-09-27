import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Jost } from 'next/font/google'
import { site } from '@/lib/site'
import './globals.css'

// Jost is the open-source Futura revival. It loads only as the fallback:
// devices with Futura (or an Adobe Fonts futura-pt kit) render Futura itself.
const jost = Jost({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-jost',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f2' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1c' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={jost.variable}>
      <body>{children}</body>
    </html>
  )
}
