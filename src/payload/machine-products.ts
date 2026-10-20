import { MACHINES, machineLabel, type Machine } from '@/lib/machines'
import {
  VERTICAL_WOOD_BLADES,
  METAL_BIMETAL_BLADES,
  MEAT_BLADES,
  type BladeConfig,
} from '@/lib/pricing'

/**
 * Turns the machine registry into catalogue entries.
 *
 * Two outcomes per machine, because five of the researched lengths — 1400,
 * 1638, 1712, 1790 and 2360 — are already stocked:
 *
 *   tag    the length exists, so the machine is attached to the products that
 *          already carry it. A Holzmann BS128 owner could not previously find
 *          the 1638 mm blade we have had on the shelf all along.
 *   create the length is new, so a product is generated for it.
 *
 * Prices are never invented: each generated product is costed from the same
 * BladeConfig tables the configurator quotes from — price per metre over the
 * loop length, plus the welding charge for that row.
 */

type SpecBasis = {
  table: BladeConfig[]
  width: number
  thickness: number
  categorySlug: string
  materialLabel: string
}

/**
 * The blade actually sold for each machine class. Wood and metal fall back to a
 * 13 mm general-purpose blade, which is the width these machines ship with and
 * the one the existing catalogue already stocks most of.
 */
const BASIS: Record<Machine['industry'], SpecBasis> = {
  wood: {
    table: VERTICAL_WOOD_BLADES,
    width: 13,
    thickness: 0.65,
    categorySlug: 'hobi-bantsig',
    materialLabel: 'Въглеродна стомана',
  },
  metal: {
    table: METAL_BIMETAL_BLADES,
    width: 13,
    thickness: 0.65,
    categorySlug: 'bimetalni-lenti',
    materialLabel: 'M42 HSS',
  },
  meat: {
    table: MEAT_BLADES,
    width: 16,
    thickness: 0.5,
    categorySlug: 'meso-i-riba',
    materialLabel: 'Неръждаема стомана',
  },
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/ö/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * The price row for the size being made. A machine that states 27×0.9 is priced
 * from the 27×0.9 row — pricing it from the 13 mm basis quoted an Optimum S 275
 * blade 15% under what the configurator charges for the same blade. Falls back
 * to the basis width only where the source gave no size.
 */
function basisRow(basis: SpecBasis, width = basis.width, thickness?: number): BladeConfig | undefined {
  const cheapest = (rows: BladeConfig[]) => [...rows].sort((a, b) => a.pricePerMeter - b.pricePerMeter)[0]
  const exact = basis.table.filter((b) => b.width === width && (thickness === undefined || b.thickness === thickness))
  if (exact.length) return cheapest(exact)
  const atWidth = basis.table.filter((b) => b.width === width)
  if (atWidth.length) return cheapest(atWidth)
  return undefined
}

export type GeneratedProduct = {
  name: string
  slug: string
  basePrice: number
  categorySlug: string
  specs: { width: number; thickness: number; length: number; material: string }
  machines: { brand: string; model: string }[]
  shortDescription: string
}

/** What the catalogue already carries, reduced to what decides whether a machine fits it. */
export type ExistingBlade = { length: number; width: number | null; industry: Machine['industry'] | null }

export type MachineTag = {
  industry: Machine['industry']
  length: number
  /** Null when the source did not state a width: any width of this loop fits the search. */
  width: number | null
  machines: { brand: string; model: string }[]
}

export type MachinePlan = {
  /** Existing products of the same industry, loop and width get these machines attached. */
  tags: MachineTag[]
  creates: GeneratedProduct[]
}

/**
 * Machines are matched to blades by industry and loop length, and by width
 * where the source stated one. Length alone attached a metal saw to wood
 * carbon blades that happen to share its loop, and a 27 mm machine to a 34 mm
 * blade — a customer filtering by their machine must only ever see blades that
 * run on it.
 */
export function planMachineProducts(existing: ExistingBlade[]): MachinePlan {
  const tags: MachinePlan['tags'] = []
  const creates: GeneratedProduct[] = []

  // One generated product can serve several models that share industry, loop and width.
  const groups = new Map<string, Machine[]>()
  for (const m of MACHINES) {
    const key = `${m.industry}|${m.length}|${m.width ?? ''}`
    groups.set(key, [...(groups.get(key) ?? []), m])
  }

  for (const machines of groups.values()) {
    const { industry, length } = machines[0]
    const statedWidth = machines[0].width ?? null
    const entries = machines.map((m) => ({ brand: m.brand, model: m.model }))
    const basis = BASIS[industry]

    const carried = existing.some(
      (e) =>
        e.industry === industry &&
        e.length === length &&
        (statedWidth === null || e.width === statedWidth),
    )
    if (carried) {
      tags.push({ industry, length, width: statedWidth, machines: entries })
      continue
    }

    const width = statedWidth ?? basis.width
    const stated = machines.find((m) => m.thickness)?.thickness
    // No price row for the stated size means no product: a blade that cannot be
    // priced from the table is not one the configurator could sell either.
    const row = basisRow(basis, width, stated ?? (width === basis.width ? basis.thickness : undefined))
    if (!row) continue
    // The row's own thickness when the source gave none: a 20 mm blade is not 0.65.
    const thickness = stated ?? row.thickness

    const price = Math.round((row.pricePerMeter * (length / 1000) + row.welding) * 100) / 100
    const names = machines.map(machineLabel)

    creates.push({
      name: `Банцигова лента ${width}×${thickness} L=${length}мм — ${names[0]}`,
      slug: `lenta-${slugify(names[0])}-${length}`,
      basePrice: price,
      categorySlug: basis.categorySlug,
      specs: { width, thickness, length, material: basis.materialLabel },
      machines: entries,
      shortDescription: `Готов размер за ${names.join(', ')}. Заварена на контур ${length} мм, готова за монтаж.`,
    })
  }

  return { tags, creates }
}
