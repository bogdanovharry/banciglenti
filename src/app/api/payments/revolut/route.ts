import { NextResponse } from 'next/server'

import { reconcileCardPayment } from '@/lib/card-payments'
import { signatureOk } from '@/lib/revolut-core'

/**
 * Revolut's webhook.
 *
 * Everything here is "something may have happened to this order, go and ask":
 * the signature is checked first, and then the payment is settled by asking
 * Revolut directly (see card-payments.ts), never from what the delivery says.
 * So a forged or replayed delivery can at worst cost one lookup.
 *
 * It answers 200 once the delivery is authentic, even if the order is not one
 * of ours, so Revolut does not keep retrying something that will never apply.
 * A failure on our side answers 500, which Revolut retries.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const raw = await request.text()
  if (raw.length > 64_000) return NextResponse.json({ error: 'too large' }, { status: 413 })

  const ok = signatureOk({
    rawBody: raw,
    signatureHeader: request.headers.get('revolut-signature') ?? request.headers.get('revolut-api-signature'),
    timestampHeader: request.headers.get('revolut-request-timestamp') ?? request.headers.get('revolut-api-timestamp'),
    secret: process.env.REVOLUT_WEBHOOK_SECRET ?? '',
  })
  if (!ok) return NextResponse.json({ error: 'invalid signature' }, { status: 401 })

  let event: { event?: string; order_id?: string } = {}
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: true })
  }
  if (!event.order_id || typeof event.order_id !== 'string' || !/^[0-9a-f-]{20,64}$/i.test(event.order_id)) return NextResponse.json({ ok: true })

  const result = await reconcileCardPayment({ revolutOrderId: event.order_id })
  // Revolut retries on a non-2xx; "unknown" can be a lookup that failed, so ask again.
  return NextResponse.json({ ok: true, state: result.state }, { status: result.state === 'unknown' ? 202 : 200 })
}
