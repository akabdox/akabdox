import 'server-only'
import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { defaultLocale, fromAcceptLanguage, isLocale, LOCALE_COOKIE, type Locale } from './config'
import { dictionaries, type Dict } from './dictionaries'

// The visitor's language: their saved choice, else their browser's, else Arabic.
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value
  if (isLocale(saved)) return saved
  return fromAcceptLanguage((await headers()).get('accept-language')) ?? defaultLocale
})

export async function getDict(): Promise<Dict> {
  return dictionaries[await getLocale()]
}

export async function getI18n(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale()
  return { locale, t: dictionaries[locale] }
}
