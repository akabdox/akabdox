import { ButtonLink } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md content-center justify-items-start gap-4 px-4">
      <p className="type-display-lg text-primary">404</p>
      <h1 className="type-headline-lg">Not on any shelf.</h1>
      <ButtonLink href="/feed" variant="tonal" icon="arrow_back" className="mt-2">
        Back to the feed
      </ButtonLink>
    </main>
  )
}
