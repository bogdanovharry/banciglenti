import { describe, expect, it } from 'vitest'

import { recommend, type RecProduct } from './recommendations'

const p = (slug: string, cats: string[], extra: Partial<RecProduct> = {}): RecProduct => ({
  slug, name: slug, categorySlugs: cats, series: null, specs: {}, ...extra,
})

const catalogue: RecProduct[] = [
  p('saw-meister-procut-32x1-1-l4010', ['dyrvo', 'horizontalni-bantsizi'], { series: 'procut', specs: { width: 32, thickness: 1.1, length: 4010 } }),
  p('saw-meister-procut-32x1-1-l4010-x10', ['dyrvo', 'horizontalni-bantsizi'], { series: 'procut', specs: { width: 32, length: 4010 } }),
  p('saw-meister-procut-35x1-1-l4010', ['dyrvo', 'horizontalni-bantsizi'], { series: 'procut', specs: { width: 35, thickness: 1.1, length: 4010 } }),
  p('cbn-borazon-disk', ['abrazivi']),
  p('coolant-acp-2e', ['abrazivi']),
  p('hm-300-72', ['tsirkulyarni-trioni']),
  p('diamond-150-12a2', ['abrazivi']),
  p('diamond-125-12a2', ['abrazivi']),
  p('saw-meister-procut-32x1-1-l4010-x5', ['dyrvo', 'horizontalni-bantsizi'], { series: 'procut', specs: { width: 32, length: 4010 } }),
  p('asm-60', ['mashini']),
  p('zm101', ['mashini']),
  p('fbm10', ['mashini']),
  p('abriht-hss-810x30', ['dyrvo', 'nozhove-za-abriht']),
  p('abriht-hss-640x30', ['dyrvo', 'nozhove-za-abriht']),
  p('carbon-13x065-l1638', ['dyrvo', 'vyglerodna-lenti-cs'], { specs: { width: 13, length: 1638 } }),
  p('bi-27x0-9-l2480', ['metal', 'bimetalni-lenti'], { specs: { width: 27, thickness: 0.9, length: 2480 } }),
]

describe('recommend', () => {
  it('offers the box, the sharpening kit and the neighbouring size for a wood band', () => {
    const r = recommend(catalogue[0], catalogue)
    expect(r.map((x) => x.slug)).toEqual([
      'saw-meister-procut-32x1-1-l4010-x10', 'cbn-borazon-disk', 'coolant-acp-2e', 'saw-meister-procut-35x1-1-l4010',
    ])
    expect(r[0].reason).toBe('box')
  })

  it('points a box back to the single band', () => {
    const r = recommend(catalogue[1], catalogue)
    expect(r[0]).toEqual({ slug: 'saw-meister-procut-32x1-1-l4010', reason: 'single' })
  })

  it('pairs the CBN wheel with its coolant', () => {
    expect(recommend(catalogue[3], catalogue)[0]).toEqual({ slug: 'coolant-acp-2e', reason: 'coolant' })
  })

  it('suggests diamond wheels for a carbide circular saw', () => {
    expect(recommend(catalogue[5], catalogue).map((x) => x.slug)).toEqual(['diamond-150-12a2', 'diamond-125-12a2'])
  })

  it('never recommends the product itself, and never a sold-out one', () => {
    const list = catalogue.map((x) => (x.slug === 'cbn-borazon-disk' ? { ...x, stock: 'out' } : x))
    const r = recommend(list[0], list)
    expect(r.map((x) => x.slug)).not.toContain(list[0].slug)
    expect(r.map((x) => x.slug)).not.toContain('cbn-borazon-disk')
  })

  it('does not give wood sharpening kit to a metal band', () => {
    expect(recommend(catalogue.find((x) => x.slug === 'bi-27x0-9-l2480')!, catalogue).map((x) => x.slug)).not.toContain('cbn-borazon-disk')
  })

  it('does not recommend the five-pack, which saves nothing', () => {
    expect(recommend(catalogue[0], catalogue).map((x) => x.slug)).not.toContain('saw-meister-procut-32x1-1-l4010-x5')
  })

  it('shows the other machines of the workshop for a machine', () => {
    const asm = catalogue.find((x) => x.slug === 'asm-60')!
    expect(recommend(asm, catalogue).map((x) => x.slug)).toEqual(['zm101', 'fbm10'])
  })

  it('gives a planer knife its neighbouring size, never a wood band', () => {
    const knife = catalogue.find((x) => x.slug === 'abriht-hss-810x30')!
    expect(recommend(knife, catalogue).map((x) => x.slug)).toEqual(['abriht-hss-640x30'])
  })
})
