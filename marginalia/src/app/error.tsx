'use client'

import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'

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
    <main className="mx-auto grid min-h-[60dvh] max-w-md content-center justify-items-start gap-5 px-4">
      <p className="eyebrow">{t.eyebrow}</p>
      <h1 className="text-[32px]">{t.title}</h1>
      <Button onClick={reset}>{t.retry}</Button>
    </main>
  )
}
