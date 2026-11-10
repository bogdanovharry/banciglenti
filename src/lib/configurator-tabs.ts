/**
 * Which configurator tab belongs to which category.
 *
 * The configurator has one tab per kind of blade, and it used to open on the
 * first (wood, horizontal) whichever page the buyer came from — so someone
 * looking at meat blades landed on a wood form. A link from a category now says
 * which tab to open (`/configurator?type=meat`), and the page honours it.
 *
 * Pure module, no imports: server pages, client components and the panel all
 * read it. The slugs are the canonical (database) category slugs.
 */

export const CONFIG_TABS = ['wood-h', 'wood-v', 'metal-bi', 'metal-cs', 'hobby', 'meat', 'bread', 'slicer'] as const
export type ConfigTab = (typeof CONFIG_TABS)[number]

export const isConfigTab = (v: unknown): v is ConfigTab => typeof v === 'string' && (CONFIG_TABS as readonly string[]).includes(v)

const TAB_FOR_CATEGORY: Record<string, ConfigTab> = {
  dyrvo: 'wood-h',
  'horizontalni-bantsizi': 'wood-h',
  'vertikalni-bantsizi': 'wood-v',
  metal: 'metal-bi',
  'bimetalni-lenti': 'metal-bi',
  'vyglerodna-lenti-cs': 'metal-cs',
  'hobi-bantsig': 'hobby',
  hrani: 'meat',
  'meso-i-riba': 'meat',
  'hlebni-izdeliya': 'bread',
  slicers: 'slicer',
}

/** The tab for a category, or null for one the configurator does not cover (machines, circular saws, abrasives…). */
export const configuratorTabFor = (categorySlug: string | null | undefined): ConfigTab | null =>
  (categorySlug && TAB_FOR_CATEGORY[categorySlug]) || null

/**
 * A product belongs to several categories (its own and its parent), and the
 * parent — "Wood" — would win if the first match were taken. The most specific
 * kind of blade is looked up first.
 */
const MOST_SPECIFIC_FIRST = [
  'meso-i-riba', 'hlebni-izdeliya', 'slicers', 'hobi-bantsig', 'vertikalni-bantsizi', 'horizontalni-bantsizi',
  'bimetalni-lenti', 'vyglerodna-lenti-cs', 'hrani', 'metal', 'dyrvo',
]

export const configuratorHrefForAny = (categorySlugs: readonly string[] | null | undefined): string => {
  const slug = MOST_SPECIFIC_FIRST.find((s) => categorySlugs?.includes(s))
  return configuratorHref(slug)
}

/** "/configurator?type=meat" for a category with a tab, plain "/configurator" otherwise. */
export const configuratorHref = (categorySlug: string | null | undefined): string => {
  const tab = configuratorTabFor(categorySlug)
  return tab ? `/configurator?type=${tab}` : '/configurator'
}
