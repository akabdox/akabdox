'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ease } from '@/lib/motion'

// Remounts on every navigation inside the member area: M3 fade through.
export default function MemberTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: ease.decelerate }}>
      {children}
    </motion.div>
  )
}
