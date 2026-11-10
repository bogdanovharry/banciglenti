import type { PoolClient } from 'pg'

import type { InvoiceSnapshot } from './document'

/**
 * Giving an invoice its number and storing it, as one step.
 *
 * Everything happens on one connection in one transaction:
 *
 *   1. lock the order's row, so two people pressing "issue" for the same order
 *      queue up instead of both getting a number;
 *   2. refuse if the order already has an invoice;
 *   3. take the next number from the series counter — an upsert, which locks
 *      the counter row until the transaction ends, so concurrent orders get
 *      different numbers, one after another;
 *   4. store the invoice and its audit line.
 *
 * If anything fails, the counter moves back with the rest, so a failed issue
 * leaves no gap in the numbering. The database also refuses a duplicate
 * (series, number) and any later UPDATE/DELETE of the invoice — see the
 * invoicing migration.
 */

export class InvoiceError extends Error {}

export type StoreParams = {
  orderId: number
  series: string
  /** The first number of a series that has none yet. */
  firstNumber: number
  issuedAt: Date
  issuedBy: number | null
  /** Builds the snapshot once the number is known. */
  build: (number: string) => InvoiceSnapshot
  shippingProof: unknown
}

export type Stored = { id: number; number: string; snapshot: InvoiceSnapshot }

export async function storeInvoice(client: PoolClient, p: StoreParams): Promise<Stored> {
  await client.query('BEGIN')
  try {
    const order = await client.query('SELECT id FROM orders WHERE id = $1 FOR UPDATE', [p.orderId])
    if (order.rowCount === 0) throw new InvoiceError('Поръчката не съществува.')

    const existing = await client.query(`SELECT number FROM invoices WHERE order_id = $1 AND doc_type = 'invoice' LIMIT 1`, [p.orderId])
    if (existing.rowCount) throw new InvoiceError(`За тази поръчка вече има фактура № ${existing.rows[0].number}.`)

    const counter = await client.query(
      `INSERT INTO invoice_counters (series, last_value) VALUES ($1, $2)
       ON CONFLICT (series) DO UPDATE SET last_value = invoice_counters.last_value + 1, updated_at = now()
       RETURNING last_value`,
      [p.series, p.firstNumber],
    )
    const number = String(counter.rows[0].last_value).padStart(10, '0')
    const snapshot = p.build(number)

    const inserted = await client.query(
      `INSERT INTO invoices
         (doc_type, series, number, issued_at, order_id, tax_case, currency, language,
          net_bani, vat_bani, total_bani, snapshot, shipping_proof, issued_by_id)
       VALUES ('invoice', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13)
       RETURNING id`,
      [
        p.series, number, p.issuedAt.toISOString(), p.orderId, snapshot.taxCase, snapshot.currency, snapshot.language,
        snapshot.totals.netBani, snapshot.totals.vatBani, snapshot.totals.totalBani,
        JSON.stringify(snapshot), JSON.stringify(p.shippingProof ?? null), p.issuedBy,
      ],
    )
    const id = inserted.rows[0].id as number

    await client.query(
      `INSERT INTO invoice_events (invoice_id, order_id, action, actor_id, "at") VALUES ($1, $2, 'issued', $3, $4)`,
      [id, p.orderId, p.issuedBy, p.issuedAt.toISOString()],
    )

    await client.query('COMMIT')
    return { id, number, snapshot }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  }
}
