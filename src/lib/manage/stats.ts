import { sql } from '@payloadcms/db-postgres'

import { marketForOrder, type MarketCode } from '@/lib/market'
import { getClient } from '@/lib/manage/session'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/manage/vocabulary'

/**
 * The figures behind the two dashboards — /manage and Payload's own.
 *
 * Every number here is an aggregate computed by Postgres, not a sum over rows
 * fetched into JavaScript. That is the bug this module exists to end: the old
 * Payload dashboard added up the newest 100 orders, cancelled ones included,
 * and printed the all-time order count beside it, so the figure was wrong as
 * soon as there were 101 orders or one cancellation, and the label described a
 * different set of orders from the one that had been summed.
 *
 * NO AUTHENTICATION HAPPENS IN HERE. Unlike every other read in src/lib/manage/,
 * these functions do not call `requireUser()`, because Payload's dashboard
 * renders them inside Payload's admin, which has already checked its session
 * and has no /manage return path to redirect to. The caller is responsible:
 * a /manage page must call `requireUser()` before it calls anything below, and
 * nothing here may be exposed through a route handler or a server action.
 *
 * The rules every figure follows, so the labels on both screens can be exact:
 *
 * - Money is EUR. `orders.total` is stored in EUR whatever the buyer was shown;
 *   `currency` and `exchange_rate` only record what they saw.
 * - A total is the order total — with VAT and shipping — because that is what
 *   the customer pays. Line values (top lines) are unit price × quantity, which
 *   is without VAT and without shipping, as the lines are stored.
 * - "Booked" is every order that is not cancelled. A cancelled order was never
 *   revenue. "Paid" is the booked subset whose payment status is 'paid'.
 * - Days and months are the workshop's, in Europe/Sofia, never the database
 *   server's (which runs on UTC): an order placed at 00:30 on the 1st in Sofia
 *   belongs to the new month. "Last 7 days" is today and the six calendar days
 *   before it, from local midnight — not a rolling 168 hours, which would move
 *   the figure every time the page is reloaded.
 */

const ZONE = 'Europe/Sofia'

type Query = ReturnType<typeof sql>

/**
 * Runs one read and hands back its rows.
 *
 * Payload's Postgres adapter is drizzle over node-postgres, whose `execute`
 * resolves to a pg QueryResult — the rows are on `.rows`. The row type is a
 * promise the SQL keeps, not something pg checks, which is why every column
 * below is cast in SQL and still passed through `num()` on the way out.
 */
async function rows<T extends Record<string, unknown>>(query: Query): Promise<T[]> {
  const payload = await getClient()
  const result = await payload.db.drizzle.execute<T>(query)
  // Typed as pg's Assume<T, QueryResultRow>, which is T for any row type here;
  // TypeScript cannot resolve that while T is still generic.
  return result.rows as T[]
}

/**
 * pg returns `numeric` and `bigint` as strings, to avoid losing precision. The
 * casts to int and float8 in the SQL make them numbers already; this is the
 * belt to that pair of braces, and turns a NULL into 0.
 */
const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Timestamps arrive as Date from pg; the screens format ISO strings. */
const iso = (v: unknown): string | null =>
  v instanceof Date ? v.toISOString() : typeof v === 'string' ? v : null

/** Midnight in Sofia `daysBack` days ago, as a timestamptz. 0 is today. */
const dayStart = (daysBack: number): Query =>
  sql`((date_trunc('day', now() at time zone ${ZONE}::text) - make_interval(days => ${daysBack}::int)) at time zone ${ZONE}::text)`

/** Midnight on the 1st of this month in Sofia, as a timestamptz. */
const monthStart = (): Query =>
  sql`(date_trunc('month', now() at time zone ${ZONE}::text) at time zone ${ZONE}::text)`

// --- Orders by status ---------------------------------------------------------

export type StatusCounts = {
  /** Every status present, zero when no order has it. */
  counts: Record<OrderStatus, number>
  /** All orders, cancelled included — this is a count of records, not revenue. */
  all: number
  pending: number
}

export async function orderStatusCounts(): Promise<StatusCounts> {
  const result = await rows<{ status: string; n: number }>(sql`
    select status::text as status, count(*)::int as n
    from orders
    group by status
  `)

  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, 0])) as Record<
    OrderStatus,
    number
  >
  let all = 0
  for (const row of result) {
    const n = num(row.n)
    all += n
    if (row.status in counts) counts[row.status as OrderStatus] = n
  }

  return { counts, all, pending: counts.pending }
}

// --- Revenue ------------------------------------------------------------------

/** A number of booked orders and what they come to, in EUR. */
export type Figure = { count: number; total: number }

export type Revenue = {
  today: Figure
  last7Days: Figure
  thisMonth: Figure
  /** The part of this month's booked orders whose payment status is 'paid'. */
  thisMonthPaid: Figure
  last30Days: Figure
  allTime: Figure
}

export async function revenue(): Promise<Revenue> {
  const today = dayStart(0)
  const week = dayStart(6)
  const days30 = dayStart(29)
  const month = monthStart()

  const [row] = await rows<Record<string, number>>(sql`
    select
      count(*) filter (where created_at >= ${today})::int as today_count,
      round(coalesce(sum(total) filter (where created_at >= ${today}), 0), 2)::float8 as today_total,
      count(*) filter (where created_at >= ${week})::int as week_count,
      round(coalesce(sum(total) filter (where created_at >= ${week}), 0), 2)::float8 as week_total,
      count(*) filter (where created_at >= ${month})::int as month_count,
      round(coalesce(sum(total) filter (where created_at >= ${month}), 0), 2)::float8 as month_total,
      count(*) filter (where created_at >= ${month} and payment_status = 'paid')::int as paid_count,
      round(coalesce(sum(total) filter (where created_at >= ${month} and payment_status = 'paid'), 0), 2)::float8 as paid_total,
      count(*) filter (where created_at >= ${days30})::int as d30_count,
      round(coalesce(sum(total) filter (where created_at >= ${days30}), 0), 2)::float8 as d30_total,
      count(*)::int as all_count,
      round(coalesce(sum(total), 0), 2)::float8 as all_total
    from orders
    where status <> 'cancelled'
  `)

  const figure = (prefix: string): Figure => ({
    count: num(row?.[`${prefix}_count`]),
    total: num(row?.[`${prefix}_total`]),
  })

  return {
    today: figure('today'),
    last7Days: figure('week'),
    thisMonth: figure('month'),
    thisMonthPaid: figure('paid'),
    last30Days: figure('d30'),
    allTime: figure('all'),
  }
}

// --- Markets ------------------------------------------------------------------

export type MarketFigure = Figure & {
  market: MarketCode
  /**
   * What those buyers were shown, in their own currency, at the rate stored on
   * each order — null for a market that displays EUR, where it would only
   * repeat `total`.
   */
  shown: { currency: string; amount: number } | null
}

/**
 * The last 30 days of booked orders, by market.
 *
 * Orders do not store a market; marketForOrder reads it from the currency, and
 * the grouping goes through that function rather than restating the rule here,
 * so the day a market field replaces it this figure follows. Postgres does the
 * summing per currency; JavaScript only files at most three rows under two
 * markets. Both markets are always returned, so an empty Romania reads as zero
 * rather than disappearing.
 */
export async function marketsLast30Days(): Promise<MarketFigure[]> {
  const result = await rows<{ currency: string | null; n: number; total: number; shown: number }>(sql`
    select
      currency::text as currency,
      count(*)::int as n,
      round(coalesce(sum(total), 0), 2)::float8 as total,
      -- Rounded per order before summing, the way customerMoney rounds the one
      -- figure the buyer saw, so this equals the sum of what the screens show.
      coalesce(sum(round(total * coalesce(exchange_rate, 1), 2)), 0)::float8 as shown
    from orders
    where status <> 'cancelled' and created_at >= ${dayStart(29)}
    group by currency
  `)

  const byMarket = new Map<MarketCode, MarketFigure>(
    (['bg', 'ro'] as const).map((code) => [code, { market: code, count: 0, total: 0, shown: null }]),
  )

  for (const row of result) {
    const market = marketForOrder({ currency: row.currency })
    const entry = byMarket.get(market.code) ?? { market: market.code, count: 0, total: 0, shown: null }
    entry.count += num(row.n)
    entry.total = Math.round((entry.total + num(row.total)) * 100) / 100
    if (row.currency && row.currency !== 'EUR') {
      const amount = Math.round(((entry.shown?.amount ?? 0) + num(row.shown)) * 100) / 100
      entry.shown = { currency: row.currency, amount }
    }
    byMarket.set(market.code, entry)
  }

  return [...byMarket.values()]
}

// --- Top lines ----------------------------------------------------------------

export type TopLine = {
  sku: string | null
  /** The name on the most recent line with this SKU. */
  name: string
  /**
   * How many different names were sold under this SKU. Made-to-measure SKUs
   * are built from the size and pitch, not always the brand, so two brands of
   * the same size can share one — this says when a row has merged them.
   */
  names: number
  quantity: number
  /** Unit price × quantity, EUR, without VAT or shipping. */
  value: number
  orders: number
}

export const TOP_LINES_DAYS = 90

/**
 * The ten lines sold in the greatest quantity over the last 90 days of booked
 * orders, grouped by SKU, or by name for a line that has none.
 */
export async function topLines(limit = 10): Promise<TopLine[]> {
  const result = await rows<{
    sku: string | null
    name: string | null
    names: number
    qty: number
    line_value: number
    orders: number
  }>(sql`
    select
      min(nullif(i.sku, '')) as sku,
      (array_agg(i.name order by o.created_at desc, i._order))[1] as name,
      count(distinct i.name)::int as names,
      round(sum(i.quantity), 3)::float8 as qty,
      round(sum(i.quantity * i.price), 2)::float8 as line_value,
      count(distinct o.id)::int as orders
    from orders_items i
    join orders o on o.id = i._parent_id
    where o.status <> 'cancelled' and o.created_at >= ${dayStart(TOP_LINES_DAYS - 1)}
    -- The prefix keeps a line without a SKU from ever grouping with a SKU that
    -- happens to equal its name.
    group by coalesce(nullif(i.sku, ''), 'name:' || coalesce(i.name, ''))
    order by qty desc, line_value desc
    limit ${Math.max(1, Math.min(50, Math.trunc(limit)))}::int
  `)

  return result.map((row) => ({
    sku: row.sku ?? null,
    name: row.name?.trim() || '—',
    names: num(row.names),
    quantity: num(row.qty),
    value: num(row.line_value),
    orders: num(row.orders),
  }))
}

// --- Customers ----------------------------------------------------------------

export type CustomerStats = {
  total: number
  newThisMonth: number
  /** Customers with at least one booked order. */
  buyers: number
  /** Customers with two or more booked orders. */
  repeat: number
}

/**
 * The repeat share is `repeat / buyers`, not `repeat / total`: a customer
 * record whose only order was cancelled, or one typed in by hand, has not had
 * the chance to come back, and counting it would understate loyalty.
 */
export async function customerStats(): Promise<CustomerStats> {
  const [row] = await rows<Record<string, number>>(sql`
    with per_customer as (
      select o.customer_id, count(*) as n
      from orders o
      join customers c on c.id = o.customer_id
      where o.status <> 'cancelled'
      group by o.customer_id
    )
    select
      (select count(*) from customers)::int as total,
      (select count(*) from customers where created_at >= ${monthStart()})::int as new_this_month,
      (select count(*) from per_customer)::int as buyers,
      (select count(*) from per_customer where n >= 2)::int as repeat
  `)

  return {
    total: num(row?.total),
    newThisMonth: num(row?.new_this_month),
    buyers: num(row?.buyers),
    repeat: num(row?.repeat),
  }
}

// --- Enquiries ----------------------------------------------------------------

/** Enquiries still in status 'new' — nobody has moved them on yet. */
export async function newEnquiryCount(): Promise<number> {
  const [row] = await rows<{ n: number }>(sql`
    select count(*)::int as n from enquiries where status = 'new'
  `)
  return num(row?.n)
}

// --- Stock --------------------------------------------------------------------

export const LOW_STOCK_THRESHOLD = 5

export type LowStock = {
  rows: { id: number; name: string; slug: string; stock: number }[]
  /** Every active product at or under the threshold, not just the rows shown. */
  total: number
}

/**
 * Active products with 5 or fewer in stock, emptiest first.
 *
 * 'out_of_stock' products are left out on purpose: someone has already marked
 * them, so they are not news. `total` is counted before the limit, so a panel
 * showing ten can say "10 от 22" rather than implying ten is all there is.
 */
export async function lowStock(limit = 10): Promise<LowStock> {
  const result = await rows<{ id: number; name: string; slug: string; stock: number; total: number }>(sql`
    select id, name, slug, stock::float8 as stock, (count(*) over ())::int as total
    from products
    where status = 'active' and stock <= ${LOW_STOCK_THRESHOLD}::int
    order by stock asc, name asc
    limit ${Math.max(1, Math.min(100, Math.trunc(limit)))}::int
  `)

  return {
    rows: result.map((row) => ({
      id: num(row.id),
      name: row.name,
      slug: row.slug,
      stock: num(row.stock),
    })),
    total: num(result[0]?.total),
  }
}

// --- Catalogue ----------------------------------------------------------------

export type SeriesCount = {
  /** Null for products that belong to no series. */
  series: string | null
  active: number
  inactive: number
  outOfStock: number
}

/**
 * Products per Saw-Meister series, split by status. What the catalogue offers,
 * not what sells — topLines answers that.
 */
export async function catalogueBySeries(): Promise<SeriesCount[]> {
  const result = await rows<{
    series: string | null
    active: number
    inactive: number
    out_of_stock: number
  }>(sql`
    select
      series::text as series,
      count(*) filter (where status = 'active')::int as active,
      count(*) filter (where status = 'inactive')::int as inactive,
      count(*) filter (where status = 'out_of_stock')::int as out_of_stock
    from products
    group by series
  `)
  return result.map((row) => ({
    series: row.series ?? null,
    active: num(row.active),
    inactive: num(row.inactive),
    outOfStock: num(row.out_of_stock),
  }))
}

// --- Recent orders ------------------------------------------------------------

export type RecentOrder = {
  id: number
  orderNumber: string
  customerName: string | null
  customerCompany: string | null
  status: string | null
  paymentStatus: string | null
  total: number
  currency: string
  createdAt: string | null
}

/** The newest orders, whatever their status — a cancellation is news too. */
export async function recentOrders(limit = 10): Promise<RecentOrder[]> {
  const result = await rows<{
    id: number
    order_number: string | null
    customer_name: string | null
    customer_company: string | null
    status: string | null
    payment_status: string | null
    total: number
    currency: string | null
    created_at: unknown
  }>(sql`
    select
      o.id,
      o.order_number,
      c.name as customer_name,
      c.company as customer_company,
      o.status::text as status,
      o.payment_status::text as payment_status,
      round(o.total, 2)::float8 as total,
      o.currency::text as currency,
      o.created_at
    from orders o
    left join customers c on c.id = o.customer_id
    order by o.created_at desc, o.id desc
    limit ${Math.max(1, Math.min(50, Math.trunc(limit)))}::int
  `)

  return result.map((row) => ({
    id: num(row.id),
    orderNumber: row.order_number ?? String(row.id),
    customerName: row.customer_name ?? null,
    customerCompany: row.customer_company ?? null,
    status: row.status ?? null,
    paymentStatus: row.payment_status ?? null,
    total: num(row.total),
    currency: row.currency ?? 'EUR',
    createdAt: iso(row.created_at),
  }))
}

// --- Everything at once -------------------------------------------------------

export type DashboardStats = {
  statuses: StatusCounts
  revenue: Revenue
  markets: MarketFigure[]
  topLines: TopLine[]
  customers: CustomerStats
  newEnquiries: number
  lowStock: LowStock
  recentOrders: RecentOrder[]
}

/** The /manage dashboard's reads, in parallel. The caller authenticates first. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [statuses, rev, markets, lines, customers, newEnquiries, stock, recent] = await Promise.all([
    orderStatusCounts(),
    revenue(),
    marketsLast30Days(),
    topLines(10),
    customerStats(),
    newEnquiryCount(),
    lowStock(10),
    recentOrders(10),
  ])

  return {
    statuses,
    revenue: rev,
    markets,
    topLines: lines,
    customers,
    newEnquiries,
    lowStock: stock,
    recentOrders: recent,
  }
}
