/**
 * How figures are written on the management screens.
 *
 * Deliberately not `formatPrice` from src/lib/market.ts. That one converts an
 * authored EUR price into whatever the *visitor's* market displays, which is
 * right for a storefront and wrong here: an order total is a settled figure in
 * EUR, and the person reconciling it against the bank must see the number that
 * was actually charged, not a re-conversion of it. Romania displays RON, so the
 * two now differ: its orders show the RON figure beside the EUR one, converted
 * at the rate stored on the order — see customerMoney.
 */

const MONEY = new Intl.NumberFormat('bg-BG', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "1 234,50 €" — always EUR, the currency orders are stored in. */
export const money = (amount: number): string => MONEY.format(amount)

/**
 * "6 489,19 RON" — the figure a customer in another currency was shown: the
 * amount the courier collects on delivery, and the one to read back on the
 * phone. Converted at the rate stored on the order, never today's, and shown
 * beside the EUR figure it came from rather than instead of it.
 */
export const customerMoney = (amountEur: number, currency: string, rate: number): string =>
  new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round(amountEur * rate * 100) / 100)

const DATE = new Intl.DateTimeFormat('bg-BG', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  // Pinned to the workshop's clock. Without it the server's timezone decides,
  // and an order taken at 00:30 in Sofia reads as the previous day on a UTC box.
  timeZone: 'Europe/Sofia',
})

const TIME = new Intl.DateTimeFormat('bg-BG', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Sofia',
})

/**
 * "07.08.2026" — assembled from the locale's own parts rather than from
 * `format()`, which appends Bulgarian's formal year marker: "07.08.2026 г.".
 * Correct prose, but three wasted characters on every row of a dense table.
 * Reading the parts drops it without doing string surgery on locale output.
 */
export const shortDate = (iso: string | null): string => {
  if (!iso) return '—'
  const parts: Record<string, string> = {}
  for (const p of DATE.formatToParts(new Date(iso))) parts[p.type] = p.value
  return `${parts.day}.${parts.month}.${parts.year}`
}

export const shortTime = (iso: string | null): string => (iso ? TIME.format(new Date(iso)) : '')
