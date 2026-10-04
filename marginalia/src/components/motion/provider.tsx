'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

// Respect the visitor's reduced motion setting for every Motion component.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
