'use client'

import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { BookCover } from '@/components/ui/book-cover'
import { ease } from '@/lib/motion'

const books = [
  { title: 'Nedjma', author: 'Kateb Yacine', x: -150, y: 40, r: -14 },
  { title: 'Season of Migration to the North', author: 'Tayeb Salih', x: -55, y: 4, r: -5 },
  { title: 'The Stranger', author: 'Albert Camus', x: 45, y: -8, r: 4 },
  { title: 'Palace Walk', author: 'Naguib Mahfouz', x: 140, y: 30, r: 13 },
]

// A fan of jackets that deals itself in, lifts on hover and drifts on scroll.
export function HeroCovers() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], [0, -80])
  const spread = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  return (
    <div ref={ref} aria-hidden className="relative mx-auto grid h-[300px] w-full max-w-[460px] place-items-center sm:h-[420px]">
      <div className="absolute inset-8 rounded-full bg-primary-container/60 blur-3xl" />
      <motion.div style={{ y: drift, scale: spread }} className="relative h-full w-full origin-center">
        <div className="absolute inset-0 scale-[0.68] sm:scale-100">
        {books.map((b, i) => (
          <motion.div
            key={b.title}
            className="absolute top-1/2 left-1/2 -mt-[132px] -ml-[88px] sm:-mt-[132px]"
            initial={{ opacity: 0, y: 120, rotate: 0, x: 0 }}
            animate={{ opacity: 1, y: b.y, rotate: b.r, x: b.x }}
            transition={{ duration: 0.9, ease: ease.emphasized, delay: 0.35 + i * 0.09 }}
            whileHover={{ y: b.y - 24, rotate: b.r * 0.4, scale: 1.04, zIndex: 10, transition: { duration: 0.3, ease: ease.emphasized } }}
          >
            <BookCover title={b.title} author={b.author} size="lg" />
          </motion.div>
        ))}
        </div>
      </motion.div>
    </div>
  )
}
