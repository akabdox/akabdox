import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'
import { SubmitButton } from '@/components/ui/submit-button'
import { requireViewer } from '@/lib/viewer'
import { signOut } from '../../(auth)/actions'
import { updateProfile } from './actions'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const viewer = await requireViewer()

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <PageHeader eyebrow={`@${viewer.username}`} title="Settings" />

      <section className="grid gap-5 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="person" className="text-primary" />
          Profile
        </h2>
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
          <SubmitButton className="justify-self-start" icon="check" pendingLabel="Saving">
            Save profile
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-low p-5 sm:p-8">
        <div className="grid gap-1">
          <h2 className="type-title-lg">Session</h2>
          <p className="type-body-md text-on-surface-variant">Signed in as @{viewer.username}.</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="danger" icon="logout">
            Sign out
          </Button>
        </form>
      </section>
    </div>
  )
}
