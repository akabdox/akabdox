import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { signUp } from '../actions'

export const metadata: Metadata = { title: 'Join' }

// Invitees arrive through the owner's link (/join?code=...). The code rides
// along hidden; without one, only the owner's own email can sign up.
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return (
    <>
      <div className="grid gap-2">
        <h1 className="type-headline-lg">Claim your seat.</h1>
        <p className="type-body-lg text-on-surface-variant">
          {code ? 'You were invited. Choose how you appear to other readers.' : 'Membership is by invitation. Open the link the owner sent you.'}
        </p>
      </div>
      <ActionForm action={signUp}>
        <input type="hidden" name="invite_code" value={code ?? ''} />
        <Field label="Username" hint="3 to 24 letters, numbers or underscores.">
          <Input name="username" required pattern="[A-Za-z0-9_]{3,24}" autoComplete="username" />
        </Field>
        <Field label="Display name">
          <Input name="display_name" required maxLength={60} autoComplete="name" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <SubmitButton pendingLabel="Joining" className="mt-2 w-full">
          Join the library
        </SubmitButton>
      </ActionForm>
      <p className="type-body-md text-on-surface-variant">
        Already a member?{' '}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  )
}
