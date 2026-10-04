'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { ease } from '@/lib/motion'

type Piece = { node: ReactNode; className: string; rotate?: number; depth?: number }

// The hero's covers and cards deal themselves in, lift on hover, and drift
// at different speeds as the page scrolls.
export function HeroStage({ pieces }: { pieces: Piece[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const near = useTransform(scrollYProgress, [0, 1], [0, -120])
  const far = useTransform(scrollYProgress, [0, 1], [0, -40])

  return (
    <div ref={ref} aria-hidden className="relative mx-auto h-[420px] w-full max-w-[420px] sm:h-[480px]">
      <div className="absolute inset-10 rounded-full bg-primary-container/70 blur-3xl" />
      {pieces.map((p, i) => (
        <motion.div key={i} style={{ y: (p.depth ?? 0) > 0 ? near : far }} className={p.className}>
          <motion.div
            initial={{ opacity: 0, y: 80, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: p.rotate ?? 0 }}
            transition={{ duration: 0.9, ease: ease.emphasized, delay: 0.3 + i * 0.1 }}
            whileHover={{ y: -12, rotate: (p.rotate ?? 0) * 0.4, scale: 1.03, transition: { duration: 0.3, ease: ease.emphasized } }}
          >
            {p.node}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
