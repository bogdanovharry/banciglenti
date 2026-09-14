import { NextResponse } from 'next/server'
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
import { carriageTerms, vatRateFor, type CheckoutPaymentMethod } from '@/lib/market'
import { getMarket } from '@/i18n/locale'
import { withOrderNumber } from '@/lib/order-number'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Commerce rules come from the market registry, resolved from the domain the
// order arrived on — the same lookup the storefront layout makes — so the price
// a Romanian buyer was shown and the VAT they are charged come from one entry.
// This is the authoritative copy: the browser's figures are a preview, and
// everything is recomputed here before an order is written.

const SHIPPING_METHODS = ['courier', 'pickup'] as const

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

  // Before validation, because what is valid depends on it: Romania has no
  // pickup and takes cash on delivery only.
  const market = await getMarket()

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

  if (shippingMethod === 'pickup' && !market.pickup) {
    errors.shippingMethod = 'Личното вземане не се предлага.'
  }
  if (shippingMethod === 'courier') {
    if (!isNonEmpty(shipping.city)) errors.city = 'Въведете град.'
    if (!isNonEmpty(shipping.street)) errors.street = 'Въведете адрес.'
  }

  const paymentMethod = body.paymentMethod as CheckoutPaymentMethod
  if (!market.paymentMethods.includes(paymentMethod)) {
    errors.paymentMethod = 'Изберете начин на плащане.'
  }

  if (rawItems.length === 0) errors.items = 'Количката е празна.'

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Проверете полетата.', fields: errors }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const vatRate = vatRateFor(market)

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

    // Same function the admin re-prices through when a line is added later, so
    // an amended order is costed exactly as the original was.
    const { subtotal, shippingCost, tax, total } = computeOrderTotals({
      lines: priced,
      shippingMethod,
      vatRate,
      ...carriageTerms(market),
    })

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
      market.country,
    ].filter(Boolean)

    const order = await withOrderNumber((orderNumber) =>
      payload.create({
        collection: 'orders',
        data: {
          orderNumber,
          customer: customerId,
          items: priced,
          status: 'pending',
          payment: { method: paymentMethod, status: 'pending' },
          shipping: {
            method: shippingMethod,
            address: shippingMethod === 'pickup' ? 'Лично вземане · Габрово' : addressLines.join('\n'),
            cost: shippingCost,
          },
          subtotal,
          tax,
          total,
          vatRate,
          // Totals stay in EUR, the authored currency. These record what the
          // buyer was shown, and at what rate, for the day RON display is on.
          currency: market.displayCurrency,
          exchangeRate: market.exchangeRate,
          ...(isNonEmpty(body.notes) ? { notes: String(body.notes).trim() } : {}),
        },
      }),
    )

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
