import { after, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { INDUSTRY_OPTIONS } from '@/lib/catalog-ui'
import { getMarket } from '@/i18n/locale'
import { sendEmail, staffRecipients } from '@/lib/email'
import { staffEnquiryEmail } from '@/lib/order-emails'
import { clientIp, rateLimited } from '@/lib/rate-limit'
import { serverText } from '@/lib/server-text'
import { siteOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

const INDUSTRIES: string[] = INDUSTRY_OPTIONS.map((o) => o.code)

/** Caps mirror what the form can produce; anything longer is a bot or a paste bomb. */
const LIMITS = { body: 20_000, name: 120, email: 160, phone: 40, company: 160, message: 4000 } as const

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Deliberately permissive — the point is to reject obvious rubbish, not to
 * adjudicate RFC 5322. A customer with an unusual address should still reach us.
 */
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

/** Public, unauthenticated: limited per address. See src/lib/rate-limit.ts for what that does and does not stop. */
const RATE = { windowMs: 60_000, max: 5 }

export async function POST(request: Request) {
  const market = await getMarket()
  const say = serverText(market)

  if (rateLimited(`contact:${clientIp(request)}`, RATE)) {
    return NextResponse.json({ error: say.rateLimited }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > LIMITS.body) return NextResponse.json({ error: say.tooLarge }, { status: 413 })
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: say.invalidRequest }, { status: 400 })
  }

  // Honeypot: a hidden field no human fills in. Answer 200 so a bot cannot
  // distinguish rejection from success and retry with the field removed.
  if (clean(body.website, 200)) {
    return NextResponse.json({ status: 'ok' })
  }

  const name = clean(body.name, LIMITS.name)
  // Lowercased on the way in: the customer screen matches enquiries to a
  // customer by email, and the order route stores customers lowercased, so a
  // mixed-case address here never lined up with its owner.
  const email = clean(body.email, LIMITS.email).toLowerCase()
  const message = clean(body.message, LIMITS.message)
  const industry = clean(body.industry, 40)

  const errors: string[] = []
  if (!name) errors.push(say.contactName)
  if (!email) errors.push(say.contactEmail)
  else if (!looksLikeEmail(email)) errors.push(say.contactEmailInvalid)
  if (!message) errors.push(say.contactMessage)

  if (errors.length) {
    return NextResponse.json({ error: errors.join(' ') }, { status: 400 })
  }

  const phone = clean(body.phone, LIMITS.phone) || undefined
  const company = clean(body.company, LIMITS.company) || undefined

  try {
    const payload = await getPayload({ config })

    const doc = (await payload.create({
      collection: 'enquiries',
      data: {
        name,
        email,
        phone,
        company,
        industry: INDUSTRIES.includes(industry) ? industry : undefined,
        message,
        status: 'new',
        // Flipped to 'sent' or 'failed' below once the notification has been
        // tried, so the admin list shows what still needs a human to look.
        emailStatus: 'not_sent',
        meta: {
          userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? undefined,
          referer: request.headers.get('referer')?.slice(0, 300) ?? undefined,
        },
      },
    })) as unknown as { id: number }

    const origin = await siteOrigin()
    after(async () => {
      const mail = staffEnquiryEmail(
        { name, email, phone, company, industry: INDUSTRIES.includes(industry) ? industry : undefined, message },
        origin,
      )
      const result = await sendEmail({
        to: staffRecipients(),
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        replyTo: email,
        idempotencyKey: `enquiry-${doc.id}`,
      })
      if (result.ok) {
        await payload
          .update({ collection: 'enquiries', id: doc.id, data: { emailStatus: 'sent' } })
          .catch((error: unknown) => console.error('[enquiry] could not record the email status:', error))
      } else if (!result.skipped) {
        await payload
          .update({ collection: 'enquiries', id: doc.id, data: { emailStatus: 'failed' } })
          .catch((error: unknown) => console.error('[enquiry] could not record the email status:', error))
      }
    })

    return NextResponse.json({ status: 'ok', id: doc.id })
  } catch (error) {
    // Never swallow this: a lost enquiry is a lost customer, so the server log
    // keeps the content even when the write failed.
    console.error('Enquiry save failed:', { name, email, industry }, error)
    return NextResponse.json({ error: say.contactFailed }, { status: 500 })
  }
}
