import { NextResponse } from 'next/server'
import { verifySignature } from '@/lib/payments/chargily'
import { createAdminClient } from '@/lib/supabase/admin'

// Chargily calls this after each checkout. Settlement is idempotent in the
// database, so retries are safe.
export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifySignature(raw, request.headers.get('signature'))) {
    return NextResponse.json({ error: 'bad signature' }, { status: 403 })
  }

  const event = JSON.parse(raw) as { type: string; data: { id: string } }
  const admin = createAdminClient()

  if (event.type === 'checkout.paid') {
    const { error } = await admin.rpc('settle_checkout', { p_provider_ref: event.data.id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (event.type === 'checkout.failed' || event.type === 'checkout.canceled' || event.type === 'checkout.expired') {
    await admin.rpc('release_checkout', { p_provider_ref: event.data.id })
  }

  return NextResponse.json({ ok: true })
}
