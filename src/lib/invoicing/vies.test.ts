import { describe, expect, it, vi } from 'vitest'
import { checkVat, parseVatNumber, withCountryPrefix } from './vies'

const reply = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
const fixedNow = () => new Date('2026-11-10T10:00:00Z')

describe('parseVatNumber', () => {
  it('strips spaces, dots and dashes and splits the country', () => {
    expect(parseVatNumber('ro 1234-5678')).toEqual({ countryCode: 'RO', vatNumber: '12345678' })
  })
  it('refuses text that is not a VAT number', () => {
    expect(parseVatNumber('12345678')).toBeNull()
    expect(parseVatNumber('hello world!')).toBeNull()
  })
})

describe('checkVat', () => {
  it('valid → valid, with identifier and time', async () => {
    const f = reply({ valid: true, userError: 'VALID', requestIdentifier: 'WAPIAAAAX1' })
    const r = await checkVat('RO12345678', { fetchImpl: f, now: fixedNow, requester: { countryCode: 'BG', vatNumber: '000000000' } })
    expect(r).toMatchObject({ result: 'valid', countryCode: 'RO', vatNumber: '12345678', requestIdentifier: 'WAPIAAAAX1', checkedAt: '2026-11-10T10:00:00.000Z' })
    const sent = JSON.parse((f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].body as string)
    expect(sent).toMatchObject({ countryCode: 'RO', vatNumber: '12345678', requesterMemberStateCode: 'BG', requesterNumber: '000000000' })
  })
  it('valid:false → invalid', async () => {
    expect((await checkVat('RO12345678', { fetchImpl: reply({ valid: false, userError: 'INVALID' }) })).result).toBe('invalid')
  })
  it('INVALID_INPUT → invalid', async () => {
    expect((await checkVat('RO12345678', { fetchImpl: reply({ valid: false, userError: 'INVALID_INPUT' }) })).result).toBe('invalid')
  })
  it('garbage text → invalid without calling VIES', async () => {
    const f = reply({})
    expect((await checkVat('not a number', { fetchImpl: f })).result).toBe('invalid')
    expect(f).not.toHaveBeenCalled()
  })
  it.each(['MS_UNAVAILABLE', 'TIMEOUT', 'SERVICE_UNAVAILABLE', 'MS_MAX_CONCURRENT_REQ'])('%s → unavailable, never valid', async (code) => {
    expect((await checkVat('RO12345678', { fetchImpl: reply({ valid: true, userError: code }) })).result).toBe('unavailable')
  })
  it('HTTP 500 → unavailable', async () => {
    expect((await checkVat('RO12345678', { fetchImpl: reply({}, 500) })).result).toBe('unavailable')
  })
  it('network error → unavailable, does not throw', async () => {
    const f = vi.fn(async () => { throw new Error('down') }) as unknown as typeof fetch
    expect((await checkVat('RO12345678', { fetchImpl: f })).result).toBe('unavailable')
  })
  it('answer without a valid flag → unavailable', async () => {
    expect((await checkVat('RO12345678', { fetchImpl: reply({ userError: 'VALID' }) })).result).toBe('unavailable')
  })
})

describe('withCountryPrefix', () => {
  it('adds the market country when the buyer typed only digits', () => {
    expect(withCountryPrefix('1234 5678', 'ro')).toBe('RO12345678')
  })
  it('keeps an existing prefix', () => {
    expect(withCountryPrefix('RO 12345678', 'ro')).toBe('RO12345678')
  })
  it('uses EL for Greece', () => {
    expect(withCountryPrefix('123456789', 'gr')).toBe('EL123456789')
  })
})
