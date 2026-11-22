import { describe, expect, it } from 'vitest'
import { buildCreditNote, buildSnapshot, previewWarnings, type InvoiceSupplier, type OrderForInvoice } from './document'

const supplier: InvoiceSupplier = {
  nameBg: 'ТЕХНОЛЕС ООД', nameLatin: 'TEHNOLES Ltd.', vatNumber: 'BG000000000', registrationNumber: '000000000',
  registrationNumberConfirmed: false, addressBg: 'гр. Габрово', addressLatin: 'Gabrovo', representative: null,
  bankName: null, iban: null, bic: null,
}
const buyer = { name: 'Ion Popescu', isCompany: false, taxId: null, vatNumber: null, address: 'Str. Exemplu 1, Cluj' }
const order = (o: Partial<OrderForInvoice> = {}): OrderForInvoice => ({
  orderNumber: 'TL-261110-2ACA', subtotalEur: 22.09, taxEur: 4.64, totalEur: 26.73, vatRate: 0.21, exchangeRate: 5.2567,
  lines: [{ name: 'Saw-Meister ProCut 32×1.1', quantity: 1, priceEur: 22.09 }],
  paymentMethod: 'cod', waybill: null, buyer, ...o,
})
const build = (o?: Partial<OrderForInvoice>) =>
  buildSnapshot({ order: order(o), supplier, series: 'RO', number: null, issueDate: '2026-11-10', toRomanian: (n) => `RO:${n}` })

describe('buildSnapshot', () => {
  it('the total is exactly what the buyer was shown in lei (26.73 EUR × 5.2567 = 140.51)', () => {
    const s = build()
    expect(s.totals.totalBani).toBe(14051)
    expect(s.totals.netBani + s.totals.vatBani).toBe(14051)
    expect(s.totals.vatBani).toBe(2439) // 14051 − 14051/1.21, rounded
  })
  it('121 lei at rate 1 → net 100, VAT 21, total 121', () => {
    const s = build({ totalEur: 121, exchangeRate: 1, lines: [{ name: 'x', quantity: 1, priceEur: 100 }] })
    expect(s.totals).toEqual({ netBani: 10000, vatBani: 2100, totalBani: 12100 })
  })
  it('several lines add up to the totals, bani for bani', () => {
    const lines = [
      { name: 'a', quantity: 3, priceEur: 3.33 },
      { name: 'b', quantity: 1, priceEur: 19.99 },
      { name: 'c', quantity: 7, priceEur: 0.41 },
    ]
    // The order's total the way checkout computes it: subtotal plus VAT rounded to the cent.
    const subtotal = lines.reduce((sum, l) => sum + l.priceEur * l.quantity, 0)
    const totalEur = Math.round((subtotal + Math.round(subtotal * 0.21 * 100) / 100) * 100) / 100
    const taxEur = Math.round(subtotal * 0.21 * 100) / 100
    const t = build({ totalEur, subtotalEur: Math.round(subtotal * 100) / 100, taxEur, lines })
    const sum = (k: 'netBani' | 'vatBani' | 'grossBani') => t.lines.reduce((a, l) => a + l[k], 0)
    expect(sum('grossBani')).toBe(t.totals.totalBani)
    expect(sum('netBani')).toBe(t.totals.netBani)
    expect(sum('vatBani')).toBe(t.totals.vatBani)
    expect(t.totals.totalBani).toBe(Math.round(totalEur * 5.2567 * 100))
  })
  it('shows a Bulgarian and a Romanian name when the stored name is Bulgarian, one when it is already Romanian', () => {
    expect(build({ lines: [{ name: 'Банцигова лента 20x0.6', quantity: 1, priceEur: 22.09 }] }).lines[0])
      .toMatchObject({ nameBg: 'Банцигова лента 20x0.6', nameRo: 'RO:Банцигова лента 20x0.6' })
    expect(build({ lines: [{ name: 'Pânză la comandă 3000×6', quantity: 1, priceEur: 22.09 }] }).lines[0])
      .toMatchObject({ nameBg: null, nameRo: 'Pânză la comandă 3000×6' })
  })
  it('always the standard rate (case A)', () => {
    const s = build()
    expect(s.taxCase).toBe('A')
    expect(s.vatRateBp).toBe(2100)
  })
  it('carries the euro amounts the buyer was charged, marked as the shop rate, adding up', () => {
    const s = build()
    expect(s.euro).toEqual({ source: 'SHOP', rate: 5.2567, netCents: 2209, vatCents: 464, totalCents: 2673 })
    expect(s.euro!.netCents + s.euro!.vatCents).toBe(s.euro!.totalCents)
  })
  it('a snapshot is plain JSON that survives storage unchanged', () => {
    const s = build()
    expect(JSON.parse(JSON.stringify(s))).toEqual(s)
  })
})

describe('previewWarnings', () => {
  it('flags what is missing before issue', () => {
    const w = previewWarnings(build(), 'processing').join(' | ')
    expect(w).toContain('ЕИК')
    expect(w).toContain('курса на магазина')
    expect(w).toContain('МОЛ')
    expect(w).toContain('товарителница')
    expect(w).toContain('не е изпратена')
  })
  it('no "not shipped" warning once it has shipped', () => {
    expect(previewWarnings(build(), 'shipped').join(' ')).not.toContain('не е изпратена')
  })
})

describe('buildCreditNote', () => {
  const invoice = buildSnapshot({
    order: {
      orderNumber: 'X1', subtotalEur: 100, taxEur: 21, totalEur: 121, vatRate: 0.21, exchangeRate: 5, paymentMethod: 'cod', waybill: 'W1',
      lines: [{ name: 'a', quantity: 2, priceEur: 50 }],
      buyer: { name: 'b', isCompany: false, taxId: null, vatNumber: null, address: 'a' },
    },
    supplier: {
      nameBg: 'Т', nameLatin: 'T', vatNumber: 'BG0', registrationNumber: '0', registrationNumberConfirmed: false,
      addressBg: '-', addressLatin: '-', representative: null, bankName: null, iban: null, bic: null,
    },
    series: 'RO', number: '9000000001', issueDate: '2026-11-10', toRomanian: (n) => n,
  })

  it('reverses every amount and nothing else', () => {
    const note = buildCreditNote(invoice, { series: 'RO', number: '9000000002', issueDate: '2026-11-20', reason: 'retur' })
    expect(note.docType).toBe('credit_note')
    expect(note.totals.totalBani).toBe(-invoice.totals.totalBani)
    expect(note.totals.netBani + note.totals.vatBani).toBe(note.totals.totalBani)
    expect(note.lines[0].grossBani).toBe(-invoice.lines[0].grossBani)
    expect(note.lines[0].quantity).toBe(invoice.lines[0].quantity)
    expect(note.euro?.totalCents).toBe(-(invoice.euro?.totalCents ?? 0))
    expect(note.credit).toEqual({ ofNumber: '9000000001', ofSeries: 'RO', ofDate: '2026-11-10', reason: 'retur' })
  })

  it('leaves the invoice it was built from untouched', () => {
    const before = JSON.stringify(invoice)
    buildCreditNote(invoice, { series: 'RO', number: null, issueDate: '2026-11-20', reason: 'x' })
    expect(JSON.stringify(invoice)).toBe(before)
  })
})
