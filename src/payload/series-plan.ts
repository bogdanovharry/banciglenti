import { SERIES, SAW_MEISTER, type SeriesKey } from '@/lib/series'
import { VERTICAL_WOOD_BLADES } from '@/lib/pricing'

/**
 * Maps the existing catalogue onto the Saw-Meister range and plans the Vector
 * products, which have no counterpart in stock today.
 *
 * Pure: takes the current products, returns what to rename and what to create.
 * The route applies it, so the mapping stays testable and reviewable on its own.
 */

export type ExistingProduct = {
  id: number
  name: string
  slug: string
  brandName: string | null
  shortDescription: string | null
  categorySlugs: string[]
  specs: { width?: number | null; thickness?: number | null; length?: number | null }
  machines: { brand: string; model: string }[]
}

/**
 * Which series a product belongs to.
 *
 * Horizontal wood splits on the steel line rather than on anything in the
 * product name: Kodiak is the softwood line, MasterGold the hardwood one.
 * Bimetal returns null on purpose — see the note in src/lib/series.ts.
 */
export function classify(p: ExistingProduct): SeriesKey | null {
  const cats = new Set(p.categorySlugs)

  if (cats.has('horizontalni-bantsizi')) {
    if (p.brandName === 'MasterGold') return 'hardcut'
    if (p.brandName === 'Kodiak') return 'softcut'
    return null
  }
  if (cats.has('vertikalni-bantsizi')) return 'vector'
  if (cats.has('hobi-bantsig')) return 'flexcut'
  if (cats.has('meso-i-riba') || cats.has('hlebni-izdeliya')) return 'finecut'

  return null // bimetal, circular saws, planer knives, abrasives, machines, consumables
}

/** Widths are whole millimetres: 40, not 40.0. */
const num = (v: number) => String(Number(v.toFixed(2)))

/**
 * Thickness always keeps a decimal, because the workshop writes 1.0 and 0.9 —
 * a bare "1" next to a width reads as a different kind of number.
 */
const thick = (v: number) => {
  const trimmed = Number(v.toFixed(2))
  return Number.isInteger(trimmed) ? trimmed.toFixed(1) : String(trimmed)
}

/**
 * Builds the name from the recorded specs rather than by rewriting the old
 * string, so a product that was named inconsistently comes out consistent.
 *
 *   Saw-Meister SoftCut 40×1.1
 *   Saw-Meister FlexCut 13×0.65 L=2240мм — Holzmann HBS300J
 */
export function seriesName(series: SeriesKey, p: ExistingProduct): string | null {
  const { width, thickness, length } = p.specs
  if (!width || !thickness) return null // no size recorded — leave it alone

  let name = `${SAW_MEISTER} ${SERIES[series].name} ${num(width)}×${thick(thickness)}`
  if (length) name += ` L=${Math.round(length)}мм`

  // Only products that were already named for a machine keep that suffix. A
  // generic stock length also carries machine tags — it was matched to every
  // machine with that contour — and naming it after one of them would tell a
  // buyer it is specific to that machine when it fits any of them. The machine
  // filter reads the relationship, so nothing is lost by leaving it out here.
  const machine = p.machines[0]
  if (machine && wasMachineNamed(p)) name += ` — ${machine.brand} ${machine.model}`

  return name
}

/** The catalogue's convention for a machine-specific size: "… — Holzmann HBS300J". */
const wasMachineNamed = (p: ExistingProduct) => p.name.includes(' — ')

/**
 * What each series is for, in the register a buyer standing at a machine would
 * use. Kept separate from the long-form copy in src/lib/series.ts: this one
 * goes on the product card, where there is room for two sentences, not four.
 */
const APPLICATION: Record<SeriesKey, string> = {
  softcut:
    'За иглолистна дървесина и свеж, влажен материал — по-едрата стъпка извежда обемната ' +
    'стърготина от реза и пази лентата от прегряване.',
  hardcut:
    'За бук, дъб, ясен и друг сух плътен материал — по-фината стъпка и по-устойчивият ръб ' +
    'дават чиста повърхност и по-малко вълна при широк срез.',
  vector:
    'За вертикални банцизи и мобилни гатери от типа Wood-Mizer — гърбът понася честото ' +
    'огъване по малките маховици на тези машини.',
  flexcut:
    'Въглеродна лента с гъвкав гръб за обща употреба — дърво, цветни метали, пластмаса и ' +
    'тънък профил.',
  finecut:
    'Лентов нож за месо, риба, кост и замразени продукти. Неръждаемо изпълнение, подходящо ' +
    'за контакт с храни и за ежедневно миене и дезинфекция.',
}

/**
 * Per-product application copy. Leads with the concrete fit — machine, contour —
 * because that is what a buyer checks first, then says what the series is for.
 */
export function applicationCopy(series: SeriesKey, p: ExistingProduct): string {
  const { length } = p.specs
  const names = p.machines.map((m) => `${m.brand} ${m.model}`)

  // A size made for one machine says so; a stock length that happens to fit
  // several lists them, rather than implying it belongs to the first one.
  const fit = !names.length
    ? null
    : wasMachineNamed(p)
      ? `Готов размер за ${names[0]}.`
      : `Пасва на ${names.slice(0, 3).join(', ')}${names.length > 3 ? ' и други' : ''}.`

  return [
    fit,
    APPLICATION[series],
    length ? `Заварена на контур ${Math.round(length)} мм, готова за монтаж.` : null,
  ]
    .filter(Boolean)
    .join(' ')
}

// --- Vector -----------------------------------------------------------------

/**
 * Vector has no products in stock, so they are planned from the vertical price
 * table. One product per width × thickness; where two steels offer the same
 * size the cheaper per-metre row is used and the other is reported for a
 * stocking decision rather than silently dropped.
 *
 * The table prices per metre and has no lengths in it. Rather than invent loop
 * lengths for machines we have not verified, each product is priced at a
 * REFERENCE_CONTOUR that is stated openly in the description, and the exact
 * length is taken through the configurator at order time.
 */
export const REFERENCE_CONTOUR_MM = 4000

export type PlannedProduct = {
  name: string
  slug: string
  shortDescription: string
  basePrice: number
  specs: { width: number; thickness: number; length: null; material: string }
  pitches: string[]
}

export function planVectorProducts(): {
  creates: PlannedProduct[]
  alternates: string[]
} {
  const wood = VERTICAL_WOOD_BLADES.filter((b) => b.brand !== 'Flexback Carbon')

  const bySize = new Map<string, typeof wood>()
  for (const row of wood) {
    const key = `${row.width}x${row.thickness}`
    const bucket = bySize.get(key)
    if (bucket) bucket.push(row)
    else bySize.set(key, [row])
  }

  const creates: PlannedProduct[] = []
  const alternates: string[] = []
  const metres = REFERENCE_CONTOUR_MM / 1000

  for (const [key, rows] of bySize) {
    const sorted = [...rows].sort((a, b) => a.pricePerMeter - b.pricePerMeter)
    const chosen = sorted[0]

    const otherSteels = [...new Set(sorted.slice(1).map((r) => r.brand))].filter(
      (b) => b !== chosen.brand,
    )
    if (otherSteels.length) {
      alternates.push(`${key} — избрана ${chosen.brand}, налична и ${otherSteels.join(', ')}`)
    }

    const pitches = [...new Set(rows.map((r) => r.pitch))]
    const price = chosen.pricePerMeter * metres + chosen.welding

    creates.push({
      name: `${SAW_MEISTER} Vector ${num(chosen.width)}×${thick(chosen.thickness)}`,
      slug: `saw-meister-vector-${num(chosen.width)}x${thick(chosen.thickness)}`.replace(/\./g, '-'),
      shortDescription:
        `Лента за вертикален банциг и мобилен гатер. Стъпка ${pitches.join(' / ')} мм. ` +
        `Показаната цена е за контур ${REFERENCE_CONTOUR_MM} мм със заваряване — ` +
        `изработваме на дължината на вашата машина.`,
      basePrice: Number(price.toFixed(2)),
      specs: {
        width: chosen.width,
        thickness: chosen.thickness,
        length: null, // made to the machine's contour
        material: 'Закалена лентова стомана',
      },
      pitches,
    })
  }

  creates.sort((a, b) => a.specs.width - b.specs.width)
  return { creates, alternates }
}
