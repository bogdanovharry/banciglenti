import { after, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import {
  computeOrderTotals,
  customSku,
  parseCustomSpecs,
  priceCustomItem,
  round2,
  type CustomSpecs,
} from '@/lib/order-pricing'
import { carriageTerms, vatRateFor, type CheckoutPaymentMethod, type Market } from '@/lib/market'
import { getMarket } from '@/i18n/locale'
import { withOrderNumber } from '@/lib/order-number'
import { clientIp, rateLimited } from '@/lib/rate-limit'
import { serverText } from '@/lib/server-text'
import { localizeName, textLang, type Override } from '@/lib/product-text'
import { sendEmail, staffRecipients } from '@/lib/email'
import { customerEmail, staffOrderEmail, type EmailOrder } from '@/lib/order-emails'
import { siteOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Taking an order.
 *
 * Commerce rules come from the market registry, resolved from the domain the
 * order arrived on — the same lookup the storefront layout makes — so the price
 * a Romanian buyer was shown and the VAT they are charged come from one entry.
 * This is the authoritative copy: the browser's figures are a preview, and
 * everything is recomputed here before an order is written.
 *
 * It is a public, unauthenticated endpoint that writes to the database, so it
 * is bounded everywhere a stranger controls the size of something: the body,
 * the number of lines, every string, and how often one address or one customer
 * may order. And it is safe to retry: the checkout page sends a key made when
 * it opened, and the same key returns the order already made instead of a
 * second one.
 */

const SHIPPING_METHODS = ['courier', 'pickup'] as const
type ShippingMethod = (typeof SHIPPING_METHODS)[number]

/** Generous for a real cart, absurd for a script. */
const LIMITS = {
  body: 64_000,
  lines: 50,
  name: 120,
  email: 160,
  phone: 40,
  company: 160,
  city: 120,
  postalCode: 20,
  street: 300,
  notes: 2000,
  sku: 120,
  taxId: 40,
  vatNumber: 40,
  billingAddress: 300,
  key: 80,
} as const

/** Per address, then per customer — the second is shared across instances. */
const PER_IP = { windowMs: 10 * 60_000, max: 12 }
const PER_CUSTOMER = { minutes: 10, max: 5 }

type IncomingLine = { sku?: unknown; quantity?: unknown; customSpecs?: unknown }

type PricedLine = {
  product?: number
  name: string
  sku: string
  quantity: number
  price: number
  customSpecs?: CustomSpecs
}

type ProductDoc = {
  id: number
  name?: string | null
  basePrice?: number | null
  status?: string | null
  stock?: number | null
  madeToOrder?: boolean | null
}

const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

/** A string no longer than `max`, trimmed; anything else is nothing. */
const text = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')

const tooLong = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > max

type Stored = {
  id: number
  orderNumber: string
  subtotal?: number | null
  total?: number | null
  tax?: number | null
  shipping?: { cost?: number | null } | null
}

/** What the page needs to show the order, from a stored order. */
const receipt = (o: Stored) => ({
  orderNumber: o.orderNumber,
  subtotal: o.subtotal ?? 0,
  shipping: o.shipping?.cost ?? 0,
  tax: o.tax ?? 0,
  total: o.total ?? 0,
})

export async function POST(request: Request) {
  const market = await getMarket()
  const say = serverText(market)
  const lang = textLang(market.locale)
  const shownNames = new Map<string, string>()
  const wanted = new Map<number, number>()

  // --- Bound what a stranger can send ---------------------------------------
  if (rateLimited(`checkout:${clientIp(request)}`, PER_IP)) {
    return NextResponse.json({ error: say.rateLimited }, { status: 429 })
  }

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > LIMITS.body) return NextResponse.json({ error: say.tooLarge }, { status: 413 })

  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > LIMITS.body) return NextResponse.json({ error: say.tooLarge }, { status: 413 })
    const parsed: unknown = JSON.parse(raw)
    // `null`, a number or an array parse fine and would crash on the first access.
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: say.invalidRequest }, { status: 400 })
  }

  const asObject = (v: unknown): Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const contact = asObject(body.contact)
  const shipping = asObject(body.shipping)
  const billingIn = asObject(body.billing)
  const rawItems = Array.isArray(body.items) ? (body.items as IncomingLine[]) : []

  // --- Validation -----------------------------------------------------------
  const errors: Record<string, string> = {}

  const email = text(contact.email, LIMITS.email + 1).toLowerCase()
  if (!email || email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = say.email

  const phone = text(contact.phone, LIMITS.phone + 1)
  if (!phone) errors.phone = say.phone
  else if (phone.length > LIMITS.phone) errors.phone = say.tooLong

  const name = text(contact.name, LIMITS.name + 1)
  if (!name) errors.name = say.name
  else if (name.length > LIMITS.name) errors.name = say.tooLong

  const company = text(contact.company, LIMITS.company)

  const shippingMethod = (
    SHIPPING_METHODS.includes(shipping.method as ShippingMethod) ? shipping.method : 'courier'
  ) as ShippingMethod
  if (shippingMethod === 'pickup' && !market.pickup) errors.shippingMethod = say.pickupUnavailable
  if (shippingMethod === 'courier') {
    if (!isNonEmpty(shipping.city)) errors.city = say.city
    else if (tooLong(shipping.city, LIMITS.city)) errors.city = say.tooLong
    if (!isNonEmpty(shipping.street)) errors.street = say.street
    else if (tooLong(shipping.street, LIMITS.street)) errors.street = say.tooLong
  }

  const paymentMethod = body.paymentMethod as CheckoutPaymentMethod
  if (!market.paymentMethods.includes(paymentMethod)) errors.paymentMethod = say.paymentMethod

  // Consent is recorded by the order existing at all, so it has to be explicit.
  if (body.acceptedTerms !== true) errors.acceptedTerms = say.acceptTerms

  const wantsInvoice = billingIn.invoice === true
  const billing = wantsInvoice
    ? {
        company: text(billingIn.company, LIMITS.company),
        taxId: text(billingIn.taxId, LIMITS.taxId),
        vatNumber: text(billingIn.vatNumber, LIMITS.vatNumber),
        address: text(billingIn.address, LIMITS.billingAddress),
      }
    : null
  if (billing) {
    if (!billing.company) errors.billingCompany = say.billingCompany
    if (!billing.taxId) errors.billingTaxId = say.billingTaxId
    if (!billing.address) errors.billingAddress = say.billingAddress
  }

  if (rawItems.length === 0) errors.items = say.itemsEmpty
  else if (rawItems.length > LIMITS.lines) errors.items = say.tooManyItems

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: say.checkFields, fields: errors }, { status: 400 })
  }

  const idempotencyKey = text(body.idempotencyKey, LIMITS.key + 1)
  const clientKey = idempotencyKey.length >= 16 && idempotencyKey.length <= LIMITS.key ? idempotencyKey : null

  try {
    const payload = await getPayload({ config })

    // --- A retry of an order already taken ---------------------------------
    if (clientKey) {
      const earlier = await payload.find({
        collection: 'orders',
        where: { clientKey: { equals: clientKey } },
        limit: 1,
        depth: 0,
      })
      if (earlier.docs[0]) return NextResponse.json(receipt(earlier.docs[0] as unknown as Stored))
    }

    const vatRate = vatRateFor(market)

    // --- Re-price every line from our own data -----------------------------
    const catalogueSkus = new Set<string>()
    for (const line of rawItems) {
      if (isNonEmpty(line?.sku) && !parseCustomSpecs(line.customSpecs)) {
        catalogueSkus.add(line.sku.trim().slice(0, LIMITS.sku))
      }
    }

    // One query for every catalogue line. This was one query per line, in a
    // loop, for whatever number of lines the request claimed to carry.
    const bySlug = new Map<string, ProductDoc & { slug?: string }>()
    if (catalogueSkus.size > 0) {
      const found = await payload.find({
        collection: 'products',
        where: { slug: { in: [...catalogueSkus] } },
        limit: catalogueSkus.size,
        depth: 0,
        pagination: false,
      })
      for (const doc of found.docs as unknown as (ProductDoc & { slug?: string })[]) {
        if (doc.slug) bySlug.set(doc.slug, doc)
      }
    }

    const priced: PricedLine[] = []
    for (const line of rawItems) {
      const quantity = Number(line?.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        return NextResponse.json({ error: say.invalidQuantity }, { status: 400 })
      }
      if (!isNonEmpty(line?.sku) || tooLong(line.sku, LIMITS.sku)) {
        return NextResponse.json({ error: say.missingSku }, { status: 400 })
      }
      const sku = line.sku.trim()

      const specs = parseCustomSpecs(line.customSpecs)
      if (specs) {
        // Made to order: re-derive from the price tables.
        const unit = priceCustomItem(specs)
        if (unit === null) {
          return NextResponse.json({ error: say.comboNotListed(sku) }, { status: 409 })
        }
        priced.push({
          name: say.customLine(specs.length, specs.width, specs.thickness, specs.brand),
          // Built here, never taken from the browser — see customSku.
          sku: customSku(specs),
          quantity,
          price: round2(unit),
          customSpecs: specs,
        })
        continue
      }

      // Catalogue: the price is whatever the CMS says today, not what the
      // browser remembered from a stale tab.
      const product = bySlug.get(sku)
      if (!product) return NextResponse.json({ error: say.unavailable(sku) }, { status: 409 })
      const productName = product.name ?? sku
      // The order keeps the Bulgarian catalogue name; what the buyer is told is in their language.
      const shownName = localizeName(productName, lang, (product as { ro?: Override }).ro)
      shownNames.set(sku, shownName)
      if (product.status === 'inactive') {
        return NextResponse.json({ error: say.retired(shownName) }, { status: 409 })
      }
      // The shop disables the button for a product with nothing in stock; the
      // route has to agree, or anyone can still buy it by hand. A made-to-order
      // product has no stock to run out of.
      if (!product.madeToOrder && (product.status === 'out_of_stock' || (product.stock ?? 0) <= 0)) {
        return NextResponse.json({ error: say.outOfStock(shownName) }, { status: 409 })
      }

      // The same product can arrive on two lines; stock is checked on the total.
      if (!product.madeToOrder) {
        const asked = (wanted.get(product.id) ?? 0) + quantity
        wanted.set(product.id, asked)
        if (asked > (product.stock ?? 0)) {
          return NextResponse.json({ error: say.notEnoughStock(shownName, product.stock ?? 0) }, { status: 409 })
        }
      }

      priced.push({
        product: product.id,
        name: productName,
        sku,
        quantity,
        price: round2(product.basePrice ?? 0),
      })
    }

    // Same function the admin re-prices through when a line is added later, so
    // an amended order is costed exactly as the original was.
    const { subtotal, shippingCost, tax, total } = computeOrderTotals({
      lines: priced,
      shippingMethod,
      vatRate,
      ...carriageTerms(market),
    })

    // --- Customer: reuse the record if this email has ordered before --------
    const existing = await payload.find({
      collection: 'customers',
      limit: 1,
      depth: 0,
      where: { email: { equals: email } },
    })
    const known = existing.docs[0] as { id: number } | undefined

    // Shared across instances, unlike the per-address limiter: the same email
    // placing order after order, from anywhere, is a flood or a mistake.
    if (known) {
      const since = new Date(Date.now() - PER_CUSTOMER.minutes * 60_000).toISOString()
      const recent = await payload.count({
        collection: 'orders',
        where: { and: [{ customer: { equals: known.id } }, { createdAt: { greater_than: since } }] },
      })
      if (recent.totalDocs >= PER_CUSTOMER.max) {
        return NextResponse.json({ error: say.rateLimited }, { status: 429 })
      }
    }

    const customerId =
      known?.id ??
      (
        (await payload.create({
          collection: 'customers',
          data: {
            name,
            email,
            phone,
            ...(company ? { company } : {}),
            // A company ordering with an invoice is a company customer.
            ...(billing ? { company: billing.company, taxId: billing.taxId, vatNumber: billing.vatNumber || undefined } : {}),
          },
        })) as { id: number }
      ).id

    const addressLines = [
      text(shipping.street, LIMITS.street) || null,
      [text(shipping.postalCode, LIMITS.postalCode), text(shipping.city, LIMITS.city)].filter(Boolean).join(' ') || null,
      market.country,
    ].filter(Boolean)
    const address = shippingMethod === 'pickup' ? 'Лично вземане · Габрово' : addressLines.join('\n')
    const notes = text(body.notes, LIMITS.notes)

    let order: Stored
    try {
      order = (await withOrderNumber((orderNumber) =>
        payload.create({
          collection: 'orders',
          data: {
            orderNumber,
            ...(clientKey ? { clientKey } : {}),
            customer: customerId,
            // What was typed, kept on the order itself — see Orders.ts.
            contact: { name, email, phone, ...(company ? { company } : {}) },
            ...(billing ? { billing: { invoice: true, ...billing } } : {}),
            items: priced,
            status: 'pending',
            payment: { method: paymentMethod, status: 'pending' },
            shipping: { method: shippingMethod, address, cost: shippingCost },
            subtotal,
            tax,
            total,
            vatRate,
            // Totals stay in EUR, the authored currency. These record what the
            // buyer was shown, and at what rate, for the day RON display is on.
            currency: market.displayCurrency,
            exchangeRate: market.exchangeRate,
            ...(notes ? { notes } : {}),
          },
        }),
      )) as unknown as Stored
    } catch (error) {
      // Two submissions with one key racing each other: the loser finds the
      // winner's order and returns it, rather than reporting an error.
      if (clientKey) {
        const winner = await payload.find({
          collection: 'orders',
          where: { clientKey: { equals: clientKey } },
          limit: 1,
          depth: 0,
        })
        if (winner.docs[0]) return NextResponse.json(receipt(winner.docs[0] as unknown as Stored))
      }
      throw error
    }

    // --- Take the goods off the shelf --------------------------------------
    // After the order exists, so a failed order never costs stock. Read-modify-
    // write, not atomic: two buyers racing for the last unit can both get it,
    // and staff see that on the order. Made-to-order products have no stock.
    for (const [productId, qty] of wanted) {
      try {
        const current = (await payload.findByID({ collection: 'products', id: productId, depth: 0 })) as unknown as {
          stock?: number | null
        }
        const left = Math.max(0, (current.stock ?? 0) - qty)
        await payload.update({
          collection: 'products',
          id: productId,
          data: { stock: left, ...(left === 0 ? { status: 'out_of_stock' as const } : {}) },
        })
      } catch (error) {
        console.error('Stock decrement failed:', productId, error)
      }
    }

    // --- Tell people, after the buyer has their answer ---------------------
    const origin = await siteOrigin()
    const emailOrder: EmailOrder = {
      orderNumber: order.orderNumber,
      id: order.id,
      contact: { name, email, phone, ...(company ? { company } : {}) },
      address,
      shippingMethod,
      paymentMethod,
      lines: priced.map((l) => ({
        name: shownNames.get(l.sku) ?? l.name,
        sku: l.sku,
        quantity: l.quantity,
        price: l.price,
        madeToMeasure: Boolean(l.customSpecs),
      })),
      subtotal,
      shippingCost,
      tax,
      total,
      vatRate,
      billing,
      notes: notes || undefined,
    }
    after(() => notify(order.id, emailOrder, market, origin))

    return NextResponse.json(receipt(order))
  } catch (error) {
    console.error('Order creation failed:', error)
    return NextResponse.json({ error: say.orderFailed }, { status: 500 })
  }
}

/**
 * The two emails an order sends, and a line in the order's history saying how
 * it went.
 *
 * The line is the point: a notification that fails silently is an order nobody
 * knows to look at. If the staff email is not sent — no provider configured, or
 * the provider refused — the order's history says so, and so does the
 * dashboard's pending count, which is the safety net.
 */
async function notify(orderId: number, order: EmailOrder, market: Market, origin: string) {
  try {
    const customer = customerEmail(market, order, origin)
    const staff = staffOrderEmail(order, market, origin)
    const recipients = staffRecipients()

    const [toCustomer, toStaff] = await Promise.all([
      sendEmail({
        to: order.contact.email,
        subject: customer.subject,
        html: customer.html,
        text: customer.text,
        idempotencyKey: `order-${order.orderNumber}-customer`,
      }),
      sendEmail({
        to: recipients,
        subject: staff.subject,
        html: staff.html,
        text: staff.text,
        replyTo: order.contact.email,
        idempotencyKey: `order-${order.orderNumber}-staff`,
      }),
    ])

    const describe = (label: string, r: typeof toStaff) =>
      r.ok ? `${label}: изпратен` : r.skipped ? `${label}: не е изпратен (няма настроен имейл)` : `${label}: НЕУСПЕШЕН (${r.error})`
    const note = `${describe('Имейл до клиента', toCustomer)} · ${describe('Известие до екипа', toStaff)}`

    // Only worth a line when something needs a person: both sent is the norm.
    if (toCustomer.ok && toStaff.ok) return

    const payload = await getPayload({ config })
    const doc = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })) as unknown as {
      log?: { id?: string | null; note?: string | null; at?: string | null; author?: number | null }[] | null
    }
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        log: [
          ...(doc.log ?? []).map((e) => ({ id: e.id ?? undefined, note: e.note ?? '', at: e.at ?? null, author: e.author ?? null })),
          { note, at: new Date().toISOString() },
        ],
      },
    })
  } catch (error) {
    console.error('[order] notification step failed:', error)
  }
}
