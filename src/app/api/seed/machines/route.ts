import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { MACHINES, type Machine } from '@/lib/machines'
import { planMachineProducts, type ExistingBlade } from '@/payload/machine-products'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Pulls "L=2360мм" / "L=2360mm" out of a product name. */
function parseLength(name: string): number | null {
  const m = name.replace(/[хХ]/g, 'x').match(/L\s*=\s*(\d{3,5})/i)
  return m ? Number(m[1]) : null
}

/** Top-level category slugs that say which kind of machine a blade belongs to. */
const INDUSTRY_SLUGS: Record<Machine['industry'], string[]> = {
  wood: ['dyrvo', 'hobi-bantsig', 'horizontalni-bantsizi', 'vertikalni-bantsizi'],
  metal: ['metal', 'bimetalni-lenti', 'vyglerodna-lenti-cs'],
  meat: ['hrani', 'meso-i-riba'],
}

function industryOf(slugs: string[]): Machine['industry'] | null {
  for (const industry of Object.keys(INDUSTRY_SLUGS) as Machine['industry'][]) {
    if (INDUSTRY_SLUGS[industry].some((s) => slugs.includes(s))) return industry
  }
  return null
}

type Doc = {
  id: number
  name: string
  slug: string
  status?: string
  specs?: { length?: number | null; width?: number | null }
  machines?: { brand: string; model: string }[] | null
  categories?: ({ slug?: string } | number)[] | null
  basePrice?: number | null
}

const keyOf = (m: { brand: string; model: string }) => `${m.brand} ${m.model}`

/**
 * Backfills loop lengths, attaches machine compatibility to stock that really
 * fits, and creates products for the machine sizes not yet carried.
 *
 *   curl -X POST https://…/api/seed/machines -H "x-setup-token: $SETUP_TOKEN"
 *
 * A machine fits a blade when the industry matches, the loop length matches,
 * and — where the registry states a width — the width matches. Re-running also
 * takes registry machines OFF blades they no longer fit, so a corrected
 * registry corrects the shop. Machines added by hand, or by the sawmill
 * generator, are not in the registry and are never touched.
 *
 * Idempotent: re-running changes nothing that is already right.
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

    const all = await payload.find({ collection: 'products', limit: 1000, depth: 1 })
    const docs = all.docs as unknown as Doc[]

    const slugsOf = (d: Doc) =>
      (d.categories ?? []).map((c) => (typeof c === 'object' ? c.slug : undefined)).filter((s): s is string => !!s)

    // --- 1. Backfill length from the product name ---
    let lengthsWritten = 0
    const lengthOf = new Map<string, number>()

    for (const doc of docs) {
      const parsed = parseLength(doc.name) ?? doc.specs?.length ?? null
      if (parsed === null) continue
      lengthOf.set(doc.slug, parsed)
      if (doc.specs?.length === parsed) continue

      await payload.update({ collection: 'products', id: doc.id, data: { specs: { length: parsed } } })
      lengthsWritten++
    }

    const existing: ExistingBlade[] = docs
      .filter((d) => d.status !== 'inactive' && lengthOf.has(d.slug))
      .map((d) => ({
        length: lengthOf.get(d.slug)!,
        width: d.specs?.width ?? null,
        industry: industryOf(slugsOf(d)),
      }))
    const plan = planMachineProducts(existing)

    // --- 2. Make every registry machine sit on exactly the blades it fits ---
    const registry = new Set(MACHINES.map((m) => keyOf(m)))
    const wanted = (doc: Doc): { brand: string; model: string }[] => {
      const length = lengthOf.get(doc.slug)
      const industry = industryOf(slugsOf(doc))
      if (length === undefined || industry === null || doc.status === 'inactive') return []
      return plan.tags
        .filter(
          (t) =>
            t.industry === industry &&
            t.length === length &&
            (t.width === null || t.width === (doc.specs?.width ?? null)),
        )
        .flatMap((t) => t.machines)
    }

    let tagged = 0
    let untagged = 0
    for (const doc of docs) {
      const current = doc.machines ?? []
      const fit = wanted(doc)
      const fitKeys = new Set(fit.map(keyOf))
      // Keep what the registry does not own; replace what it does with what fits.
      const kept = current.filter((m) => !registry.has(keyOf(m)))
      const have = new Set(current.map(keyOf))
      const merged = [...kept, ...fit.filter((m, i) => fit.findIndex((o) => keyOf(o) === keyOf(m)) === i)]

      const same =
        merged.length === current.length && merged.every((m) => have.has(keyOf(m))) &&
        current.filter((m) => registry.has(keyOf(m))).every((m) => fitKeys.has(keyOf(m)))
      if (same) continue

      untagged += current.filter((m) => registry.has(keyOf(m)) && !fitKeys.has(keyOf(m))).length
      tagged += fit.filter((m) => !have.has(keyOf(m))).length
      await payload.update({ collection: 'products', id: doc.id, data: { machines: merged } })
    }

    // --- 3. Create products for the sizes not carried ---
    const categories = await payload.find({ collection: 'categories', limit: 200, depth: 0 })
    const categoryBySlug = new Map(
      (categories.docs as unknown as { id: number; slug: string; parent?: number | null }[]).map((c) => [c.slug, c]),
    )
    const existingSlugs = new Set(docs.map((d) => d.slug))

    let created = 0
    const skipped: string[] = []
    const repriced: string[] = []

    for (const p of plan.creates) {
      if (existingSlugs.has(p.slug)) {
        // Re-priced from the table, so a corrected price row reaches the shelf.
        const have = docs.find((d) => d.slug === p.slug)
        if (have && have.basePrice !== p.basePrice) {
          await payload.update({ collection: 'products', id: have.id, data: { basePrice: p.basePrice } })
          repriced.push(p.slug)
        }
        skipped.push(p.slug)
        continue
      }
      const category = categoryBySlug.get(p.categorySlug)
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
      untagged,
      created,
      repriced,
      skipped,
    })
  } catch (error) {
    console.error('Machine seed failed:', error)
    return NextResponse.json({ status: 'error', error: String(error).slice(0, 800) }, { status: 500 })
  }
}
