import { packFromSlug } from './packs'

/**
 * "Bought with this" — what a person buying the product in front of them most
 * plausibly needs next, chosen by rule from the catalogue itself.
 *
 * The rules are the trade's, not a popularity count (there are no customers yet
 * to count): a mill buys blades by the box and sharpens them; a metal shop
 * wants the same band for the next machine; a food plant wants the second
 * profile it uses. Each recommendation carries the reason it was made, so the
 * page can say why it is there rather than showing an unexplained row.
 *
 * Pure: it is given the catalogue and returns slugs, so it is tested without a
 * database. The page turns the slugs into cards.
 */

export type RecProduct = {
  slug: string
  name: string
  categorySlugs: string[]
  series: string | null
  badge?: string | null
  specs: { width?: number; thickness?: number; length?: number }
  stock?: string
}

export type RecReason = 'box' | 'single' | 'sharpen' | 'coolant' | 'sameLength' | 'sameWidth' | 'popular' | 'machine' | 'sameKind'
export type Recommendation = { slug: string; reason: RecReason }

const has = (p: RecProduct, slug: string) => p.categorySlugs.includes(slug)

/** Sharpening kit for wood bands: the wheel that sharpens them and the coolant it runs with. */
const WOOD_SHARPEN: [string, RecReason][] = [
  ['cbn-borazon-disk', 'sharpen'],
  ['coolant-acp-2e', 'coolant'],
]
/** Carbide-tipped circular saws are ground with diamond wheels. */
const HM_SHARPEN: [string, RecReason][] = [
  ['diamond-150-12a2', 'sharpen'],
  ['diamond-125-12a2', 'sharpen'],
]
/** The wheel and the coolant belong together. */
const ABRASIVE_PAIRS: Record<string, [string, RecReason][]> = {
  'cbn-borazon-disk': [['coolant-acp-2e', 'coolant']],
  'coolant-acp-2e': [['cbn-borazon-disk', 'sharpen']],
}

const isBand = (p: RecProduct) =>
  p.categorySlugs.some((s) =>
    ['horizontalni-bantsizi', 'vertikalni-bantsizi', 'bimetalni-lenti', 'vyglerodna-lenti-cs', 'hobi-bantsig', 'meso-i-riba', 'hlebni-izdeliya', 'slicers'].includes(s),
  )

export function recommend(product: RecProduct, all: RecProduct[], limit = 4): Recommendation[] {
  const bySlug = new Map(all.map((p) => [p.slug, p]))
  const out: Recommendation[] = []
  const seen = new Set<string>([product.slug])
  const add = (slug: string, reason: RecReason) => {
    const found = bySlug.get(slug)
    if (!found || seen.has(slug) || found.stock === 'out') return
    seen.add(slug)
    out.push({ slug, reason })
  }

  const pack = packFromSlug(product.slug)

  // 1. The same product in the other package: a single band → its boxes; a box → the single band.
  if (pack) {
    const single = product.slug.replace(/-x\d+$/, '').replace(/-komplekt-\d+$/, '')
    if (single !== product.slug) add(single, 'single')
  } else {
    // The boxes that carry a discount (10 and 20), not the five-pack, which saves nothing.
    for (const p of all) {
      const pk = packFromSlug(p.slug)
      if (p.slug.startsWith(`${product.slug}-x`) && pk?.kind === 'box' && pk.percent > 0) add(p.slug, 'box')
    }
    // A bread-band set is "…-komplekt-8", which packFromSlug does not read.
    for (const p of all) if (p.slug.startsWith(`${product.slug}-komplekt`)) add(p.slug, 'box')
  }

  // 2. What goes with it on the bench.
  if (has(product, 'dyrvo') && !has(product, 'hobi-bantsig') && isBand(product)) {
    for (const [slug, reason] of WOOD_SHARPEN) add(slug, reason)
  }
  if (product.slug.startsWith('hm-') && has(product, 'tsirkulyarni-trioni')) {
    for (const [slug, reason] of HM_SHARPEN) add(slug, reason)
  }
  for (const [slug, reason] of ABRASIVE_PAIRS[product.slug] ?? []) add(slug, reason)

  // 3. The same band for the same machine in the neighbouring size — what a shop with two machines buys next.
  if (isBand(product) && product.specs.length && !pack) {
    const sameLength = all.filter(
      (p) =>
        !packFromSlug(p.slug) &&
        p.specs.length === product.specs.length &&
        p.slug !== product.slug &&
        p.series === product.series &&
        product.categorySlugs.some((c) => c !== 'dyrvo' && c !== 'metal' && c !== 'hrani' && p.categorySlugs.includes(c)),
    )
    const w = product.specs.width ?? 0
    sameLength.sort((a, b) => Math.abs((a.specs.width ?? 0) - w) - Math.abs((b.specs.width ?? 0) - w))
    for (const p of sameLength.slice(0, 2)) add(p.slug, 'sameLength')
  }

  // 4. The workshop's machines go together: setting, sharpening and welding the same band.
  if (has(product, 'mashini')) {
    for (const p of all) if (has(p, 'mashini')) add(p.slug, 'machine')
  }

  // 5. Parts that come in sizes of one family (circular saws of a tooth type, knives of a steel, consumables):
  //    the neighbours of the same kind.
  if (['tsirkulyarni-trioni', 'nozhove-za-abriht', 'konsumativi'].some((c) => has(product, c))) {
    const family = (slug: string) => slug.replace(/\d+([x.-]\d+)*/g, '#')
    const kind = family(product.slug)
    for (const p of all) {
      if (out.length >= limit) break
      if (!packFromSlug(p.slug) && p.categorySlugs.some((c) => product.categorySlugs.includes(c) && c !== 'dyrvo' && c !== 'metal') && family(p.slug) === kind) {
        add(p.slug, 'sameKind')
      }
    }
  }

  // 6. Few ideas so far: the shop's own top picks from the same narrow category — never from a different kind of product.
  if (out.length < 2) {
    const narrow = product.categorySlugs.filter((c) => !['dyrvo', 'metal', 'hrani'].includes(c))
    for (const p of all) {
      if (out.length >= limit) break
      if (p.badge === 'TOP' && p.categorySlugs.some((c) => narrow.includes(c)) && !packFromSlug(p.slug)) add(p.slug, 'popular')
    }
  }

  return out.slice(0, limit)
}
