/**
 * One source of truth for money.
 *
 * Prices are authored once in EUR and stay that way through the quote engine,
 * the cart and the order route. A market decides only how that EUR figure is
 * *presented* and what tax sits on top of it — never what it is worth.
 *
 * Deliberately standalone: nothing here imports company.ts or any component,
 * so it can be read from a Server Component, a route handler, or a client
 * component without dragging anything else in. company.ts reads *from* here.
 */

export type MarketCode = 'bg' | 'ro' | 'gr'

export type Market = {
  code: MarketCode
  /** BCP-47. Drives Intl formatting and, later, <html lang>. */
  locale: string
  /** What the buyer sees. EUR until a fixed conversion rate is set — see below. */
  displayCurrency: 'EUR' | 'RON'
  /**
   * Fixed EUR → displayCurrency rate. Deliberately not a live feed: a rate that
   * moves daily makes carts, saved quotes and printed offers disagree with each
   * other, which is unacceptable when buyers request an offer and order days
   * later. Changing it is a repricing decision, like changing the price list.
   */
  exchangeRate: number
  /** Standard rate for consumers. B2B reverse charge is handled by vatRateFor(). */
  vatRate: number
  /** Both in EUR, the authored currency — never in the display currency. */
  freeShippingThreshold: number
  shippingCost: number
  /**
   * Carriers offered at checkout. Proper nouns, so they are never translated —
   * but they are entirely per-market: a Romanian buyer has never heard of Еконт.
   */
  couriers: string[]
}

export const MARKETS: Record<MarketCode, Market> = {
  bg: {
    code: 'bg',
    locale: 'bg-BG',
    displayCurrency: 'EUR',
    exchangeRate: 1,
    vatRate: 0.2,
    freeShippingThreshold: 200,
    shippingCost: 6,
    couriers: ['Еконт', 'Спиди'],
  },
  ro: {
    code: 'ro',
    locale: 'ro-RO',
    // Stays EUR until the owner sets a fixed EUR→RON rate. Showing RON at a
    // guessed rate would quote a price the business has not agreed to sell at.
    displayCurrency: 'EUR',
    exchangeRate: 1,
    // 19%, collected under OSS registered via НАП — confirmed by the accountant.
    vatRate: 0.19,
    // TODO: Romanian courier costs differ (Fan Courier / Cargus / Sameday).
    // Carrying the Bulgarian figures until real ones are quoted.
    freeShippingThreshold: 200,
    shippingCost: 6,
    couriers: ['Fan Courier', 'Cargus', 'Sameday'],
  },
  gr: {
    code: 'gr',
    locale: 'el-GR',
    displayCurrency: 'EUR',
    exchangeRate: 1,
    // TODO: confirm with the accountant before launch, as the Romanian rate was.
    vatRate: 0.24,
    freeShippingThreshold: 200,
    shippingCost: 6,
    // TODO: confirm Greek carriers before launch.
    couriers: [],
  },
}

/** Bulgaria is market #1 and the only one currently served. */
export const DEFAULT_MARKET = MARKETS.bg

// --- Presentation -----------------------------------------------------------

/**
 * "22,09 €" — separator, symbol and placement all come from the locale.
 *
 * This matters before Romania exists: every price was a bare `.toFixed(2)`,
 * which always emits a `.` decimal separator, and Bulgarian uses a comma. The
 * prices were already formatted wrong for Bulgaria.
 */
export function formatPrice(amountEur: number, market: Market = DEFAULT_MARKET): string {
  return new Intl.NumberFormat(market.locale, {
    style: 'currency',
    currency: market.displayCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountEur * market.exchangeRate)
}

/**
 * "22,09" — the number alone, for layouts that style the currency symbol
 * separately (the catalogue sets it smaller and lighter than the figure).
 * Pair it with `currencySymbol`.
 */
export function formatAmount(amountEur: number, market: Market = DEFAULT_MARKET): string {
  return new Intl.NumberFormat(market.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountEur * market.exchangeRate)
}

export const currencySymbol = (market: Market = DEFAULT_MARKET): string =>
  market.displayCurrency === 'RON' ? 'lei' : '€'

/** "20%" / "19%" — for labels, so the rate is never typed into a string. */
export const vatLabel = (rate: number): string => `${Math.round(rate * 100)}%`

// --- Tax --------------------------------------------------------------------

export type CustomerType = 'consumer' | 'business'

/**
 * VAT as a function of (market, customer), not a constant on the market.
 *
 * Selling from the Bulgarian entity into another EU state, a business customer
 * with a VIES-valid VAT number is an intra-community supply: 0%, reverse
 * charged, the customer accounts for it. A Bulgarian business is a domestic
 * sale and pays the normal rate.
 *
 * Zero-rating carries an obligation the checkout cannot discharge on its own:
 * the business must retain the CMR or courier signature proving the goods left
 * Bulgaria, or the revenue office can disallow it and charge the VAT back.
 */
export function vatRateFor(
  market: Market,
  customer: { type: CustomerType; vatNumberValidated?: boolean } = { type: 'consumer' },
): number {
  const intraCommunity = market.code !== 'bg'
  if (intraCommunity && customer.type === 'business' && customer.vatNumberValidated) return 0
  return market.vatRate
}
