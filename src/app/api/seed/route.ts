import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { seed } from '@/payload/seed'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * One-shot catalogue import. Guarded by SETUP_TOKEN and POST-only — this
 * replaces the unauthenticated GET endpoints that previously exposed a
 * drop-every-table "reset" step to anyone who requested the URL.
 *
 *   curl -X POST https://…/api/seed -H "x-setup-token: $SETUP_TOKEN"
 *
 * Refuses to run against a non-empty catalogue; re-seeding means clearing the
 * collections in /admin first.
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

  try {
    const payload = await getPayload({ config })

    const existing = await payload.count({ collection: 'products' })
    if (existing.totalDocs > 0) {
      return NextResponse.json(
        { status: 'already_seeded', products: existing.totalDocs },
        { status: 409 },
      )
    }

    const result = await seed(payload)
    return NextResponse.json({ status: 'ok', ...result })
  } catch (error) {
    console.error('Seed failed:', error)
    return NextResponse.json({ status: 'error', error: String(error).slice(0, 800) }, { status: 500 })
  }
}
