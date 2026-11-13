import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * The parts of the Revolut integration that touch neither the network nor the
 * database, so they can be tested on their own.
 */

/**
 * What to charge, in the smallest unit of the currency the buyer was shown.
 *
 * Orders are stored in EUR with the exchange rate they were taken at; the buyer
 * saw `total × rate` to two decimals, and that is what Revolut is asked for —
 * the same figure, rounded the same way, so the card page never disagrees with
 * the checkout. Used again to check a payment that comes back: a paid order
 * whose amount differs from this is not marked paid.
 */
export const chargeMinor = (totalEur: number, rate: number): number => Math.round(Math.round(totalEur * rate * 1e6) / 1e4)

const toBuffer = (hex: string) => Buffer.from(hex, 'utf8')

/**
 * Is this webhook really from Revolut?
 *
 * Revolut signs `v1.<timestamp>.<raw body>` with HMAC-SHA256 and the webhook's
 * signing secret, and sends the result as `v1=<hex>` — several, comma separated,
 * while a secret is being rotated. Any one matching is enough. A timestamp far
 * from now is refused, so a captured delivery cannot be replayed later.
 *
 * The body must be the exact bytes received: parsing and re-serialising it
 * changes the whitespace and breaks the signature.
 */
export function signatureOk({
  rawBody,
  signatureHeader,
  timestampHeader,
  secret,
  nowMs = Date.now(),
  toleranceMs = 5 * 60_000,
}: {
  rawBody: string
  signatureHeader: string | null
  timestampHeader: string | null
  secret: string
  nowMs?: number
  toleranceMs?: number
}): boolean {
  if (!secret || !signatureHeader || !timestampHeader) return false
  if (!/^\d{9,16}$/.test(timestampHeader)) return false

  // Milliseconds, as Revolut sends it; seconds are accepted too.
  const stamp = Number(timestampHeader)
  const stampMs = stamp < 1e11 ? stamp * 1000 : stamp
  if (Math.abs(nowMs - stampMs) > toleranceMs) return false

  const expected = createHmac('sha256', secret).update(`v1.${timestampHeader}.${rawBody}`).digest('hex')
  return signatureHeader
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1='))
    .some((part) => {
      const given = part.slice(3)
      return given.length === expected.length && timingSafeEqual(toBuffer(given), toBuffer(expected))
    })
}

/** What a Revolut order's state means for our order. */
export type PaymentOutcome = 'paid' | 'failed' | 'pending'

export function outcomeOf(state: string | null | undefined): PaymentOutcome {
  switch (state) {
    case 'completed':
      return 'paid'
    case 'cancelled':
    case 'failed':
      return 'failed'
    default:
      // pending, processing, authorised: the buyer has not finished, or Revolut has not.
      return 'pending'
  }
}
