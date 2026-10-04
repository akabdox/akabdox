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
        <h1 className="type-headline-lg">Welcome back.</h1>
        <p className="type-body-lg text-on-surface-variant">Sign in to your shelf, the feed and the market.</p>
      </div>
      <ActionForm action={signIn}>
        <input type="hidden" name="next" value={next ?? '/feed'} />
        <Field label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <SubmitButton pendingLabel="Signing in" className="mt-2 w-full">
          Sign in
        </SubmitButton>
      </ActionForm>
      <p className="type-body-md text-on-surface-variant">
        Have an invite link? Open it to claim your seat.
      </p>
    </>
  )
}
