/**
 * Paths and nav vocabulary for the management screens.
 *
 * Separate from session.ts so the nav can be a Client Component: session.ts
 * imports `next/headers` and Payload, neither of which can cross into the
 * browser bundle. Everything here is a plain string.
 */

/** Payload's own auth views — this app never handles a password. */
export const LOGIN_PATH = '/admin/login'
export const LOGOUT_PATH = '/admin/logout'

/** Payload keeps Articles, Pages and Media; the rail links back to them. */
export const PAYLOAD_ADMIN = '/admin'

/** Where an order number leads. */
export const orderHref = (id: number): string => `/manage/orders/${id}`

export type NavItem = {
  href: string
  label: string
  /** Ordinal in the mono rail, in the storefront's section-number idiom. */
  n: string
  /**
   * Active only on this exact path. The dashboard lives at /manage, which every
   * other screen's path also starts with.
   */
  exact?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/manage', label: 'Табло', n: '00', exact: true },
  { href: '/manage/orders', label: 'Поръчки', n: '01' },
  { href: '/manage/customers', label: 'Клиенти', n: '02' },
  { href: '/manage/products', label: 'Продукти', n: '03' },
]
