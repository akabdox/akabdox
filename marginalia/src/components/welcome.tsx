import { finishWelcome } from '@/app/(app)/welcome/actions'
import { Button } from './ui/button'
import { getDict } from '@/i18n/server'
import type { Profile } from '@/lib/types'

// First visit guide. Shown over the app until the member closes it; the
// choice is stored on the profile, so it does not come back on another device.
export async function Welcome({ viewer }: { viewer: Profile }) {
  const t = await getDict()
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-surface/85 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="animate-rise grid w-full max-w-lg gap-7 border border-outline bg-surface-low p-6 sm:p-8"
      >
        <div className="grid gap-2">
          <p className="eyebrow">{t.welcome.eyebrow}</p>
          <h2 id="welcome-title" className="type-headline-sm">
            {t.welcome.title(viewer.display_name)}
          </h2>
        </div>

        <ol className="grid gap-5">
          {t.welcome.steps.map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[auto_1fr] gap-4">
              <span className="tabular grid size-7 place-items-center rounded-full border border-outline type-body-sm font-medium">{i + 1}</span>
              <div className="grid gap-1">
                <p className="font-medium">{title}</p>
                <p className="type-body-md text-on-surface-variant">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <form action={finishWelcome} className="flex flex-wrap gap-3">
          <Button type="submit" name="next" value={`/u/${viewer.username}`}>
            {t.welcome.addBook}
          </Button>
          <Button type="submit" name="next" value="" variant="secondary">
            {t.welcome.later}
          </Button>
        </form>
      </section>
    </div>
  )
}
