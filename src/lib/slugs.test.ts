import { describe, expect, it } from 'vitest'
import { CATEGORY_SLUGS_RO, canonicalCategorySlug, categoryPublicSlug, localizeHref } from './slugs'

describe('category slugs', () => {
  it('every Romanian slug is unique and Latin-only', () => {
    const ro = Object.values(CATEGORY_SLUGS_RO)
    expect(new Set(ro).size).toBe(ro.length)
    for (const s of ro) expect(s).toMatch(/^[a-z0-9-]+$/)
  })
  it('round-trips: Romanian → canonical → Romanian', () => {
    for (const [bg, ro] of Object.entries(CATEGORY_SLUGS_RO)) {
      expect(canonicalCategorySlug(ro)).toBe(bg)
      expect(canonicalCategorySlug(bg)).toBe(bg)
      expect(categoryPublicSlug(bg, 'ro-RO')).toBe(ro)
      expect(categoryPublicSlug(ro, 'ro')).toBe(ro)
    }
  })
  it('Bulgarian visitors keep the canonical slug, even from a Romanian link', () => {
    expect(categoryPublicSlug('lemn', 'bg-BG')).toBe('dyrvo')
    expect(categoryPublicSlug('dyrvo', 'bg')).toBe('dyrvo')
  })
  it('leaves unknown slugs alone', () => {
    expect(canonicalCategorySlug('nope')).toBe('nope')
    expect(categoryPublicSlug('nope', 'ro')).toBe('nope')
  })
  it('localizeHref only touches category links and keeps the rest of the URL', () => {
    expect(localizeHref('/category/dyrvo', 'ro-RO')).toBe('/category/lemn')
    expect(localizeHref('/category/dyrvo?x=1', 'ro-RO')).toBe('/category/lemn?x=1')
    expect(localizeHref('/category/dyrvo', 'bg-BG')).toBe('/category/dyrvo')
    expect(localizeHref('/shop', 'ro-RO')).toBe('/shop')
    expect(localizeHref('/product/dyrvo', 'ro-RO')).toBe('/product/dyrvo')
  })
})
