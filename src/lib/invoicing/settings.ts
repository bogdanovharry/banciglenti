/**
 * Invoice settings — configuration, not logic.
 *
 * Nothing here is a legal fact. The texts below are placeholders waiting for the
 * owner and the accountant; `confirmed: false` must stay until they say
 * otherwise, and no screen may present them as legally verified.
 */

export type InvoiceLanguage = 'bg' | 'ro'

/** Basis printed on a zero-rated invoice. One text per language. */
export type LegalBasis = {
  /** null = nobody has supplied this text yet. It is never invented. */
  text: string | null
  /** True only after the owner/accountant confirmed the exact wording. */
  confirmed: boolean
}

export const ZERO_RATE_BASIS: Record<InvoiceLanguage, LegalBasis> = {
  // Wording taken from the NRA handbook example; the exact text is still to be
  // confirmed with the owner (instructions, section 3, case B).
  bg: { text: 'облагане с 0% по силата на чл. 53, ал. 1, във вр. с чл. 7 от ЗДДС', confirmed: false },
  // No Romanian wording has been supplied.
  ro: { text: null, confirmed: false },
}

/**
 * The supplier's details come from stored settings (decision 8 in the
 * instructions), so only the shape is defined here.
 */
export type SupplierDetails = {
  legalName: string
  registrationNumber: string
  vatNumber: string
  address: string
  representative: string
  bankAccount: string | null
}

/** How a company with a valid VAT number is priced (decision 7, still open). */
export type BusinessPricing = 'same-gross' | 'net'

/**
 * Which currencies the invoice shows. Decided 2026-11-10: ONE invoice, with the
 * amounts in lei and their euro equivalent side by side (no second, mirror
 * invoice). See `euroRate` below for which rate the euro figures use.
 */
export type InvoiceCurrencies = { primary: 'RON'; alsoShow: 'EUR' | null }

export const INVOICE_SETTINGS = {
  /**
   * Numbering — PROVISIONAL, chosen by Claude on 2026-11-10 at the owner's
   * request ("think it up for now"); the accountant has not seen it.
   * A separate series for the website. The number is ten digits, unique within
   * the series, and given by a counter inside the same transaction that stores
   * the invoice, so there are no duplicates and no gaps. It starts at a high
   * value so it cannot collide with the numbers of the company's own invoices,
   * whatever range those are in. Changing `code` starts a new series.
   */
  series: { code: 'RO', firstNumber: 9_000_000_001 },
  currencies: { primary: 'RON', alsoShow: 'EUR' } as InvoiceCurrencies,
  /**
   * How the euro equivalent is worked out. PROVISIONAL.
   * 'SHOP' = the order's own euro amounts, i.e. the same fixed rate that turned
   * the euro price into lei at checkout (5.2567, BNR of 14 Sep). It is exact for
   * what the buyer was charged, but it is NOT an official rate for the day of
   * the tax event; the owner said the real rate ("ECB" or "BNR", for which date)
   * will be chosen later, with the accountant. The preview says so.
   */
  euroRate: { source: 'SHOP', date: 'order' } as null | { source: 'ECB' | 'BNR' | 'SHOP'; date: 'dispatch' | 'delivery' | 'order' },
  /** Countries where a buyer with an accepted VAT number, delivered inside that country, is zero-rated. */
  zeroRateCountries: ['RO'],
  /** Open decision 7. Must be chosen explicitly by the owner before go-live. */
  businessPricing: 'same-gross' as BusinessPricing,
} as const
