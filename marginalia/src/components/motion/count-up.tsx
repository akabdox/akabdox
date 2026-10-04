'use client'

import { animate, useInView } from 'motion/react'
import { useEffect, useRef } from 'react'

// Counts from zero to `to` once, when first visible.
export function CountUp({ to, locale = 'en', className }: { to: number; locale?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })

  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const format = new Intl.NumberFormat(locale)
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.05, 0.7, 0.1, 1],
      onUpdate: (v) => {
        el.textContent = format.format(Math.round(v))
      },
    })
    return () => controls.stop()
  }, [inView, to, locale])

  return (
    <span ref={ref} className={className}>
      {new Intl.NumberFormat(locale).format(to)}
    </span>
  )
}
