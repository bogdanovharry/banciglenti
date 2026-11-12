import { NextResponse } from 'next/server'

import { clearAccountCookie, sameOrigin } from '@/lib/account'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  await clearAccountCookie()
  return NextResponse.json({ ok: true })
}
