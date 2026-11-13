import { describe, expect, it } from 'vitest'
import { CONFIG_TABS, configuratorHref, configuratorHrefForAny, configuratorTabFor, isConfigTab } from './configurator-tabs'

describe('configurator tabs', () => {
  it.each([
    ['meso-i-riba', 'meat'], ['hrani', 'meat'], ['hlebni-izdeliya', 'bread'], ['horizontalni-bantsizi', 'wood-h'],
    ['dyrvo', 'wood-h'], ['vertikalni-bantsizi', 'wood-v'], ['bimetalni-lenti', 'metal-bi'], ['metal', 'metal-bi'],
    ['vyglerodna-lenti-cs', 'metal-cs'], ['hobi-bantsig', 'hobby'], ['slicers', 'slicer'],
  ])('%s opens the %s tab', (slug, tab) => {
    expect(configuratorTabFor(slug)).toBe(tab)
    expect(configuratorHref(slug)).toBe(`/configurator?type=${tab}`)
  })
  it('a category the configurator does not cover, or none, goes to the plain page', () => {
    for (const slug of ['mashini', 'abrazivi', 'tsirkulyarni-trioni', 'nozhove-za-abriht', 'konsumativi', 'nope', '', null, undefined]) {
      expect(configuratorTabFor(slug)).toBeNull()
      expect(configuratorHref(slug)).toBe('/configurator')
    }
  })
  it('every tab the map can name is a real tab', () => {
    for (const slug of ['meso-i-riba', 'dyrvo', 'metal', 'hobi-bantsig', 'slicers']) expect(isConfigTab(configuratorTabFor(slug))).toBe(true)
    expect(CONFIG_TABS).toHaveLength(8)
  })
  it('a product takes the tab of its most specific category, not of its parent', () => {
    expect(configuratorHrefForAny(['dyrvo', 'hobi-bantsig'])).toBe('/configurator?type=hobby')
    expect(configuratorHrefForAny(['hobi-bantsig', 'dyrvo'])).toBe('/configurator?type=hobby')
    expect(configuratorHrefForAny(['hrani', 'meso-i-riba'])).toBe('/configurator?type=meat')
    expect(configuratorHrefForAny(['metal', 'bimetalni-lenti'])).toBe('/configurator?type=metal-bi')
    expect(configuratorHrefForAny(['mashini'])).toBe('/configurator')
    expect(configuratorHrefForAny([])).toBe('/configurator')
    expect(configuratorHrefForAny(null)).toBe('/configurator')
  })
  it('refuses a tab name it does not know', () => {
    expect(isConfigTab('meat')).toBe(true)
    expect(isConfigTab('<script>')).toBe(false)
    expect(isConfigTab(undefined)).toBe(false)
  })
})
