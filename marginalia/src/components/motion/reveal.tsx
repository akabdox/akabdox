'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ease } from '@/lib/motion'

// Rises into place the first time it scrolls into view.
export function Reveal({ children, delay = 0, y = 24, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: ease.decelerate, delay }}
    >
      {children}
    </motion.div>
  )
}
