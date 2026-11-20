import { packFromSlug } from './packs'

/**
 * Quantity discount: 5% from 10 pieces and 10% from 20 pieces of the same kind.
 *
 * "Of the same kind" means one order line — one product in one pitch, or one made-to-measure
 * blade with one set of specs. Different blades on different lines are not added together.
 * Boxes and sets are left out: their price already carries a discount of its own (see packs.ts).
 *
 * One module for the browser (cart, product page, configurator) and the server (checkout, admin),
 * so the price that is shown is the price that is charged.
 */
export const VOLUME_TIERS = [
  { min: 10, percent: 5 },
  { min: 20, percent: 10 },
] as const

export const roundMoney = (n: number) => Math.round(n * 100) / 100

/** Whole percent off for this many pieces of one kind (0 below the first tier). */
export function volumePercent(qty: number): number {
  let percent = 0
  for (const t of VOLUME_TIERS) if (qty >= t.min) percent = t.percent
  return percent
}

/** The next tier above this quantity, or null when the top one is reached. */
export function nextVolumeTier(qty: number): (typeof VOLUME_TIERS)[number] | null {
  return VOLUME_TIERS.find((t) => qty < t.min) ?? null
}

/** Boxes and sets already carry a discount; everything else (single blades, made to measure) is eligible. */
export const volumeEligible = (sku: string): boolean => !packFromSlug(sku)

/** The unit price after the quantity discount (unchanged when not eligible or below 10 pieces). */
export function volumeUnitPrice(unit: number, qty: number, sku: string): number {
  const p = volumeEligible(sku) ? volumePercent(qty) : 0
  return p ? roundMoney(unit * (1 - p / 100)) : roundMoney(unit)
}
