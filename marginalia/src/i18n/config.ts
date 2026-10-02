export const locales = ['ar', 'fr', 'en'] as const
export type Locale = (typeof locales)[number]

// Algeria first: Arabic unless the browser asks for French or English.
export const defaultLocale: Locale = 'ar'
export const LOCALE_COOKIE = 'lang'

export const localeNames: Record<Locale, string> = { ar: 'العربية', fr: 'Français', en: 'English' }

// Tags for Intl. The DZ variants keep Latin digits, as Algerians write them.
export const intlTag: Record<Locale, string> = { ar: 'ar-DZ', fr: 'fr-DZ', en: 'en' }

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export function dirOf(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

// "fr-FR,fr;q=0.9,en;q=0.8" -> first supported language, in order of preference.
export function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=')
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)
  return ranked.map((r) => r.lang).find(isLocale) ?? null
}
