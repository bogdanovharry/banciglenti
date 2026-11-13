import { NextResponse } from 'next/server'
import { ValidationError, getPayload } from 'payload'
import config from '@payload-config'

import { getMarket } from '@/i18n/locale'
import { clientIp, rateLimited } from '@/lib/rate-limit'
import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  clean,
  isEmail,
  normaliseEmail,
  readJson,
  sameOrigin,
  setAccountCookie,
  toProfile,
} from '@/lib/account'

/**
 * Make a profile and log it in.
 *
 * Public, writes to the database, and until e-mail is wired up nothing proves
 * the address is the shopper's — so a new profile starts empty and is never
 * attached to a customer or an order that already exists under that address.
 * Errors are codes; the page words them in the visitor's language.
 */
export const dynamic = 'force-dynamic'

const PER_IP = { windowMs: 60 * 60_000, max: 8 }

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('forbidden', 403)
  if (rateLimited(`account-register:${clientIp(request)}`, PER_IP)) return fail('rate_limited', 429)

  const body = await readJson(request)
  if (!body) return fail('invalid', 400)

  const email = normaliseEmail(body.email)
  const name = clean(body.name, 120)
  const password = typeof body.password === 'string' ? body.password : ''
  if (!isEmail(email) || !name) return fail('invalid', 400)
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) return fail('weak_password', 400)
  if (body.acceptTerms !== true) return fail('terms_required', 400)

  const market = await getMarket()
  const payload = await getPayload({ config })

  const existing = await payload.count({ collection: 'accounts', where: { email: { equals: email } }, overrideAccess: true })
  if (existing.totalDocs > 0) return fail('email_taken', 409)

  try {
    await payload.create({
      collection: 'accounts',
      overrideAccess: true,
      data: {
        email,
        password,
        name,
        phone: clean(body.phone, 40) || undefined,
        market: market.code,
        termsAcceptedAt: new Date().toISOString(),
      },
    })
    const { token, exp, user } = await payload.login({ collection: 'accounts', data: { email, password } })
    if (!token) return fail('server', 500)
    await setAccountCookie(token, exp ?? Date.now() / 1000 + 3600)
    return NextResponse.json({ account: toProfile(user as never) })
  } catch (error) {
    // Two registrations of one address at once: the unique index refuses the second.
    if (error instanceof ValidationError) return fail('email_taken', 409)
    console.error('[account] register failed', error)
    return fail('server', 500)
  }
}
