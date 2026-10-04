import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { getDict } from '@/i18n/server'
import { signIn } from '../actions'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).auth.signIn, alternates: { canonical: '/login' } }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const t = await getDict()
  return (
    <>
      <div className="grid gap-2">
        <h1 className="type-headline-lg">{t.auth.loginTitle}</h1>
        <p className="type-body-lg text-on-surface-variant">{t.auth.loginBody}</p>
      </div>
      <ActionForm action={signIn}>
        <input type="hidden" name="next" value={next ?? '/feed'} />
        <Field label={t.auth.email}>
          <Input name="email" type="email" autoComplete="email" required dir="ltr" />
        </Field>
        <Field label={t.auth.password}>
          <Input name="password" type="password" autoComplete="current-password" required dir="ltr" />
        </Field>
        <SubmitButton pendingLabel={t.auth.signingIn} className="mt-2 w-full">
          {t.auth.signIn}
        </SubmitButton>
      </ActionForm>
      <p className="type-body-md text-on-surface-variant">
        {t.auth.noAccount}{' '}
        <Link href="/join" className="font-medium text-primary underline underline-offset-4">
          {t.auth.joinLink}
        </Link>
      </p>
    </>
  )
}
