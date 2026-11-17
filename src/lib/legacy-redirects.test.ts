import { describe, expect, it } from 'vitest'
import { legacyRedirects } from './legacy-redirects'

const NEW_CATEGORIES = [
  'slicers', 'hlebni-izdeliya', 'meso-i-riba', 'vyglerodna-lenti-cs', 'bimetalni-lenti', 'nozhove-za-abriht',
  'tsirkulyarni-trioni', 'vertikalni-bantsizi', 'horizontalni-bantsizi', 'konsumativi', 'mashini', 'abrazivi',
  'hobi-bantsig', 'hrani', 'metal', 'dyrvo',
]
const NEW_PAGES = ['/', '/shop', '/configurator', '/contact', '/about', '/delivery', '/terms', '/privacy', '/account']

describe('legacy redirects', () => {
  const list = legacyRedirects()

  it('only ever lead to pages this shop has', () => {
    for (const r of list) {
      const path = r.destination.split('?')[0]
      const ok = NEW_PAGES.includes(path) || NEW_CATEGORIES.some((c) => path === `/category/${c}`)
      expect(ok, `${r.source} -> ${r.destination}`).toBe(true)
    }
  })

  it('has no source twice', () => {
    const sources = list.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('never sends the news pages to a blog that does not exist', () => {
    expect(list.some((r) => r.destination.startsWith('/blog'))).toBe(false)
  })
})
