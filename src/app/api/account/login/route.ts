import { NextResponse } from 'next/server'
import { LockedAuth, getPayload } from 'payload'
import config from '@payload-config'

import { clientIp, rateLimited } from '@/lib/rate-limit'
import { PASSWORD_MAX, normaliseEmail, readJson, sameOrigin, setAccountCookie, toProfile } from '@/lib/account'

export const dynamic = 'force-dynamic'

const PER_IP = { windowMs: 10 * 60_000, max: 15 }

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('forbidden', 403)
  if (rateLimited(`account-login:${clientIp(request)}`, PER_IP)) return fail('rate_limited', 429)

  const body = await readJson(request)
  const email = normaliseEmail(body?.email)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!email || !password || password.length > PASSWORD_MAX) return fail('invalid_credentials', 401)

  try {
    const payload = await getPayload({ config })
    const { token, exp, user } = await payload.login({ collection: 'accounts', data: { email, password } })
    if (!token) return fail('invalid_credentials', 401)
    await setAccountCookie(token, exp ?? Date.now() / 1000 + 3600)
    return NextResponse.json({ account: toProfile(user as never) })
  } catch (error) {
    // Wrong password and no such account read the same to the visitor; a locked
    // account is told apart only so the page can say "wait". Matched by class,
    // not by message: Payload's messages are in the admin's language.
    if (error instanceof LockedAuth) return fail('locked', 423)
    return fail('invalid_credentials', 401)
  }
}
