'use client'

import { useSyncExternalStore } from 'react'
import { Icon } from './ui/icon'
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
      className={cn('state-layer grid size-10 place-items-center rounded-full text-on-surface-variant', className)}
    >
      <Icon name={next === 'dark' ? 'dark_mode' : 'light_mode'} />
    </button>
  )
}
