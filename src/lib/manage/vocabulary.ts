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

/**
 * Where an order may go from where it is.
 *
 * Any-to-any let a cancelled order be marked shipped and a delivered one go
 * back to pending — each a status nobody could explain later. These are the
 * moves work actually makes, including the step back a person takes after a
 * mis-click ("Потвърдена" → "Чакаща"). A shipped parcel can still end as
 * "Отказана": a cash-on-delivery customer who refuses it at the door.
 *
 * "Доставена" and "Отказана" are closed. Reopening one is a correction, so it
 * is an administrator's, and it still goes through the history like any other.
 */
const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['pending', 'processing', 'shipped', 'cancelled'],
  processing: ['confirmed', 'shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const ADMIN_CORRECTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  shipped: ['processing'],
  delivered: ['shipped'],
  cancelled: ['pending'],
}

export function nextStatuses(current: string | null | undefined, admin: boolean): OrderStatus[] {
  if (!isOrderStatus(current)) return ['pending']
  return [...NEXT_STATUS[current], ...(admin ? (ADMIN_CORRECTIONS[current] ?? []) : [])]
}

/**
 * Why an order's lines and delivery method can no longer change, or null when
 * they can.
 *
 * Both move the total. Once a parcel has left, or money has been taken against
 * a figure, changing that figure silently is how the books and the customer
 * stop agreeing — so the screen says why instead of offering the controls.
 */
export function moneyLockReason(order: {
  status: string | null | undefined
  paymentStatus: string | null | undefined
}): string | null {
  if (order.status !== 'pending' && order.status !== 'confirmed' && order.status !== 'processing') {
    return `Поръчката е „${statusPill(order.status)}“ — редовете и начинът на доставка вече не се променят.`
  }
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
    return 'Плащането е отбелязано — редовете и начинът на доставка не се променят, докато плащането не е „Очаква“.'
  }
  return null
}

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
