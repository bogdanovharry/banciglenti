import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

import type { ProductCardData } from '@/components/product/ProductCard'
import { isSeriesKey, type SeriesKey } from '@/lib/series'
import { stockStateFor } from '@/lib/catalog-ui'

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
  /** Saw-Meister product line; null for bimetal, circulars, knives, abrasives. */
  series: SeriesKey | null
  shortDescription?: string
  specs: { width?: number; thickness?: number; length?: number; material?: string }
  /** Machines this size fits — "Holzmann BS128HDR". Drives the machine filter. */
  machines: string[]
  /** One line per blade in a mixed set; empty for everything else. */
  setContents: string[]
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

/**
 * Representative product photography, used until real per-SKU images are
 * uploaded through /admin. An uploaded image always wins over this.
 *
 * These are ТЕХНОЛЕС's own watermarked blade shots, matched by tooth profile:
 * the two wood blades have coarse hook teeth and bright steel, the bimetal and
 * carbon ones are dark with a fine pitch. They are representative of the type,
 * not photographs of each individual size — which is normal for a blade
 * catalogue, where a 35 mm and a 40 mm blade of the same series are visually
 * identical.
 *
 * Deliberately restricted to band blades. Circular saws, planer knives,
 * abrasives, machines and consumables keep their spec tile: putting a bandsaw
 * blade next to a circular saw would misrepresent the product.
 */
const BLADE_CATEGORIES = new Set([
  'horizontalni-bantsizi',
  'vertikalni-bantsizi',
  'bimetalni-lenti',
  'vyglerodna-lenti-cs',
  'hobi-bantsig',
  'meso-i-riba',
  'hlebni-izdeliya',
  'slicers',
])

/**
 * The series now decides the photo. It used to key off the steel brand, but
 * the blades carry the house brand since the Saw-Meister rebrand, so brand no
 * longer distinguishes one blade from another — the series does.
 */
const SERIES_IMAGE: Record<SeriesKey, string> = {
  softcut: '/images/products/kodiak.png',
  procut: '/images/products/mastergold.png',
  vector: '/images/products/kodiak.png',
  flexcut: '/images/products/hardback_fixed.png',
  finecut: '/images/products/hardback_fixed.png',
}

function fallbackImage(
  categorySlugs: string[],
  brandName: string | null,
  series: SeriesKey | null,
  material?: string,
): string | undefined {
  if (!categorySlugs.some((s) => BLADE_CATEGORIES.has(s))) return undefined

  if (series) return SERIES_IMAGE[series]

  // Products outside the five series — bimetal above all — keep the old rules.
  if (brandName === 'Kodiak') return '/images/products/kodiak.png'
  if (brandName === 'MasterGold') return '/images/products/mastergold.png'

  // Fine-pitch dark blades for metal; the coarse bright ones are for wood.
  if (material && /M42|M51|HSS|BiMetal/i.test(material)) return '/images/products/bohler_fixed.png'
  if (categorySlugs.includes('bimetalni-lenti')) return '/images/products/bohler_fixed.png'
  if (categorySlugs.includes('horizontalni-bantsizi')) return '/images/products/kodiak.png'

  return '/images/products/hardback_fixed.png'
}


/**
 * "2360 × 13 × 0.65 мм" — length first, because that is the figure that has to
 * match the machine. Falls back to width × thickness when no length is recorded.
 */
function dimensionLabel(specs: {
  width?: number | null
  thickness?: number | null
  length?: number | null
}): string {
  const wt = [specs.width, specs.thickness].filter(
    (n): n is number => typeof n === 'number' && Number.isFinite(n),
  )
  if (wt.length !== 2) return ''

  const hasLength = typeof specs.length === 'number' && Number.isFinite(specs.length)
  return hasLength ? `${specs.length} × ${wt[0]} × ${wt[1]} мм` : `${wt[0]} × ${wt[1]} мм`
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

  const specs = (doc.specs ?? {}) as {
    width?: number
    thickness?: number
    length?: number
    material?: string
  }
  const stockCount = typeof doc.stock === 'number' ? doc.stock : 0

  const machines = (Array.isArray(doc.machines) ? doc.machines : [])
    .map((m) => {
      if (!m || typeof m !== 'object') return null
      const { brand, model } = m as { brand?: unknown; model?: unknown }
      return brand && model ? `${String(brand)} ${String(model)}` : null
    })
    .filter((s): s is string => s !== null)

  const brandName = relationName(doc.brand)
  const series = isSeriesKey(doc.series) ? doc.series : null

  // What is in a mixed set. Empty for singles and for boxes of one blade,
  // where the name already says everything there is to say.
  const setContents = (Array.isArray(doc.setContents) ? doc.setContents : [])
    .map((row) =>
      row && typeof row === 'object' && 'label' in row
        ? String((row as { label?: unknown }).label ?? '')
        : '',
    )
    .filter(Boolean)

  // An image uploaded in /admin takes precedence; the mapping is only a stand-in
  // until per-SKU photography exists.
  const uploaded = Array.isArray(doc.images) ? doc.images[0] : undefined
  const uploadedUrl =
    uploaded && typeof uploaded === 'object' && 'image' in uploaded
      ? ((uploaded as { image?: { url?: string } }).image?.url ?? undefined)
      : undefined

  return {
    sku: String(doc.slug),
    slug: String(doc.slug),
    name: String(doc.name),
    price: typeof doc.basePrice === 'number' ? doc.basePrice : 0,
    dim: dimensionLabel(specs),
    industry,
    stock: stockStateFor(stockCount),
    badge: doc.topProduct ? 'TOP' : null,
    image: uploadedUrl ?? fallbackImage(categorySlugs, brandName, series, specs.material),
    stockCount,
    categorySlugs,
    brandName,
    series,
    shortDescription: typeof doc.shortDescription === 'string' ? doc.shortDescription : undefined,
    specs,
    machines,
    setContents,
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

    /**
     * Withdrawn products stay out of the shop.
     *
     * The status field has existed since the collection was written and was
     * never queried, so marking a product inactive in /admin changed nothing —
     * it kept listing and kept selling. That surfaced when a batch of blades at
     * an unconfirmed loop length was retired and carried on appearing.
     *
     * `out_of_stock` is deliberately still listed: it is a real state a buyer
     * should see, and the card already says "Изчерпан". Only `inactive` means
     * "this is not a product any more".
     */
    const notRetired = { status: { not_equals: 'inactive' } }

    const result = await payload.find({
      collection: 'products',
      limit: 500,
      depth: 1,
      sort: 'name',
      where: categorySlug
        ? { and: [{ 'categories.slug': { equals: categorySlug } }, notRetired] }
        : notRetired,
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
