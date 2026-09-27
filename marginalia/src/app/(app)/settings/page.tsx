import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { ActionForm } from '@/components/ui/action-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { Rule } from '@/components/ui/rule'
import { SubmitButton } from '@/components/ui/submit-button'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/viewer'
import { formatDate } from '@/lib/time'
import { siteUrl } from '@/lib/site'
import { signOut } from '../../(auth)/actions'
import { createInvite, updateProfile } from './actions'

export const metadata: Metadata = { title: 'Settings' }

type Invite = { code: string; used_by: string | null; expires_at: string; created_at: string }

export default async function SettingsPage() {
  const viewer = await requireViewer()
  const supabase = await createClient()
  const [{ data: invites }, { data: settings }] = await Promise.all([
    supabase.from('invites').select('code, used_by, expires_at, created_at').eq('created_by', viewer.id).order('created_at'),
    supabase.from('settings').select('invites_per_member').maybeSingle(),
  ])
  const mine = (invites ?? []) as Invite[]
  const quota = viewer.role === 'admin' ? Infinity : (settings?.invites_per_member ?? 3)
  const left = quota - mine.length

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
        <Rule label="Invitations" />
        <p className="text-[14px] text-ink-2">
          Seats are limited. {Number.isFinite(left) ? `You have ${left} ${left === 1 ? 'invite' : 'invites'} left.` : 'As admin, your invites are unlimited.'}
        </p>
        {mine.map((i) => {
          const expired = !i.used_by && Date.parse(i.expires_at) < Date.now()
          return (
            <div key={i.code} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
              <div className="grid gap-0.5">
                <code className="text-[15px] font-medium tracking-[0.2em]">{i.code}</code>
                {!i.used_by && !expired ? (
                  <span className="break-all text-[12px] text-ink-3">{`${siteUrl()}/join?code=${i.code}`}</span>
                ) : null}
              </div>
              {i.used_by ? (
                <Badge tone="solid">Claimed</Badge>
              ) : expired ? (
                <Badge tone="muted">Expired</Badge>
              ) : (
                <Badge tone="outline">Open until {formatDate(i.expires_at)}</Badge>
              )}
            </div>
          )
        })}
        {left > 0 ? (
          <ActionForm action={createInvite}>
            <SubmitButton variant="secondary" className="justify-self-start" pendingLabel="Creating">
              New invite code
            </SubmitButton>
          </ActionForm>
        ) : null}
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
