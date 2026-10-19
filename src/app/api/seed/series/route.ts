import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SAW_MEISTER, SERIES } from '@/lib/series'
import {
  applicationCopy,
  classify,
  planVectorProducts,
  seriesName,
  type ExistingProduct,
} from '@/payload/series-plan'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Rebrands the catalogue onto the Saw-Meister range and creates the Vector
 * products, which have no counterpart in current stock.
 *
 *   curl -X POST https://…/api/seed/series -H "x-setup-token: $SETUP_TOKEN"
 *
 * Idempotent: a product already carrying its series name is skipped, and a
 * Vector slug is never created twice. Products outside the five series —
 * bimetal, circular saws, planer knives, abrasives, machines, consumables —
 * are left exactly as they are.
 *
 * Pass ?dry=1 to see the plan without writing anything.
 */
export async function POST(request: Request) {
  const expected = process.env.SETUP_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'SETUP_TOKEN is not configured.' }, { status: 503 })
  }
  if (request.headers.get('x-setup-token') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(request.url).searchParams.get('dry') === '1'

  try {
    const payload = await getPayload({ config })

    const all = await payload.find({ collection: 'products', limit: 1000, depth: 1 })
    const docs = all.docs as unknown as {
      id: number
      name: string
      slug: string
      brand?: { name?: string } | number | null
      categories?: ({ slug?: string } | number)[] | null
      shortDescription?: string | null
      specs?: { width?: number | null; thickness?: number | null; length?: number | null }
      machines?: { brand: string; model: string }[] | null
    }[]

    const existing: ExistingProduct[] = docs.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      brandName:
        d.brand && typeof d.brand === 'object' && typeof d.brand.name === 'string'
          ? d.brand.name
          : null,
      shortDescription: typeof d.shortDescription === 'string' ? d.shortDescription : null,
      categorySlugs: (d.categories ?? [])
        .map((c) => (c && typeof c === 'object' && typeof c.slug === 'string' ? c.slug : null))
        .filter((s): s is string => s !== null),
      specs: d.specs ?? {},
      machines: d.machines ?? [],
    }))

    // --- 1. The house brand ---
    const brands = await payload.find({
      collection: 'brands',
      where: { name: { equals: SAW_MEISTER } },
      limit: 1,
    })
    let sawMeisterId = (brands.docs[0] as { id: number } | undefined)?.id
    if (!sawMeisterId && !dryRun) {
      const created = await payload.create({
        collection: 'brands',
        data: { name: SAW_MEISTER, slug: 'saw-meister' },
      })
      sawMeisterId = (created as unknown as { id: number }).id
    }

    // --- 2. Rename and classify existing stock ---
    const renamed: { from: string; to: string; series: string }[] = []
    const untouched: string[] = []

    for (const p of existing) {
      const series = classify(p)
      if (!series) {
        untouched.push(p.slug)
        continue
      }

      const name = seriesName(series, p)
      if (!name) {
        untouched.push(`${p.slug} (няма записани размери)`)
        continue
      }
      if (p.name === name) continue // already applied

      renamed.push({ from: p.name, to: name, series })

      if (!dryRun) {
        await payload.update({
          collection: 'products',
          id: p.id,
          data: {
            name,
            series,
            ...(sawMeisterId ? { brand: sawMeisterId } : {}),
            // Fill the application copy only where there is none, so anything
            // written by hand in /admin survives a re-run.
            ...(p.shortDescription?.trim() ? {} : { shortDescription: applicationCopy(series, p) }),
          },
        })
      }
    }

    // --- 3. Create the Vector range ---
    const categories = await payload.find({ collection: 'categories', limit: 200, depth: 0 })
    const categoryBySlug = new Map(
      (categories.docs as unknown as { id: number; slug: string; parent?: number | null }[]).map(
        (c) => [c.slug, c],
      ),
    )
    const existingSlugs = new Set(existing.map((p) => p.slug))
    const { creates, alternates } = planVectorProducts()

    const vertical = categoryBySlug.get('vertikalni-bantsizi')
    const createdVector: string[] = []
    const skippedVector: string[] = []

    for (const p of creates) {
      if (existingSlugs.has(p.slug)) {
        skippedVector.push(`${p.slug} (вече съществува)`)
        continue
      }
      if (!vertical) {
        skippedVector.push(`${p.slug} (липсва категория vertikalni-bantsizi)`)
        continue
      }

      if (!dryRun) {
        await payload.create({
          collection: 'products',
          data: {
            name: p.name,
            slug: p.slug,
            shortDescription: p.shortDescription,
            basePrice: p.basePrice,
            series: 'vector',
            ...(sawMeisterId ? { brand: sawMeisterId } : {}),
            stock: 0,
            madeToOrder: true, // cut when ordered: there is no stock to run out of
            status: 'active',
            featured: false,
            topProduct: false,
            categories: [vertical.id, ...(vertical.parent ? [vertical.parent] : [])],
            specs: p.specs,
          },
        })
      }
      createdVector.push(`${p.name} — ${p.basePrice.toFixed(2)} €`)
    }

    return NextResponse.json({
      status: dryRun ? 'dry-run' : 'ok',
      renamedCount: renamed.length,
      renamed: renamed.slice(0, 60),
      bySeries: Object.fromEntries(
        Object.keys(SERIES).map((k) => [k, renamed.filter((r) => r.series === k).length]),
      ),
      vectorCreated: createdVector,
      vectorSkipped: skippedVector,
      /** Sizes where a second steel is available — a stocking decision, not an error. */
      alternateSteels: alternates,
      untouchedCount: untouched.length,
    })
  } catch (error) {
    console.error('Series seed failed:', error)
    return NextResponse.json({ status: 'error', error: String(error).slice(0, 800) }, { status: 500 })
  }
}
