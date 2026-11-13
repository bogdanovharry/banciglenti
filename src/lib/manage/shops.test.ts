import { describe, expect, it } from 'vitest'
import { shopLinks } from './shops'

describe('shopLinks', () => {
  it('on the Romanian shop: Romania is current, Bulgaria links to its own address', () => {
    expect(shopLinks('ro', 'ro.example')).toEqual([
      { code: 'bg', name: 'България', href: 'https://banciglenti.com/manage', current: false },
      { code: 'ro', name: 'Румъния', href: '/manage', current: true },
    ])
  })
  it('on the Bulgarian shop: Bulgaria is current, Romania links to its own address', () => {
    expect(shopLinks('bg', 'banciglenti.com')).toEqual([
      { code: 'bg', name: 'България', href: '/manage', current: true },
      { code: 'ro', name: 'Румъния', href: 'https://banciglenti-ro.vercel.app/manage', current: false },
    ])
  })
  it('opened from a Vercel address, the other shop is linked at its Vercel address too', () => {
    expect(shopLinks('ro', 'banciglenti-ro.vercel.app')[0].href).toBe('https://banciglenti.vercel.app/manage')
    expect(shopLinks('bg', 'banciglenti.vercel.app')[1].href).toBe('https://banciglenti-ro.vercel.app/manage')
  })
  it('the www. alias of a shop is never the address linked to', () => {
    for (const l of shopLinks('ro', 'x')) expect(l.href).not.toContain('www.')
  })
  it('in development it uses the *.localhost names on the same port', () => {
    expect(shopLinks('ro', 'ro.localhost:3100').map((l) => l.href)).toEqual(['http://bg.localhost:3100/manage', '/manage'])
    expect(shopLinks('bg', 'localhost:3000').map((l) => l.href)).toEqual(['/manage', 'http://ro.localhost:3000/manage'])
  })
})
