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

/** Cheapest row matching the basis width, or the cheapest in the table. */
function basisRow(basis: SpecBasis): BladeConfig | undefined {
  const atWidth = basis.table.filter((b) => b.width === basis.width)
  const pool = atWidth.length ? atWidth : basis.table
  return [...pool].sort((a, b) => a.pricePerMeter - b.pricePerMeter)[0]
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

export type MachinePlan = {
  /** Existing product slugs get these machines attached. */
  tags: { length: number; machines: { brand: string; model: string }[] }[]
  creates: GeneratedProduct[]
}

/**
 * @param existingLengths loop lengths already present in the catalogue.
 */
export function planMachineProducts(existingLengths: Set<number>): MachinePlan {
  const tags: MachinePlan['tags'] = []
  const creates: GeneratedProduct[] = []

  // Group machines by length so one generated product can serve several models
  // that happen to share a loop size.
  const byLength = new Map<number, Machine[]>()
  for (const m of MACHINES) {
    byLength.set(m.length, [...(byLength.get(m.length) ?? []), m])
  }

  for (const [length, machines] of byLength) {
    const entries = machines.map((m) => ({ brand: m.brand, model: m.model }))

    if (existingLengths.has(length)) {
      tags.push({ length, machines: entries })
      continue
    }

    const industry = machines[0].industry
    const basis = BASIS[industry]
    const row = basisRow(basis)
    if (!row) continue

    // Prefer a width the source actually stated for this machine.
    const width = machines.find((m) => m.width)?.width ?? basis.width
    const thickness = machines.find((m) => m.thickness)?.thickness ?? basis.thickness

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
