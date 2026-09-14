import { DEFAULT_MARKET } from './market'

/**
 * Order arithmetic, on its own.
 *
 * Split out of order-pricing.ts, which imports every price table, so the cart
 * can preview totals with this exact function without shipping 133 blade rows
 * to every page that renders the header. order-pricing.ts re-exports it, so
 * the order route and the admin keep importing from where they always have.
 */

export const round2 = (n: number) => Math.round(n * 100) / 100

export type OrderTotals = {
  subtotal: number
  shippingCost: number
  tax: number
  total: number
}

/**
 * What an order comes to, given its lines.
 *
 * Asked three times: by the checkout preview in the browser, when the customer
 * places the order, and again when someone adds a line to it from the admin.
 * Two copies of this arithmetic is two answers to "what does the customer
 * owe", and the one the accountant reconciles against would eventually be the
 * wrong one.
 *
 * `vatRate` is passed in, not read from the market, so re-pricing an existing
 * order uses the rate that order was taken under. VAT is charged on goods only,
 * not on the carriage — which is how the checkout has always computed it.
 */
export function computeOrderTotals({
  lines,
  shippingMethod,
  vatRate,
  freeShippingThreshold = DEFAULT_MARKET.freeShippingThreshold,
  shippingCost = DEFAULT_MARKET.shippingCost,
}: {
  lines: { price: number; quantity: number }[]
  shippingMethod: 'courier' | 'pickup'
  vatRate: number
  freeShippingThreshold?: number
  shippingCost?: number
}): OrderTotals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0))
  const carriage =
    shippingMethod === 'pickup' || subtotal >= freeShippingThreshold ? 0 : shippingCost
  const tax = round2(subtotal * vatRate)

  return { subtotal, shippingCost: carriage, tax, total: round2(subtotal + carriage + tax) }
}
