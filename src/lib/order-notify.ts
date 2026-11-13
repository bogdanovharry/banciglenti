import { getPayload } from 'payload'
import config from '@payload-config'

import { sendEmail, staffRecipients } from '@/lib/email'
import type { Market } from '@/lib/market'
import { customerEmail, staffOrderEmail, type EmailOrder } from '@/lib/order-emails'

/**
 * The two emails an order sends, and a line in the order's history saying how
 * it went.
 *
 * The line is the point: a notification that fails silently is an order nobody
 * knows to look at. If the staff email is not sent — no provider configured, or
 * the provider refused — the order's history says so, and so does the
 * dashboard's pending count, which is the safety net.
 */
export async function notifyOrder(orderId: number, order: EmailOrder, market: Market, origin: string) {
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
