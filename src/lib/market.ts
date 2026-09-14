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

/** What a buyer can choose at checkout. Cards join once a provider is connected. */
export type CheckoutPaymentMethod = 'bank_transfer' | 'cod'

export type Market = {
  code: MarketCode
  /** BCP-47. Drives Intl formatting and, later, <html lang>. */
  locale: string
  /**
   * Written on the last line of every delivery address. Set by the server from
   * the domain, never sent by the browser — a courier label reading "България"
   * under a Cluj street is a parcel that goes nowhere.
   */
  country: string
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
  /**
   * How carriage reaches the bill.
   *  - 'flat': `shippingCost` is added to the order below `freeShippingThreshold`.
   *  - 'collect': never on the order. The courier weighs the parcel and charges
   *    its own fee to the buyer at the door, alongside the cash on delivery —
   *    so nothing is promised free, and the two figures below are unused.
   * Read through carriageTerms(), not directly.
   */
  carriage: 'flat' | 'collect'
  /** Both in EUR, the authored currency — never in the display currency. */
  freeShippingThreshold: number
  shippingCost: number
  /**
   * Carriers offered at checkout. Proper nouns, so they are never translated —
   * but they are entirely per-market: a Romanian buyer has never heard of Еконт.
   */
  couriers: string[]
  /**
   * Collection from the workshop in Gabrovo. Only where the buyer can drive
   * there — offered in Bulgaria, and nowhere a customer would cross a border.
   */
  pickup: boolean
  /**
   * Offered at checkout, first one preselected. The order route refuses any
   * other, so a method switched off here cannot be posted by hand.
   */
  paymentMethods: CheckoutPaymentMethod[]
}

export const MARKETS: Record<MarketCode, Market> = {
  bg: {
    code: 'bg',
    locale: 'bg-BG',
    country: 'България',
    displayCurrency: 'EUR',
    exchangeRate: 1,
    vatRate: 0.2,
    carriage: 'flat',
    freeShippingThreshold: 200,
    shippingCost: 6,
    couriers: ['Еконт', 'Спиди'],
    pickup: true,
    paymentMethods: ['bank_transfer', 'cod'],
  },
  ro: {
    code: 'ro',
    locale: 'ro-RO',
    country: 'România',
    // Lei, because HG 947/2000 requires consumer prices in lei. The rate is the
    // BNR reference rate for 14 Sep 2026, fixed by the owner that day (the ECB
    // published 5.2568). Changing it reprices the Romanian shop — see the
    // exchangeRate note on the type.
    displayCurrency: 'RON',
    exchangeRate: 5.2567,
    // Collected under OSS registered via НАП. Romania's standard rate rose from
    // 19% to 21% on 1 August 2025 (July 2025 fiscal package); the 19% previously here
    // predates that. Reconfirm with the accountant before the first order.
    vatRate: 0.21,
    // Speedy / DPD price by weight, and a blade order runs from a hobby loop to
    // a crate of sawmill bands, so no flat fee is honest. The courier charges
    // the buyer at the door; there is no free-delivery threshold. Owner's
    // decision, 14 Sep 2026.
    carriage: 'collect',
    freeShippingThreshold: 0,
    shippingCost: 0,
    // Owner's choice, 14 Sep 2026.
    couriers: ['Speedy', 'DPD'],
    pickup: false,
    // Cash on delivery only at launch — the courier collects lei, so no RON
    // bank account is needed. Cards are to follow once a provider is connected.
    paymentMethods: ['cod'],
  },
  gr: {
    code: 'gr',
    locale: 'el-GR',
    country: 'Ελλάδα',
    displayCurrency: 'EUR',
    exchangeRate: 1,
    // TODO: confirm with the accountant before launch, as the Romanian rate was.
    vatRate: 0.24,
    carriage: 'flat',
    freeShippingThreshold: 200,
    shippingCost: 6,
    // TODO: confirm Greek carriers before launch.
    couriers: [],
    pickup: false,
    // TODO: follows whatever Romania proves out.
    paymentMethods: ['cod'],
  },
}

/** Bulgaria is market #1 and the only one currently served. */
export const DEFAULT_MARKET = MARKETS.bg

/**
 * The carriage computeOrderTotals should add. Under 'collect' that is nothing:
 * the courier bills the buyer directly, so the order never carries a fee.
 */
export function carriageTerms(market: Market): { shippingCost: number; freeShippingThreshold: number } {
  return market.carriage === 'collect'
    ? { shippingCost: 0, freeShippingThreshold: 0 }
    : { shippingCost: market.shippingCost, freeShippingThreshold: market.freeShippingThreshold }
}

/**
 * The market an order already on file was taken in.
 *
 * Orders do not store their market — adding that field needs the migration
 * workflow that does not exist yet (docs/ADMIN-PLAN.md) — so it is read from
 * the currency, which is unambiguous while Romania is the only market that
 * displays anything but EUR. Replace with a stored field before Greece.
 */
export function marketForOrder(order: { currency?: string | null }): Market {
  return order.currency === 'RON' ? MARKETS.ro : DEFAULT_MARKET
}

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
    // ro-RO spells EUR out as "EUR" and RON as "RON" under the default display,
    // while the large figures pair formatAmount with currencySymbol ("€", "lei").
    // narrowSymbol gives "€" and "lei" in every locale, so the two agree.
    currencyDisplay: 'narrowSymbol',
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

/** "20%" / "21%" — for labels, so the rate is never typed into a string. */
export const vatLabel = (rate: number): string => `${Math.round(rate * 100)}%`

/**
 * Net → gross, rounded to the cent the way the order route rounds tax, so the
 * with-VAT figure on a product equals what one unit adds to the order total.
 */
export const withVat = (amountEur: number, rate: number): number =>
  Math.round(amountEur * (1 + rate) * 100) / 100

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
