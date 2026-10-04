import { locales, localeNames } from '@/i18n/config'
import { setLocale } from '@/i18n/actions'
import { getI18n } from '@/i18n/server'
import { cn } from '@/lib/cn'

// Three plain buttons in one form: works without JavaScript.
export async function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = await getI18n()
  return (
    <form action={setLocale} className={cn('flex items-center gap-1', className)} aria-label={t.language}>
      {locales.map((l) => (
        <button
          key={l}
          type="submit"
          name="locale"
          value={l}
          lang={l}
          aria-pressed={l === locale}
          className={cn('state-layer h-8 rounded-sm px-3 type-label-lg', l === locale ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant')}
        >
          {localeNames[l]}
        </button>
      ))}
    </form>
  )
}
