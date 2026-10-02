import type { Metadata } from 'next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { PageHeader } from '@/components/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Rule } from '@/components/ui/rule'
import { SubmitButton } from '@/components/ui/submit-button'
import { requireViewer } from '@/lib/viewer'
import { getDict } from '@/i18n/server'
import { signOut } from '../../(auth)/actions'
import { reopenWelcome } from '../welcome/actions'
import { updateProfile } from './actions'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDict()).settings.title }
}

export default async function SettingsPage() {
  const viewer = await requireViewer()
  const t = await getDict()

  return (
    <div className="mx-auto grid max-w-xl gap-12">
      <PageHeader eyebrow={`@${viewer.username}`} title={t.settings.title} />

      <section className="grid gap-5">
        <Rule label={t.settings.profile} />
        <ActionForm action={updateProfile}>
          <Field label={t.settings.displayName}>
            <Input name="display_name" defaultValue={viewer.display_name} required maxLength={60} dir="auto" />
          </Field>
          <Field label={t.settings.city}>
            <Input name="city" defaultValue={viewer.city ?? ''} maxLength={60} placeholder="Sétif" dir="auto" />
          </Field>
          <Field label={t.settings.bio} hint={t.settings.bioHint}>
            <Textarea name="bio" defaultValue={viewer.bio ?? ''} maxLength={280} rows={3} dir="auto" />
          </Field>
          <SubmitButton className="justify-self-start" pendingLabel={t.settings.saving}>
            {t.settings.save}
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-5">
        <Rule label={t.language} />
        <LanguageSwitcher />
      </section>

      <section className="grid gap-5">
        <Rule label={t.settings.guide} />
        <form action={reopenWelcome}>
          <Button type="submit" variant="secondary">
            {t.welcome.reopen}
          </Button>
        </form>
      </section>

      <section className="grid gap-5">
        <Rule label={t.settings.session} />
        <form action={signOut}>
          <Button type="submit" variant="danger">
            {t.settings.signOut}
          </Button>
        </form>
      </section>
    </div>
  )
}
