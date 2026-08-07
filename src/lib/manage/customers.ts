import type { Where } from 'payload'
import { cache } from 'react'

import { getClient, requireUser } from '@/lib/manage/session'
import { PAGE_SIZE } from '@/lib/manage/vocabulary'

/**
 * Read side of the customer book.
 *
 * The order list answers "what needs doing". This answers "who is this" — what
 * they have bought, what they asked about, and what machines they run, which is
 * the question that decides what to sell them next.
 */

export const CUSTOMER_SORTS = {
  spend: { label: 'Най-много похарчено', local: true },
  recent: { label: 'Последна поръчка', local: true },
  name: { label: 'По име', payload: 'name' },
  newest: { label: 'Най-нови', payload: '-createdAt' },
} as const

export type CustomerSortKey = keyof typeof CUSTOMER_SORTS

export const DEFAULT_CUSTOMER_SORT: CustomerSortKey = 'spend'

export const isCustomerSortKey = (v: unknown): v is CustomerSortKey =>
  typeof v === 'string' && v in CUSTOMER_SORTS

export type CustomerMachine = {
  index: number
  brand: string
  model: string
  bladeLength: number | null
  bladeWidth: number | null
  bladeThickness: number | null
  source: string | null
  notes: string | null
}

export type CustomerRow = {
  id: number
  name: string
  company: string | null
  email: string
  phone: string | null
  createdAt: string | null
  orderCount: number
  /** Cancelled orders excluded — they were never revenue. */
  totalSpent: number
  lastOrderAt: string | null
  machineCount: number
}

export type CustomerOrderLine = {
  id: number
  orderNumber: string
  status: string | null
  total: number
  createdAt: string | null
  itemCount: number
}

export type CustomerEnquiry = {
  id: number
  status: string | null
  message: string
  createdAt: string | null
}

export type CustomerDetail = {
  id: number
  name: string
  company: string | null
  email: string
  phone: string | null
  taxId: string | null
  vatNumber: string | null
  vatNumberValidated: boolean
  createdAt: string | null
  addresses: {
    label: string | null
    street: string | null
    city: string | null
    postalCode: string | null
    country: string | null
    isDefault: boolean
  }[]
  machines: CustomerMachine[]
  orders: CustomerOrderLine[]
  orderCount: number
  totalSpent: number
  enquiries: CustomerEnquiry[]
}

type RawCustomer = {
  id: number
  name?: string | null
  company?: string | null
  email?: string | null
  phone?: string | null
  taxId?: string | null
  vatNumber?: string | null
  vatNumberValidated?: boolean | null
  createdAt?: string | null
  addresses?: Record<string, unknown>[] | null
  machines?: Record<string, unknown>[] | null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const numOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

function toMachines(rows: Record<string, unknown>[] | null | undefined): CustomerMachine[] {
  return (rows ?? []).map((m, index) => ({
    index,
    brand: str(m.brand) ?? '—',
    model: str(m.model) ?? '—',
    bladeLength: numOrNull(m.bladeLength),
    bladeWidth: numOrNull(m.bladeWidth),
    bladeThickness: numOrNull(m.bladeThickness),
    source: str(m.source),
    notes: str(m.notes),
  }))
}

/**
 * Every order, once per request, keyed by customer.
 *
 * Payload has no group-by, and the customer list needs a spend and an order
 * count per row — so N queries for N customers, or one pass over the orders.
 * This is the one pass. `cache` keeps it to a single trip even though the list
 * and its sort both want it.
 *
 * It reads in pages rather than one huge query, and stops at CEILING. That
 * limit is reported rather than swallowed: a total that quietly omitted older
 * orders would be worse than no total at all. The old platform holds 5 766
 * orders, so the ceiling is set above that with room to spare.
 */
const CEILING = 20000

type Aggregate = {
  byCustomer: Map<number, { count: number; spent: number; lastAt: string | null }>
  /** True when there were more orders than the pass was willing to read. */
  truncated: boolean
}

const aggregateOrders = cache(async (): Promise<Aggregate> => {
  const payload = await getClient()
  const byCustomer: Aggregate['byCustomer'] = new Map()

  let page = 1
  let read = 0
  let truncated = false

  for (;;) {
    const batch = await payload.find({
      collection: 'orders',
      limit: 500,
      page,
      depth: 0,
      sort: '-createdAt',
      select: { customer: true, total: true, status: true, createdAt: true },
    })

    for (const doc of batch.docs as unknown as {
      customer?: unknown
      total?: number | null
      status?: string | null
      createdAt?: string | null
    }[]) {
      const id =
        typeof doc.customer === 'number'
          ? doc.customer
          : doc.customer && typeof doc.customer === 'object'
            ? ((doc.customer as { id?: number }).id ?? null)
            : null
      if (id === null) continue

      const entry = byCustomer.get(id) ?? { count: 0, spent: 0, lastAt: null }
      entry.count += 1
      // A cancelled order is not money the customer spent, and counting it
      // would rank a serial canceller alongside a real buyer.
      if (doc.status !== 'cancelled' && typeof doc.total === 'number') entry.spent += doc.total
      if (doc.createdAt && (!entry.lastAt || doc.createdAt > entry.lastAt)) {
        entry.lastAt = doc.createdAt
      }
      byCustomer.set(id, entry)
    }

    read += batch.docs.length
    if (!batch.hasNextPage) break
    if (read >= CEILING) {
      truncated = true
      break
    }
    page += 1
  }

  return { byCustomer, truncated }
})

export type CustomerList = {
  rows: CustomerRow[]
  total: number
  page: number
  pageCount: number
  /** Set when the spend figures are computed over an incomplete order set. */
  spendTruncated: boolean
}

function searchWhere(q: string): Where {
  // Whoever is looking has one of these in front of them: a name off a
  // delivery note, a company from an invoice, or the email or phone the
  // customer just rang from.
  return {
    or: [
      { name: { contains: q } },
      { company: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ],
  }
}

export async function listCustomers(
  query: { q?: string; sort?: CustomerSortKey; page?: number } = {},
): Promise<CustomerList> {
  await requireUser('/manage/customers')
  const payload = await getClient()

  const q = (query.q ?? '').trim()
  const sort = isCustomerSortKey(query.sort) ? query.sort : DEFAULT_CUSTOMER_SORT
  const page = Math.max(1, Math.trunc(query.page ?? 1))
  const where = q ? searchWhere(q) : undefined

  const config = CUSTOMER_SORTS[sort]

  const [result, aggregate] = await Promise.all([
    payload.find({
      collection: 'customers',
      where,
      // The two money sorts are computed here, not in the database — Payload
      // cannot order by a figure it does not store. Those fetch a wider slice
      // and sort it in memory; see below.
      sort: 'payload' in config ? config.payload : 'name',
      limit: 'local' in config ? 1000 : PAGE_SIZE,
      page: 'local' in config ? 1 : page,
      depth: 0,
    }),
    aggregateOrders(),
  ])

  const all: CustomerRow[] = (result.docs as unknown as RawCustomer[]).map((doc) => {
    const stats = aggregate.byCustomer.get(doc.id) ?? { count: 0, spent: 0, lastAt: null }
    return {
      id: doc.id,
      name: str(doc.name) ?? '—',
      company: str(doc.company),
      email: str(doc.email) ?? '—',
      phone: str(doc.phone),
      createdAt: doc.createdAt ?? null,
      orderCount: stats.count,
      totalSpent: Math.round(stats.spent * 100) / 100,
      lastOrderAt: stats.lastAt,
      machineCount: (doc.machines ?? []).length,
    }
  })

  if (!('local' in config)) {
    return {
      rows: all,
      total: result.totalDocs,
      page: result.page ?? page,
      pageCount: result.totalPages ?? 1,
      spendTruncated: aggregate.truncated,
    }
  }

  // Sorted on a derived figure, so paged here too.
  all.sort((a, b) =>
    sort === 'spend'
      ? b.totalSpent - a.totalSpent
      : (b.lastOrderAt ?? '').localeCompare(a.lastOrderAt ?? ''),
  )

  const start = (page - 1) * PAGE_SIZE
  return {
    rows: all.slice(start, start + PAGE_SIZE),
    total: all.length,
    page,
    pageCount: Math.max(1, Math.ceil(all.length / PAGE_SIZE)),
    spendTruncated: aggregate.truncated,
  }
}

export async function getCustomer(id: number): Promise<CustomerDetail | null> {
  await requireUser(`/manage/customers/${id}`)
  const payload = await getClient()

  let doc: RawCustomer | null = null
  try {
    doc = (await payload.findByID({
      collection: 'customers',
      id,
      depth: 0,
    })) as unknown as RawCustomer
  } catch {
    return null
  }
  if (!doc) return null

  const email = str(doc.email)

  const [orders, enquiries] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { customer: { equals: id } },
      sort: '-createdAt',
      limit: 200,
      depth: 0,
    }),
    // Enquiries carry no customer relationship — the contact form is open to
    // people who have never ordered. Email is the only thing that ties the two
    // together, and it is what the order route reuses a customer record by.
    email
      ? payload.find({
          collection: 'enquiries',
          where: { email: { equals: email } },
          sort: '-createdAt',
          limit: 50,
          depth: 0,
        })
      : Promise.resolve({ docs: [] as unknown[] }),
  ])

  const orderRows = (orders.docs as unknown as {
    id: number
    orderNumber?: string | null
    status?: string | null
    total?: number | null
    createdAt?: string | null
    items?: unknown[] | null
  }[]).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber ?? String(o.id),
    status: o.status ?? null,
    total: typeof o.total === 'number' ? o.total : 0,
    createdAt: o.createdAt ?? null,
    itemCount: Array.isArray(o.items) ? o.items.length : 0,
  }))

  const spent = orderRows
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  return {
    id: doc.id,
    name: str(doc.name) ?? '—',
    company: str(doc.company),
    email: email ?? '—',
    phone: str(doc.phone),
    taxId: str(doc.taxId),
    vatNumber: str(doc.vatNumber),
    vatNumberValidated: doc.vatNumberValidated === true,
    createdAt: doc.createdAt ?? null,
    addresses: (doc.addresses ?? []).map((a) => ({
      label: str(a.label),
      street: str(a.street),
      city: str(a.city),
      postalCode: str(a.postalCode),
      country: str(a.country),
      isDefault: a.isDefault === true,
    })),
    machines: toMachines(doc.machines),
    orders: orderRows,
    orderCount: orderRows.length,
    totalSpent: Math.round(spent * 100) / 100,
    enquiries: (enquiries.docs as unknown as {
      id: number
      status?: string | null
      message?: string | null
      createdAt?: string | null
    }[]).map((e) => ({
      id: e.id,
      status: e.status ?? null,
      message: e.message ?? '',
      createdAt: e.createdAt ?? null,
    })),
  }
}
