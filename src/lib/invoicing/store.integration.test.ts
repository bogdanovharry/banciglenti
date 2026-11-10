import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildSnapshot, type InvoiceSupplier } from './document'
import { InvoiceError, storeInvoice } from './store'

/**
 * Needs a real Postgres with the project's schema applied. Skipped unless
 * TEST_DATABASE_URL is set, so the normal `npm test` stays database-free:
 *
 *   TEST_DATABASE_URL=postgresql://… npx vitest run store.integration
 *
 * Use a scratch database. This test creates orders and invoices in it.
 */
const url = process.env.TEST_DATABASE_URL

const supplier: InvoiceSupplier = {
  nameBg: 'Т', nameLatin: 'T', vatNumber: 'BG0', registrationNumber: '0', registrationNumberConfirmed: false,
  addressBg: '-', addressLatin: '-', representative: null, bankName: null, iban: null, bic: null,
}
const snapshotFor = (series: string) => (number: string) =>
  buildSnapshot({
    order: {
      orderNumber: 'X', totalEur: 121, vatRate: 0.21, exchangeRate: 1, paymentMethod: 'cod', waybill: null,
      lines: [{ name: 'x', quantity: 1, priceEur: 100 }],
      buyer: { name: 'b', isCompany: false, taxId: null, vatNumber: null, address: 'a' },
    },
    supplier, series, number, issueDate: '2026-11-10', toRomanian: (n) => n,
  })

describe.skipIf(!url)('storeInvoice (real database)', () => {
  const pool = new pg.Pool({ connectionString: url, max: 15 })
  const series = `T${Date.now()}`
  const orderIds: number[] = []

  const newOrder = async () => {
    const c = await pool.query(`INSERT INTO customers (name, email) VALUES ('t', $1) RETURNING id`, [`t-${Math.random().toString(36).slice(2)}@example.invalid`])
    const o = await pool.query(
      `INSERT INTO orders (order_number, customer_id, total, status) VALUES ($1, $2, 1, 'shipped') RETURNING id`,
      [`T-${Math.random().toString(36).slice(2)}`, c.rows[0].id],
    )
    orderIds.push(o.rows[0].id)
    return o.rows[0].id as number
  }
  const issue = async (orderId: number) => {
    const client = await pool.connect()
    try {
      return await storeInvoice(client, {
        orderId, series, firstNumber: 9_000_000_001, issuedAt: new Date(), issuedBy: null,
        build: snapshotFor(series), shippingProof: { waybill: 'W' },
      })
    } finally {
      client.release()
    }
  }

  beforeAll(async () => {
    await pool.query('SELECT 1')
  })
  afterAll(async () => {
    await pool.end()
  })

  it('ten simultaneous orders get ten different, consecutive numbers', async () => {
    const ids = await Promise.all(Array.from({ length: 10 }, newOrder))
    const results = await Promise.all(ids.map(issue))
    const numbers = results.map((r) => r.number).sort()
    expect(new Set(numbers).size).toBe(10)
    expect(numbers[0]).toBe('9000000001')
    expect(numbers[9]).toBe('9000000010')
    for (const n of numbers) expect(n).toMatch(/^[0-9]{10}$/)
  })

  it('the same order cannot be invoiced twice, even when asked at the same moment', async () => {
    const id = await newOrder()
    const outcomes = await Promise.allSettled([issue(id), issue(id), issue(id)])
    expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1)
    for (const o of outcomes) if (o.status === 'rejected') expect(o.reason).toBeInstanceOf(InvoiceError)
  })

  it('a failed issue leaves no gap in the numbering', async () => {
    const before = await issue(await newOrder())
    const client = await pool.connect()
    await expect(
      storeInvoice(client, {
        orderId: await newOrder(), series, firstNumber: 9_000_000_001, issuedAt: new Date(), issuedBy: null,
        build: () => { throw new Error('boom') }, shippingProof: null,
      }),
    ).rejects.toThrow('boom')
    client.release()
    const after = await issue(await newOrder())
    expect(Number(after.number)).toBe(Number(before.number) + 1)
  })

  it('an issued invoice cannot be changed or removed', async () => {
    const stored = await issue(await newOrder())
    await expect(pool.query('UPDATE invoices SET vat_bani = 0 WHERE id = $1', [stored.id])).rejects.toThrow(/immutable/)
    await expect(pool.query('DELETE FROM invoices WHERE id = $1', [stored.id])).rejects.toThrow(/immutable/)
  })

  it('the stored snapshot is the one that was built, with the number in it', async () => {
    const stored = await issue(await newOrder())
    const row = await pool.query('SELECT snapshot, total_bani FROM invoices WHERE id = $1', [stored.id])
    expect(row.rows[0].snapshot.number).toBe(stored.number)
    expect(Number(row.rows[0].total_bani)).toBe(12100)
  })
})
