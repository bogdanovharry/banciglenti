import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { clientIp, rateLimited } from '@/lib/rate-limit'
import {
  PASSWORD_MAX,
  clearAccountCookie,
  clean,
  getAccount,
  readJson,
  sameOrigin,
  toProfile,
  type Address,
  type Machine,
} from '@/lib/account'

/**
 * Save the profile (PATCH) or delete it (DELETE).
 *
 * Everything is re-read from the session on the server: the id to change is
 * never taken from the request, so one shopper cannot edit another's profile by
 * changing a number.
 */
export const dynamic = 'force-dynamic'

const MAX = { addresses: 5, machines: 10, name: 120, phone: 40, company: 160, taxId: 40, vatNumber: 40, street: 300, city: 120, postalCode: 20, label: 60, brand: 80, model: 80 }

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v.replace(',', '.')) : NaN
  return Number.isFinite(n) && n > 0 && n < 100_000 ? n : null
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return fail('forbidden', 403)
  const account = await getAccount()
  if (!account) return fail('unauthorised', 401)
  if (rateLimited(`account-save:${account.id}`, { windowMs: 60_000, max: 30 })) return fail('rate_limited', 429)

  const body = await readJson(request)
  if (!body) return fail('invalid', 400)

  // Only what the request carries is changed; the page always sends everything.
  const name = clean(body.name, MAX.name)
  if ('name' in body && !name) return fail('invalid', 400)

  const addresses = (Array.isArray(body.addresses) ? body.addresses : [])
    .slice(0, MAX.addresses)
    .map((a: Record<string, unknown>): Address => ({
      label: clean(a?.label, MAX.label),
      street: clean(a?.street, MAX.street),
      city: clean(a?.city, MAX.city),
      postalCode: clean(a?.postalCode, MAX.postalCode),
      isDefault: a?.isDefault === true,
    }))
    .filter((a: Address) => a.street || a.city)
  // One default at most: the first one ticked.
  let seenDefault = false
  for (const a of addresses) {
    if (a.isDefault && seenDefault) a.isDefault = false
    if (a.isDefault) seenDefault = true
  }

  const machines = (Array.isArray(body.machines) ? body.machines : [])
    .slice(0, MAX.machines)
    .map((m: Record<string, unknown>): Machine => ({
      brand: clean(m?.brand, MAX.brand),
      model: clean(m?.model, MAX.model),
      bladeLength: num(m?.bladeLength),
      bladeWidth: num(m?.bladeWidth),
      bladeThickness: num(m?.bladeThickness),
    }))
    .filter((m: Machine) => m.brand || m.model)

  try {
    const payload = await getPayload({ config })
    const updated = await payload.update({
      collection: 'accounts',
      id: account.id,
      overrideAccess: true,
      data: {
        ...(name ? { name } : {}),
        ...('phone' in body ? { phone: clean(body.phone, MAX.phone) } : {}),
        ...('company' in body ? { company: clean(body.company, MAX.company) } : {}),
        ...('taxId' in body ? { taxId: clean(body.taxId, MAX.taxId) } : {}),
        ...('vatNumber' in body ? { vatNumber: clean(body.vatNumber, MAX.vatNumber) } : {}),
        ...(Array.isArray(body.addresses) ? { addresses } : {}),
        ...(Array.isArray(body.machines) ? { machines } : {}),
      },
    })
    return NextResponse.json({ account: toProfile(updated as never) })
  } catch (error) {
    console.error('[account] save failed', error)
    return fail('server', 500)
  }
}

/** Delete the profile for good, after the password is given again. Orders stay, unlinked. */
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail('forbidden', 403)
  const account = await getAccount()
  if (!account) return fail('unauthorised', 401)
  if (rateLimited(`account-delete:${clientIp(request)}`, { windowMs: 10 * 60_000, max: 5 })) return fail('rate_limited', 429)

  const body = await readJson(request)
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password || password.length > PASSWORD_MAX) return fail('invalid_credentials', 401)

  try {
    const payload = await getPayload({ config })
    await payload.login({ collection: 'accounts', data: { email: account.email, password } })
  } catch {
    return fail('invalid_credentials', 401)
  }
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'accounts', id: account.id, overrideAccess: true })
    await clearAccountCookie()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[account] delete failed', error)
    return fail('server', 500)
  }
}
