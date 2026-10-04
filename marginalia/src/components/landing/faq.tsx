'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/cn'

// M3 style expandable list. One open at a time.
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <ul className="grid gap-2">
      {items.map((item, i) => {
        const expanded = open === i
        return (
          <li key={item.q} className={cn('overflow-hidden rounded-lg transition-colors duration-300', expanded ? 'bg-surface-high' : 'bg-surface-low')}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : i)}
              className="state-layer flex w-full items-center gap-4 rounded-lg px-5 py-5 text-left sm:px-6"
            >
              <span className="flex-1 type-title-md">{item.q}</span>
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3, ease: ease.emphasized }} className="grid text-on-surface-variant">
                <Icon name="expand_more" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  key="a"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: ease.emphasized }}
                >
                  <p className="max-w-2xl px-5 pb-6 type-body-lg text-on-surface-variant sm:px-6">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
