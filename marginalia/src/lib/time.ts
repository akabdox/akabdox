const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000)
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function timeLeft(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  if (minutes >= 1440) return `${Math.round(minutes / 1440)}d`
  if (minutes >= 60) return `${Math.round(minutes / 60)}h`
  return `${minutes}m`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Postgres interval text ("24:00:00", "7 days") -> "24 hours", "7 days".
export function describeInterval(interval: string): string {
  const days = interval.match(/(\d+) days?/)
  if (days) return `${days[1]} day${days[1] === '1' ? '' : 's'}`
  const hours = interval.match(/^(\d+):/)
  if (hours) return `${Number(hours[1])} hours`
  return interval
}
