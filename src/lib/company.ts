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

/** "гр. Габрово 5300, ул. „Негенска“ 2, България" */
export const formattedAddress = () =>
  `гр. ${COMPANY.address.city} ${COMPANY.address.postalCode}, ${COMPANY.address.street}, ${COMPANY.address.country}`

/**
 * Commercial terms as the code actually implements them — see src/lib/cart.tsx
 * and src/app/api/orders/route.ts. Kept here so the legal pages cannot drift
 * away from what checkout really charges.
 */
export const TERMS = {
  vatRate: 0.2,
  freeShippingThreshold: 200,
  shippingCost: 6,
  currency: 'EUR',
  /** Loop lengths we weld, mirroring the configurator's limits. */
  customLengthMin: 1650,
  customLengthMax: 12000,
} as const
