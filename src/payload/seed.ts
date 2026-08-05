import type { Payload } from 'payload'

import { ALL_PRODUCTS } from '@/lib/products-data'

/**
 * Seeds the catalogue into Payload from `src/lib/products-data.ts`, which is the
 * pricing sheet exported from the legacy banciglenti.com shop. Runs once against
 * an empty database; `POST /api/setup` drives it.
 */

// Two-level taxonomy: industry parents, then the categories products attach to.
// `parent: null` marks the top level — those are created first so children can
// reference them by id.
const CATEGORIES: { name: string; slug: string; parent: string | null; sortOrder: number }[] = [
  { name: 'Дърво', slug: 'dyrvo', parent: null, sortOrder: 1 },
  { name: 'Метал', slug: 'metal', parent: null, sortOrder: 2 },
  { name: 'Храни', slug: 'hrani', parent: null, sortOrder: 3 },
  { name: 'Хоби банциг', slug: 'hobi-bantsig', parent: null, sortOrder: 4 },
  { name: 'Абразиви', slug: 'abrazivi', parent: null, sortOrder: 5 },
  { name: 'Машини', slug: 'mashini', parent: null, sortOrder: 6 },
  { name: 'Консумативи', slug: 'konsumativi', parent: null, sortOrder: 7 },

  { name: 'Хоризонтални банцизи', slug: 'horizontalni-bantsizi', parent: 'dyrvo', sortOrder: 10 },
  { name: 'Вертикални банцизи', slug: 'vertikalni-bantsizi', parent: 'dyrvo', sortOrder: 11 },
  { name: 'Циркулярни триони', slug: 'tsirkulyarni-trioni', parent: 'dyrvo', sortOrder: 12 },
  { name: 'Ножове за абрихт', slug: 'nozhove-za-abriht', parent: 'dyrvo', sortOrder: 13 },

  { name: 'Биметални ленти', slug: 'bimetalni-lenti', parent: 'metal', sortOrder: 20 },
  { name: 'Въглеродна стомана CS', slug: 'vyglerodna-lenti-cs', parent: 'metal', sortOrder: 21 },

  { name: 'Месо и риба', slug: 'meso-i-riba', parent: 'hrani', sortOrder: 30 },
  { name: 'Хлебни изделия', slug: 'hlebni-izdeliya', parent: 'hrani', sortOrder: 31 },
  { name: 'Слайсъри', slug: 'slicers', parent: 'hrani', sortOrder: 32 },
]

// Matched against the product name, first hit wins. The source sheet mixes Latin
// and Cyrillic homoglyphs (e.g. "Metabо" carries a Cyrillic о), so the patterns
// stay loose enough to catch both.
const BRAND_PATTERNS: { name: string; test: RegExp }[] = [
  { name: 'MasterGold', test: /master\s*gold/i },
  { name: 'Kodiak', test: /kodiak/i },
  { name: 'Einhell', test: /einhell/i },
  { name: 'Parkside', test: /parkside/i },
  { name: 'Raider', test: /raider/i },
  { name: 'Metabo', test: /metab/i },
  { name: 'WoodMizer', test: /wood\s*mizer/i },
  { name: 'Tyrolit', test: /tyrolit/i },
  { name: 'Böhler', test: /b(ö|o)hler/i },
]

// Every product without an explicit brand is house-branded.
const DEFAULT_BRAND = 'Tehnoles'

const MATERIAL_PATTERNS: { material: string; test: RegExp }[] = [
  { material: 'M42 HSS', test: /м?42/i },
  { material: 'M51 Cobalt', test: /м?51/i },
  { material: 'HSS', test: /\bhss\b/i },
  { material: '100Cr6', test: /100cr6/i },
  { material: 'CBN', test: /cbn|боразон/i },
  { material: 'Диамант', test: /диамант/i },
  { material: 'HM Carbide', test: /\bwz\b|\bz\d+\b/i },
  { material: 'Въглеродна стомана', test: /въглеродна|carbon/i },
  { material: 'Абразив', test: /абразив/i },
]

const slugifyBrand = (name: string) =>
  name
    .toLowerCase()
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Pulls dimensions out of a product name. The sheet writes these inconsistently
 * — "32x1.1", "35х1.1" (Cyrillic х), "Ø300 x 2.24 x 30" — so the separator is
 * normalised before matching.
 *
 * Dimension order depends on the product. Blades and circular saws lead with the
 * measurement that matters (width, or diameter) followed by thickness. Planer
 * knives are written length × width × thickness, so reading the first two
 * numbers there would record the length as a width. Returns an empty object when
 * the name carries no dimensions at all (machines, coolant).
 */
function parseSpecs(
  name: string,
  category: string,
): { width?: number; thickness?: number; material?: string } {
  const normalised = name.replace(/[хХ]/g, 'x').replace(/,/g, '.')
  const material = MATERIAL_PATTERNS.find((m) => m.test.test(name))?.material
  const withMaterial = material ? { material } : {}

  const num = String.raw`\d+(?:\.\d+)?`

  if (category === 'nozhove-za-abriht') {
    const triple = normalised.match(new RegExp(`(${num})\\s*x\\s*(${num})\\s*x\\s*(${num})`, 'i'))
    if (triple) {
      return { width: Number(triple[2]), thickness: Number(triple[3]), ...withMaterial }
    }
  }

  const pair = normalised.match(new RegExp(`(${num})\\s*x\\s*(${num})`, 'i'))
  if (!pair) return withMaterial

  return { width: Number(pair[1]), thickness: Number(pair[2]), ...withMaterial }
}

export type SeedResult = {
  categories: number
  brands: number
  products: number
  adminCreated: boolean
}

export async function seed(payload: Payload): Promise<SeedResult> {
  // --- Categories: parents first so children can point at real ids ---
  const categoryIds: Record<string, number> = {}

  for (const category of CATEGORIES.filter((c) => c.parent === null)) {
    const created = await payload.create({
      collection: 'categories',
      data: { name: category.name, slug: category.slug, sortOrder: category.sortOrder },
    })
    categoryIds[category.slug] = created.id as number
  }

  for (const category of CATEGORIES.filter((c) => c.parent !== null)) {
    const created = await payload.create({
      collection: 'categories',
      data: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        parent: categoryIds[category.parent as string],
      },
    })
    categoryIds[category.slug] = created.id as number
  }

  // --- Brands: only those actually referenced by the catalogue ---
  const referencedBrands = new Set<string>([DEFAULT_BRAND])
  for (const product of ALL_PRODUCTS) {
    const brand = BRAND_PATTERNS.find((b) => b.test.test(product.name))
    if (brand) referencedBrands.add(brand.name)
  }

  const brandIds: Record<string, number> = {}
  for (const name of referencedBrands) {
    const created = await payload.create({
      collection: 'brands',
      data: { name, slug: slugifyBrand(name) },
    })
    brandIds[name] = created.id as number
  }

  // --- Products ---
  for (const product of ALL_PRODUCTS) {
    const brandName = BRAND_PATTERNS.find((b) => b.test.test(product.name))?.name ?? DEFAULT_BRAND

    // Attach the product to its own category and, when it has one, the parent
    // industry — so /category/dyrvo lists everything beneath it.
    const parentSlug = CATEGORIES.find((c) => c.slug === product.category)?.parent
    const categories = [categoryIds[product.category], parentSlug ? categoryIds[parentSlug] : undefined].filter(
      (id): id is number => typeof id === 'number',
    )

    await payload.create({
      collection: 'products',
      data: {
        name: product.name,
        slug: product.slug,
        basePrice: product.price,
        stock: product.stock,
        featured: product.featured,
        topProduct: product.topProduct,
        status: product.stock > 0 ? 'active' : 'out_of_stock',
        brand: brandIds[brandName],
        categories,
        specs: parseSpecs(product.name, product.category),
      },
    })
  }

  // --- Admin user ---
  const existingUsers = await payload.count({ collection: 'users' })
  const adminCreated = existingUsers.totalDocs === 0

  if (adminCreated) {
    const email = process.env.SEED_ADMIN_EMAIL
    const password = process.env.SEED_ADMIN_PASSWORD

    if (!email || !password) {
      throw new Error(
        'Refusing to seed an admin user without SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD set. ' +
          'Set both in the environment, or create the first user through /admin.',
      )
    }

    await payload.create({
      collection: 'users',
      data: { email, password, name: 'Admin', role: 'admin' },
    })
  }

  return {
    categories: Object.keys(categoryIds).length,
    brands: Object.keys(brandIds).length,
    products: ALL_PRODUCTS.length,
    adminCreated,
  }
}
