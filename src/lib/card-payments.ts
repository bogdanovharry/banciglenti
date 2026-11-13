import { getPayload, type Where } from 'payload'
import config from '@payload-config'

import { marketForOrder } from '@/lib/market'
import type { EmailOrder } from '@/lib/order-emails'
import { notifyOrder } from '@/lib/order-notify'
import { chargeMinor, outcomeOf } from '@/lib/revolut-core'
import { createRevolutOrder, getRevolutOrder } from '@/lib/revolut'
import { siteOrigin } from '@/lib/site-url'

/**
 * Paying an order by card, from "start" to "paid".
 *
 * An order is created first, as for any other method, with payment `pending`.
 * It is marked paid by exactly one thing: Revolut saying, when asked directly
 * with our secret key, that the order is completed for the amount we expect.
 * What reaches us from outside — the browser coming back, a webhook — only
 * triggers that question; neither is believed on its own.
 */

type Row = { id?: string | null; note?: string | null; at?: string | null; author?: number | null }

type OrderDoc = {
  id: number
  orderNumber: string
  clientKey?: string | null
  total?: number | null
  tax?: number | null
  subtotal?: number | null
  vatRate?: number | null
  currency?: string | null
  exchangeRate?: number | null
  status?: string | null
  notes?: string | null
  contact?: { name?: string | null; email?: string | null; phone?: string | null; company?: string | null } | null
  shipping?: { method?: string | null; address?: string | null; cost?: number | null } | null
  payment?: { method?: string | null; status?: string | null; transactionId?: string | null } | null
  billing?: { invoice?: boolean | null; company?: string | null; taxId?: string | null; vatNumber?: string | null; address?: string | null } | null
  items?: { name?: string | null; sku?: string | null; quantity?: number | null; price?: number | null; customSpecs?: unknown }[] | null
  log?: Row[] | null
}

const withEntry = (doc: OrderDoc, note: string) => [
  ...(doc.log ?? []).map((e) => ({ id: e.id ?? undefined, note: e.note ?? '', at: e.at ?? null, author: e.author ?? null })),
  { note, at: new Date().toISOString() },
]

/** The currency and rate the buyer was shown, as stored on the order. */
const chargeFor = (doc: OrderDoc) => ({
  currency: doc.currency || 'EUR',
  amountMinor: chargeMinor(doc.total ?? 0, doc.exchangeRate ?? 1),
})

/** Start the payment; the page to send the buyer to, or why not. */
export async function startCardPayment(orderId: number): Promise<{ url: string } | { error: string }> {
  try {
    const payload = await getPayload({ config })
    const doc = (await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })) as unknown as OrderDoc
    if (!doc.clientKey) return { error: 'order has no key' }

    // The same order asked twice (a refresh, a second tab) reuses its Revolut order.
    if (doc.payment?.transactionId) {
      const existing = await getRevolutOrder(doc.payment.transactionId)
      if (existing.checkout_url && outcomeOf(existing.state) === 'pending') return { url: existing.checkout_url }
    }

    const origin = await siteOrigin()
    const { currency, amountMinor } = chargeFor(doc)
    const order = await createRevolutOrder({
      amountMinor,
      currency,
      reference: doc.orderNumber,
      email: doc.contact?.email ?? '',
      description: `Order ${doc.orderNumber}`,
      redirectUrl: `${origin}/checkout/return?k=${encodeURIComponent(doc.clientKey)}`,
    })
    if (!order.checkout_url) return { error: 'no checkout url' }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        payment: { method: 'revolut', status: 'pending', transactionId: order.id },
        log: withEntry(doc, `Плащане с карта: започнато в Revolut (${(amountMinor / 100).toFixed(2)} ${currency})`),
      },
    })
    return { url: order.checkout_url }
  } catch (error) {
    console.error('[card] could not start the payment', error)
    return { error: 'revolut unavailable' }
  }
}

export type Settled = 'paid' | 'failed' | 'pending' | 'mismatch' | 'unknown'

/**
 * Ask Revolut where the payment stands and bring the order into line.
 * Safe to call any number of times, from anywhere, at the same time.
 */
export async function reconcileCardPayment(where: { id: number } | { clientKey: string } | { revolutOrderId: string }): Promise<{ state: Settled; orderNumber?: string }> {
  try {
    const payload = await getPayload({ config })
    const key: Where = 'id' in where ? { id: { equals: where.id } } : 'clientKey' in where ? { clientKey: { equals: where.clientKey } } : { 'payment.transactionId': { equals: where.revolutOrderId } }
    const found = await payload.find({ collection: 'orders', where: key, limit: 1, depth: 0 })
    const doc = found.docs[0] as unknown as OrderDoc | undefined
    if (!doc || doc.payment?.method !== 'revolut' || !doc.payment.transactionId) return { state: 'unknown' }

    if (doc.payment.status === 'paid') return { state: 'paid', orderNumber: doc.orderNumber }
    if (doc.status === 'cancelled') return { state: 'failed', orderNumber: doc.orderNumber }

    const remote = await getRevolutOrder(doc.payment.transactionId)
    const outcome = outcomeOf(remote.state)

    if (outcome === 'paid') {
      const expected = chargeFor(doc)
      if (remote.amount !== expected.amountMinor || remote.currency !== expected.currency || (remote.outstanding_amount ?? 0) !== 0) {
        await payload.update({
          collection: 'orders',
          id: doc.id,
          data: { log: withEntry(doc, `ВНИМАНИЕ: Revolut отчита платена поръчка, но сумата не съвпада — получено ${remote.amount / 100} ${remote.currency}, очаквано ${expected.amountMinor / 100} ${expected.currency}. Не е отбелязана като платена.`) },
        })
        return { state: 'mismatch', orderNumber: doc.orderNumber }
      }

      // Whoever flips the flag first sends the e-mails; a second caller finds it flipped.
      const pool = (payload.db as unknown as { pool: { query: (q: string, v: unknown[]) => Promise<{ rowCount: number | null }> } }).pool
      const claim = await pool.query(`UPDATE orders SET payment_status = 'paid' WHERE id = $1 AND payment_status IS DISTINCT FROM 'paid'`, [doc.id])
      if (!claim.rowCount) return { state: 'paid', orderNumber: doc.orderNumber }

      const fresh = (await payload.findByID({ collection: 'orders', id: doc.id, depth: 0 })) as unknown as OrderDoc
      await payload.update({
        collection: 'orders',
        id: doc.id,
        data: { log: withEntry(fresh, `Платено с карта през Revolut (${remote.amount / 100} ${remote.currency})`) },
      })
      const origin = await siteOrigin()
      await notifyOrder(doc.id, emailOrderFrom(fresh), marketForOrder(fresh), origin)
      return { state: 'paid', orderNumber: doc.orderNumber }
    }

    if (outcome === 'failed') {
      // Expired or cancelled without payment: the order is given up and its goods go back on the shelf.
      await payload.update({
        collection: 'orders',
        id: doc.id,
        data: {
          status: 'cancelled',
          payment: { method: 'revolut', status: 'failed', transactionId: doc.payment.transactionId },
          log: withEntry(doc, `Плащането с карта не е завършило (${remote.state}) — поръчката е отказана автоматично.`),
        },
      })
      return { state: 'failed', orderNumber: doc.orderNumber }
    }

    return { state: 'pending', orderNumber: doc.orderNumber }
  } catch (error) {
    console.error('[card] could not settle the payment', error)
    return { state: 'unknown' }
  }
}

/** The data the two e-mails are written from, rebuilt from the stored order. */
export function emailOrderFrom(doc: OrderDoc): EmailOrder {
  const billing = doc.billing?.invoice
    ? { company: doc.billing.company ?? '', taxId: doc.billing.taxId ?? '', vatNumber: doc.billing.vatNumber ?? undefined, address: doc.billing.address ?? '' }
    : null
  return {
    orderNumber: doc.orderNumber,
    id: doc.id,
    contact: { name: doc.contact?.name ?? '', email: doc.contact?.email ?? '', phone: doc.contact?.phone ?? '', ...(doc.contact?.company ? { company: doc.contact.company } : {}) },
    address: doc.shipping?.address ?? '',
    shippingMethod: doc.shipping?.method === 'pickup' ? 'pickup' : 'courier',
    paymentMethod: 'card',
    lines: (doc.items ?? []).map((i) => ({
      name: i.name ?? '',
      sku: i.sku ?? '',
      quantity: i.quantity ?? 1,
      price: i.price ?? 0,
      madeToMeasure: Boolean(i.customSpecs),
    })),
    subtotal: doc.subtotal ?? 0,
    shippingCost: doc.shipping?.cost ?? 0,
    tax: doc.tax ?? 0,
    total: doc.total ?? 0,
    vatRate: doc.vatRate ?? 0,
    billing,
    notes: doc.notes ?? undefined,
  }
}
