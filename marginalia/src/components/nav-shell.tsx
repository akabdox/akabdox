'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Icon } from './ui/icon'
import { Monogram } from './ui/monogram'
import { Wordmark } from './wordmark'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/cn'
export type Dest = { href: string; label: string; icon: string; match?: string }

function useActive() {
  const pathname = usePathname()
  return (d: Dest) => pathname === d.href || pathname.startsWith(`${d.match ?? d.href}/`)
}

// Material 3 navigation: a rail from medium widths up, a bar below.
// The rail sits on the inline start, so it moves to the right in Arabic.
export function NavShell({
  dests,
  admin,
  name,
  labels,
  actions,
}: {
  dests: Dest[]
  admin?: Dest
  name: string
  labels: { settings: string; newPost: string; home: string }
  actions: ReactNode
}) {
  const isActive = useActive()
  const railDests = admin ? [...dests, admin] : dests

  return (
    <>
      {/* Top app bar */}
      <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-lg md:ps-24">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/feed" aria-label={labels.home} className="md:hidden">
            <Wordmark />
          </Link>
          <div className="ms-auto flex items-center gap-1">
            {admin ? (
              <Link href={admin.href} aria-label={admin.label} className="state-layer grid size-10 place-items-center rounded-full text-on-surface-variant md:hidden">
                <Icon name={admin.icon} />
              </Link>
            ) : null}
            {actions}
            <Link href="/settings" aria-label={labels.settings} className="state-layer flex items-center gap-3 rounded-full p-1 sm:ps-4">
              <span className="hidden type-label-lg text-on-surface-variant sm:inline">{name}</span>
              <Monogram name={name} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation rail */}
      <nav aria-label="Main" className="fixed inset-y-0 start-0 z-40 hidden w-24 flex-col items-center gap-10 bg-surface pt-5 md:flex">
        <Link href="/feed" aria-label={labels.home}>
          <Wordmark compact />
        </Link>
        <Link
          href="/feed#compose"
          aria-label={labels.newPost}
          title={labels.newPost}
          className="state-layer grid size-14 place-items-center rounded-lg bg-primary-container text-on-primary-container shadow-e2 transition-shadow hover:shadow-e3"
        >
          <Icon name="edit" />
        </Link>
        <ul className="grid gap-3">
          {railDests.map((d) => {
            const active = isActive(d)
            return (
              <li key={d.label}>
                <Link href={d.href} aria-current={active ? 'page' : undefined} className="group grid justify-items-center gap-1 px-3">
                  <span className="relative grid h-8 w-14 place-items-center">
                    {active ? (
                      <motion.span layoutId="rail-pill" transition={{ duration: 0.4, ease: ease.emphasized }} className="absolute inset-0 rounded-full bg-secondary-container" />
                    ) : (
                      <span className="absolute inset-0 rounded-full bg-on-surface opacity-0 transition-opacity group-hover:opacity-[0.08]" />
                    )}
                    <Icon name={d.icon} filled={active} className={cn('relative', active ? 'text-on-secondary-container' : 'text-on-surface-variant')} />
                  </span>
                  <span className={cn('type-label-md', active ? 'text-on-surface' : 'text-on-surface-variant')}>{d.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Navigation bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 bg-surface-container pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid h-20 auto-cols-fr grid-flow-col">
          {dests.map((d) => {
            const active = isActive(d)
            return (
              <li key={d.label}>
                <Link href={d.href} aria-current={active ? 'page' : undefined} className="grid h-full content-center justify-items-center gap-1">
                  <span className="relative grid h-8 w-16 place-items-center">
                    {active ? (
                      <motion.span layoutId="bar-pill" transition={{ duration: 0.4, ease: ease.emphasized }} className="absolute inset-0 rounded-full bg-secondary-container" />
                    ) : null}
                    <Icon name={d.icon} filled={active} className={cn('relative', active ? 'text-on-secondary-container' : 'text-on-surface-variant')} />
                  </span>
                  <span className={cn('type-label-md', active ? 'text-on-surface' : 'text-on-surface-variant')}>{d.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
