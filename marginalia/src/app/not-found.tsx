import { ButtonLink } from '@/components/ui/button'
import { getDict } from '@/i18n/server'

export default async function NotFound() {
  const t = await getDict()
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md content-center justify-items-start gap-4 px-4">
      <p className="type-display-lg text-primary">404</p>
      <h1 className="type-headline-lg">{t.pages.notFoundTitle}</h1>
      <ButtonLink href="/feed" variant="tonal" icon="arrow_back" className="mt-2">
        {t.pages.backToFeed}
      </ButtonLink>
    </main>
  )
}
