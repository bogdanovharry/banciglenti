/**
 * Category addresses in the visitor's language.
 *
 * The database, the seeds and a good deal of code know categories by their
 * Bulgarian transliterated slug ("horizontalni-bantsizi"). That is the one
 * canonical key and it does not change. What a Romanian visitor sees in the
 * address bar is a Romanian slug, and both spellings are accepted when a
 * request arrives (the Romanian site redirects the Bulgarian one to the
 * Romanian, so each page has a single address).
 *
 * Pure module — no imports — so server and client code can both use it.
 */

/** canonical (database) slug → Romanian slug */
export const CATEGORY_SLUGS_RO: Record<string, string> = {
  dyrvo: 'lemn',
  metal: 'metal',
  hrani: 'alimente',
  'hobi-bantsig': 'ferastrau-hobby',
  abrazivi: 'abrazive',
  mashini: 'utilaje',
  konsumativi: 'consumabile',
  'horizontalni-bantsizi': 'ferastraie-panglica-orizontale',
  'vertikalni-bantsizi': 'ferastraie-panglica-verticale',
  'tsirkulyarni-trioni': 'panze-ferastrau-circular',
  'nozhove-za-abriht': 'cutite-de-rindea',
  'bimetalni-lenti': 'panze-bimetalice',
  'vyglerodna-lenti-cs': 'otel-carbon-cs',
  'meso-i-riba': 'carne-si-peste',
  'hlebni-izdeliya': 'panificatie',
  slicers: 'feliatoare',
}

const RO_TO_CANONICAL = Object.fromEntries(Object.entries(CATEGORY_SLUGS_RO).map(([bg, ro]) => [ro, bg]))

const isRomanian = (locale: string): boolean => locale.toLowerCase().startsWith('ro')

/** Whatever spelling arrived → the database slug. Unknown slugs pass through. */
export const canonicalCategorySlug = (slug: string): string => RO_TO_CANONICAL[slug] ?? slug

/** The slug a visitor with this locale should see. */
export const categoryPublicSlug = (slug: string, locale: string): string => {
  const canonical = canonicalCategorySlug(slug)
  return isRomanian(locale) ? (CATEGORY_SLUGS_RO[canonical] ?? canonical) : canonical
}

/** "/category/dyrvo" → "/category/lemn" for a Romanian visitor; any other href is returned as it is. */
export function localizeHref(href: string, locale: string): string {
  const m = /^\/category\/([^/?#]+)(.*)$/.exec(href)
  return m ? `/category/${categoryPublicSlug(m[1], locale)}${m[2]}` : href
}
