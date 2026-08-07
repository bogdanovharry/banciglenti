import type { Where } from 'payload'

import { getClient, requireUser } from '@/lib/manage/session'
import {
  DEFAULT_SORT,
  ORDER_STATUSES,
  PAGE_SIZE,
  SORTS,
  isSortKey,
  type OrderStatus,
  type SortKey,
} from '@/lib/manage/vocabulary'

/**
 * Read side of the order book, the way src/lib/catalog.ts is the read side of
 * the catalogue: the screens never touch Payload directly, and every query in
 * here checks the session before it runs.
 *
 * Nothing writes. Status changes, comments and tracking numbers go through the
 * server actions in actions.ts, so no money field is ever reachable from the
 * browser.
 *
 * The labels live in vocabulary.ts, not here — importing this module pulls in
 * Payload and `next/headers`, which a Client Component cannot have.
 */

export type OrderRow = {
  id: number
  orderNumber: string
  status: string | null
  total: number
  currency: string
  createdAt: string | null
  itemCount: number
  customer: {
    name: string | null
    company: string | null
    phone: string | null
    email: string | null
  }
  payment: { method: string | null; status: string | null }
  /** Present once dispatched — the list shows it so nobody opens the order to check. */
  trackingNumber: string | null
}

export type OrderList = {
  rows: OrderRow[]
  /** Rows matching the current filter and search. */
  total: number
  page: number
  pageCount: number
  /** Per-status totals for the tab counts, ignoring the status filter itself. */
  counts: Record<string, number>
  /** All orders matching the search, across every status. */
  countAll: number
}

export type OrderQuery = {
  status?: OrderStatus | null
  q?: string
  sort?: SortKey
  page?: number
}

// --- Mapping ----------------------------------------------------------------

type RawOrder = {
  id: number
  orderNumber?: string | null
  status?: string | null
  total?: number | null
  currency?: string | null
  createdAt?: string | null
  items?: unknown[] | null
  customer?: unknown
  payment?: { method?: string | null; status?: string | null } | null
  shipping?: { trackingNumber?: string | null } | null
}

function toRow(doc: RawOrder): OrderRow {
  // depth: 1 populates the relationship; a bare id survives as a number if a
  // customer row was deleted, and the list still has to render.
  const c =
    doc.customer && typeof doc.customer === 'object'
      ? (doc.customer as {
          name?: string | null
          company?: string | null
          phone?: string | null
          email?: string | null
        })
      : null

  return {
    id: doc.id,
    orderNumber: doc.orderNumber ?? String(doc.id),
    status: doc.status ?? null,
    total: typeof doc.total === 'number' ? doc.total : 0,
    currency: doc.currency ?? 'EUR',
    createdAt: doc.createdAt ?? null,
    itemCount: Array.isArray(doc.items) ? doc.items.length : 0,
    customer: {
      name: c?.name ?? null,
      company: c?.company ?? null,
      phone: c?.phone ?? null,
      email: c?.email ?? null,
    },
    payment: { method: doc.payment?.method ?? null, status: doc.payment?.status ?? null },
    trackingNumber: doc.shipping?.trackingNumber ?? null,
  }
}

/**
 * The search box matches the order number.
 *
 * `contains` rather than `equals` because the number is typed off a printed
 * work order or read back over the phone, and people give the last four digits.
 */
function searchWhere(q: string): Where {
  return { orderNumber: { contains: q } }
}

/** The two filters combine with AND; either may be absent. */
function combine(status: OrderStatus | null | undefined, search: Where | undefined): Where | undefined {
  const byStatus: Where | undefined = status ? { status: { equals: status } } : undefined
  if (byStatus && search) return { and: [byStatus, search] }
  return byStatus ?? search
}

// --- Reads ------------------------------------------------------------------

export async function listOrders(query: OrderQuery = {}): Promise<OrderList> {
  await requireUser()
  const payload = await getClient()

  const q = (query.q ?? '').trim()
  const sort: SortKey = isSortKey(query.sort) ? query.sort : DEFAULT_SORT
  const page = Math.max(1, Math.trunc(query.page ?? 1))

  const search = q ? searchWhere(q) : undefined
  const where = combine(query.status, search)

  // The tab counts describe the same search, so they stay honest as it is
  // narrowed: with "1042" typed, "Чакащи 1" means one pending order matches
  // that number, not one pending order exists.
  const [result, countAll, ...perStatus] = await Promise.all([
    payload.find({
      collection: 'orders',
      where,
      sort: SORTS[sort].payload,
      limit: PAGE_SIZE,
      page,
      depth: 1,
    }),
    payload.count({ collection: 'orders', where: search }),
    ...ORDER_STATUSES.map((s) =>
      payload.count({ collection: 'orders', where: combine(s.value, search) }),
    ),
  ])

  const counts: Record<string, number> = {}
  ORDER_STATUSES.forEach((s, i) => {
    counts[s.value] = perStatus[i]?.totalDocs ?? 0
  })

  return {
    rows: (result.docs as unknown as RawOrder[]).map(toRow),
    total: result.totalDocs,
    page: result.page ?? page,
    pageCount: result.totalPages ?? 1,
    counts,
    countAll: countAll.totalDocs,
  }
}
