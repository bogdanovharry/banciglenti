import { BLADE_TABLES, type BladeTableKey } from './order-pricing'

/**
 * Which tooth pitches (or edge profiles) a ready-made product can be had in.
 *
 * The configurator already knows every pitch each width and thickness is made in
 * — those are the rows of the price tables. A ready-made product is one row of
 * the catalogue, with no pitch of its own to choose from. This reads the same
 * tables for the product's width and thickness, so the product page offers the
 * same choices, with the same explanations, as the configurator, and the two
 * cannot disagree.
 *
 * Price: in every table but the meat blades, pitch does not change the price
 * per metre, so the product's own price stands. Meat blades price the edge
 * profile (a wave grind costs more than a smooth one), and those products are
 * made to order, so their price is worked out the way the table works it out:
 * length × price per metre.
 *
 * Server-side: this imports the price tables. The product page computes the
 * answer and hands the result to the browser; checkout recomputes it to
 * validate what the buyer chose.
 */

export type PitchProduct = {
  categorySlugs: string[]
  series: string | null
  name: string
  width: number | null
  thickness: number | null
  /** Millimetres; null when the product has no recorded length. */
  length: number | null
  /** The pitch recorded on the product itself, if any (hobby blades). */
  toothPitch: string | null
  /** EUR, net. */
  price: number
}

export type PitchOption = {
  pitch: string
  /** The brand of the table row this option comes from, which the explanation text depends on. */
  brand: string
  /** EUR, net — what the product costs with this pitch. */
  unitPrice: number
}

export type PitchInfo = {
  table: BladeTableKey
  options: PitchOption[]
  /** The option the product is already (its recorded pitch, or the one its price is quoted at). Null = the buyer must choose. */
  defaultPitch: string | null
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** A Cyrillic "М" typed for the Latin one in "М42" would defeat a match on the steel grade. */
const latinM = (s: string) => s.replace(/М/g, 'M')

type Family = { table: BladeTableKey; brandOk: (brand: string) => boolean }

function familyOf(p: PitchProduct): Family | null {
  const has = (slug: string) => p.categorySlugs.includes(slug)
  const any = () => true

  if (has('meso-i-riba')) return { table: 'meat', brandOk: any }
  if (has('hlebni-izdeliya')) return { table: 'bread', brandOk: any }

  if (has('bimetalni-lenti')) {
    const grade = /M90/i.test(latinM(p.name)) ? 'M90' : 'M42'
    return { table: 'metal-bi', brandOk: (b) => b.includes(grade) }
  }
  if (has('vyglerodna-lenti-cs')) return { table: 'metal-cs', brandOk: any }

  if (has('hobi-bantsig')) {
    // Narrow flexback bands: the carbon rows of the vertical-wood table, else the metal one.
    const onWood = BLADE_TABLES['wood-v'].some(
      (r) => r.brand === 'Flexback Carbon' && r.width === p.width && r.thickness === p.thickness,
    )
    return { table: onWood ? 'wood-v' : 'metal-cs', brandOk: (b) => b === 'Flexback Carbon' }
  }

  if (has('horizontalni-bantsizi')) {
    const brand = p.series === 'procut' ? 'MasterGold' : p.series === 'softcut' ? 'Kodiak' : null
    return { table: 'wood-h', brandOk: (b) => (brand ? b === brand : true) }
  }
  if (has('vertikalni-bantsizi')) return { table: 'wood-v', brandOk: (b) => b !== 'Flexback Carbon' }

  return null
}

/** 4 TPI before 14 TPI, 6 before 12.5; named profiles after the numbers, in table order. */
const byPitch = (a: PitchOption, b: PitchOption): number => {
  const na = Number.parseFloat(a.pitch)
  const nb = Number.parseFloat(b.pitch)
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
  if (Number.isFinite(na)) return -1
  if (Number.isFinite(nb)) return 1
  return 0
}

export function pitchInfoFor(p: PitchProduct): PitchInfo | null {
  if (p.width === null || p.thickness === null) return null
  const family = familyOf(p)
  if (!family) return null

  const rows = BLADE_TABLES[family.table].filter(
    (r) => r.width === p.width && r.thickness === p.thickness && family.brandOk(r.brand),
  )
  if (rows.length === 0) return null

  // Only the meat table prices the profile. Its products are made to order and
  // priced by length, so each option's price is worked out from the table.
  const prices = new Set(rows.map((r) => r.pricePerMeter))
  const pricedByPitch = prices.size > 1
  if (pricedByPitch && !p.length) return null

  const seen = new Set<string>()
  const options: PitchOption[] = []
  for (const r of rows) {
    if (seen.has(r.pitch)) continue
    seen.add(r.pitch)
    options.push({
      pitch: r.pitch,
      brand: r.brand,
      unitPrice: pricedByPitch ? round2(((p.length as number) / 1000) * r.pricePerMeter) : p.price,
    })
  }
  options.sort(byPitch)

  let defaultPitch: string | null = null
  if (p.toothPitch) {
    const wanted = p.toothPitch.trim()
    defaultPitch = options.find((o) => o.pitch === wanted || o.pitch === `${wanted} TPI`)?.pitch ?? null
  }
  // A priced-by-profile product is quoted at one profile already: the one its price matches.
  if (!defaultPitch && pricedByPitch) {
    defaultPitch = options.find((o) => Math.abs(o.unitPrice - p.price) < 0.011)?.pitch ?? null
  }
  // One possible pitch is no choice at all.
  if (!defaultPitch && options.length === 1) defaultPitch = options[0].pitch

  return { table: family.table, options, defaultPitch }
}

/** What goes on the order line: the product's name with the choice appended, in the catalogue's own language (Bulgarian). */
export const PITCH_NAME_BG: Record<string, string> = {
  'cleaner-tooth': 'Зъб чистач',
  'concave-wave': 'Вдлъбната вълна',
  'convex-wave': 'Изпъкнала вълна',
  'smooth-ground': 'Гладко заточен',
  wave: 'Вълна',
}

export function nameWithPitch(name: string, pitch: string): string {
  return pitch in PITCH_NAME_BG ? `${name} · профил ${PITCH_NAME_BG[pitch]}` : `${name} · стъпка ${pitch}`
}

export const PITCH_NAME_RO: Record<string, string> = {
  'cleaner-tooth': 'Dinte cu curățitor',
  'concave-wave': 'Val concav',
  'convex-wave': 'Val convex',
  'smooth-ground': 'Ascuțit neted',
  wave: 'Val',
}

/** "8 TPI" stays as it is; a named profile is written in the language asked for. */
export const pitchText = (pitch: string, lang: 'bg' | 'ro'): string =>
  (lang === 'ro' ? PITCH_NAME_RO : PITCH_NAME_BG)[pitch] ?? pitch
