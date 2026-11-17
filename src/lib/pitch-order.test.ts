import { describe, expect, it } from 'vitest'
import { getAvailablePitches, type BladeConfig } from './pricing'

const row = (pitch: string): BladeConfig =>
  ({ width: 27, thickness: 0.9, pitch, brand: 'X', pricePerMeter: 1, welding: 0, sharpening: 0, heatTreatment: 0, setting: 0 }) as BladeConfig

describe('pitch order in the configurator', () => {
  it('lists the coarsest pitch first', () => {
    const rows = ['3/4', '8/12', '4/6', '2/3', '5/8'].map(row)
    expect(getAvailablePitches(rows, 27, 0.9, 'X')).toEqual(['2/3', '3/4', '4/6', '5/8', '8/12'])
  })
  it('keeps named profiles after the numbers', () => {
    const rows = ['wave', '4 TPI', '3 TPI'].map(row)
    expect(getAvailablePitches(rows, 27, 0.9, 'X')).toEqual(['3 TPI', '4 TPI', 'wave'])
  })
})
