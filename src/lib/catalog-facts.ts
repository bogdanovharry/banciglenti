import {
  VERTICAL_WOOD_BLADES,
  HORIZONTAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  TEXTILE_BLADES,
} from './pricing'
import { MIN_CUSTOM_LENGTH } from './order-pricing'

/**
 * The figures the site states about its range, derived from the price tables.
 *
 * They were typed into the copy by hand — "6-200 мм широчина", "33 профила и
 * стъпки" — and neither was true: the tables stop at 100 mm and hold 32
 * profiles. A claim a customer can check against the configurator has to come
 * from the same place the configurator does, so these are computed, and a new
 * row in the tables moves every page that quotes them.
 */
const ALL = [
  VERTICAL_WOOD_BLADES,
  HORIZONTAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  METAL_CARBON_BLADES,
  MEAT_BLADES,
  BREAD_BLADES,
  TEXTILE_BLADES,
].flat()

const widths = [...new Set(ALL.map((b) => b.width))].sort((a, b) => a - b)

export const CATALOG_FACTS = {
  /** Priced blade specifications — one row per width, thickness, pitch and brand. */
  specs: ALL.length,
  /** Distinct blade widths, and the narrowest and widest, in mm. */
  widths: widths.length,
  widthMin: widths[0],
  widthMax: widths[widths.length - 1],
  /** Distinct tooth pitches and profiles. */
  profiles: new Set(ALL.map((b) => b.pitch)).size,
  /** Shortest loop welded; there is no upper limit — a longer one is a phone call. */
  lengthMin: MIN_CUSTOM_LENGTH,
} as const
