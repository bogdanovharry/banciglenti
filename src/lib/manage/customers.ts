import { sql } from '@payloadcms/db-postgres'

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
  spend: { label: 'Най-много похарчено' },
  recent: { label: 'Последна поръчка' },
  name: { label: 'По име' },
  newest: { label: 'Най-нови' },
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
  /** Posted back by every form on the screen; see `isStale` in customer-actions.ts. */
  updatedAt: string | null
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
  /** The most recent ORDER_LIMIT orders; `orderCount` is the full count. */
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
  updatedAt?: string | null
  addresses?: Record<string, unknown>[] | null
  machines?: Record<string, unknown>[] | null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const numOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null
const iso = (v: unknown): string | null =>
  v instanceof Date ? v.toISOString() : typeof v === 'string' ? v : null

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
 * Raw SQL through Payload's own connection.
 *
 * The list sorts on figures no collection stores — a customer's spend and the
 * date of their last order. Payload has no group-by, so this used to read every
 * order into memory and fetch at most 1 000 customers to sort among, which
 * silently dropped everyone past the thousandth once the old platform's
 * customers arrive. Postgres does the grouping, the sort and the paging now,
 * whatever the size of the book.
 */
type Rows = { rows: Record<string, unknown>[] }

async function query(statement: ReturnType<typeof sql>): Promise<Record<string, unknown>[]> {
  const payload = await getClient()
  const drizzle = (payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<Rows> } }).drizzle
  return (await drizzle.execute(statement)).rows
}

/** Postgres LIKE treats % and _ as wildcards; a search for "50%" should not. */
const likePattern = (q: string): string => `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

const ORDER_BY: Record<CustomerSortKey, ReturnType<typeof sql>> = {
  spend: sql`total_spent desc, c.id desc`,
  recent: sql`last_order_at desc nulls last, c.id desc`,
  name: sql`lower(c.name) asc, c.id asc`,
  newest: sql`c.created_at desc, c.id desc`,
}

export type CustomerList = {
  rows: CustomerRow[]
  total: number
  page: number
  pageCount: number
}

export async function listCustomers(
  input: { q?: string; sort?: CustomerSortKey; page?: number } = {},
): Promise<CustomerList> {
  await requireUser('/manage/customers')

  const q = (input.q ?? '').trim()
  const sort = isCustomerSortKey(input.sort) ? input.sort : DEFAULT_CUSTOMER_SORT
  const page = Math.max(1, Math.trunc(input.page ?? 1))

  // Whoever is looking has one of these in front of them: a name off a
  // delivery note, a company from an invoice, or the email or phone the
  // customer just rang from.
  const pattern = likePattern(q)
  const where = q
    ? sql`where (c.name ilike ${pattern} or c.company ilike ${pattern} or c.email ilike ${pattern} or c.phone ilike ${pattern})`
    : sql``

  const [rows, counted] = await Promise.all([
    query(sql`
      select c.id, c.name, c.company, c.email, c.phone, c.created_at,
             coalesce(o.order_count, 0)::int as order_count,
             -- A cancelled order is not money the customer spent, and counting
             -- it would rank a serial canceller alongside a real buyer.
             coalesce(o.total_spent, 0)::float as total_spent,
             o.last_order_at,
             (select count(*) from customers_machines m where m._parent_id = c.id)::int as machine_count
        from customers c
        left join (
          select customer_id,
                 count(*) as order_count,
                 sum(total) filter (where status <> 'cancelled') as total_spent,
                 max(created_at) as last_order_at
            from orders
           group by customer_id
        ) o on o.customer_id = c.id
        ${where}
       order by ${ORDER_BY[sort]}
       limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}
    `),
    query(sql`select count(*)::int as total from customers c ${where}`),
  ])

  const total = Number(counted[0]?.total ?? 0)

  return {
    rows: rows.map((r) => ({
      id: Number(r.id),
      name: str(r.name) ?? '—',
      company: str(r.company),
      email: str(r.email) ?? '—',
      phone: str(r.phone),
      createdAt: iso(r.created_at),
      orderCount: Number(r.order_count ?? 0),
      totalSpent: Math.round(Number(r.total_spent ?? 0) * 100) / 100,
      lastOrderAt: iso(r.last_order_at),
      machineCount: Number(r.machine_count ?? 0),
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

/** How many orders the customer screen lists; the count and spend cover all of them. */
const ORDER_LIMIT = 200

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

  const [orders, enquiries, totals] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { customer: { equals: id } },
      sort: '-createdAt',
      limit: ORDER_LIMIT,
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
    // Counted in the database, not from the listed orders: a customer with more
    // than ORDER_LIMIT orders used to show ORDER_LIMIT as their count.
    query(sql`
      select count(*)::int as order_count,
             coalesce(sum(total) filter (where status <> 'cancelled'), 0)::float as total_spent
        from orders where customer_id = ${id}
    `),
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

  return {
    id: doc.id,
    updatedAt: doc.updatedAt ?? null,
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
    orderCount: Number(totals[0]?.order_count ?? orderRows.length),
    totalSpent: Math.round(Number(totals[0]?.total_spent ?? 0) * 100) / 100,
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

/**
 * The address to offer on a new order: the one the customer's latest order went
 * to. Checkout never saves addresses to the customer record, so their last
 * delivery is the best guess there is — and it is only a default in a textarea.
 */
export async function lastDelivery(customerId: number): Promise<{
  address: string | null
  office: string | null
  currency: string | null
}> {
  await requireUser('/manage/orders/new')
  const payload = await getClient()
  const latest = await payload.find({
    collection: 'orders',
    where: { customer: { equals: customerId } },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    select: { shipping: true, currency: true },
  })
  const doc = latest.docs[0] as unknown as
    | { shipping?: { address?: string | null; office?: string | null; method?: string | null }; currency?: string | null }
    | undefined

  return {
    address: doc?.shipping?.method === 'pickup' ? null : (doc?.shipping?.address ?? null),
    office: doc?.shipping?.office ?? null,
    currency: doc?.currency ?? null,
  }
}
