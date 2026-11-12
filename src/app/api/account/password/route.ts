import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { clientIp, rateLimited } from '@/lib/rate-limit'
import { PASSWORD_MAX, PASSWORD_MIN, getAccount, readJson, sameOrigin, setAccountCookie } from '@/lib/account'

/**
 * Change the password: the old one is asked for again, and every session of the
 * account ends — a stolen cookie stops working with the old password — before
 * this browser is logged in again with the new one.
 */
export const dynamic = 'force-dynamic'

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('forbidden', 403)
  const account = await getAccount()
  if (!account) return fail('unauthorised', 401)
  if (rateLimited(`account-password:${clientIp(request)}`, { windowMs: 10 * 60_000, max: 8 })) return fail('rate_limited', 429)

  const body = await readJson(request)
  const current = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const next = typeof body?.newPassword === 'string' ? body.newPassword : ''
  if (!current || current.length > PASSWORD_MAX) return fail('invalid_credentials', 401)
  if (next.length < PASSWORD_MIN || next.length > PASSWORD_MAX) return fail('weak_password', 400)

  const payload = await getPayload({ config })
  try {
    await payload.login({ collection: 'accounts', data: { email: account.email, password: current } })
  } catch {
    return fail('invalid_credentials', 401)
  }
  try {
    await payload.update({ collection: 'accounts', id: account.id, overrideAccess: true, data: { password: next } })
    await (payload.db as unknown as { pool: { query: (q: string, v: unknown[]) => Promise<unknown> } }).pool.query(
      'DELETE FROM accounts_sessions WHERE _parent_id = $1',
      [account.id],
    )
    const { token, exp } = await payload.login({ collection: 'accounts', data: { email: account.email, password: next } })
    if (token) await setAccountCookie(token, exp ?? Date.now() / 1000 + 3600)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[account] password change failed', error)
    return fail('server', 500)
  }
}
