'use client'

import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

// Client side, so the copy lives here rather than in the server dictionaries.
const copy = {
  ar: { eyebrow: 'حدث خلل', title: 'لم تُحمَّل هذه الصفحة.', retry: 'حاول مجددًا' },
  fr: { eyebrow: 'Page déchirée', title: 'Cette page ne s’est pas chargée.', retry: 'Réessayer' },
  en: { eyebrow: 'Something tore', title: 'This page did not load.', retry: 'Try again' },
}

const readLang = () => document.documentElement.lang
const noop = () => () => {}

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const lang = useSyncExternalStore(noop, readLang, () => 'en')
  const t = copy[lang as keyof typeof copy] ?? copy.en
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md content-center justify-items-start gap-4 px-4">
      <span className="grid size-14 place-items-center rounded-full bg-error-container text-on-error-container">
        <Icon name="error" />
      </span>
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="type-headline-lg">{t.title}</h1>
      <Button onClick={reset} icon="history" className="mt-2">
        {t.retry}
      </Button>
    </main>
  )
}
