import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Rule } from '@/components/ui/rule'
import { SubmitButton } from '@/components/ui/submit-button'
import { requireViewer } from '@/lib/viewer'
import { signOut } from '../../(auth)/actions'
import { updateProfile } from './actions'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const viewer = await requireViewer()

  return (
    <div className="mx-auto grid max-w-xl gap-12">
      <PageHeader eyebrow={`@${viewer.username}`} title="Settings" />

      <section className="grid gap-5">
        <Rule label="Profile" />
        <ActionForm action={updateProfile}>
          <Field label="Display name">
            <Input name="display_name" defaultValue={viewer.display_name} required maxLength={60} />
          </Field>
          <Field label="City">
            <Input name="city" defaultValue={viewer.city ?? ''} maxLength={60} placeholder="Sétif" />
          </Field>
          <Field label="Bio" hint="280 characters.">
            <Textarea name="bio" defaultValue={viewer.bio ?? ''} maxLength={280} rows={3} />
          </Field>
          <SubmitButton className="justify-self-start" pendingLabel="Saving">
            Save profile
          </SubmitButton>
        </ActionForm>
      </section>


      <section className="grid gap-5">
        <Rule label="Session" />
        <form action={signOut}>
          <Button type="submit" variant="danger">
            Sign out
          </Button>
        </form>
      </section>
    </div>
  )
}
