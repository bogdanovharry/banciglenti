import {
  VERTICAL_WOOD_BLADES,
  HORIZONTAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  TEXTILE_BLADES,
  calculateBladePrice,
  findBlade,
} from './pricing'

/**
 * Server-side re-pricing of a cart.
 *
 * The browser sends what it wants to buy, never what it costs. A price posted
 * from the client is a number the customer controls, so every line is priced
 * again here from the same tables the storefront quoted from. A line that
 * cannot be priced server-side is rejected rather than trusted.
 */

/** Named so a custom line can say which table it was quoted from. */
export const BLADE_TABLES = {
  'wood-h': HORIZONTAL_WOOD_BLADES,
  'wood-v': VERTICAL_WOOD_BLADES,
  'metal-bi': METAL_BIMETAL_BLADES,
  'metal-cs': METAL_CARBON_BLADES,
  meat: MEAT_BLADES,
  bread: BREAD_BLADES,
  textile: TEXTILE_BLADES,
} as const

export type BladeTableKey = keyof typeof BLADE_TABLES

export const isBladeTableKey = (v: unknown): v is BladeTableKey =>
  typeof v === 'string' && v in BLADE_TABLES

/**
 * Everything needed to re-derive a made-to-order blade's price. Written by the
 * configurators into the cart line so the server can reproduce the quote
 * without trusting it.
 */
export type CustomSpecs = {
  table: BladeTableKey
  length: number
  width: number
  thickness: number
  pitch: string
  brand: string
  welding?: boolean
  setting?: boolean
  sharpening?: boolean
  heatTreatment?: boolean
}

/** Loop lengths we will actually weld. Mirrors the configurator's own limits. */
export const MIN_CUSTOM_LENGTH = 1650
export const MAX_CUSTOM_LENGTH = 12000

export function parseCustomSpecs(value: unknown): CustomSpecs | null {
  if (!value || typeof value !== 'object') return null
  const s = value as Record<string, unknown>

  const length = Number(s.length)
  const width = Number(s.width)
  const thickness = Number(s.thickness)

  if (!isBladeTableKey(s.table)) return null
  if (!Number.isFinite(length) || length < MIN_CUSTOM_LENGTH || length > MAX_CUSTOM_LENGTH) return null
  if (!Number.isFinite(width) || !Number.isFinite(thickness)) return null
  if (typeof s.pitch !== 'string' || typeof s.brand !== 'string') return null

  return {
    table: s.table,
    length,
    width,
    thickness,
    pitch: s.pitch,
    brand: s.brand,
    welding: s.welding === true,
    setting: s.setting === true,
    sharpening: s.sharpening === true,
    heatTreatment: s.heatTreatment === true,
  }
}

/**
 * Unit price ex-VAT for a made-to-order blade, or null when the combination is
 * not in the price list — which is also the answer to "can we make this?".
 */
export function priceCustomItem(specs: CustomSpecs): number | null {
  const blade = findBlade(
    BLADE_TABLES[specs.table],
    specs.width,
    specs.thickness,
    specs.pitch,
    specs.brand,
  )
  if (!blade) return null

  return calculateBladePrice(blade, specs.length, {
    welding: specs.welding ?? false,
    sharpening: specs.sharpening ?? false,
    heatTreatment: specs.heatTreatment ?? false,
    setting: specs.setting ?? false,
  }).totalWithoutVat
}
