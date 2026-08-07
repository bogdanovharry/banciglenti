import { SERIES, type SeriesKey } from '@/lib/series'
import type { BladeTableKey } from '@/lib/order-pricing'

/**
 * What a configured blade actually is, and what it is for.
 *
 * The configurator knows the exact price-table row once width, thickness,
 * brand and pitch are chosen — but it only ever showed a number. This turns
 * that row into the same answer a person behind the counter would give: which
 * series it belongs to, what it cuts, and whether the chosen tooth pitch suits
 * the job.
 */

/** Photography by series, matching what the catalogue cards use. */
const SERIES_IMAGE: Record<SeriesKey, string> = {
  softcut: '/images/products/kodiak.png',
  hardcut: '/images/products/mastergold.png',
  vector: '/images/products/kodiak.png',
  flexcut: '/images/products/hardback_fixed.png',
  finecut: '/images/products/hardback_fixed.png',
}

const BIMETAL_IMAGE = '/images/products/bohler_fixed.png'

/**
 * Which Saw-Meister line a configured blade belongs to.
 *
 * Horizontal wood splits on the steel, exactly as the catalogue does: Kodiak
 * is the softwood line, MasterGold the hardwood one. Bimetal returns null on
 * purpose — it is deliberately outside the five series.
 */
export function seriesForBlade(table: BladeTableKey, brand: string): SeriesKey | null {
  switch (table) {
    case 'wood-h':
      if (brand === 'MasterGold') return 'hardcut'
      if (brand === 'Kodiak') return 'softcut'
      return null
    case 'wood-v':
      return 'vector'
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

export type BladeGuide = {
  series: SeriesKey | null
  /** "Saw-Meister SoftCut" or, for bimetal, the steel itself. */
  name: string
  type: string
  application: string
  description: string
  image: string
  /** One line on what this tooth pitch is suited to. */
  pitchNote: string | null
}

/**
 * Tooth pitch in millimetres, for wood. Coarser teeth clear more sawdust per
 * tooth and cut faster; finer teeth leave a cleaner face but load up in deep
 * or wet timber. Stated as a range of use rather than a rule, because the
 * right pitch also depends on how deep the cut is.
 */
function woodPitchNote(pitch: string): string | null {
  const mm = Number(pitch)
  if (!Number.isFinite(mm)) return null
  if (mm >= 22) return 'Едра стъпка — за дълбок рез и мокър материал, бързо отвеждане на стърготината.'
  if (mm >= 15) return 'Средна стъпка — универсална за дъски и греди със средна дебелина.'
  return 'Фина стъпка — за по-плитък рез и по-чиста повърхност.'
}

/** Metal blades are specified in teeth per inch, usually as a variable range. */
function metalPitchNote(pitch: string): string | null {
  if (!/TPI|\//i.test(pitch)) return null
  const first = Number(pitch.split(/[\/ ]/)[0])
  if (!Number.isFinite(first)) return null
  if (first <= 3) return 'Груба стъпка — за плътен профил и голямо сечение.'
  if (first <= 6) return 'Средна стъпка — тръби с дебела стена и плътен материал.'
  return 'Фина стъпка — тънкостенни тръби и профили. Поне 3 зъба да са в реза.'
}

export function bladeGuide(
  table: BladeTableKey,
  brand: string,
  pitch: string,
): BladeGuide {
  const key = seriesForBlade(table, brand)

  const pitchNote =
    table === 'wood-h' || table === 'wood-v'
      ? woodPitchNote(pitch)
      : metalPitchNote(pitch)

  if (!key) {
    // Bimetal and anything else outside the series still deserves an answer.
    return {
      series: null,
      name: brand || 'Биметална лента',
      type: 'Биметал',
      application: 'Метал',
      description:
        'Биметална отрезна лента: закалени зъби, заварени върху пружинен гръб. ' +
        'Издържа на по-висока скорост и по-твърд материал от въглеродната лента, ' +
        'но е и по-скъпа — избира се за серийно рязане на метал.',
      image: BIMETAL_IMAGE,
      pitchNote,
    }
  }

  const s = SERIES[key]
  return {
    series: key,
    name: `Saw-Meister ${s.name}`,
    type: s.type,
    application: s.application,
    description: s.description,
    image: SERIES_IMAGE[key],
    pitchNote,
  }
}
