import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { READY_SAWMILL_BLADES } from '@/lib/products-data'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Imports the ready-made sawmill blades — ProCut and SoftCut welded to the
 * popular mill lengths, singles and boxes.
 *
 * Additive on purpose. /api/seed is a one-shot that refuses to run against a
 * non-empty catalogue, which is right for a first import and useless for
 * adding a range to a shop that is already selling. This inserts only slugs
 * that are not there yet, so it is safe to run again after the generator
 * changes, and it never touches a product it did not create.
 *
 * Prices are not sent from here. They come from READY_SAWMILL_BLADES, which
 * computes them from HORIZONTAL_WOOD_BLADES — the same table the configurator
 * quotes from — so a shelf blade and a configured one cannot drift apart.
 *
 *   curl -X POST http://localhost:3000/api/seed/blades -H "x-setup-token: $SETUP_TOKEN"
 *
 * Pass ?dry=1 to see what it would do without writing anything.
 */
export async function POST(request: Request) {
  const expected = process.env.SETUP_TOKEN

  // Fail closed: no token configured means the endpoint is unavailable, not open.
  if (!expected) {
    return NextResponse.json(
      { error: 'SETUP_TOKEN is not configured; seeding is disabled.' },
      { status: 503 },
    )
  }
  if (request.headers.get('x-setup-token') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(request.url).searchParams.get('dry') === '1'

  try {
    const payload = await getPayload({ config })

    const category = await payload.find({
      collection: 'categories',
      where: { slug: { equals: 'horizontalni-bantsizi' } },
      limit: 1,
    })
    const categoryId = category.docs[0]?.id
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category horizontalni-bantsizi not found — run /api/seed first.' },
        { status: 409 },
      )
    }
    // The parent industry too, so /category/dyrvo lists them.
    const parent = await payload.find({
      collection: 'categories',
      where: { slug: { equals: 'dyrvo' } },
      limit: 1,
    })

    // House brand. Created rather than assumed, so this route works on a shop
    // that was seeded before Saw-Meister existed as a brand record.
    const brands = await payload.find({
      collection: 'brands',
      where: { slug: { equals: 'saw-meister' } },
      limit: 1,
    })
    let brandId = brands.docs[0]?.id
    if (!brandId && !dryRun) {
      const created = await payload.create({
        collection: 'brands',
        data: { name: 'Saw-Meister', slug: 'saw-meister' },
      })
      brandId = created.id
    }

    const categories = [categoryId, parent.docs[0]?.id].filter(
      (id): id is number => typeof id === 'number',
    )

    const created: string[] = []
    const skipped: string[] = []
    const patched: string[] = []

    for (const p of READY_SAWMILL_BLADES) {
      const existing = await payload.find({
        collection: 'products',
        where: { slug: { equals: p.slug } },
        limit: 1,
      })
      // Machines were added after the first import, so an existing row is
      // patched rather than skipped outright — otherwise the machine filter
      // stays empty for everything already in the shop.
      const machines = (p.machines ?? []).map((m) => {
        const [brand, ...rest] = m.split(' ')
        return { brand, model: rest.join(' ') || brand }
      })

      if (existing.totalDocs > 0) {
        skipped.push(p.slug)
        if (!dryRun && machines.length) {
          await payload.update({
            collection: 'products',
            id: existing.docs[0].id,
            data: { machines, name: p.name },
          })
          patched.push(p.slug)
        }
        continue
      }
      if (dryRun) {
        created.push(p.slug)
        continue
      }

      await payload.create({
        collection: 'products',
        data: {
          name: p.name,
          slug: p.slug,
          basePrice: p.price,
          stock: p.stock,
          featured: p.featured,
          topProduct: p.topProduct,
          status: p.stock > 0 ? 'active' : 'out_of_stock',
          series: p.series as 'procut' | 'softcut',
          ...(brandId ? { brand: brandId } : {}),
          machines,
          categories,
          specs: {
            width: p.width,
            thickness: p.thickness,
            length: p.length,
            material: 'Въглеродна лентова стомана',
          },
        },
      })
      created.push(p.slug)
    }

    // Sizes the generator no longer makes — the 4013 mm Wood-Mizer blades came
    // from an inch conversion, and Serra/Jonsered 3570 had no metric source.
    // Retired, not deleted, so the URL resolves and old orders still read.
    const live = new Set(READY_SAWMILL_BLADES.map((p) => p.slug))
    const retired: string[] = []
    for (const prefix of ['saw-meister-procut-', 'saw-meister-softcut-']) {
      const owned = await payload.find({
        collection: 'products',
        where: { slug: { like: `${prefix}%` }, status: { not_equals: 'inactive' } },
        limit: 1000,
        depth: 0,
      })
      for (const doc of owned.docs) {
        const slug = String(doc.slug)
        // Only the ready-made loops (-l<length>); configurator and set rows are not ours.
        if (!/-l\d{4}(-x\d+)?$/.test(slug) || live.has(slug)) continue
        if (!dryRun) {
          await payload.update({ collection: 'products', id: doc.id, data: { status: 'inactive', stock: 0 } })
        }
        retired.push(slug)
      }
    }

    return NextResponse.json({
      status: dryRun ? 'dry_run' : 'ok',
      retired: retired.length,
      available: READY_SAWMILL_BLADES.length,
      created: created.length,
      skipped: skipped.length,
      patched: patched.length,
      sample: created.slice(0, 5),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seeding failed' },
      { status: 500 },
    )
  }
}
