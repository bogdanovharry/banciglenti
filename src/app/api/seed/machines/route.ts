import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { planMachineProducts } from '@/payload/machine-products'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Pulls "L=2360мм" / "L=2360mm" out of a product name. */
function parseLength(name: string): number | null {
  const m = name.replace(/[хХ]/g, 'x').match(/L\s*=\s*(\d{3,5})/i)
  return m ? Number(m[1]) : null
}

/**
 * Backfills loop lengths, attaches machine compatibility to stock that already
 * fits, and creates products for the machine sizes not yet carried.
 *
 *   curl -X POST https://…/api/seed/machines -H "x-setup-token: $SETUP_TOKEN"
 *
 * Idempotent: re-running skips products that already carry their machines and
 * never creates a slug twice.
 */
export async function POST(request: Request) {
  const expected = process.env.SETUP_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'SETUP_TOKEN is not configured.' }, { status: 503 })
  }
  if (request.headers.get('x-setup-token') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    const all = await payload.find({ collection: 'products', limit: 1000, depth: 0 })
    const docs = all.docs as unknown as {
      id: number
      name: string
      slug: string
      specs?: { length?: number | null }
      machines?: { brand: string; model: string }[]
      basePrice?: number | null
    }[]

    // --- 1. Backfill length from the product name ---
    let lengthsWritten = 0
    const lengthBySlug = new Map<string, number>()

    for (const doc of docs) {
      const parsed = parseLength(doc.name)
      if (parsed === null) continue
      lengthBySlug.set(doc.slug, parsed)
      if (doc.specs?.length === parsed) continue

      await payload.update({
        collection: 'products',
        id: doc.id,
        data: { specs: { length: parsed } },
      })
      lengthsWritten++
    }

    const existingLengths = new Set(lengthBySlug.values())
    const plan = planMachineProducts(existingLengths)

    // --- 2. Attach machines to stock that already fits ---
    let tagged = 0
    for (const tag of plan.tags) {
      const matching = docs.filter((d) => lengthBySlug.get(d.slug) === tag.length)
      for (const doc of matching) {
        const already = new Set((doc.machines ?? []).map((m) => `${m.brand} ${m.model}`))
        const merged = [
          ...(doc.machines ?? []),
          ...tag.machines.filter((m) => !already.has(`${m.brand} ${m.model}`)),
        ]
        if (merged.length === (doc.machines ?? []).length) continue

        await payload.update({ collection: 'products', id: doc.id, data: { machines: merged } })
        tagged++
      }
    }

    // --- 3. Create products for the sizes not carried ---
    const categories = await payload.find({ collection: 'categories', limit: 200, depth: 0 })
    const categoryIdBySlug = new Map(
      (categories.docs as unknown as { id: number; slug: string; parent?: number | null }[]).map(
        (c) => [c.slug, c],
      ),
    )
    const existingSlugs = new Set(docs.map((d) => d.slug))

    let created = 0
    const skipped: string[] = []
    const repriced: string[] = []

    for (const p of plan.creates) {
      if (existingSlugs.has(p.slug)) {
        // Re-priced from the table, so a corrected price row reaches the shelf.
        const have = docs.find((d) => d.slug === p.slug) as unknown as { id: number; basePrice?: number | null }
        if (have && have.basePrice !== p.basePrice) {
          await payload.update({ collection: 'products', id: have.id, data: { basePrice: p.basePrice } })
          repriced.push(p.slug)
        }
        skipped.push(p.slug)
        continue
      }
      const category = categoryIdBySlug.get(p.categorySlug)
      if (!category) {
        skipped.push(`${p.slug} (no category ${p.categorySlug})`)
        continue
      }

      const categoryIds = [category.id, ...(category.parent ? [category.parent] : [])]

      await payload.create({
        collection: 'products',
        data: {
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription,
          basePrice: p.basePrice,
          stock: 0,
          madeToOrder: true, // cut when ordered: there is no stock to run out of
          status: 'active',
          featured: false,
          topProduct: false,
          categories: categoryIds,
          specs: p.specs,
          machines: p.machines,
        },
      })
      created++
    }

    return NextResponse.json({
      status: 'ok',
      lengthsWritten,
      tagged,
      created,
      repriced,
      skipped,
    })
  } catch (error) {
    console.error('Machine seed failed:', error)
    return NextResponse.json({ status: 'error', error: String(error).slice(0, 800) }, { status: 500 })
  }
}
