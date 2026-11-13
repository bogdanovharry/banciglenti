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
    for (const slug of ['horizontalni-bantsizi', 'mashini', 'abrazivi', 'hobi-bantsig', 'nope']) expect(facetsFor(slug)).toEqual([])
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
