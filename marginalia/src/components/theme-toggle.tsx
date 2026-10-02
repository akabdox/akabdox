'use client'

import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'

type Theme = 'light' | 'dark'

function current(): Theme {
  const picked = document.documentElement.dataset.theme
  if (picked === 'light' || picked === 'dark') return picked
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const listeners = new Set<() => void>()
function subscribe(fn: () => void) {
  listeners.add(fn)
  const media = matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', fn)
  return () => {
    listeners.delete(fn)
    media.removeEventListener('change', fn)
  }
}

// Flips light and dark at once, then saves the choice for the server render.
export function ThemeToggle({ labels, className }: { labels: { light: string; dark: string }; className?: string }) {
  const theme = useSyncExternalStore(subscribe, current, () => 'light' as Theme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'

  function flip() {
    document.documentElement.dataset.theme = next
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`
    listeners.forEach((fn) => fn())
  }

  return (
    <button
      type="button"
      onClick={flip}
      aria-label={next === 'dark' ? labels.dark : labels.light}
      title={next === 'dark' ? labels.dark : labels.light}
      className={cn('grid size-8 place-items-center rounded-full text-ink-2 transition-colors hover:text-ink', className)}
    >
      <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
      </svg>
    </button>
  )
}
