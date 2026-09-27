const grouping = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })

export function formatMoney(minor: number, currency: string): string {
  return `${grouping.format(minor / 100)} ${currency}`
}

// "1 250", "1,250.50", "1250" -> minor units. Returns null when unparseable.
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 100)
}
