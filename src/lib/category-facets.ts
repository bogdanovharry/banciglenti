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

export type FacetProduct = {
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

export const facetsFor = (categorySlug: string | null | undefined): SpecFacet[] =>
  categorySlug === 'tsirkulyarni-trioni' ? CIRCULAR : categorySlug === 'nozhove-za-abriht' ? KNIVES : []

/**
 * What "length" means on this page. A band blade's is the length of its loop and
 * must match the machine exactly; a planer knife's is just how long the knife is.
 */
export const lengthKindFor = (categorySlug: string | null | undefined): 'loop' | 'part' =>
  categorySlug === 'nozhove-za-abriht' ? 'part' : 'loop'
