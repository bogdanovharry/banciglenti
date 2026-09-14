import type { Metadata } from 'next'
import Link from 'next/link'

import { ProductsEditor, type EditorRow, type SortLink } from './ProductsEditor'
import { money } from '@/lib/manage/format'
import {
  DEFAULT_PRODUCT_SORT,
  isProductSortKey,
  isProductStatus,
  isSeriesFilter,
  isStockFilter,
  listProducts,
  PRODUCT_SORTS,
  PRODUCT_STATUSES,
  productsHref,
  STOCK_FILTERS,
  type ProductQuery,
  type ProductRow,
  type ProductSortKey,
} from '@/lib/manage/products'
import { isAdmin, requireUser } from '@/lib/manage/session'
import { PAGE_SIZE } from '@/lib/manage/vocabulary'
import { isSeriesKey, SERIES, SERIES_LIST } from '@/lib/series'

/**
 * The catalogue, for a stock-take and a price review.
 *
 * Built for going down a list, not for finding one product: filter to what
 * needs counting — "Нулева", or one series — and type the figures straight into
 * the rows. The whole page is one form with one save; see ProductsEditor for
 * why, and product-actions.ts for what the save refuses.
 *
 * Everything that is not an edit is a link or a plain GET form, as on the order
 * book, so a filtered view is a URL: "FlexCut with low stock" can be bookmarked
 * and reopened for next month's count.
 *
 * Deliberately not here: descriptions, images, specs. Those are content, edited
 * one product at a time, and Payload's form is good at that — every row links
 * to it.
 */

export const metadata: Metadata = { title: 'Продукти' }

type Search = {
  status?: string | string[]
  series?: string | string[]
  stock?: string | string[]
  q?: string | string[]
  sort?: string | string[]
  page?: string | string[]
  saved?: string | string[]
  unsaved?: string | string[]
}

/** Repeated keys ("?q=a&q=b") arrive as arrays; take the first and move on. */
const one = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v

/**
 * Where a sortable column header leads. `keys` are the sorts the column owns,
 * in the order clicks step through them; a click on an inactive header lands on
 * the first.
 *
 * Computed here and handed to the editor as data rather than as rendered
 * header cells: server JSX passed through a Client Component's props drew
 * intermittent key warnings from React in development, depending on how the
 * stream happened to be chunked.
 */
function sortLink(keys: ProductSortKey[], query: ProductQuery): SortLink {
  const current = query.sort ?? DEFAULT_PRODUCT_SORT
  const at = keys.indexOf(current)
  const active = at !== -1
  const next = active ? keys[(at + 1) % keys.length] : keys[0]

  return {
    // A new sort starts from the first page: page 3 of "by name" and page 3 of
    // "by stock" have nothing to do with each other.
    href: productsHref({ ...query, sort: next, page: undefined }),
    dir: active ? PRODUCT_SORTS[current].dir : null,
  }
}

/** A row of filter chips — one choice, "all" included, each a link. */
function FilterGroup({
  label,
  options,
}: {
  label: string
  options: { key: string; label: string; href: string; active: boolean }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mr-1">
        {label}
      </span>
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          aria-current={o.active ? 'page' : undefined}
          className={`h-7 px-2.5 inline-flex items-center border text-[12.5px] whitespace-nowrap ${
            o.active
              ? 'border-ink bg-ink text-white font-semibold'
              : 'border-ink-15 text-ink-70 hover:text-ink hover:bg-paper'
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  )
}

/** "44.80" when that is exact, otherwise the stored figure untouched. */
function priceInput(price: number | null): string {
  if (price === null) return ''
  const fixed = price.toFixed(2)
  // Never round in the input: a figure the screen rounded would be written back
  // rounded the next time anything else on the row is saved.
  return Number(fixed) === price ? fixed : String(price)
}

function toEditorRow(row: ProductRow): EditorRow {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    series: isSeriesKey(row.series) ? SERIES[row.series].name : row.series,
    stock: row.stock === null ? '' : String(row.stock),
    status: row.status ?? '',
    price: priceInput(row.basePrice),
    priceText: row.basePrice === null ? '—' : money(row.basePrice),
    version: row.updatedAt,
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const user = await requireUser('/manage/products')
  const canEditPrice = isAdmin(user)

  const statusParam = one(sp.status)
  const seriesParam = one(sp.series)
  const stockParam = one(sp.stock)
  const sortParam = one(sp.sort)

  const query: ProductQuery = {
    status: isProductStatus(statusParam) ? statusParam : null,
    series: isSeriesFilter(seriesParam) ? seriesParam : null,
    stock: isStockFilter(stockParam) ? stockParam : null,
    q: (one(sp.q) ?? '').trim(),
    sort: isProductSortKey(sortParam) ? sortParam : DEFAULT_PRODUCT_SORT,
    page: Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1),
  }
  const { status, series, stock, q, sort } = query

  const list = await listProducts(query)

  // The page actually shown, which the list may have pulled back from past the
  // end. Filter links start again from page 1; the save returns to this one.
  const here: ProductQuery = { ...query, page: list.page }
  const filtered = { ...query, page: undefined }

  const from = (list.page - 1) * PAGE_SIZE + 1
  const to = Math.min(list.page * PAGE_SIZE, list.total)

  // Left behind by the navigation a save ends on — see done() in
  // product-actions.ts.
  const saved = one(sp.saved)?.slice(0, 200)
  const unsaved = one(sp.unsaved)?.slice(0, 400)

  const tabs = [
    { value: null as string | null, label: 'Всички', count: list.countAll },
    ...PRODUCT_STATUSES.map((s) => ({
      value: s.value as string | null,
      label: s.label,
      count: list.counts[s.value] ?? 0,
    })),
  ]

  const anyFilter = Boolean(q || status || series || stock)

  return (
    <div className="min-w-0">
      {/* Masthead — title, the count it is showing, and the search box. */}
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            03 · Продукти
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1">
            {list.total === 0
              ? 'Няма продукти'
              : `${list.total} ${list.total === 1 ? 'продукт' : 'продукта'}`}
            {q && <span className="text-ink-50 font-normal"> за „{q}“</span>}
          </h1>
          {/* The one misreading this screen invites: that a blade made to
              measure costs what its catalogue row says. It does not. */}
          <p className="mt-1 text-[12.5px] text-ink-50 max-w-[620px]">
            Цените са в EUR без ДДС. Цените на лентите по размер идват от ценовите таблици, не от
            този списък.
            {!canEditPrice && ' Цените се променят само от администратор.'}
          </p>
        </div>

        {/* A plain GET form; the hidden fields keep the tab, filters and sort
            through a search, so searching inside "Нулева" stays inside it. */}
        <form
          method="get"
          action="/manage/products"
          className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
        >
          {status && <input type="hidden" name="status" value={status} />}
          {series && <input type="hidden" name="series" value={series} />}
          {stock && <input type="hidden" name="stock" value={stock} />}
          {sort !== DEFAULT_PRODUCT_SORT && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">
            Търсене по име или SKU
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Име или SKU"
            autoComplete="off"
            className="h-9 flex-1 min-w-0 sm:flex-none sm:w-[220px] border border-ink-15 px-3 text-[13px] placeholder:text-ink-30 focus:border-blue focus:outline-none"
          />
          <button
            type="submit"
            className="tl-btn h-9 px-4 bg-ink text-white text-[13px] font-semibold cursor-pointer"
          >
            Търси
          </button>
          {q && (
            <Link
              href={productsHref({ ...filtered, q: '' })}
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
            >
              Изчисти
            </Link>
          )}
        </form>

        {(saved || unsaved) && (
          <div className="basis-full">
            {saved && (
              <p role="status" className="text-[12.5px] text-ok">
                {saved}
              </p>
            )}
            {unsaved && (
              <p role="status" className="text-[12.5px] text-danger">
                {unsaved}
              </p>
            )}
          </div>
        )}
      </header>

      {/* Status tabs. The counts respect the search and the filters below, so
          they never promise rows the current view would not return. */}
      <div className="border-b border-ink-15 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => {
          const active = tab.value === status
          return (
            <Link
              key={tab.value ?? 'all'}
              href={productsHref({
                ...filtered,
                status: isProductStatus(tab.value) ? tab.value : null,
              })}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap px-3 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-orange text-ink font-semibold'
                  : 'border-transparent text-ink-70 hover:text-ink'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 font-mono text-[11px] tl-figures ${
                  active ? 'text-orange' : 'text-ink-30'
                }`}
              >
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="border-b border-ink-15 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <FilterGroup
          label="Серия"
          options={[
            { key: 'all', label: 'Всички', href: productsHref({ ...filtered, series: null }), active: !series },
            ...SERIES_LIST.map((s) => ({
              key: s.key,
              label: s.name,
              href: productsHref({ ...filtered, series: s.key }),
              active: series === s.key,
            })),
            {
              key: 'none',
              label: 'Без серия',
              href: productsHref({ ...filtered, series: 'none' }),
              active: series === 'none',
            },
          ]}
        />
        <FilterGroup
          label="Наличност"
          options={[
            { key: 'all', label: 'Всяка', href: productsHref({ ...filtered, stock: null }), active: !stock },
            ...(Object.keys(STOCK_FILTERS) as (keyof typeof STOCK_FILTERS)[]).map((key) => ({
              key,
              label: STOCK_FILTERS[key].label,
              href: productsHref({ ...filtered, stock: key }),
              active: stock === key,
            })),
          ]}
        />
      </div>

      {list.rows.length === 0 ? (
        <div className="px-4 sm:px-6 py-16 text-center">
          <div className="text-[15px] text-ink-70">
            {q
              ? `Нищо не отговаря на „${q}“.`
              : anyFilter
                ? 'Няма продукти с тези филтри.'
                : 'Каталогът е празен.'}
          </div>
          {anyFilter && (
            <Link
              href="/manage/products"
              className="inline-block mt-3 font-mono text-[10px] tracking-[0.12em] uppercase text-blue hover:underline"
            >
              Покажи всички
            </Link>
          )}
        </div>
      ) : (
        // Keyed on every row's version: the editor holds the typed figures in
        // state, seeded once on mount, so after a save it must start again from
        // what is now stored rather than from what was typed.
        <ProductsEditor
          key={list.rows.map((r) => `${r.id}:${r.updatedAt}`).join(',')}
          rows={list.rows.map(toEditorRow)}
          statuses={PRODUCT_STATUSES.map((s) => ({ value: s.value, label: s.option }))}
          canEditPrice={canEditPrice}
          returnTo={productsHref(here).split('?')[1] ?? ''}
          sorts={{
            name: sortLink(['name'], here),
            price: sortLink(['price-desc', 'price-asc'], here),
            stock: sortLink(['stock'], here),
          }}
        />
      )}

      {/* Paging. Stated in full — "51–100 от 214" — so a truncated list never
          reads as the whole list. */}
      {list.pageCount > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-ink-15 flex items-center justify-between gap-4">
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50 tl-figures">
            {from}–{to} от {list.total}
          </div>
          <div className="flex items-center gap-2">
            {list.page > 1 && (
              <Link
                href={productsHref({ ...here, page: list.page - 1 })}
                className="h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] hover:bg-paper"
              >
                ← Назад
              </Link>
            )}
            <span className="font-mono text-[11px] text-ink-50 tl-figures">
              {list.page} / {list.pageCount}
            </span>
            {list.page < list.pageCount && (
              <Link
                href={productsHref({ ...here, page: list.page + 1 })}
                className="h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] hover:bg-paper"
              >
                Напред →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
