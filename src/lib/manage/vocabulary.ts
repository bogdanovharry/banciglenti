/**
 * The words and keys the management screens agree on.
 *
 * Separate from orders.ts for the same reason routes.ts is separate from
 * session.ts: the status select and the status pill are Client Components, and
 * orders.ts reaches the database. Importing a list of six labels must not drag
 * `next/headers` and the Payload client into the browser bundle — which it did,
 * and the build said so.
 *
 * Nothing in this file may import anything that touches a request.
 */

/**
 * The six statuses, in the order work actually moves through them, mirroring
 * the options in src/payload/collections/Orders.ts. One list, because the tabs,
 * the pills, the select and the query all have to agree; three copies of six
 * strings is how they stop agreeing.
 */
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Чакащи', pill: 'Чакаща' },
  { value: 'confirmed', label: 'Потвърдени', pill: 'Потвърдена' },
  { value: 'processing', label: 'В обработка', pill: 'В обработка' },
  { value: 'shipped', label: 'Изпратени', pill: 'Изпратена' },
  { value: 'delivered', label: 'Доставени', pill: 'Доставена' },
  { value: 'cancelled', label: 'Отказани', pill: 'Отказана' },
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]['value']

const STATUS_VALUES = ORDER_STATUSES.map((s) => s.value) as readonly string[]

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && STATUS_VALUES.includes(value)
}

export const statusPill = (value: string | null | undefined): string =>
  ORDER_STATUSES.find((s) => s.value === value)?.pill ?? '—'

export const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Очаква',
  paid: 'Платена',
  failed: 'Неуспешна',
  refunded: 'Възстановена',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  mypos: 'myPOS',
  cod: 'Наложен платеж',
  bank_transfer: 'Банков превод',
}

/** Enquiry states, mirroring src/payload/collections/Enquiries.ts. */
export const ENQUIRY_LABEL: Record<string, string> = {
  new: 'Ново',
  in_progress: 'В процес',
  closed: 'Приключено',
}

// --- List query vocabulary --------------------------------------------------

export const SORTS = {
  newest: { label: 'Най-нови', payload: '-createdAt' },
  oldest: { label: 'Най-стари', payload: 'createdAt' },
  largest: { label: 'Най-голяма сума', payload: '-total' },
  smallest: { label: 'Най-малка сума', payload: 'total' },
} as const

export type SortKey = keyof typeof SORTS

export const DEFAULT_SORT: SortKey = 'newest'

export function isSortKey(value: unknown): value is SortKey {
  return typeof value === 'string' && value in SORTS
}

/** 50 a page, matching what the Payload list used, and what fits a screen. */
export const PAGE_SIZE = 50
