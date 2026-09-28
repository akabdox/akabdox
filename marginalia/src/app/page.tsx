import type { CSSProperties } from 'react'
import { redirect } from 'next/navigation'
import { ButtonLink } from '@/components/ui/button'
import { getViewer } from '@/lib/viewer'
import { site } from '@/lib/site'
import { cn } from '@/lib/cn'

const spines = [
  ['Nedjma', 'h-44', 'bg-ink text-paper'],
  ['The Stranger', 'h-36', 'bg-ink-2 text-paper'],
  ['Invisible Cities', 'h-52', 'border border-ink'],
  ['Stoner', 'h-32', 'bg-ink text-paper'],
  ['The Big House', 'h-40', 'border border-ink'],
  ['Season of Migration', 'h-52', 'bg-ink-2 text-paper'],
  ['Ficciones', 'h-36', 'bg-ink text-paper'],
  ['The Plague', 'h-44', 'border border-ink'],
  ['Palace Walk', 'h-40', 'bg-ink text-paper'],
  ['Pedro Páramo', 'h-32', 'bg-ink-2 text-paper'],
  ['Things Fall Apart', 'h-48', 'border border-ink'],
  ['Solaris', 'h-36', 'bg-ink text-paper'],
] as const

export default async function Home() {
  if (await getViewer()) redirect('/feed')

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="text-[15px] font-medium uppercase tracking-[0.28em]">{site.name}</span>
        <ButtonLink href="/login" variant="ghost">
          Sign in
        </ButtonLink>
      </header>

      <section className="mx-auto grid w-full max-w-5xl flex-1 content-center gap-7 px-4 py-12 sm:px-6">
        <p className="eyebrow animate-rise">By invitation · 1,000 seats</p>
        <h1 className="animate-rise max-w-3xl text-[40px] font-medium uppercase leading-[1.02] tracking-[0.04em] sm:text-[64px]" style={{ '--i': 1 } as CSSProperties}>
          A private library of a thousand readers.
        </h1>
        <p className="animate-rise max-w-md text-[17px] text-ink-2" style={{ '--i': 2 } as CSSProperties}>
          Share what you are reading. Keep a shelf of what you own. Swap it, sell it, talk about it, and let the
          conversation fade by morning.
        </p>
        <div className="animate-rise flex flex-wrap gap-3" style={{ '--i': 3 } as CSSProperties}>
          <ButtonLink href="/login">Member sign in</ButtonLink>
        </div>
      </section>

      <div aria-hidden className="overflow-hidden border-b border-ink">
        <div className="mx-auto flex max-w-5xl items-end gap-1.5 px-4 sm:px-6">
          {spines.map(([title, height, style], i) => (
            <div
              key={title}
              className={cn('animate-rise flex w-11 shrink-0 items-center justify-center rounded-t-[2px] sm:w-14', height, style)}
              style={{ '--i': i + 4 } as CSSProperties}
            >
              <span className="rotate-180 text-[10px] font-medium uppercase tracking-[0.2em] [font-variant-ligatures:none] [writing-mode:vertical-rl]">{title}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
