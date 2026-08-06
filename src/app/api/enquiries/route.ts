import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

const INDUSTRIES = ['Дърво', 'Метал', 'Храни', 'Хоби', 'Абразиви', 'Друго']

/** Caps mirror what the form can produce; anything longer is a bot or a paste bomb. */
const LIMITS = { name: 120, email: 160, phone: 40, company: 160, message: 4000 } as const

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Deliberately permissive — the point is to reject obvious rubbish, not to
 * adjudicate RFC 5322. A customer with an unusual address should still reach us.
 */
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

/**
 * Public, unauthenticated, so it is rate limited per IP. This is in-memory:
 * it resets on redeploy and is per-instance rather than global, which is the
 * honest limitation of doing this without Redis. It stops a script hammering
 * one instance; it is not a defence against a distributed flood.
 */
const RATE = { windowMs: 60_000, max: 5 }
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE.windowMs)
  recent.push(now)
  hits.set(ip, recent)

  if (hits.size > 5000) hits.clear() // crude bound on memory growth
  return recent.length > RATE.max
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Твърде много заявки. Опитайте отново след минута.' },
      { status: 429 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Невалидна заявка.' }, { status: 400 })
  }

  // Honeypot: a hidden field no human fills in. Answer 200 so a bot cannot
  // distinguish rejection from success and retry with the field removed.
  if (clean(body.website, 200)) {
    return NextResponse.json({ status: 'ok' })
  }

  const name = clean(body.name, LIMITS.name)
  const email = clean(body.email, LIMITS.email)
  const message = clean(body.message, LIMITS.message)
  const industry = clean(body.industry, 40)

  const errors: string[] = []
  if (!name) errors.push('Името е задължително.')
  if (!email) errors.push('Имейлът е задължителен.')
  else if (!looksLikeEmail(email)) errors.push('Имейлът изглежда невалиден.')
  if (!message) errors.push('Съобщението е задължително.')

  if (errors.length) {
    return NextResponse.json({ error: errors.join(' ') }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    const doc = await payload.create({
      collection: 'enquiries',
      data: {
        name,
        email,
        phone: clean(body.phone, LIMITS.phone) || undefined,
        company: clean(body.company, LIMITS.company) || undefined,
        industry: INDUSTRIES.includes(industry) ? industry : undefined,
        message,
        status: 'new',
        // No email adapter is configured yet. Recording that explicitly means
        // the admin list shows what still needs a human to pick it up, rather
        // than looking like everything was delivered.
        emailStatus: 'not_sent',
        meta: {
          userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? undefined,
          referer: request.headers.get('referer')?.slice(0, 300) ?? undefined,
        },
      },
    })

    return NextResponse.json({ status: 'ok', id: (doc as { id: number }).id })
  } catch (error) {
    // Never swallow this: a lost enquiry is a lost customer, so the server log
    // keeps the content even when the write failed.
    console.error('Enquiry save failed:', { name, email, industry }, error)
    return NextResponse.json(
      { error: 'Възникна грешка при изпращането. Обадете се на 066 800 822.' },
      { status: 500 },
    )
  }
}
