'use client'

import { motion } from 'motion/react'
import { ease } from '@/lib/motion'
import { cn } from '@/lib/cn'

const lines = [
  { who: 'Amel', text: 'Finished Nedjma on the train. The ending wrecked me.', mine: false, life: 0.3 },
  { who: 'You', text: 'Told you. Want my copy of Le Polygone étoilé next?', mine: true, life: 0.55 },
  { who: 'Amel', text: 'Yes. Swap for my Mahfouz?', mine: false, life: 0.8 },
  { who: 'You', text: 'Deal. Friday at the café.', mine: true, life: 1 },
]

// Older messages are fainter: ink fading as the timer runs out.
export function ChatDemo() {
  return (
    <div aria-hidden className="grid gap-2.5">
      {lines.map((l, i) => (
        <motion.div
          key={l.text}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          whileInView={{ opacity: 0.25 + 0.75 * l.life, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: ease.decelerate, delay: 0.15 + i * 0.25 }}
          className={cn('max-w-[85%] rounded-[20px] px-4 py-2.5 type-body-md', l.mine ? 'justify-self-end rounded-br-xs bg-primary text-on-primary' : 'justify-self-start rounded-bl-xs bg-surface-lowest text-on-surface')}
        >
          {l.text}
        </motion.div>
      ))}
    </div>
  )
}
