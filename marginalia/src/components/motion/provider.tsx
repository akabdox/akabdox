'use client'

import { MotionConfig } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

// Respect the visitor's reduced motion setting for every Motion component,
// and reveal icons only once their font has loaded, so a slow or blocked
// font never shows ligature names like "dark_mode" as text.
export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.fonts
      .load('24px "Material Symbols Rounded"', 'home')
      .then((faces) => {
        if (faces.length) document.documentElement.classList.add('icons-ready')
      })
      .catch(() => {})
  }, [])
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
