import type { Where } from 'payload'

import { getClient, requireUser } from '@/lib/manage/session'
import { PAGE_SIZE } from '@/lib/manage/vocabulary'
import { isSeriesKey, type SeriesKey } from '@/lib/series'

/**
 * Read side of the catalogue as staff see it — for a stock-take and a price
 * review, not for authoring.
 *
 * Payload's list is fine for changing one product and hopeless for changing
 * forty: every edit is a page load, a form and a save. This returns one page of
 * rows with exactly the three figures a stock-take touches — stock, status and
 * price — so the screen can put a whole page of them in one form.
 *
 * Nothing writes. The save goes through product-actions.ts, which re-reads
 * every row it is about to change and refuses when the screen was out of date.
 *
 * The labels live here rather than in vocabulary.ts because nothing on the
 * client needs to import them: the page passes the status options down to the
 * editor as props.
 */

/**
 * The three product statuses, mirroring src/payload/collections/Products.ts.
 * `label` is the tab (plural), `option` the select (singular).
 */
export const PRODUCT_STATUSES = [
  { value: 'active', label: 'Активни', option: 'Активен' },
  { value: 'out_of_stock', label: 'Изчерпани', option: 'Изчерпан' },
  { value: 'inactive', label: 'Неактивни', option: 'Неактивен' },
] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]['value']

const STATUS_VALUES = PRODUCT_STATUSES.map((s) => s.value) as readonly string[]

export const isProductStatus = (v: unknown): v is ProductStatus =>
  typeof v === 'string' && STATUS_VALUES.includes(v)

/**
 * Sorts. Each carries a name tie-break: a hundred products share a stock of 20,
 * and without a second key Postgres may order the ties differently on each
 * query — so a row can appear on page 1 and again on page 2 while another never
 * appears at all.
 */
export const PRODUCT_SORTS = {
  name: { label: 'Име', payload: ['name'], dir: 'asc' },
  stock: { label: 'Наличност', payload: ['stock', 'name'], dir: 'asc' },
  'price-desc': { label: 'Най-скъпи', payload: ['-basePrice', 'name'], dir: 'desc' },
  'price-asc': { label: 'Най-евтини', payload: ['basePrice', 'name'], dir: 'asc' },
} as const

export type ProductSortKey = keyof typeof PRODUCT_SORTS

export const DEFAULT_PRODUCT_SORT: ProductSortKey = 'name'

export const isProductSortKey = (v: unknown): v is ProductSortKey =>
  typeof v === 'string' && v in PRODUCT_SORTS

/** "Low" is five or fewer — about a week of a fast-moving size. */
export const LOW_STOCK = 5

export const STOCK_FILTERS = {
  low: { label: `До ${LOW_STOCK} бр.` },
  zero: { label: 'Нулева' },
} as const

export type StockFilter = keyof typeof STOCK_FILTERS

export const isStockFilter = (v: unknown): v is StockFilter =>
  typeof v === 'string' && v in STOCK_FILTERS

/** A series key, or 'none' for the products outside the Saw-Meister lines. */
export type SeriesFilter = SeriesKey | 'none'

export const isSeriesFilter = (v: unknown): v is SeriesFilter => v === 'none' || isSeriesKey(v)

export type ProductQuery = {
  status?: ProductStatus | null
  series?: SeriesFilter | null
  stock?: StockFilter | null
  q?: string
  sort?: ProductSortKey
  page?: number
}

/** The list URL for a query. Defaults are left out so the plain list stays /manage/products. */
export function productsHref(p: ProductQuery): string {
  const sp = new URLSearchParams()
  if (p.status) sp.set('status', p.status)
  if (p.series) sp.set('series', p.series)
  if (p.stock) sp.set('stock', p.stock)
  if (p.q) sp.set('q', p.q)
  if (p.sort && p.sort !== DEFAULT_PRODUCT_SORT) sp.set('sort', p.sort)
  if (p.page && p.page > 1) sp.set('page', String(p.page))
  const query = sp.toString()
  return query ? `/manage/products?${query}` : '/manage/products'
}

/** The query-string keys the list reads — and the only ones a save may carry back. */
export const PRODUCT_LIST_PARAMS = ['status', 'series', 'stock', 'q', 'sort', 'page'] as const

export type ProductRow = {
  id: number
  name: string
  slug: string
  series: string | null
  /** EUR without VAT. Null only on a row that never had one. */
  basePrice: number | null
  stock: number | null
  status: string | null
  /**
   * The row's version as this screen saw it. The save sends it back, so a
   * product changed by someone else in the meantime is refused rather than
   * silently overwritten.
   */
  updatedAt: string
}

export type ProductList = {
  rows: ProductRow[]
  /** Rows matching every filter and the search. */
  total: number
  page: number
  pageCount: number
  /** Per-status totals for the tabs: every filter except status itself. */
  counts: Record<string, number>
  /** All products matching the search and the other filters, across statuses. */
  countAll: number
}

type RawProduct = {
  id: number
  name?: string | null
  slug?: string | null
  series?: string | null
  basePrice?: number | null
  stock?: number | null
  status?: string | null
  updatedAt?: string | null
}

const numOrNull = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

function toRow(doc: RawProduct): ProductRow {
  return {
    id: doc.id,
    name: doc.name?.trim() || `#${doc.id}`,
    slug: doc.slug ?? '',
    series: doc.series ?? null,
    basePrice: numOrNull(doc.basePrice),
    stock: numOrNull(doc.stock),
    status: doc.status ?? null,
    updatedAt: doc.updatedAt ?? '',
  }
}

// --- Filters ----------------------------------------------------------------

/**
 * Name or SKU. The slug is the SKU — it is what an order line records and what
 * is printed on the work order — so both are what someone has in front of them.
 */
function searchWhere(q: string): Where {
  return { or: [{ name: { contains: q } }, { slug: { contains: q } }] }
}

/**
 * A product with no stock recorded counts as none. For a stock-take an empty
 * figure is the same question as a zero: someone has to go and count.
 */
function stockWhere(filter: StockFilter): Where {
  const none: Where = { stock: { exists: false } }
  return filter === 'zero'
    ? { or: [{ stock: { equals: 0 } }, none] }
    : { or: [{ stock: { less_than_equal: LOW_STOCK } }, none] }
}

function seriesWhere(filter: SeriesFilter): Where {
  return filter === 'none' ? { series: { exists: false } } : { series: { equals: filter } }
}

function combine(clauses: (Where | undefined)[]): Where | undefined {
  const present = clauses.filter((c): c is Where => Boolean(c))
  if (present.length === 0) return undefined
  return present.length === 1 ? present[0] : { and: present }
}

// --- Reads ------------------------------------------------------------------

const SELECT = {
  name: true,
  slug: true,
  series: true,
  basePrice: true,
  stock: true,
  status: true,
  updatedAt: true,
} as const

export async function listProducts(query: ProductQuery = {}): Promise<ProductList> {
  await requireUser('/manage/products')
  const payload = await getClient()

  const q = (query.q ?? '').trim()
  const sort: ProductSortKey = isProductSortKey(query.sort) ? query.sort : DEFAULT_PRODUCT_SORT
  const requested = Math.max(1, Math.trunc(query.page ?? 1))

  // Everything but the status, so the tabs can count against it.
  const rest = combine([
    q ? searchWhere(q) : undefined,
    query.series ? seriesWhere(query.series) : undefined,
    query.stock ? stockWhere(query.stock) : undefined,
  ])
  const byStatus = (status: ProductStatus | null | undefined) =>
    combine([status ? { status: { equals: status } } : undefined, rest])

  const find = (page: number) =>
    payload.find({
      collection: 'products',
      where: byStatus(query.status),
      sort: [...PRODUCT_SORTS[sort].payload],
      limit: PAGE_SIZE,
      page,
      depth: 0,
      select: SELECT,
    })

  // Same rule as the order book: the tab counts describe the same search and
  // filters, so "Изчерпани 4" with "ProCut" picked means four ProCut products,
  // not four in the catalogue.
  const [first, countAll, ...perStatus] = await Promise.all([
    find(requested),
    payload.count({ collection: 'products', where: rest }),
    ...PRODUCT_STATUSES.map((s) => payload.count({ collection: 'products', where: byStatus(s.value) })),
  ])

  // A stock-take empties its own filter: set the stock on the last rows of
  // "Нулева" and, after the save, the page they were on no longer exists. Land
  // on the last page that does rather than on an empty table.
  const result =
    first.docs.length === 0 && requested > 1 && first.totalDocs > 0
      ? await find(Math.max(1, first.totalPages ?? 1))
      : first

  const counts: Record<string, number> = {}
  PRODUCT_STATUSES.forEach((s, i) => {
    counts[s.value] = perStatus[i]?.totalDocs ?? 0
  })

  return {
    rows: (result.docs as unknown as RawProduct[]).map(toRow),
    total: result.totalDocs,
    page: result.page ?? requested,
    pageCount: Math.max(1, result.totalPages ?? 1),
    counts,
    countAll: countAll.totalDocs,
  }
}
