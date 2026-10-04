'use client'

import { animate, useInView } from 'motion/react'
import { useEffect, useRef } from 'react'

// Counts from zero to `to` once, when first visible.
export function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })

  useEffect(() => {
    if (!inView || !ref.current) return
    const el = ref.current
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.05, 0.7, 0.1, 1],
      onUpdate: (v) => {
        el.textContent = Math.round(v).toLocaleString('en-US')
      },
    })
    return () => controls.stop()
  }, [inView, to])

  return (
    <span ref={ref} className={className}>
      {to.toLocaleString('en-US')}
    </span>
  )
}
