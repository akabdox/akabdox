import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { getDict } from '@/i18n/server'
import { signIn } from '../actions'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).auth.signIn }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const t = await getDict()
  return (
    <>
      <div className="grid gap-2">
        <h1 className="text-[32px]">{t.auth.loginTitle}</h1>
        <p className="text-ink-2">{t.auth.loginBody}</p>
      </div>
      <ActionForm action={signIn}>
        <input type="hidden" name="next" value={next ?? '/feed'} />
        <Field label={t.auth.email}>
          <Input name="email" type="email" autoComplete="email" required dir="ltr" />
        </Field>
        <Field label={t.auth.password}>
          <Input name="password" type="password" autoComplete="current-password" required dir="ltr" />
        </Field>
        <SubmitButton pendingLabel={t.auth.signingIn}>{t.auth.signIn}</SubmitButton>
      </ActionForm>
      <p className="text-[14px] text-ink-3">
        {t.auth.noAccount}{' '}
        <Link href="/join" className="text-ink underline underline-offset-4">
          {t.auth.joinLink}
        </Link>
      </p>
    </>
  )
}
