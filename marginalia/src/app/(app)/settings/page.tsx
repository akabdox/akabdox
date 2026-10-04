import type { Metadata } from 'next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { PageHeader } from '@/components/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'
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
    <div className="mx-auto grid max-w-2xl gap-4">
      <PageHeader eyebrow={`@${viewer.username}`} title={t.settings.title} />

      <section className="grid gap-5 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="person" className="text-primary" />
          {t.settings.profile}
        </h2>
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
          <SubmitButton className="justify-self-start" icon="check" pendingLabel={t.settings.saving}>
            {t.settings.save}
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="grid gap-4 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="language" className="text-primary" />
          {t.language}
        </h2>
        <LanguageSwitcher />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-low p-5 sm:p-8">
        <h2 className="flex items-center gap-2 type-title-lg">
          <Icon name="auto_stories" className="text-primary" />
          {t.settings.guide}
        </h2>
        <form action={reopenWelcome}>
          <Button type="submit" variant="tonal">
            {t.welcome.reopen}
          </Button>
        </form>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-low p-5 sm:p-8">
        <div className="grid gap-1">
          <h2 className="type-title-lg">{t.settings.session}</h2>
          <p dir="ltr" className="justify-self-start type-body-md text-on-surface-variant">
            @{viewer.username}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="danger" icon="logout">
            {t.settings.signOut}
          </Button>
        </form>
      </section>
    </div>
  )
}
