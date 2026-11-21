/**
 * Which filters a category offers beyond loop length and machine fit.
 *
 * Those two are for band blades. A page of circular saws or planer knives has
 * neither, but it has things a buyer arrives with: the diameter of the saw, the
 * steel of the knife, how long it is. The facets are read from the product's
 * recorded specs, so a category offers a filter only when the data is there, and
 * the panel shows it only when there is more than one value to choose between.
 *
 * Pure module: server and client both read it. Slugs are the canonical
 * (database) category slugs.
 */

import { bladeLineOf } from './product-images'

export type FacetProduct = {
  name?: string
  slug?: string
  series?: string | null
  specs?: { width?: number; thickness?: number; length?: number; material?: string }
}

export type SpecFacet = {
  id: string
  /** Message under `catalog.filters`. */
  title: string
  read: (p: FacetProduct) => string | number | null
  /** The facet's values are message keys under `catalog.filters`, not data. */
  messageValues?: boolean
  /** Written in front of a number: "Ø" before a saw's diameter. */
  prefix?: string
}

const num = (v: number | undefined): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

const CARBIDE = /HM|carbide|dur/i

const CIRCULAR: SpecFacet[] = [
  {
    id: 'type',
    title: 'type',
    messageValues: true,
    // Carbide-tipped saws are recorded with a material; the plain steel ones with none.
    read: (p) => (p.specs?.material ? (CARBIDE.test(p.specs.material) ? 'typeCarbide' : 'typeSteel') : 'typeSteel'),
  },
  { id: 'diameter', title: 'diameter', prefix: 'Ø', read: (p) => num(p.specs?.width) },
  { id: 'thickness', title: 'thickness', read: (p) => num(p.specs?.thickness) },
]

const KNIVES: SpecFacet[] = [
  { id: 'material', title: 'material', read: (p) => p.specs?.material?.trim() || null },
  { id: 'width', title: 'width', read: (p) => num(p.specs?.width) },
]

/**
 * The abrasives shelf: told apart by what the product is and by the wheel's diameter.
 * Read from the slug (abraziv-150-10-3, diamond-125-12a2, cbn-borazon-disk, coolant-acp-2e), which is the same in every
 * language, not from the name, which is translated.
 */
const ABRASIVES: SpecFacet[] = [
  {
    id: 'type',
    title: 'type',
    messageValues: true,
    read: (p) => {
      const slug = p.slug ?? ''
      return slug.startsWith('coolant')
        ? 'typeCoolant'
        : slug.startsWith('diamond')
          ? 'typeDiamond'
          : slug.startsWith('cbn')
            ? 'typeCbn'
            : slug.startsWith('abraziv')
              ? 'typeAbrasive'
              : null
    },
  },
  {
    id: 'diameter',
    title: 'diameter',
    prefix: 'Ø',
    read: (p) => {
      const m = /^(?:abraziv|diamond)-(\d+)/.exec(p.slug ?? '')
      return m ? Number(m[1]) : num(p.specs?.width)
    },
  },
]

/** The two Saw-Meister horizontal lines: told apart by the tooth (10/30° universal, 14° for soft wood). */
const HORIZONTAL: SpecFacet[] = [
  {
    id: 'line',
    title: 'line',
    messageValues: true,
    read: (p) => {
      const line = bladeLineOf(p)
      return line === 'procut' ? 'lineProcut' : line === 'softcut' ? 'lineSoftcut' : null
    },
  },
]

/** Width in millimetres — the first thing a buyer of a band blade knows about the machine's guides and the cut. */
const WIDTH: SpecFacet = { id: 'width', title: 'width', read: (p) => num(p.specs?.width) }

/** Every category of band blades offers the width filter. */
const BAND_CATEGORIES = new Set([
  'horizontalni-bantsizi',
  'vertikalni-bantsizi',
  'bimetalni-lenti',
  'vyglerodna-lenti-cs',
  'hobi-bantsig',
  'meso-i-riba',
  'hlebni-izdeliya',
  'slicers',
])

export const facetsFor = (categorySlug: string | null | undefined): SpecFacet[] => {
  if (categorySlug === 'tsirkulyarni-trioni') return CIRCULAR
  if (categorySlug === 'nozhove-za-abriht') return KNIVES
  if (categorySlug === 'abrazivi') return ABRASIVES
  if (categorySlug && BAND_CATEGORIES.has(categorySlug)) {
    return categorySlug === 'horizontalni-bantsizi' ? [...HORIZONTAL, WIDTH] : [WIDTH]
  }
  return []
}

/**
 * What "length" means on this page. A band blade's is the length of its loop and
 * must match the machine exactly; a planer knife's is just how long the knife is.
 */
export const lengthKindFor = (categorySlug: string | null | undefined): 'loop' | 'part' =>
  categorySlug === 'nozhove-za-abriht' ? 'part' : 'loop'
