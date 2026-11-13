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
