import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { ProductCardData } from '@/components/product/ProductCard'

/**
 * Read side of the catalogue. Everything the storefront renders comes through
 * here, so the pages never touch Payload directly.
 *
 * Server-only — these run inside Server Components and route handlers. React's
 * `cache` deduplicates within a single request: a page that asks for the same
 * category twice issues one query. It does not cache across requests, so how
 * fresh the data is depends on the calling route's own rendering mode —
 * /category and /product render per request, /shop revalidates on an interval.
 */

type PayloadCategory = {
  id: number
  name: string
  slug: string
  description?: string | null
  parent?: unknown
}

export type CatalogCategory = {
  id: number
  name: string
  slug: string
  description: string
  parentSlug: string | null
}

export type CatalogProduct = ProductCardData & {
  /** Units on hand, before it is bucketed into the display label. */
  stockCount: number
  categorySlugs: string[]
  brandName: string | null
  shortDescription?: string
  specs: { width?: number; thickness?: number; material?: string }
}

const getClient = cache(async () => getPayload({ config }))

/** Relationship fields arrive as an id or a populated object depending on depth. */
function relationSlug(value: unknown): string | null {
  if (value && typeof value === 'object' && 'slug' in value) {
    return String((value as { slug: unknown }).slug)
  }
  return null
}

function relationName(value: unknown): string | null {
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name: unknown }).name)
  }
  return null
}

function stockLabel(stock: number): ProductCardData['stock'] {
  if (stock <= 0) return 'Изчерпан'
  if (stock <= 5) return 'Ниска наличност'
  return 'На склад'
}

/** "3810 × 27 × 0.9 мм" style summary, from whatever specs the product has. */
function dimensionLabel(specs: { width?: number | null; thickness?: number | null }): string {
  const parts = [specs.width, specs.thickness].filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n),
  )
  return parts.length === 2 ? `${parts[0]} × ${parts[1]} мм` : ''
}

export const getCategories = cache(async (): Promise<CatalogCategory[]> => {
  const payload = await getClient()
  const result = await payload.find({
    collection: 'categories',
    limit: 200,
    depth: 1,
    sort: 'sortOrder',
  })

  return result.docs.map((doc) => {
    const category = doc as unknown as PayloadCategory
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentSlug: relationSlug(category.parent),
    }
  })
})

export const getCategoryBySlug = cache(async (slug: string): Promise<CatalogCategory | null> => {
  const categories = await getCategories()
  return categories.find((category) => category.slug === slug) ?? null
})

function toCatalogProduct(doc: Record<string, unknown>, categories: CatalogCategory[]): CatalogProduct {
  const rawCategories = Array.isArray(doc.categories) ? doc.categories : []
  const categorySlugs = rawCategories
    .map((c) => relationSlug(c))
    .filter((s): s is string => typeof s === 'string')

  // The card's "industry" label is the top-level category. Products are seeded
  // against both their own category and its parent, so prefer whichever of the
  // attached categories sits at the root.
  const attached = categories.filter((c) => categorySlugs.includes(c.slug))
  const industry =
    attached.find((c) => c.parentSlug === null)?.name ?? attached[0]?.name ?? 'Друго'

  const specs = (doc.specs ?? {}) as { width?: number; thickness?: number; material?: string }
  const stockCount = typeof doc.stock === 'number' ? doc.stock : 0

  return {
    sku: String(doc.slug),
    slug: String(doc.slug),
    name: String(doc.name),
    price: typeof doc.basePrice === 'number' ? doc.basePrice : 0,
    dim: dimensionLabel(specs),
    industry,
    stock: stockLabel(stockCount),
    badge: doc.topProduct ? 'TOP' : null,
    stockCount,
    categorySlugs,
    brandName: relationName(doc.brand),
    shortDescription: typeof doc.shortDescription === 'string' ? doc.shortDescription : undefined,
    specs,
  }
}

/**
 * Products in a category. Passing a top-level slug ("dyrvo") returns everything
 * beneath it, because each product is attached to its own category and its
 * parent. Omit the slug for the whole catalogue.
 */
export const getProducts = cache(
  async (categorySlug?: string): Promise<CatalogProduct[]> => {
    const payload = await getClient()
    const categories = await getCategories()

    const result = await payload.find({
      collection: 'products',
      limit: 500,
      depth: 1,
      sort: 'name',
      where: categorySlug ? { 'categories.slug': { equals: categorySlug } } : undefined,
    })

    return result.docs.map((doc) => toCatalogProduct(doc as Record<string, unknown>, categories))
  },
)

export const getProductBySlug = cache(async (slug: string): Promise<CatalogProduct | null> => {
  const payload = await getClient()
  const categories = await getCategories()

  const result = await payload.find({
    collection: 'products',
    limit: 1,
    depth: 1,
    where: { slug: { equals: slug } },
  })

  const doc = result.docs[0]
  return doc ? toCatalogProduct(doc as Record<string, unknown>, categories) : null
})

/** Category slugs with how many products each holds — drives the filter counts. */
export const getCategoryCounts = cache(async (): Promise<Record<string, number>> => {
  const products = await getProducts()
  const counts: Record<string, number> = {}

  for (const product of products) {
    for (const slug of product.categorySlugs) {
      counts[slug] = (counts[slug] ?? 0) + 1
    }
  }

  return counts
})
