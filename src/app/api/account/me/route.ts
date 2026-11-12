import { NextResponse } from 'next/server'

import { getAccount } from '@/lib/account'

/** Who is logged in — what the checkout reads to fill its form. Never cached. */
export const dynamic = 'force-dynamic'

export async function GET() {
  const account = await getAccount()
  return NextResponse.json({ account }, { headers: { 'Cache-Control': 'no-store' } })
}
