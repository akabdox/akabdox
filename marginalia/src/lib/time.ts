import { intlTag, type Locale } from '@/i18n/config'

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function timeAgo(iso: string, locale: Locale, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(intlTag[locale], { numeric: 'auto' })
  const seconds = Math.round((Date.parse(iso) - now) / 1000)
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(0, 'second')
}

function unit(locale: Locale, value: number, name: 'minute' | 'hour' | 'day', display: 'narrow' | 'long') {
  return new Intl.NumberFormat(intlTag[locale], { style: 'unit', unit: name, unitDisplay: display }).format(value)
}

export function timeLeft(iso: string, locale: Locale, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  if (minutes >= 1440) return unit(locale, Math.round(minutes / 1440), 'day', 'narrow')
  if (minutes >= 60) return unit(locale, Math.round(minutes / 60), 'hour', 'narrow')
  return unit(locale, minutes, 'minute', 'narrow')
}

export function formatDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(intlTag[locale], { day: 'numeric', month: 'short', year: 'numeric' })
}

// Postgres interval text ("24:00:00", "7 days") -> "24 hours", "7 jours", "7 أيام".
export function describeInterval(interval: string, locale: Locale): string {
  const days = interval.match(/(\d+) days?/)
  if (days) return unit(locale, Number(days[1]), 'day', 'long')
  const hours = interval.match(/^(\d+):/)
  if (hours) return unit(locale, Number(hours[1]), 'hour', 'long')
  return interval
}
