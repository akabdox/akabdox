import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

// Chargily Pay v2: CIB and Edahabia cards, DZD only.
// Stripe does not onboard Algerian businesses, so this is the local gateway.

function baseUrl() {
  return process.env.CHARGILY_MODE === 'live'
    ? 'https://pay.chargily.net/api/v2'
    : 'https://pay.chargily.net/test/api/v2'
}

function secretKey(): string {
  const key = process.env.CHARGILY_SECRET_KEY
  if (!key) throw new Error('CHARGILY_SECRET_KEY is not set')
  return key
}

export function chargilyEnabled(): boolean {
  return Boolean(process.env.CHARGILY_SECRET_KEY)
}

export async function createCheckout(input: {
  amountMinor: number
  successUrl: string
  failureUrl: string
  webhookUrl: string
  description: string
}): Promise<{ id: string; checkout_url: string }> {
  const res = await fetch(`${baseUrl()}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(input.amountMinor / 100),
      currency: 'dzd',
      success_url: input.successUrl,
      failure_url: input.failureUrl,
      webhook_endpoint: input.webhookUrl,
      description: input.description,
      locale: 'fr',
    }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Chargily checkout failed with ${res.status}`)
  return (await res.json()) as { id: string; checkout_url: string }
}

// The `signature` header is an HMAC-SHA256 of the raw body keyed with the secret key.
export function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = createHmac('sha256', secretKey()).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
