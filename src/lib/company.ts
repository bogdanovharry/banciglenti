import { MARKETS, type Market } from './market'

/**
 * The selling entity. One Bulgarian company sells into every market, so this
 * stays a single constant rather than a per-market value — see the multi-market
 * plan. Everything here is verifiable from existing site content; nothing is
 * invented.
 *
 * Previously duplicated across Footer.tsx and checkout/page.tsx.
 */
export const COMPANY = {
  legalName: 'ТЕХНОЛЕС ООД',
  tradeName: 'ТЕХНОЛЕС',
  vatNumber: 'BG817088234',
  /**
   * Company registration number (ЕИК), Търговски регистър / Commercial Register
   * of Bulgaria. DERIVED from the VAT number — for a Bulgarian ООД the ЕИК is
   * the nine digits after "BG". It was NOT read from the register: the owner
   * must confirm it before the legal pages go live.
   */
  eik: '817088234',
  foundedYear: 1993,

  address: {
    street: 'ул. „Негенска“ 2',
    postalCode: '5300',
    city: 'Габрово',
    country: 'България',
  },

  phone: {
    office: { display: '066 800 822', href: 'tel:+35966800822' },
    mobile: { display: '+359 878 800 162', href: 'tel:+359878800162' },
  },
  email: 'tehnoles@tehnoles.com',

  bank: {
    name: 'UniCredit Bulbank',
    iban: 'BG80 UNCR 7000 1522 5765 37',
    bic: 'UNCRBGSF',
  },

  hours: 'Пн–Пт 8:00–17:30',
} as const

/**
 * The same entity written in Latin script, for markets that cannot read
 * Cyrillic. A Romanian or Greek buyer looking at "ТЕХНОЛЕС ООД, гр. Габрово"
 * cannot read the seller's name, the city, or the street they would ship a
 * return to — which is a problem for a mandatory legal disclosure.
 *
 * "TEHNOLES" is not a transliteration invented here: the business already uses
 * it in tehnoles.com and tehnoles@tehnoles.com.
 *
 * Only the script changes. VAT number, IBAN, BIC and email are script-neutral
 * and are deliberately not duplicated — one copy cannot drift from another.
 *
 * The phone is written in full international form, because 066 800 822 is not
 * dialable from outside Bulgaria.
 */
export const COMPANY_LATIN = {
  legalName: 'TEHNOLES Ltd.',
  tradeName: 'TEHNOLES',

  address: {
    street: 'ul. Negenska 2',
    postalCode: '5300',
    city: 'Gabrovo',
    country: 'Bulgaria',
  },

  phone: {
    office: { display: '+359 66 800 822', href: 'tel:+35966800822' },
    mobile: { display: '+359 878 800 162', href: 'tel:+359878800162' },
  },

  hours: 'Mon–Fri 8:00–17:30',
} as const

/**
 * Company details in the script the market can read. Bulgarian keeps the
 * registered Cyrillic form; every other market gets Latin.
 *
 * Note for invoices: the name entered in the Bulgarian commercial register is
 * the Cyrillic one. Showing the Latin form to the customer is normal practice,
 * but an invoice should carry the registered name too — confirm the exact
 * wording with the accountant before the first Romanian invoice goes out.
 */
export function companyFor(locale: string) {
  const latin = !locale.startsWith('bg')

  return {
    ...COMPANY,
    ...(latin ? COMPANY_LATIN : {}),
    address: latin ? COMPANY_LATIN.address : COMPANY.address,
    phone: latin ? COMPANY_LATIN.phone : COMPANY.phone,
  }
}

/** "гр. Габрово 5300, ул. „Негенска“ 2, България" */
export const formattedAddress = () =>
  `гр. ${COMPANY.address.city} ${COMPANY.address.postalCode}, ${COMPANY.address.street}, ${COMPANY.address.country}`

/**
 * Commercial terms as the code actually implements them — see src/lib/cart.tsx
 * and src/app/api/checkout/route.ts. Kept here so the legal pages cannot drift
 * away from what checkout really charges.
 */
export const TERMS = {
  vatRate: MARKETS.bg.vatRate,
  freeShippingThreshold: MARKETS.bg.freeShippingThreshold,
  shippingCost: MARKETS.bg.shippingCost,
  currency: MARKETS.bg.displayCurrency,
  /** Below this we do not weld; above it there is no upper limit. */
  customLengthMin: 1000,
} as const

/** "ul. Negenska 2, 5300 Gabrovo, Bulgaria" for Latin-script markets; Cyrillic via formattedAddress(). */
export function addressLine(locale: string): string {
  if (locale.startsWith('bg')) return formattedAddress()
  const a = COMPANY_LATIN.address
  return `${a.street}, ${a.postalCode} ${a.city}, ${a.country}`
}

/** "5,2567" — the fixed EUR rate in the market's own number format. */
export function rateLabel(market: Market): string {
  return new Intl.NumberFormat(market.locale, { maximumFractionDigits: 4 }).format(market.exchangeRate)
}

/**
 * The commercial terms of one market, read from the market registry so the
 * legal pages cannot disagree with what checkout charges. Amounts are in EUR,
 * the authored currency; format them with formatPrice(amount, market).
 */
export function termsFor(market: Market) {
  return {
    vatPercent: Math.round(market.vatRate * 100),
    currency: market.displayCurrency,
    exchangeRate: market.exchangeRate,
    /** 'collect' = the courier bills its own fee at the door. */
    carriage: market.carriage,
    shippingCost: market.shippingCost,
    freeShippingThreshold: market.freeShippingThreshold,
    couriers: market.couriers,
    pickup: market.pickup,
    cod: market.paymentMethods.includes('cod'),
    bankTransfer: market.paymentMethods.includes('bank_transfer'),
    customLengthMin: TERMS.customLengthMin,
  }
}
