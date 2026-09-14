import { NextResponse } from 'next/server'

import { HOBBY_BLADES, HOBBY_SETS, CATALOGUE_ENRICHED } from '@/lib/products-data'
import { checkSeedAuth, seedGenerated } from '../_shared'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Imports the hobby range: blades by machine length and tooth pitch, the mixed
 * sets, and the pitch metadata for the rows that predate it.
 *
 * The legacy rows are included on purpose. They already exist in the shop with
 * their own slugs and prices, both of which this leaves alone — what they gain
 * is the tooth pitch they always had, plus the series, dimensions and machine
 * list that make them filterable next to everything generated.
 *
 *   curl -X POST http://localhost:3000/api/seed/hobby -H "x-setup-token: $SETUP_TOKEN"
 *
 * Pass ?dry=1 to see what it would do without writing.
 */
export async function POST(request: Request) {
  const auth = checkSeedAuth(request)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const legacy = CATALOGUE_ENRICHED.filter((p) => p.category === 'hobi-bantsig' && p.pitch)

    const result = await seedGenerated({
      products: [...legacy, ...HOBBY_BLADES, ...HOBBY_SETS],
      categorySlug: 'hobi-bantsig',
      parentSlug: 'dyrvo',
      brandName: 'Saw-Meister',
      brandSlug: 'saw-meister',
      material: 'Въглеродна стомана, гъвкав гръб',
      dryRun: auth.dryRun,
      // Only the generated slugs. The legacy hobby rows carry their own names
      // and must never be retired by a generator that did not create them.
      retirePrefix: 'flexcut-',
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seeding failed' },
      { status: 500 },
    )
  }
}
