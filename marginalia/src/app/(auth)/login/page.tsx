import type { Metadata } from 'next'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { signIn } from '../actions'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <>
      <div className="grid gap-2">
        <h1 className="text-[32px]">Welcome back.</h1>
        <p className="text-ink-2">Members only.</p>
      </div>
      <ActionForm action={signIn}>
        <input type="hidden" name="next" value={next ?? '/feed'} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton pendingLabel="Signing in">Sign in</SubmitButton>
      </ActionForm>
    </>
  )
}
