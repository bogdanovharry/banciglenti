/**
 * Catalogue state that the code compares against, kept separate from the words
 * shown for it.
 *
 * These used to be the same thing: stock was the string "На склад" and the sort
 * order was the option's own label. That works until someone translates the
 * label, at which point the comparison stops matching and the catalogue quietly
 * returns nothing — no error, no type failure, just an empty grid. Codes are
 * stored and compared; labels are only ever rendered, and become translation
 * keys in Phase C.
 *
 * Client-safe on purpose: src/lib/catalog.ts pulls in Payload and cannot be
 * imported from a component, so the shared vocabulary lives here instead.
 */

export type StockState = 'in' | 'low' | 'out' | 'order'

export const STOCK_LABELS: Record<StockState, string> = {
  in: 'На склад',
  low: 'Ниска наличност',
  out: 'Изчерпан',
  order: 'Изработва се по поръчка',
}

/**
 * Five or fewer is "low" — enough to warn without blocking the sale.
 *
 * A made-to-order product has no stock to run out of: the workshop cuts it when
 * it is bought. It used to be shown as "sold out" with a disabled button, which
 * is the one thing the business sells the most of, so it has a state of its own
 * and is always orderable.
 */
export function stockStateFor(units: number, madeToOrder = false): StockState {
  if (madeToOrder) return 'order'
  if (units <= 0) return 'out'
  if (units <= 5) return 'low'
  return 'in'
}

export type SortKey = 'popularity' | 'price-asc' | 'price-desc' | 'width'

/** Order here is the order rendered in the dropdown. */
export const SORT_OPTIONS: { key: SortKey; label: string; msg: 'popularity' | 'priceAsc' | 'priceDesc' | 'width' }[] = [
  // `msg` is the key under the `sort` message namespace; the pages render
  // that, and only ever compare `key`. `label` stays as the Bulgarian source.
  { key: 'popularity', msg: 'popularity', label: 'Популярност' },
  { key: 'price-asc', msg: 'priceAsc', label: 'Цена ↑' },
  { key: 'price-desc', msg: 'priceDesc', label: 'Цена ↓' },
  { key: 'width', msg: 'width', label: 'Широчина' },
]

export const isSortKey = (v: unknown): v is SortKey =>
  typeof v === 'string' && SORT_OPTIONS.some((o) => o.key === v)

/**
 * Sorting for a given key. `popularity` deliberately returns 0 — it means "the
 * order the catalogue already came in", which is the server's own ranking.
 */
export function compareBy(key: SortKey) {
  return (
    a: { price: number; specs?: { width?: number | null } | null },
    b: { price: number; specs?: { width?: number | null } | null },
  ): number => {
    switch (key) {
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'width':
        return (a.specs?.width ?? 0) - (b.specs?.width ?? 0)
      default:
        return 0
    }
  }
}

/**
 * The industries offered on the contact form. The code is what gets stored on
 * an enquiry; the label is what the customer clicks.
 */
export const INDUSTRY_OPTIONS = [
  { code: 'wood', label: 'Дърво' },
  { code: 'metal', label: 'Метал' },
  { code: 'food', label: 'Храни' },
  { code: 'hobby', label: 'Хоби' },
  { code: 'abrasives', label: 'Абразиви' },
  { code: 'other', label: 'Друго' },
] as const

export type IndustryCode = (typeof INDUSTRY_OPTIONS)[number]['code']

/**
 * A whole number the way the market writes it — "1 000" in Bulgarian, "1.000"
 * in Romanian. Grouping is forced on: Bulgarian leaves four-digit numbers bare
 * by default, but a loop length is read in thousands.
 */
export const formatInt = (n: number, locale: string): string =>
  new Intl.NumberFormat(locale, { useGrouping: 'always', maximumFractionDigits: 0 }).format(n)
