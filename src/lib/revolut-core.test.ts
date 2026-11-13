import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { chargeMinor, outcomeOf, signatureOk } from './revolut-core'

const secret = 'wsk_test_secret'
const body = '{"event":"ORDER_COMPLETED","order_id":"abc"}'
const now = 1_800_000_000_000
const sign = (ts: string, b = body, s = secret) => `v1=${createHmac('sha256', s).update(`v1.${ts}.${b}`).digest('hex')}`

describe('chargeMinor', () => {
  it('is the figure the buyer was shown, in the smallest unit', () => {
    expect(chargeMinor(25.98, 5.2567)).toBe(13657) // 136,57 lei
    expect(chargeMinor(25.98, 1)).toBe(2598)
    expect(chargeMinor(0.1 + 0.2, 1)).toBe(30) // no floating point drift
  })
})

describe('signatureOk', () => {
  const ts = String(now)
  it('accepts a correctly signed, fresh delivery', () => {
    expect(signatureOk({ rawBody: body, signatureHeader: sign(ts), timestampHeader: ts, secret, nowMs: now })).toBe(true)
  })
  it('accepts when one of several signatures matches (secret rotation)', () => {
    const header = `v1=${'0'.repeat(64)}, ${sign(ts)}`
    expect(signatureOk({ rawBody: body, signatureHeader: header, timestampHeader: ts, secret, nowMs: now })).toBe(true)
  })
  it('refuses a changed body, a wrong secret, and a missing header', () => {
    expect(signatureOk({ rawBody: body + ' ', signatureHeader: sign(ts), timestampHeader: ts, secret, nowMs: now })).toBe(false)
    expect(signatureOk({ rawBody: body, signatureHeader: sign(ts, body, 'other'), timestampHeader: ts, secret, nowMs: now })).toBe(false)
    expect(signatureOk({ rawBody: body, signatureHeader: null, timestampHeader: ts, secret, nowMs: now })).toBe(false)
    expect(signatureOk({ rawBody: body, signatureHeader: sign(ts), timestampHeader: null, secret, nowMs: now })).toBe(false)
    expect(signatureOk({ rawBody: body, signatureHeader: sign(ts), timestampHeader: ts, secret: '', nowMs: now })).toBe(false)
  })
  it('refuses a replay: a delivery older than five minutes', () => {
    const old = String(now - 6 * 60_000)
    expect(signatureOk({ rawBody: body, signatureHeader: sign(old), timestampHeader: old, secret, nowMs: now })).toBe(false)
  })
  it('refuses a garbled signature without throwing', () => {
    expect(signatureOk({ rawBody: body, signatureHeader: 'v1=zz', timestampHeader: ts, secret, nowMs: now })).toBe(false)
    expect(signatureOk({ rawBody: body, signatureHeader: 'nonsense', timestampHeader: ts, secret, nowMs: now })).toBe(false)
  })
})

describe('outcomeOf', () => {
  it('maps Revolut order states to ours', () => {
    expect(outcomeOf('completed')).toBe('paid')
    expect(outcomeOf('cancelled')).toBe('failed')
    expect(outcomeOf('failed')).toBe('failed')
    expect(outcomeOf('pending')).toBe('pending')
    expect(outcomeOf('authorised')).toBe('pending')
    expect(outcomeOf(undefined)).toBe('pending')
  })
})
