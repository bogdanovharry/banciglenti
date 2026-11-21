import { describe, expect, it } from 'vitest'
import { parseCustomSpecs, priceCustomItem } from './order-pricing'

describe('made-to-length price', () => {
  it('always includes welding, sharpening and setting; heat treatment only when chosen', () => {
    const base = { table: 'wood-v', length: 3000, width: 30, thickness: 0.7, pitch: '10', brand: 'Kodiak' }
    // Kodiak 30×0.7: 1.53/m + weld 1.84 + sharpening 0.41/m + setting 0.20/m, for 3 m
    const included = priceCustomItem(parseCustomSpecs(base)!)
    expect(included).toBe(Math.round((1.53 * 3 + 1.84 + 0.41 * 3 + 0.2 * 3) * 100) / 100)
    const withHeat = priceCustomItem(parseCustomSpecs({ ...base, heatTreatment: true })!)
    expect(withHeat).toBe(Math.round((1.53 * 3 + 1.84 + 0.41 * 3 + 0.2 * 3 + 0.26 * 3) * 100) / 100)
  })
})
