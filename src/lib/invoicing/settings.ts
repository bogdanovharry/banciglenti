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

export const INVOICE_SETTINGS = {
  /** Countries where a VIES-valid buyer, delivered inside that country, is zero-rated. */
  zeroRateCountries: ['RO'],
  /** Open decision 7. Must be chosen explicitly by the owner before go-live. */
  businessPricing: 'same-gross' as BusinessPricing,
} as const
