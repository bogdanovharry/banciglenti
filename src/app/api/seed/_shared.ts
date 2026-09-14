import { getPayload } from 'payload'
import config from '@payload-config'

import type { ProductData } from '@/lib/products-data'

/**
 * Additive import of a generated product range.
 *
 * /api/seed is a one-shot that refuses to run against a non-empty catalogue —
 * right for a first import, useless for adding a range to a shop that is
 * already selling. This inserts what is missing and updates what is already
 * there, so re-running after the generator changes is safe and expected.
 *
 * Prices are never passed in by a caller. They arrive on the ProductData rows,
 * which compute them from the price tables the configurator quotes from, so a
 * shelf product and a configured one cannot drift apart.
 *
 * Extracted from the sawmill route so hobby did not become a second copy of
 * sixty lines that would then be fixed in only one of the two places.
 */
export type SeedOutcome = {
  status: 'ok' | 'dry_run'
  available: number
  created: number
  updated: number
  retired: number
  sample: string[]
  retiredSample: string[]
}

/** "Wood-Mizer LT15 / LT20" → { brand: "Wood-Mizer", model: "LT15 / LT20" }. */
const toMachine = (m: string) => {
  const [brand, ...rest] = m.split(' ')
  return { brand, model: rest.join(' ') || brand }
}

export async function seedGenerated({
  products,
  categorySlug,
  parentSlug,
  brandName,
  brandSlug,
  material,
  dryRun,
  retirePrefix,
}: {
  products: ProductData[]
  categorySlug: string
  parentSlug?: string
  brandName: string
  brandSlug: string
  material: string
  dryRun: boolean
  /** Slug prefix this generator owns, so withdrawn sizes can be retired. */
  retirePrefix?: string
}): Promise<SeedOutcome | { error: string; status: number }> {
  const payload = await getPayload({ config })

  const category = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorySlug } },
    limit: 1,
  })
  const categoryId = category.docs[0]?.id
  if (!categoryId) {
    return { error: `Category ${categorySlug} not found — run /api/seed first.`, status: 409 }
  }

  const parent = parentSlug
    ? await payload.find({
        collection: 'categories',
        where: { slug: { equals: parentSlug } },
        limit: 1,
      })
    : null

  // Created rather than assumed, so this works on a shop seeded before the
  // house brand existed as a record.
  const brands = await payload.find({
    collection: 'brands',
    where: { slug: { equals: brandSlug } },
    limit: 1,
  })
  let brandId = brands.docs[0]?.id
  if (!brandId && !dryRun) {
    brandId = (await payload.create({ collection: 'brands', data: { name: brandName, slug: brandSlug } })).id
  }

  const categories = [categoryId, parent?.docs[0]?.id].filter(
    (id): id is number => typeof id === 'number',
  )

  const created: string[] = []
  const updated: string[] = []

  for (const p of products) {
    const machines = (p.machines ?? []).map(toMachine)
    const setContents = (p.setContents ?? []).map((label) => ({ label }))

    const data = {
      name: p.name,
      slug: p.slug,
      basePrice: p.price,
      stock: p.stock,
      featured: p.featured,
      topProduct: p.topProduct,
      status: p.stock > 0 ? ('active' as const) : ('out_of_stock' as const),
      ...(p.series ? { series: p.series as 'procut' | 'softcut' | 'flexcut' } : {}),
      ...(brandId ? { brand: brandId } : {}),
      machines,
      setContents,
      categories,
      specs: {
        width: p.width,
        thickness: p.thickness,
        length: p.length,
        material,
        toothPitch: p.pitch,
      },
    }

    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: p.slug } },
      limit: 1,
    })

    if (existing.totalDocs > 0) {
      // Updated, not skipped. The sawmill route only ever patched `machines`,
      // which meant a price change in the table never reached the shelf.
      if (!dryRun) {
        await payload.update({ collection: 'products', id: existing.docs[0].id, data })
      }
      updated.push(p.slug)
      continue
    }

    if (!dryRun) await payload.create({ collection: 'products', data })
    created.push(p.slug)
  }

  /**
   * Anything this generator used to produce and no longer does.
   *
   * Dropping a size from the generator does not remove it from the shop — it
   * just stops being updated, and sits there still purchasable. That is how a
   * blade at an unconfirmed length keeps selling after the length has been
   * withdrawn.
   *
   * Retired, not deleted: the row keeps its slug so the URL still resolves and
   * any order that references it still reads, but stock goes to zero and the
   * status to inactive so it cannot be bought.
   */
  const retired: string[] = []
  if (retirePrefix) {
    const live = new Set(products.map((p) => p.slug))
    const owned = await payload.find({
      collection: 'products',
      where: { slug: { like: `${retirePrefix}%` }, status: { not_equals: 'inactive' } },
      limit: 1000,
    })
    for (const doc of owned.docs) {
      if (live.has(String(doc.slug))) continue
      if (!dryRun) {
        await payload.update({
          collection: 'products',
          id: doc.id,
          data: { status: 'inactive', stock: 0 },
        })
      }
      retired.push(String(doc.slug))
    }
  }

  return {
    status: dryRun ? 'dry_run' : 'ok',
    available: products.length,
    created: created.length,
    updated: updated.length,
    retired: retired.length,
    sample: created.slice(0, 5),
    retiredSample: retired.slice(0, 8),
  }
}

/** Shared guard: POST-only, SETUP_TOKEN, ?dry=1. */
export function checkSeedAuth(request: Request) {
  const expected = process.env.SETUP_TOKEN
  if (!expected) return { error: 'SETUP_TOKEN is not configured; seeding is disabled.', status: 503 }
  if (request.headers.get('x-setup-token') !== expected) return { error: 'Unauthorized', status: 401 }
  return { dryRun: new URL(request.url).searchParams.get('dry') === '1' }
}
