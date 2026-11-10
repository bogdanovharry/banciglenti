import { describe, expect, it } from 'vitest'
import { classifyBuyer, computeInvoice, vatInGross, type Buyer } from './calculate'

const RATE = 2100
const consumer: Buyer = { type: 'consumer', vies: 'not_checked' }
const company = (vies: Buyer['vies'], country = 'RO'): Buyer => ({
  type: 'business', vatNumber: 'RO12345678', vatCountry: country, vies,
})

describe('classifyBuyer', () => {
  it('consumer → A at 21%', () => {
    expect(classifyBuyer(consumer, 'RO', RATE)).toMatchObject({ case: 'A', rateBp: 2100 })
  })
  it('valid RO number + RO delivery → B at 0%', () => {
    expect(classifyBuyer(company('valid'), 'RO', RATE)).toMatchObject({ case: 'B', rateBp: 0 })
  })
  it('valid number + delivery outside RO → C (as A) and owner notified', () => {
    expect(classifyBuyer(company('valid'), 'BG', RATE)).toMatchObject({ case: 'C', rateBp: 2100, notifyOwner: true })
  })
  it('valid number of another country delivered in RO → C, never zero-rated', () => {
    expect(classifyBuyer(company('valid', 'DE'), 'RO', RATE).case).toBe('C')
  })
  it('invalid number → A', () => {
    expect(classifyBuyer(company('invalid'), 'RO', RATE)).toMatchObject({ case: 'A', rateBp: 2100 })
  })
  it('business without a number → A', () => {
    expect(classifyBuyer({ type: 'business', vies: 'not_checked' }, 'RO', RATE).case).toBe('A')
  })
  it('VIES down or not yet checked → HOLD, never 0%', () => {
    for (const v of ['unavailable', 'not_checked'] as const) {
      const c = classifyBuyer(company(v), 'RO', RATE)
      expect(c.case).toBe('HOLD')
      expect(c.rateBp).not.toBe(0)
    }
  })
})

describe('computeInvoice', () => {
  it('121 lei gross → net 100, VAT 21, total 121', () => {
    const r = computeInvoice([{ grossBani: 12100 }], { case: 'A', standardRateBp: RATE })
    expect(r).toMatchObject({ netBani: 10000, vatBani: 2100, totalBani: 12100 })
  })
  it('total always equals the cart price; lines add up to the totals', () => {
    const gross = [3333, 1999, 1, 12345, 777]
    const r = computeInvoice(gross.map((g) => ({ grossBani: g })), { case: 'A', standardRateBp: RATE })
    const sum = (k: 'netBani' | 'vatBani' | 'grossBani') => r.lines.reduce((a, l) => a + l[k], 0)
    expect(r.totalBani).toBe(gross.reduce((a, b) => a + b, 0))
    expect(sum('vatBani')).toBe(r.vatBani)
    expect(sum('netBani')).toBe(r.netBani)
    expect(r.netBani + r.vatBani).toBe(r.totalBani)
    r.lines.forEach((l) => expect(l.netBani + l.vatBani).toBe(l.grossBani))
  })
  it('rounds VAT once for the whole invoice, halves up', () => {
    // 1 leu gross → 0.1736 VAT → 17 bani
    expect(vatInGross(100, RATE)).toBe(17)
    // 605 bani: 605*2100/12100 = 105 exactly
    expect(vatInGross(605, RATE)).toBe(105)
    // 11 bani: 11*2100/12100 = 1.909 → 2
    expect(vatInGross(11, RATE)).toBe(2)
  })
  it('case B, same gross: no VAT, total unchanged', () => {
    const r = computeInvoice([{ grossBani: 12100 }], { case: 'B', standardRateBp: RATE, businessPricing: 'same-gross' })
    expect(r).toMatchObject({ netBani: 12100, vatBani: 0, totalBani: 12100 })
  })
  it('case B, net pricing: total is the net amount', () => {
    const r = computeInvoice([{ grossBani: 12100 }], { case: 'B', standardRateBp: RATE, businessPricing: 'net' })
    expect(r).toMatchObject({ netBani: 10000, vatBani: 0, totalBani: 10000 })
  })
  it('case C is computed exactly like case A', () => {
    const a = computeInvoice([{ grossBani: 9999 }], { case: 'A', standardRateBp: RATE })
    const c = computeInvoice([{ grossBani: 9999 }], { case: 'C', standardRateBp: RATE })
    expect(c).toEqual(a)
  })
})
