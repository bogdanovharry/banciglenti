/**
 * Order numbers, shared by the storefront's checkout and the admin's phone
 * orders so the two can never mint numbers in different shapes.
 */

/**
 * "TL-260806-4F2A" — sortable by eye, short enough to read down a phone line.
 *
 * Dated on the workshop's calendar. It used UTC, which put an order taken in
 * Gabrovo at 01:30 on the previous day's number.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Sofia',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  )
  const tail = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0')
  return `TL-${parts.year}${parts.month}${parts.day}-${tail}`
}

/** Payload turns Postgres' unique violation into a ValidationError naming the field. */
function isNumberClash(error: unknown): boolean {
  const errors = (error as { data?: { errors?: { path?: string | null }[] } } | null)?.data?.errors
  return Array.isArray(errors) && errors.some((e) => /order_?number/i.test(e.path ?? ''))
}

/**
 * Create an order under a fresh number, drawing again if it is taken.
 *
 * Four hex digits are 65 536 numbers a day, and at ten orders a day two of them
 * share a number roughly once a year — which surfaced as a checkout error and a
 * lost order. A clash is now simply another draw; anything else is rethrown.
 */
export async function withOrderNumber<T>(create: (orderNumber: string) => Promise<T>): Promise<T> {
  const ATTEMPTS = 5
  let last: unknown
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      return await create(generateOrderNumber())
    } catch (error) {
      if (!isNumberClash(error)) throw error
      last = error
    }
  }
  throw last
}
