import type { Pool } from 'pg'

import { COMPANY, COMPANY_LATIN, addressLine, formattedAddress } from '@/lib/company'
import { INVOICE_SETTINGS } from '@/lib/invoicing/settings'
import {
  buildSnapshot,
  previewWarnings,
  type InvoiceBuyer,
  type InvoiceSnapshot,
  type InvoiceSupplier,
} from '@/lib/invoicing/document'
import { InvoiceError, storeInvoice } from '@/lib/invoicing/store'
import { marketForOrder } from '@/lib/market'
import { localizeName } from '@/lib/product-text'
import { getOrder, type OrderDetail } from '@/lib/manage/order'
import { getClient, isAdmin, requireUser, type ManageUser } from '@/lib/manage/session'

/**
 * Invoices on the management screens: what the preview shows, whether an order
 * may be invoiced yet, and the act of issuing.
 *
 * The invoice is prepared from the order whenever it is looked at, and frozen
 * (stored whole, with its number) only when an administrator presses "issue".
 * Issue is allowed once the order has shipped — the owner's decision — and never
 * happens by itself: the owner looks first.
 */

export { InvoiceError }

/** The invoice already issued for an order, if any. */
export type IssuedInvoice = {
  id: number
  number: string
  series: string
  issuedAt: string
  snapshot: InvoiceSnapshot
}

export async function getIssuedInvoice(orderId: number): Promise<IssuedInvoice | null> {
  await requireUser(`/manage/orders/${orderId}`)
  const payload = await getClient()
  const found = await payload.find({
    collection: 'invoices',
    where: { and: [{ order: { equals: orderId } }, { docType: { equals: 'invoice' } }] },
    limit: 1,
    depth: 0,
  })
  const doc = found.docs[0] as unknown as
    | { id: number; number: string; series: string; issuedAt: string; snapshot: InvoiceSnapshot }
    | undefined
  return doc ? { id: doc.id, number: doc.number, series: doc.series, issuedAt: doc.issuedAt, snapshot: doc.snapshot } : null
}

/** The supplier as printed. Details come from src/lib/company.ts until they are moved into stored settings. */
export function supplierDetails(): InvoiceSupplier {
  return {
    nameBg: COMPANY.legalName,
    nameLatin: COMPANY_LATIN.legalName,
    vatNumber: COMPANY.vatNumber,
    registrationNumber: COMPANY.eik,
    // company.ts says it plainly: the ЕИК was derived from the VAT number, not read from the register.
    registrationNumberConfirmed: false,
    addressBg: formattedAddress(),
    addressLatin: addressLine('ro'),
    representative: null,
    bankName: COMPANY.bank.name,
    iban: COMPANY.bank.iban,
    bic: COMPANY.bank.bic,
  }
}

const oneLine = (s: string | null | undefined): string =>
  (s ?? '').split(/\r?\n/).map((p) => p.trim()).filter(Boolean).join(', ')

function buyerOf(order: OrderDetail): InvoiceBuyer {
  if (order.billing) {
    return {
      name: order.billing.company ?? order.customer.name ?? '—',
      isCompany: true,
      taxId: order.billing.taxId,
      vatNumber: order.billing.vatNumber || null,
      address: oneLine(order.billing.address) || oneLine(order.shipping.address),
    }
  }
  return {
    name: order.customer.name ?? '—',
    isCompany: false,
    taxId: null,
    vatNumber: null,
    address: oneLine(order.shipping.address),
  }
}

const SOFIA_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sofia', year: 'numeric', month: '2-digit', day: '2-digit' })

/** The invoice as it would be issued right now (no number yet). */
export function previewSnapshot(order: OrderDetail, number: string | null = null, at: Date = new Date()): InvoiceSnapshot {
  return buildSnapshot({
    order: {
      orderNumber: order.orderNumber,
      subtotalEur: order.subtotal,
      taxEur: order.tax,
      totalEur: order.total,
      vatRate: order.vatRate,
      exchangeRate: order.exchangeRate,
      lines: order.lines.map((l) => ({ name: l.name, quantity: l.quantity, priceEur: l.price })),
      paymentMethod: order.payment.method,
      waybill: order.shipping.trackingNumber,
      buyer: buyerOf(order),
    },
    supplier: supplierDetails(),
    series: INVOICE_SETTINGS.series.code,
    number,
    issueDate: SOFIA_DAY.format(at),
    toRomanian: (name) => localizeName(name, 'ro'),
  })
}

export const warningsFor = (snapshot: InvoiceSnapshot, order: OrderDetail): string[] => previewWarnings(snapshot, order.status)

/** Why this order cannot be invoiced now, or null when it can. */
export function whyNotInvoiceable(order: OrderDetail, user: ManageUser | null): string | null {
  if (marketForOrder(order).code !== 'ro') return 'Фактури от сайта се издават само за поръчки от Румъния.'
  if (order.status === 'cancelled') return 'Поръчката е отказана.'
  if (order.status !== 'shipped' && order.status !== 'delivered') {
    return 'Фактурата се издава, когато поръчката е изпратена. Сега можете само да я прегледате.'
  }
  if (!isAdmin(user)) return 'Фактури издава само администратор.'
  return null
}

/** Issue the invoice. Throws InvoiceError with a sentence for the screen when it may not be done. */
export async function issueInvoiceFor(orderId: number): Promise<{ number: string }> {
  const user = await requireUser(`/manage/orders/${orderId}/invoice`)
  const order = await getOrder(orderId)
  if (!order) throw new InvoiceError('Поръчката не съществува.')

  const refusal = whyNotInvoiceable(order, user)
  if (refusal) throw new InvoiceError(refusal)

  const issuedAt = new Date()
  const payload = await getClient()
  const pool = (payload.db as unknown as { pool: Pool }).pool
  const client = await pool.connect()
  try {
    const stored = await storeInvoice(client, {
      orderId,
      series: INVOICE_SETTINGS.series.code,
      firstNumber: INVOICE_SETTINGS.series.firstNumber,
      issuedAt,
      issuedBy: user.id,
      build: (number) => previewSnapshot(order, number, issuedAt),
      // Proof of transport, kept beside the invoice. Only the waybill is known to the system so far.
      shippingProof: { waybill: order.shipping.trackingNumber, orderStatus: order.status },
    })
    return { number: stored.number }
  } finally {
    client.release()
  }
}
