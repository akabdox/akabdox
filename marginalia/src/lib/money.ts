import { intlTag, type Locale } from '@/i18n/config'

// Currency label per language: DZD, DA, د.ج.
const labels: Record<Locale, Record<string, string>> = {
  ar: { DZD: 'د.ج' },
  fr: { DZD: 'DA' },
  en: { DZD: 'DZD' },
}

export function currencyLabel(currency: string, locale: Locale = 'en'): string {
  return labels[locale][currency] ?? currency
}

export function formatMoney(minor: number, currency: string, locale: Locale = 'en'): string {
  const amount = new Intl.NumberFormat(intlTag[locale], { maximumFractionDigits: 2 }).format(minor / 100)
  return `${amount} ${currencyLabel(currency, locale)}`
}

// "1 250", "1,250.50", "1250" -> minor units. Returns null when unparseable.
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 100)
}
