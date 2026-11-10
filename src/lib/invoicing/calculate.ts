import { INVOICE_SETTINGS, type BusinessPricing } from './settings'

/**
 * Invoice arithmetic. Pure functions, integer minor units (bani) throughout, so
 * there is no floating-point drift between what the courier collects and what
 * the invoice says.
 *
 * ROUNDING RULE (one place, tested): VAT is computed once for the whole
 * invoice from the gross total: vat = round(gross × rate / (1 + rate)), halves
 * rounded up; net = gross − vat. The total therefore always equals the cart
 * price. The invoice VAT is then spread over the lines (largest remainder) so
 * that the lines add up to the totals exactly.
 */

export type ViesStatus = 'valid' | 'invalid' | 'unavailable' | 'not_checked'

export type Buyer = {
  type: 'consumer' | 'business'
  vatNumber?: string | null
  /** Country of the VAT number, ISO 3166-1 alpha-2. */
  vatCountry?: string | null
  vies: ViesStatus
}

export type InvoiceCase = 'A' | 'B' | 'C' | 'HOLD'

export type Classification = {
  case: InvoiceCase
  /** Rate in basis points: 2100 = 21%. */
  rateBp: number
  /** True when the owner must be told (case C). */
  notifyOwner: boolean
  reason: string
}

/**
 * A: consumer, or business without a valid number → standard VAT (OSS).
 * B: valid number and delivery in the same zero-rate country → 0%.
 * C: valid number, delivery elsewhere → treated as A, owner informed.
 * HOLD: a number was given but VIES could not confirm or deny it → no invoice.
 */
export function classifyBuyer(
  buyer: Buyer,
  shippingCountry: string,
  standardRateBp: number,
  zeroRateCountries: readonly string[] = INVOICE_SETTINGS.zeroRateCountries,
): Classification {
  const standard = (c: InvoiceCase, reason: string, notifyOwner = false): Classification => ({
    case: c, rateBp: standardRateBp, notifyOwner, reason,
  })
  const hasNumber = Boolean(buyer.vatNumber?.trim())

  if (buyer.type === 'consumer' || !hasNumber) return standard('A', 'No VAT number: standard rate')
  if (buyer.vies === 'invalid') return standard('A', 'VAT number is not valid in VIES: standard rate')
  if (buyer.vies !== 'valid') {
    return { case: 'HOLD', rateBp: standardRateBp, notifyOwner: false, reason: 'VIES did not give an answer: invoice held' }
  }

  const sameCountry =
    Boolean(buyer.vatCountry) &&
    buyer.vatCountry!.toUpperCase() === shippingCountry.toUpperCase() &&
    zeroRateCountries.includes(shippingCountry.toUpperCase())
  if (sameCountry) return { case: 'B', rateBp: 0, notifyOwner: false, reason: 'Valid VAT number, delivery in the same country: 0%' }

  return standard('C', 'Valid VAT number but delivery outside the zero-rate country: standard rate', true)
}

/** VAT contained in a gross amount (bani), halves up. */
export function vatInGross(grossBani: number, rateBp: number): number {
  return Math.round((grossBani * rateBp) / (10000 + rateBp))
}

export type InvoiceLineInput = { grossBani: number }
export type InvoiceLine = { netBani: number; vatBani: number; grossBani: number }

export type InvoiceAmounts = {
  lines: InvoiceLine[]
  netBani: number
  vatBani: number
  /** What the invoice asks to be paid — and what the courier must collect. */
  totalBani: number
}

/** Split `total` (whole bani) over lines in proportion to `exact`, summing exactly to `total`. */
function allocate(exact: number[], total: number): number[] {
  const parts = exact.map(Math.floor)
  let diff = total - parts.reduce((a, b) => a + b, 0)
  const byFraction = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => (diff > 0 ? b.frac - a.frac : a.frac - b.frac) || a.i - b.i)
  // One bani at a time, round and round. The guard only stops a runaway loop.
  for (let k = 0; diff !== 0 && k < 100_000; k++) {
    const idx = byFraction[k % byFraction.length].i
    if (diff > 0) { parts[idx]++; diff-- } else if (parts[idx] > 0) { parts[idx]--; diff++ }
  }
  return parts
}

/**
 * Spread a whole-bani `total` over lines by their `weights` (any positive
 * numbers), largest remainder, so the parts add up to the total exactly.
 * Used to turn per-line prices into line amounts that sum to the figure the
 * courier collects.
 */
export function distribute(weights: number[], total: number): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (weights.length === 0) return []
  if (sum <= 0) return allocate(weights.map(() => total / weights.length), total)
  return allocate(weights.map((w) => (total * w) / sum), total)
}

export function computeInvoice(
  lines: InvoiceLineInput[],
  options: { case: InvoiceCase; standardRateBp: number; businessPricing?: BusinessPricing },
): InvoiceAmounts {
  const gross = lines.map((l) => l.grossBani)
  const grossTotal = gross.reduce((a, b) => a + b, 0)
  const zeroRated = options.case === 'B'
  const pricing = options.businessPricing ?? INVOICE_SETTINGS.businessPricing

  // Zero rate, same gross price: nothing to split.
  if (zeroRated && pricing === 'same-gross') {
    return {
      lines: gross.map((g) => ({ netBani: g, vatBani: 0, grossBani: g })),
      netBani: grossTotal, vatBani: 0, totalBani: grossTotal,
    }
  }

  // Cases A and C, and case B priced net: first split the standard-rate VAT.
  const rate = options.standardRateBp
  const vatTotal = vatInGross(grossTotal, rate)
  const vatLines = allocate(gross.map((g) => (g * rate) / (10000 + rate)), vatTotal)

  if (!zeroRated) {
    return {
      lines: gross.map((g, i) => ({ netBani: g - vatLines[i], vatBani: vatLines[i], grossBani: g })),
      netBani: grossTotal - vatTotal, vatBani: vatTotal, totalBani: grossTotal,
    }
  }
  // Case B, net pricing: the buyer pays the net amount, no VAT.
  const netLines = gross.map((g, i) => g - vatLines[i])
  return {
    lines: netLines.map((n) => ({ netBani: n, vatBani: 0, grossBani: n })),
    netBani: grossTotal - vatTotal, vatBani: 0, totalBani: grossTotal - vatTotal,
  }
}
