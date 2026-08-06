import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { parseCustomSpecs, priceCustomItem, type CustomSpecs } from '@/lib/order-pricing'
import { DEFAULT_MARKET, vatRateFor } from '@/lib/market'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Commerce rules come from the market registry, so the server, the browser and
// the legal pages cannot disagree about what an order costs. This is the
// authoritative copy: the browser's figures are a preview, and everything is
// recomputed here before an order is written.
const VAT_RATE = vatRateFor(DEFAULT_MARKET)
const { freeShippingThreshold: FREE_SHIPPING_THRESHOLD, shippingCost: SHIPPING_COST } =
  DEFAULT_MARKET

const PAYMENT_METHODS = ['bank_transfer', 'cod'] as const
const SHIPPING_METHODS = ['courier', 'pickup'] as const

type PaymentMethod = (typeof PAYMENT_METHODS)[number]
type ShippingMethod = (typeof SHIPPING_METHODS)[number]

type IncomingLine = { sku?: unknown; quantity?: unknown; customSpecs?: unknown }

type PricedLine = {
  product?: number
  name: string
  sku: string
  quantity: number
  price: number
  customSpecs?: CustomSpecs
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * TL-260806-4F2A — sortable by eye, short enough to read down a phone line.
 * The random tail avoids a collision when two orders land in the same second.
 */
function generateOrderNumber(now: Date): string {
  const stamp = [
    String(now.getUTCFullYear()).slice(2),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('')
  const tail = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0')
  return `TL-${stamp}-${tail}`
}

const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Невалидна заявка.' }, { status: 400 })
  }

  const contact = (body.contact ?? {}) as Record<string, unknown>
  const shipping = (body.shipping ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(body.items) ? (body.items as IncomingLine[]) : []

  // --- Validation -----------------------------------------------------------
  const errors: Record<string, string> = {}

  if (!isNonEmpty(contact.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.email = 'Въведете валиден имейл.'
  }
  if (!isNonEmpty(contact.phone)) errors.phone = 'Въведете телефон.'
  if (!isNonEmpty(contact.name)) errors.name = 'Въведете име.'

  const shippingMethod = (
    SHIPPING_METHODS.includes(shipping.method as ShippingMethod) ? shipping.method : 'courier'
  ) as ShippingMethod

  if (shippingMethod === 'courier') {
    if (!isNonEmpty(shipping.city)) errors.city = 'Въведете град.'
    if (!isNonEmpty(shipping.street)) errors.street = 'Въведете адрес.'
  }

  const paymentMethod = body.paymentMethod
  if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
    errors.paymentMethod = 'Изберете начин на плащане.'
  }

  if (rawItems.length === 0) errors.items = 'Количката е празна.'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Проверете полетата.', fields: errors }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    // --- Re-price every line from our own data -----------------------------
    const priced: PricedLine[] = []

    for (const line of rawItems) {
      const quantity = Number(line.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        return NextResponse.json({ error: 'Невалидно количество.' }, { status: 400 })
      }
      if (!isNonEmpty(line.sku)) {
        return NextResponse.json({ error: 'Липсва артикул.' }, { status: 400 })
      }

      const specs = parseCustomSpecs(line.customSpecs)

      if (specs) {
        // Made to order: re-derive from the price tables.
        const unit = priceCustomItem(specs)
        if (unit === null) {
          return NextResponse.json(
            { error: `Комбинацията за ${line.sku} не е в ценоразписа.` },
            { status: 409 },
          )
        }
        priced.push({
          name: `Лента по размер ${specs.length}×${specs.width}×${specs.thickness} мм · ${specs.brand}`,
          sku: line.sku,
          quantity,
          price: round2(unit),
          customSpecs: specs,
        })
        continue
      }

      // Catalogue: the price is whatever the CMS says today, not what the
      // browser remembered from a stale tab.
      const found = await payload.find({
        collection: 'products',
        limit: 1,
        depth: 0,
        where: { slug: { equals: line.sku } },
      })
      const product = found.docs[0] as unknown as
        | { id: number; name: string; basePrice?: number | null; status?: string }
        | undefined

      if (!product) {
        return NextResponse.json({ error: `Артикулът ${line.sku} вече не е наличен.` }, { status: 409 })
      }
      if (product.status === 'inactive') {
        return NextResponse.json({ error: `${product.name} вече не се предлага.` }, { status: 409 })
      }

      priced.push({
        product: product.id,
        name: product.name,
        sku: line.sku,
        quantity,
        price: round2(product.basePrice ?? 0),
      })
    }

    const subtotal = round2(priced.reduce((sum, l) => sum + l.price * l.quantity, 0))
    const shippingCost =
      shippingMethod === 'pickup' || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
    const tax = round2(subtotal * VAT_RATE)
    const total = round2(subtotal + shippingCost + tax)

    // --- Customer: reuse the record if this email has ordered before --------
    const email = String(contact.email).trim().toLowerCase()
    const existing = await payload.find({
      collection: 'customers',
      limit: 1,
      depth: 0,
      where: { email: { equals: email } },
    })

    const customerData = {
      name: String(contact.name).trim(),
      email,
      phone: String(contact.phone).trim(),
      ...(isNonEmpty(contact.company) ? { company: String(contact.company).trim() } : {}),
    }

    const customerId =
      (existing.docs[0] as { id: number } | undefined)?.id ??
      ((await payload.create({ collection: 'customers', data: customerData })) as { id: number }).id

    const addressLines = [
      isNonEmpty(shipping.street) ? String(shipping.street).trim() : null,
      [shipping.postalCode, shipping.city].filter(isNonEmpty).map(String).join(' ').trim() || null,
      isNonEmpty(shipping.country) ? String(shipping.country).trim() : 'България',
    ].filter(Boolean)

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber: generateOrderNumber(new Date()),
        customer: customerId,
        items: priced,
        status: 'pending',
        payment: { method: paymentMethod as PaymentMethod, status: 'pending' },
        shipping: {
          method: shippingMethod,
          address: shippingMethod === 'pickup' ? 'Лично вземане · Габрово' : addressLines.join('\n'),
          cost: shippingCost,
        },
        subtotal,
        tax,
        total,
        vatRate: VAT_RATE,
        currency: 'EUR',
        exchangeRate: 1,
        ...(isNonEmpty(body.notes) ? { notes: String(body.notes).trim() } : {}),
      },
    })

    const created = order as unknown as { orderNumber: string }
    return NextResponse.json({
      orderNumber: created.orderNumber,
      subtotal,
      shipping: shippingCost,
      tax,
      total,
    })
  } catch (error) {
    console.error('Order creation failed:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при създаване на поръчката. Опитайте отново или се обадете.' },
      { status: 500 },
    )
  }
}
