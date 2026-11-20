import { describe, expect, it } from 'vitest'
import { nextVolumeTier, volumePercent, volumeUnitPrice } from './volume-discount'

describe('volume discount', () => {
  it('5% from 10 and 10% from 20', () => {
    expect([1, 9, 10, 19, 20, 150].map(volumePercent)).toEqual([0, 0, 5, 5, 10, 10])
  })
  it('prices the unit', () => {
    expect(volumeUnitPrice(40, 10, 'CUSTOM-x')).toBe(38)
    expect(volumeUnitPrice(40, 20, 'CUSTOM-x')).toBe(36)
    expect(volumeUnitPrice(40, 5, 'CUSTOM-x')).toBe(40)
  })
  it('leaves boxes alone', () => {
    expect(volumeUnitPrice(100, 20, 'band-l4013-x10')).toBe(100)
  })
  it('names the next tier', () => {
    expect(nextVolumeTier(3)?.min).toBe(10)
    expect(nextVolumeTier(12)?.min).toBe(20)
    expect(nextVolumeTier(20)).toBeNull()
  })
})
