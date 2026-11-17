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

/**
 * What a shopper typed at checkout, kept on their profile so the next order is
 * already filled in. Only gaps are filled — nothing the shopper saved on the
 * profile page is overwritten by an order — and a delivery address is added only
 * when the profile has none yet. Best effort: a failure here never touches the order.
 */
export async function rememberFromOrder(
  account: AccountProfile,
  typed: {
    name: string
    phone: string
    company?: string
    taxId?: string
    vatNumber?: string
    address?: { street: string; city: string; postalCode: string } | null
  },
): Promise<void> {
  const data: Record<string, unknown> = {}
  if (!account.phone && typed.phone) data.phone = typed.phone
  if (!account.company && typed.company) data.company = typed.company
  if (!account.taxId && typed.taxId) data.taxId = typed.taxId
  if (!account.vatNumber && typed.vatNumber) data.vatNumber = typed.vatNumber
  const a = typed.address
  if (a && (a.street || a.city) && account.addresses.length === 0) {
    data.addresses = [{ label: '', street: a.street, city: a.city, postalCode: a.postalCode, isDefault: true }]
  }
  if (Object.keys(data).length === 0) return
  try {
    const payload = await getPayload({ config })
    await payload.update({ collection: 'accounts', id: account.id, overrideAccess: true, data })
  } catch (error) {
    console.error('[account] could not remember checkout details', error)
  }
}
