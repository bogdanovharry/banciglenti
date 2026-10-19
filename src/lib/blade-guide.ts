import { SERIES, type SeriesKey } from '@/lib/series'
import type { BladeTableKey } from '@/lib/order-pricing'

/**
 * What a configured blade actually is, and what it is for.
 *
 * The configurator knows the exact price-table row once width, thickness,
 * brand and pitch are chosen. This turns that row into the same answer a
 * person behind the counter would give: which series it belongs to, what the
 * chosen width can and cannot do, and what that tooth pitch or edge profile is
 * actually for.
 *
 * It reads the whole selection, not just the brand. A 16 mm fish knife ground
 * smooth and a 20 mm 3 TPI blade for frozen carcass are both "FineCut" and
 * used to carry the same paragraph — one that named bone and frozen product
 * even when the customer had picked a boneless filleting edge. Width and
 * profile now decide the copy, because they are what decide the job.
 *
 * Where the figures come from
 * ---------------------------
 * · Variable-pitch ranges for bimetal (solid diameter per pitch) follow the
 *   published metal-cutting tooth selection chart — 10/14 at Ø 2–15 mm through
 *   1.5/2 at Ø 120–400 mm.
 * · The "at least 3 teeth in the cut" minimum is the standard rule; for
 *   constant-pitch blades the millimetre figure quoted is derived from it
 *   directly (3 × 25.4 / TPI).
 * · Narrow-band minimum cut radii are the standard width/radius table
 *   (1/4" → 5/8", 3/8" → 1‑7/16", 1/2" → 2‑1/2", 3/4" → 5‑1/2", 1" → 7"),
 *   converted to millimetres and rounded up, so the radius quoted is one the
 *   band will actually make.
 * · Food edge profiles follow Tehnoles' own published applications for these
 *   exact blades (finecut.bg): 3 TPI for frozen and chilled carcass meat,
 *   4 TPI for fresh product and fish, the cleaner tooth for splitting
 *   carcasses, the convex wave for filleting fresh fish and thin bone.
 */

/**
 * Every sentence below is a message under `catalog.guide` / `catalog.series`,
 * not a string in this file, so the same row reads in the visitor's language.
 * The translator is passed in rather than imported: this module is shared by a
 * client component today and may be called from a server one tomorrow, and
 * next-intl has a different hook for each. Anything shaped like
 * `useTranslations('catalog')` fits.
 */
export type Translate = (key: string, values?: Record<string, string | number>) => string

/** Photography by series, matching what the catalogue cards use. */
const SERIES_IMAGE: Record<SeriesKey, string> = {
  softcut: '/images/products/kodiak.png',
  procut: '/images/products/mastergold.png',
  vector: '/images/products/kodiak.png',
  flexcut: '/images/products/hardback_fixed.png',
  finecut: '/images/products/hardback_fixed.png',
}

const BIMETAL_IMAGE = '/images/products/bohler_fixed.png'

/** What the configurator knows about a blade once the row is resolved. */
export type BladeSelection = {
  width: number
  thickness: number
  pitch: string
  brand: string
}

export type BladeGuide = {
  series: SeriesKey | null
  /** "Saw-Meister SoftCut" or, for bimetal, the steel itself. */
  name: string
  type: string
  application: string
  /** What it is, and what this particular width is good for. */
  description: string
  image: string
  /** One line on what this tooth pitch or edge profile is suited to. */
  pitchNote: string | null
}

/**
 * Which Saw-Meister line a configured blade belongs to.
 *
 * Horizontal wood splits on the steel, exactly as the catalogue does: Kodiak
 * is the softwood line, MasterGold the hardwood one. Böhler wide bands and the
 * bimetal rows return null on purpose — they are outside the five series.
 * Vertical wood returns null for the narrow carbon flexback rows, which are
 * curve-cutting bands for a workshop saw and have nothing to do with the
 * Wood-Mizer-class mills Vector is written for.
 */
export function seriesForBlade(table: BladeTableKey, brand: string): SeriesKey | null {
  switch (table) {
    case 'wood-h':
      // MasterGold carried the premium horizontal line, which ProCut now is.
      // Kodiak stays SoftCut: it was always the softwood steel, and SoftCut is
      // still the softwood answer — only its definition moved from "soft
      // timber" to "14° hook", which is the same blade described honestly.
      if (brand === 'MasterGold') return 'procut'
      if (brand === 'Kodiak') return 'softcut'
      return null
    case 'wood-v':
      return brand === 'Flexback Carbon' ? 'flexcut' : 'vector'
    case 'metal-cs':
      return 'flexcut'
    case 'meat':
    case 'bread':
    case 'textile':
      return 'finecut'
    default:
      return null // metal-bi — bimetal, no series
  }
}

const isBimetal = (table: BladeTableKey, brand: string) =>
  table === 'metal-bi' || /bimetal|m42|m51|m90/i.test(brand)

// ===== Tooth pitch and edge profile =====

/** A pitch written as teeth per inch — "14 TPI", or a bare number on a metal table. */
function toothsPerInch(table: BladeTableKey, pitch: string): number | null {
  const tpi = /TPI/i.test(pitch)
    ? Number(pitch.replace(/\s*TPI/i, ''))
    : table === 'metal-cs'
      ? Number(pitch)
      : NaN
  return Number.isFinite(tpi) && tpi > 0 ? tpi : null
}

/**
 * Constant-pitch blades, stated as the smallest section they can cut.
 *
 * A blade needs three teeth in the material at all times: fewer and the work
 * drops between the teeth and snaps them off. Three teeth at 25.4/TPI spacing
 * is the whole rule, so it is quoted as the millimetre figure rather than left
 * as a maxim the buyer has to apply themselves.
 */
function constantPitchNote(t: Translate, tpi: number): string {
  const minMm = Math.round((3 * 25.4) / tpi)

  if (tpi <= 4) return t('guide.pitch.constantCoarse', { minMm })
  if (tpi <= 8) return t('guide.pitch.constantUniversal', { minMm })
  return t('guide.pitch.constantFine', { minMm })
}

/**
 * Variable pitch for bimetal, by the section it is cut for.
 *
 * The two spacings alternate so the blade never settles into one harmonic —
 * that is what kills the washboard pattern and the singing on a long cut. The
 * diameter ranges are the published selection chart, not a rule of thumb.
 */
/** The pairs the selection chart names; their text is `guide.pitch.variable.<pair>`. */
const VARIABLE_PITCH_PAIRS = ['1.4/2', '2/3', '3/4', '4/6', '5/8', '6/10', '8/12', '10/14', '12/16']

function variablePitchNote(t: Translate, pitch: string): string | null {
  if (VARIABLE_PITCH_PAIRS.includes(pitch)) return t(`guide.pitch.variable.${pitch.replace('.', '_').replace('/', '-')}`)
  if (!pitch.includes('/')) return null

  // An unlisted pair still gets the principle, read off its coarse tooth.
  const coarse = Number(pitch.split('/')[0])
  if (!Number.isFinite(coarse)) return null
  if (coarse <= 3) return t('guide.pitch.variableCoarse')
  if (coarse <= 6) return t('guide.pitch.variableMedium')
  return t('guide.pitch.variableFine')
}

/**
 * Tooth pitch in millimetres, for wood.
 *
 * Coarser teeth clear more sawdust per tooth and cut faster; finer teeth leave
 * a cleaner face but load up in deep or wet timber. 22 mm is the pitch a
 * sawmill band is normally supplied in — the thresholds are set around it
 * rather than around a round number.
 */
function woodPitchNote(t: Translate, pitch: string): string | null {
  const mm = Number(pitch)
  if (!Number.isFinite(mm)) return null

  if (mm < 10) return t('guide.pitch.woodFine', { mm })
  if (mm < 15) return t('guide.pitch.woodMedium', { mm })
  if (mm < 20) return t('guide.pitch.woodMediumCoarse', { mm })
  if (mm < 24) return t('guide.pitch.woodCoarse', { mm })
  return t('guide.pitch.woodCoarsest', { mm })
}

// ===== Edge profiles for food blades =====

type FoodEdge = 'toothed' | 'cleaner' | 'wave' | 'plain'

function foodEdge(table: BladeTableKey, pitch: string): FoodEdge {
  if (pitch === 'cleaner-tooth') return 'cleaner'
  if (pitch === 'smooth-ground') return 'plain'
  if (pitch === 'wave' || pitch === 'concave-wave' || pitch === 'convex-wave') return 'wave'
  if (table === 'textile') return 'plain'
  return 'toothed'
}

/**
 * Which shape to draw for this profile.
 *
 * Kept next to the copy that describes the same edge, so the picture and the
 * sentence can never drift apart — a scallop that reads "points bite the skin"
 * must not be drawn as a smooth wave.
 */
export type EdgeKind =
  | 'straight'
  | 'wave'
  | 'scallop'
  | 'convex'
  | 'cleaner'
  | 'teeth-coarse'
  | 'teeth-fine'
  | 'teeth-variable'
  | 'none'

export function edgeKind(table: BladeTableKey, pitch: string): EdgeKind {
  switch (pitch) {
    case 'smooth-ground':
      return 'straight'
    case 'wave':
      return 'wave'
    case 'concave-wave':
      return 'scallop'
    case 'convex-wave':
      return 'convex'
    case 'cleaner-tooth':
      return 'cleaner'
  }

  if (pitch.includes('/')) return 'teeth-variable'

  const tpi = toothsPerInch(table, pitch)
  if (tpi) return tpi >= 8 ? 'teeth-fine' : 'teeth-coarse'

  // Wood is specified in millimetres between teeth — the bigger the number,
  // the coarser the tooth, which is the opposite way round from TPI.
  if (table === 'wood-h' || table === 'wood-v') {
    const mm = Number(pitch)
    if (Number.isFinite(mm)) return mm >= 15 ? 'teeth-coarse' : 'teeth-fine'
  }

  return 'none'
}

/**
 * The edge profiles, as Tehnoles publishes them for these blades.
 *
 * The toothed profiles saw: the tooth is set, it takes a chip and it will go
 * through bone. The wave and plain profiles slice — no set, no chip, no
 * sawdust — which is why they are the ones used on boneless product where the
 * face of the cut is the product.
 */
const FOOD_PROFILE_CODES = [
  '3 TPI',
  '4 TPI',
  'cleaner-tooth',
  'concave-wave',
  'convex-wave',
  'smooth-ground',
  'wave',
]

const foodProfileNote = (t: Translate, pitch: string): string | null =>
  FOOD_PROFILE_CODES.includes(pitch) ? t(`guide.food.profile.${pitch.replace(' ', '_')}`) : null

// ===== Soft materials: which grind for which material =====

/**
 * The four edge grinds a band knife for soft materials comes in.
 *
 * They sit on one axis — how hard the edge bites — and the material picks the
 * point on it. A knife edge parts soft foam and stacked cloth without taking
 * anything away; at the other end a V-tooth nibbles its way through dense foam
 * and board, and makes dust doing it. Wave and scallop are the two useful
 * stops in between, the scallop being the more aggressive of the pair.
 *
 * Only the knife edge is in the price table today (TEXTILE_BLADES). The rest
 * are listed because a buyer with felt or rubber hose needs to know they exist
 * and that they are the right answer — an enquiry we can quote is worth more
 * than a wrong blade sold from stock.
 */
export type MaterialEdge = {
  /** Matches a PITCH_LABELS code where one exists, so the two agree. */
  code: string
  kind: EdgeKind
  /** In the price list, or quoted on enquiry. */
  stocked: boolean
}

/** The words for an edge: `guide.edge.<code>.name | materials | note`. */
export type MaterialEdgeText = { name: string; materials: string; note: string }

export const MATERIAL_EDGE_GUIDE: MaterialEdge[] = [
  { code: 'smooth-ground', kind: 'straight', stocked: true },
  { code: 'wave', kind: 'wave', stocked: false },
  { code: 'concave-wave', kind: 'scallop', stocked: false },
  { code: 'v-tooth', kind: 'teeth-fine', stocked: false },
]

export const materialEdgeText = (t: Translate, code: string): MaterialEdgeText => ({
  name: t(`guide.edge.${code}.name`),
  materials: t(`guide.edge.${code}.materials`),
  note: t(`guide.edge.${code}.note`),
})

// ===== What the chosen width buys you =====

/**
 * Minimum cut radius for a narrow band, in millimetres.
 *
 * The band cannot turn tighter than its own width allows without twisting in
 * the kerf and running off the wheels. Rounded up from the standard table, so
 * the figure is one the band will actually hold.
 */
function minRadiusMm(width: number): number {
  if (width <= 6) return 15
  if (width <= 8) return 25
  if (width <= 10) return 40
  if (width <= 13) return 65
  if (width <= 16) return 100
  if (width <= 20) return 140
  return 180
}

/** Horizontal mills — width is beam strength against wander in a deep cut. */
function millWidthNote(t: Translate, width: number): string {
  if (width <= 35) return t('guide.width.mill1', { width })
  if (width <= 50) return t('guide.width.mill2', { width })
  if (width < 100) return t('guide.width.mill3', { width })
  return t('guide.width.mill4', { width })
}

/** Vertical saws — narrow bands turn, wide bands resaw. */
function verticalWidthNote(t: Translate, width: number): string {
  const radius = minRadiusMm(width)
  if (width <= 16) return t('guide.width.vertical1', { width, radius })
  if (width <= 25) return t('guide.width.vertical2', { width, radius })
  if (width <= 50) return t('guide.width.vertical3', { width })
  return t('guide.width.vertical4', { width })
}

/** Metal saws — width is set by the machine, and pairs with the back thickness. */
function metalWidthNote(t: Translate, width: number, thickness: number): string {
  const v = { width, thickness }
  if (width <= 13) return t('guide.width.metal1', v)
  if (width <= 20) return t('guide.width.metal2', v)
  if (width <= 27) return t('guide.width.metal3', v)
  if (width <= 34) return t('guide.width.metal4', v)
  if (width <= 41) return t('guide.width.metal5', v)
  return t('guide.width.metal6', v)
}

/** Food and slicer blades — narrow follows the contour, wide holds the line. */
function foodWidthNote(t: Translate, width: number, thickness: number, edge: FoodEdge): string {
  const v = { width, thickness }
  if (width <= 12) return t('guide.width.food1', v)
  if (width <= 16)
    return edge === 'toothed' || edge === 'cleaner' ? t('guide.width.food2Toothed', v) : t('guide.width.food2Smooth', v)
  return t('guide.width.food3', v)
}

// ===== Assembly =====

function identity(
  t: Translate,
  table: BladeTableKey,
  blade: BladeSelection,
): Pick<BladeGuide, 'series' | 'name' | 'type' | 'application' | 'image'> & { base: string } {
  const key = seriesForBlade(table, blade.brand)

  if (!key) {
    // Bimetal on a mill table is a sawmill band, not an off-cut blade for
    // metal. Same construction, entirely different job — it is bought for the
    // hours it runs between sharpenings in abrasive or dirty timber.
    if (isBimetal(table, blade.brand) && (table === 'wood-h' || table === 'wood-v')) {
      return {
        series: null,
        name: blade.brand === 'BiMetal' ? t('guide.identity.bimetalMillName') : blade.brand,
        type: t('guide.identity.bimetalType'),
        application: t('guide.identity.woodMill'),
        image: BIMETAL_IMAGE,
        base: t('guide.identity.bimetalMillBase'),
      }
    }

    if (isBimetal(table, blade.brand)) {
      // M42 is the workhorse cobalt HSS tooth. The grades above it carry more
      // alloy in the tooth and are bought for the materials that eat M42.
      const premium = !/m42/i.test(blade.brand)
      return {
        series: null,
        name: blade.brand || t('guide.identity.bimetalBlade'),
        type: t('guide.identity.bimetalType'),
        application: premium ? t('guide.identity.alloyStainless') : t('guide.identity.metalGeneral'),
        image: BIMETAL_IMAGE,
        base: premium ? t('guide.identity.bimetalPremiumBase') : t('guide.identity.bimetalStandardBase'),
      }
    }

    // Böhler and the other wide carbon bands on the mill tables.
    return {
      series: null,
      name: blade.brand || t('guide.identity.bandsawBlade'),
      type: t('guide.identity.carbonType'),
      application: t('guide.identity.woodMill'),
      image: SERIES_IMAGE.softcut,
      base: t('guide.identity.carbonBase'),
    }
  }

  const s = SERIES[key]
  return {
    series: key,
    name: `Saw-Meister ${s.name}`,
    type: t(`series.${key}.type`),
    application: t(`series.${key}.application`),
    image: SERIES_IMAGE[key],
    base: t(`series.${key}.description`),
  }
}

/**
 * Food blades need their opening line to follow the edge, not the series.
 *
 * FineCut covers everything from a 3 TPI blade that splits frozen carcass to a
 * smooth-ground knife for filleting fish. One paragraph for both told half the
 * customers the wrong thing about their own blade.
 */
function foodBase(t: Translate, table: BladeTableKey, edge: FoodEdge): string {
  const steel = t('guide.food.steel')

  // The edge itself is described in the profile note below the paragraph, so
  // this says what the product is and what it runs on instead of repeating it.
  if (table === 'textile') return t('guide.food.baseTextile')
  if (table === 'bread') return t('guide.food.baseBread', { steel })

  switch (edge) {
    case 'toothed':
      return t('guide.food.baseToothed', { steel })
    case 'cleaner':
      return t('guide.food.baseCleaner', { steel })
    case 'wave':
      return t('guide.food.baseWave', { steel })
    case 'plain':
      return t('guide.food.basePlain', { steel })
  }
}

function widthNote(t: Translate, table: BladeTableKey, blade: BladeSelection): string {
  switch (table) {
    case 'wood-h':
      return millWidthNote(t, blade.width)
    case 'wood-v':
      return blade.brand === 'Flexback Carbon'
        ? t('guide.width.flexbackWood', { width: blade.width, radius: minRadiusMm(blade.width) })
        : verticalWidthNote(t, blade.width)
    case 'metal-bi':
      return metalWidthNote(t, blade.width, blade.thickness)
    case 'metal-cs':
      return t('guide.width.metalCs', { width: blade.width, radius: minRadiusMm(blade.width) })
    case 'meat':
    case 'bread':
      return foodWidthNote(t, blade.width, blade.thickness, foodEdge(table, blade.pitch))
    case 'textile':
      if (blade.width <= 10) return t('guide.width.textile1', { width: blade.width })
      if (blade.width <= 20) return t('guide.width.textile2', { width: blade.width })
      return t('guide.width.textile3', { width: blade.width, thickness: blade.thickness })
    default:
      return ''
  }
}

/**
 * The concave wave is stocked for both counters, and the reason it works is
 * the same in each — the points grip, the crescent cuts. Which side of that to
 * lead with depends on which tab the buyer is standing on.
 */
function pitchNoteFor(t: Translate, table: BladeTableKey, blade: BladeSelection): string | null {
  // On the soft-materials tab the same codes mean the same shapes but a wholly
  // different job, so the guide written for those materials answers instead of
  // the food copy.
  if (table === 'textile')
    return MATERIAL_EDGE_GUIDE.some((e) => e.code === blade.pitch)
      ? materialEdgeText(t, blade.pitch).note
      : null

  if (table === 'bread' && blade.pitch === 'concave-wave') return t('guide.food.breadConcaveWave')

  if (table === 'meat' || table === 'bread') return foodProfileNote(t, blade.pitch)

  if (blade.pitch.includes('/')) return variablePitchNote(t, blade.pitch)

  const tpi = toothsPerInch(table, blade.pitch)
  if (tpi) return constantPitchNote(t, tpi)

  if (table === 'wood-h' || table === 'wood-v') return woodPitchNote(t, blade.pitch)
  return null
}

export function bladeGuide(t: Translate, table: BladeTableKey, blade: BladeSelection): BladeGuide {
  const id = identity(t, table, blade)
  const edge = foodEdge(table, blade.pitch)
  const isFood = table === 'meat' || table === 'bread' || table === 'textile'

  const base = isFood ? foodBase(t, table, edge) : id.base
  const width = widthNote(t, table, blade)

  return {
    series: id.series,
    name: id.name,
    // FineCut's "food" type is right for the meat and bread counters but not
    // for a slicer band cutting textile, paper and foam.
    type: table === 'textile' ? t('guide.identity.bandKnife') : id.type,
    application: isFood ? foodApplication(t, table, edge) : id.application,
    description: width ? `${base} ${width}` : base,
    image: id.image,
    pitchNote: pitchNoteFor(t, table, blade),
  }
}

/** The eyebrow above the name, so it names the job rather than the department. */
function foodApplication(t: Translate, table: BladeTableKey, edge: FoodEdge): string {
  if (table === 'textile') return t('guide.food.appTextile')
  if (table === 'bread') return t('guide.food.appBread')
  switch (edge) {
    case 'toothed':
      return t('guide.food.appToothed')
    case 'cleaner':
      return t('guide.food.appCleaner')
    case 'wave':
      return t('guide.food.appWave')
    case 'plain':
      return t('guide.food.appPlain')
  }
}
