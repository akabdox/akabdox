import type { Metadata } from 'next'
import Link from 'next/link'
import { ActionForm } from '@/components/ui/action-form'
import { Field, Input } from '@/components/ui/field'
import { SubmitButton } from '@/components/ui/submit-button'
import { signUp } from '../actions'

export const metadata: Metadata = { title: 'Join' }

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  return (
    <>
      <div className="grid gap-2">
        <h1 className="text-[32px]">Claim your seat.</h1>
        <p className="text-ink-2">A member invited you. The code is on your invitation.</p>
      </div>
      <ActionForm action={signUp}>
        <Field label="Invite code">
          <Input name="invite_code" defaultValue={code} required autoCapitalize="characters" className="uppercase tracking-[0.2em]" />
        </Field>
        <Field label="Username" hint="Letters, numbers, underscores.">
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
        <SubmitButton pendingLabel="Joining">Join the library</SubmitButton>
      </ActionForm>
      <p className="text-[14px] text-ink-3">
        Already a member?{' '}
        <Link href="/login" className="text-ink underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  )
}
