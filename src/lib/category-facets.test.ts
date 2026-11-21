import { describe, expect, it } from 'vitest'
import { facetsFor, lengthKindFor } from './category-facets'

const read = (slug: string, id: string, specs: Record<string, unknown>) =>
  facetsFor(slug).find((f) => f.id === id)!.read({ specs } as never)

describe('category facets', () => {
  it('circular saws offer type, diameter and thickness; planer knives material and width', () => {
    expect(facetsFor('tsirkulyarni-trioni').map((f) => f.id)).toEqual(['type', 'diameter', 'thickness'])
    expect(facetsFor('nozhove-za-abriht').map((f) => f.id)).toEqual(['material', 'width'])
  })
  it('every other category has none of its own', () => {
    expect(facetsFor('horizontalni-bantsizi').map((f) => f.id)).toEqual(['line', 'width'])
    for (const slug of ['vertikalni-bantsizi', 'bimetalni-lenti', 'vyglerodna-lenti-cs', 'hobi-bantsig', 'meso-i-riba', 'hlebni-izdeliya', 'slicers']) {
      expect(facetsFor(slug).map((f) => f.id)).toEqual(['width'])
    }
    for (const slug of ['mashini', 'nope']) expect(facetsFor(slug)).toEqual([])
    expect(facetsFor(undefined)).toEqual([])
  })
  it('a saw with a carbide material is carbide, one with none is plain steel', () => {
    expect(read('tsirkulyarni-trioni', 'type', { material: 'HM Carbide', width: 350 })).toBe('typeCarbide')
    expect(read('tsirkulyarni-trioni', 'type', { material: 'Metal dur (HM)' })).toBe('typeCarbide')
    expect(read('tsirkulyarni-trioni', 'type', {})).toBe('typeSteel')
  })
  it('diameter and thickness come from the recorded specs, and are null when missing', () => {
    expect(read('tsirkulyarni-trioni', 'diameter', { width: 250 })).toBe(250)
    expect(read('tsirkulyarni-trioni', 'thickness', { thickness: 2.24 })).toBe(2.24)
    expect(read('tsirkulyarni-trioni', 'diameter', {})).toBeNull()
  })
  it('a knife reads its steel and width', () => {
    expect(read('nozhove-za-abriht', 'material', { material: ' HSS ' })).toBe('HSS')
    expect(read('nozhove-za-abriht', 'material', {})).toBeNull()
    expect(read('nozhove-za-abriht', 'width', { width: 30 })).toBe(30)
  })
  it('length is a loop on band blades and just a length on knives', () => {
    expect(lengthKindFor('nozhove-za-abriht')).toBe('part')
    expect(lengthKindFor('horizontalni-bantsizi')).toBe('loop')
    expect(lengthKindFor(undefined)).toBe('loop')
  })
})

describe('abrasives facets', () => {
  const type = (slug: string) => facetsFor('abrazivi').find((f) => f.id === 'type')!.read({ slug } as never)
  const diameter = (slug: string, width?: number) => facetsFor('abrazivi').find((f) => f.id === 'diameter')!.read({ slug, specs: { width } } as never)
  it('tells the products apart by type', () => {
    expect(['abraziv-150-10-3', 'diamond-125-12a2', 'cbn-borazon-disk', 'coolant-acp-2e', 'coolant-acp-2e-cbn'].map(type)).toEqual(['typeAbrasive', 'typeDiamond', 'typeCbn', 'typeCoolant', 'typeCoolant'])
  })
  it('reads the diameter from the slug, else from the recorded width', () => {
    expect(diameter('abraziv-250-13-3')).toBe(250)
    expect(diameter('diamond-125-12r4')).toBe(125)
    expect(diameter('cbn-borazon-disk')).toBeNull()
    expect(diameter('x', 200)).toBe(200)
  })
})
