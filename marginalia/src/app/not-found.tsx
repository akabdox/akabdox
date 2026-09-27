import { ButtonLink } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-md content-center justify-items-start gap-5 px-4">
      <p className="eyebrow">404</p>
      <h1 className="text-[32px]">Not on any shelf.</h1>
      <ButtonLink href="/feed" variant="secondary">
        Back to the feed
      </ButtonLink>
    </main>
  )
}
