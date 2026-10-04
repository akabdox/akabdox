'use client'

import Link from 'next/link'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { Wordmark } from '@/components/wordmark'
import { cn } from '@/lib/cn'

// M3 top app bar: flat at rest, tonal container once content scrolls under it.
// The join button never leaves the screen.
export function TopBar({
  home,
  links,
  signIn,
  join,
  tools,
}: {
  home: string
  links: { href: string; label: string }[]
  signIn: string
  join: string
  tools: ReactNode
}) {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8))

  return (
    <header className={cn('sticky top-0 z-50 transition-[background-color,box-shadow] duration-300', scrolled ? 'bg-surface-container/90 shadow-e1 backdrop-blur-lg' : 'bg-surface')}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={home}>
          <Wordmark />
        </Link>
        <ul className="ms-4 hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="state-layer rounded-full px-4 py-2.5 type-label-lg whitespace-nowrap text-on-surface-variant">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          {tools}
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
            {signIn}
          </ButtonLink>
          <ButtonLink href="/join">{join}</ButtonLink>
        </div>
      </nav>
    </header>
  )
}
