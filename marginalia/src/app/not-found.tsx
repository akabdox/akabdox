import { ButtonLink } from '@/components/ui/button'
import { getDict } from '@/i18n/server'

export default async function NotFound() {
  const t = await getDict()
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-md content-center justify-items-start gap-5 px-4">
      <p className="eyebrow">404</p>
      <h1 className="text-[32px]">{t.pages.notFoundTitle}</h1>
      <ButtonLink href="/feed" variant="secondary">
        {t.pages.backToFeed}
      </ButtonLink>
    </main>
  )
}
