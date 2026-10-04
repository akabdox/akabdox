import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { getDict } from '@/i18n/server'
import { signUp } from '../actions'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).auth.joinLink, alternates: { canonical: '/join' } }
}

// Open to anyone. The founder email becomes admin on sign up.
export default async function JoinPage() {
  const t = await getDict()
  return (
    <>
      <div className="grid gap-2">
        <h1 className="type-headline-lg">{t.auth.joinTitle}</h1>
        <p className="type-body-lg text-on-surface-variant">{t.auth.joinBody}</p>
      </div>
      <ActionForm action={signUp}>
        <Field label={t.auth.username} hint={t.auth.usernameHint}>
          <Input name="username" required pattern="[A-Za-z0-9_]{3,24}" autoComplete="username" dir="ltr" />
        </Field>
        <Field label={t.auth.displayName}>
          <Input name="display_name" required maxLength={60} autoComplete="name" />
        </Field>
        <Field label={t.auth.email}>
          <Input name="email" type="email" required autoComplete="email" dir="ltr" />
        </Field>
        <Field label={t.auth.password}>
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" dir="ltr" />
        </Field>
        <SubmitButton pendingLabel={t.auth.joining} className="mt-2 w-full">
          {t.auth.join}
        </SubmitButton>
      </ActionForm>
      <p className="type-body-md text-on-surface-variant">
        {t.auth.haveAccount}{' '}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          {t.auth.signInLink}
        </Link>
      </p>
    </>
  )
}
