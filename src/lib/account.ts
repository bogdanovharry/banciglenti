import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

import { toProfile, type AccountProfile, type RawAccount } from './account-core'

export * from './account-core'

/**
 * The shopper's session.
 *
 * The login itself is Payload's (a hashed password, a lock after repeated
 * failures, a session id in the token). What is ours is where the token lives:
 * a cookie called `sm_account`, not `payload-token`. A staff member who is
 * logged into /admin and tries the shop as a customer must not lose their admin
 * session, and the admin must never take a shopper's cookie for a staff one.
 *
 * Reading it back goes through `payload.auth` with the token as a header, which
 * checks the signature, the expiry and that the session still exists.
 */
export const ACCOUNT_COOKIE = 'sm_account'

/** The account behind a token, or null for anything that is not a live account session. */
async function accountFromToken(token: string): Promise<AccountProfile | null> {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: new Headers({ Authorization: `JWT ${token}` }) })
    const u = user as (RawAccount & { collection?: string }) | null
    if (!u || u.collection !== 'accounts') return null
    return toProfile(u)
  } catch {
    return null
  }
}

/** Who is logged in on this request, if anyone. */
export async function getAccount(): Promise<AccountProfile | null> {
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value
  return token ? accountFromToken(token) : null
}

export async function setAccountCookie(token: string, expiresAtSeconds: number): Promise<void> {
  const maxAge = Math.max(60, Math.floor(expiresAtSeconds - Date.now() / 1000))
  ;(await cookies()).set(ACCOUNT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export async function clearAccountCookie(): Promise<void> {
  ;(await cookies()).set(ACCOUNT_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
}

/** A JSON body of bounded size, or null. */
export async function readJson(request: Request, maxBytes = 32_000): Promise<Record<string, unknown> | null> {
  try {
    const raw = await request.text()
    if (raw.length > maxBytes) return null
    const body = JSON.parse(raw)
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}
