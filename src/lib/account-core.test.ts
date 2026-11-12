import { describe, expect, it } from 'vitest'
import { clean, isEmail, normaliseEmail, sameOrigin, toProfile } from './account-core'

const req = (headers: Record<string, string>) => new Request('https://shop.example/api/account/login', { method: 'POST', headers })

describe('sameOrigin', () => {
  it('accepts a request from the site itself, or with no Origin at all', () => {
    expect(sameOrigin(req({ origin: 'https://shop.example', host: 'shop.example' }))).toBe(true)
    expect(sameOrigin(req({ host: 'shop.example' }))).toBe(true)
  })
  it('refuses another site, a malformed Origin, and a look-alike host', () => {
    expect(sameOrigin(req({ origin: 'https://evil.example', host: 'shop.example' }))).toBe(false)
    expect(sameOrigin(req({ origin: 'not a url', host: 'shop.example' }))).toBe(false)
    expect(sameOrigin(req({ origin: 'https://shop.example.evil.example', host: 'shop.example' }))).toBe(false)
  })
  it('trusts the forwarded host the platform sets', () => {
    expect(sameOrigin(req({ origin: 'https://ro.shop', host: 'internal', 'x-forwarded-host': 'ro.shop' }))).toBe(true)
  })
})

describe('input cleaning', () => {
  it('lower-cases and trims an e-mail, and refuses what is not one', () => {
    expect(normaliseEmail('  Ana@Example.COM ')).toBe('ana@example.com')
    expect(normaliseEmail(42)).toBe('')
    expect(isEmail('ana@example.com')).toBe(true)
    expect(isEmail('ana@')).toBe(false)
    expect(isEmail('a na@example.com')).toBe(false)
  })
  it('bounds and trims text, and turns anything else into nothing', () => {
    expect(clean('  hello  ', 3)).toBe('hel')
    expect(clean({ a: 1 }, 10)).toBe('')
  })
})

describe('toProfile', () => {
  it('keeps only what the shopper may see, never the hash, salt, token or lock', () => {
    const raw = {
      id: 7, email: 'ana@example.com', name: 'Ana', hash: 'secret', salt: 'secret', resetPasswordToken: 'secret', loginAttempts: 3,
      addresses: [{ street: 'Str 1', city: 'Cluj', isDefault: true }],
      machines: [{ brand: 'Holzmann', model: 'BS125M', bladeLength: 1435 }],
    }
    const profile = toProfile(raw as never)
    expect(JSON.stringify(profile)).not.toContain('secret')
    expect(profile).toMatchObject({ id: 7, email: 'ana@example.com', phone: '', company: '' })
    expect(profile.addresses[0]).toEqual({ label: '', street: 'Str 1', city: 'Cluj', postalCode: '', isDefault: true })
    expect(profile.machines[0]).toEqual({ brand: 'Holzmann', model: 'BS125M', bladeLength: 1435, bladeWidth: null, bladeThickness: null })
  })
})
