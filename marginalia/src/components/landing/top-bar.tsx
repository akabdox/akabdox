'use client'

import Link from 'next/link'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { ButtonLink } from '@/components/ui/button'
import { Wordmark } from '@/components/wordmark'
import { cn } from '@/lib/cn'

const links = [
  { href: '#how', label: 'How it works' },
  { href: '#market', label: 'Market' },
  { href: '#faq', label: 'Questions' },
]

// M3 top app bar: flat at rest, tonal container once content scrolls under it.
export function TopBar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 8))

  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300', scrolled ? 'bg-surface-container/90 shadow-e1 backdrop-blur-lg' : 'bg-transparent')}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Fahrasah home">
          <Wordmark />
        </Link>
        <ul className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="state-layer rounded-full px-4 py-2.5 type-label-lg text-on-surface-variant hover:text-on-surface">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" className="hidden sm:inline-flex">
            Sign in
          </ButtonLink>
          <ButtonLink href="/join">Claim your seat</ButtonLink>
        </div>
      </nav>
    </header>
  )
}
