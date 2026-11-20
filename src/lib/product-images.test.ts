import { describe, expect, it } from 'vitest'
import { FLEXBACK_PHOTO, MEAT_PHOTO, hasDimensionLabel } from './product-images'

describe('hasDimensionLabel', () => {
  it('is true only for the two photos that have a free corner for the size', () => {
    expect(hasDimensionLabel(FLEXBACK_PHOTO)).toBe(true)
    expect(hasDimensionLabel(MEAT_PHOTO)).toBe(true)
  })
  it('is false for any other photo, an uploaded one, or none', () => {
    expect(hasDimensionLabel('/images/products/kodiak.png')).toBe(false)
    expect(hasDimensionLabel('https://cdn.example/uploads/blade.jpg')).toBe(false)
    expect(hasDimensionLabel(null)).toBe(false)
    expect(hasDimensionLabel(undefined)).toBe(false)
  })
})

import { knifeKind, hasWhiteFrame, PLANER_PHOTO, PROCUT_PHOTO } from './product-images'

describe('planer knives', () => {
  it('HSS is for hard wood, 100Cr6 for soft', () => {
    expect(knifeKind('Нож за абрихт HSS 320х30х3 1бр.')).toEqual({ steel: 'HSS', wood: 'hard' })
    expect(knifeKind('Нож за абрихт 100Cr6 320х30х3 1бр.')).toEqual({ steel: '100Cr6', wood: 'soft' })
  })
  it('the new studio photos sit on a white frame', () => {
    expect(hasWhiteFrame(PLANER_PHOTO)).toBe(true)
    expect(hasWhiteFrame(PROCUT_PHOTO)).toBe(true)
    expect(hasWhiteFrame('/images/products/kodiak.png')).toBe(false)
  })
})
