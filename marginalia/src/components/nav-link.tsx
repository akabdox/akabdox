'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function NavLink({ href, match, className, children }: { href: string; match?: string; className?: string; children: ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${match ?? href}/`)
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'text-[11px] font-medium uppercase tracking-[0.16em] transition-colors',
        active ? 'text-ink' : 'text-ink-3 hover:text-ink',
        className,
      )}
    >
      {children}
    </Link>
  )
}
