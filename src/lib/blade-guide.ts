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
function constantPitchNote(tpi: number): string {
  const minMm = Math.round((3 * 25.4) / tpi)

  if (tpi <= 4)
    return `Едра стъпка — за дебел и мек материал: алуминий, месинг, пластмаса, дърво. Дълбокият улей извежда обемната стружка, вместо да я трамбова. Поне 3 зъба в реза означава сечение от около ${minMm} мм нагоре.`
  if (tpi <= 8)
    return `Универсална стъпка — най-широко приложима за среден профил и плътен материал до около 25 мм. Поне 3 зъба в реза означава сечение от около ${minMm} мм нагоре.`
  return `Фина стъпка — за тънък лист, тънкостенна тръба и малко сечение. Дава по-гладък срез, но улеят се запълва бързо в дебел материал. Материал под около ${minMm} мм остава между зъбите и ги чупи.`
}

/**
 * Variable pitch for bimetal, by the section it is cut for.
 *
 * The two spacings alternate so the blade never settles into one harmonic —
 * that is what kills the washboard pattern and the singing on a long cut. The
 * diameter ranges are the published selection chart, not a rule of thumb.
 */
const VARIABLE_PITCH_NOTE: Record<string, string> = {
  '1.4/2':
    'Най-едрата стъпка — плътно сечение Ø 120 – 400 мм. Големият улей носи стружката през целия дълъг рез; на тънък материал зъбът е прекалено едър и се къса.',
  '2/3':
    'Груба стъпка — плътно сечение Ø 80 – 200 мм и тежък конструкционен профил. Малко зъби в реза, много място за стружка.',
  '3/4':
    'Едра стъпка — плътно сечение Ø 60 – 120 мм, вал, дебела шина и плътен блок.',
  '4/6':
    'Средна стъпка — плътно сечение Ø 35 – 70 мм, тръби с дебела стена и плътен профил. Най-универсалната стъпка за работилница.',
  '5/8':
    'Средно-фина стъпка — плътно сечение Ø 25 – 40 мм и профил със средна стена.',
  '6/10':
    'Фина стъпка — плътно сечение Ø 16 – 30 мм, тръби и профили с по-тънка стена.',
  '8/12':
    'Фина стъпка — плътно сечение Ø 8 – 20 мм, тънкостенна тръба и тънък профил.',
  '10/14':
    'Много фина стъпка — плътно сечение Ø 2 – 15 мм и тънкостенна тръба. Стената трябва да поеме поне 3 зъба, иначе зъбите се късат.',
  '12/16':
    'Най-финият зъб — ламарина, тънкостенен профил и малко сечение, където срезът трябва да излезе чист и без мустак.',
}

function variablePitchNote(pitch: string): string | null {
  const known = VARIABLE_PITCH_NOTE[pitch]
  if (known) return known
  if (!pitch.includes('/')) return null

  // An unlisted pair still gets the principle, read off its coarse tooth.
  const coarse = Number(pitch.split('/')[0])
  if (!Number.isFinite(coarse)) return null
  if (coarse <= 3) return 'Груба стъпка — за плътен профил и голямо сечение.'
  if (coarse <= 6) return 'Средна стъпка — тръби с дебела стена и плътен материал.'
  return 'Фина стъпка — тънкостенни тръби и профили. Поне 3 зъба да са в реза.'
}

/**
 * Tooth pitch in millimetres, for wood.
 *
 * Coarser teeth clear more sawdust per tooth and cut faster; finer teeth leave
 * a cleaner face but load up in deep or wet timber. 22 mm is the pitch a
 * sawmill band is normally supplied in — the thresholds are set around it
 * rather than around a round number.
 */
function woodPitchNote(pitch: string): string | null {
  const mm = Number(pitch)
  if (!Number.isFinite(mm)) return null

  if (mm < 10)
    return `Фина стъпка (${mm} мм) — за плитък рез, тънък материал и чиста повърхност направо от лентата.`
  if (mm < 15)
    return `Средна стъпка (${mm} мм) — универсална за разкрой на дъски и по-плитко разбичване.`
  if (mm < 20)
    return `Средно-едра стъпка (${mm} мм) — за дебели дъски и греди, където финият зъб вече се запълва.`
  if (mm < 24)
    return `Едра стъпка (${mm} мм) — стъпката, с която обикновено се работи в дълбок рез: улеят носи стружката през целия срез, без да я трамбова.`
  return `Най-едра стъпка (${mm} мм) — за най-дълбокия рез, за мокър материал и за висока подаваща скорост. Обемната стружка запушва всеки по-фин зъб.`
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
const FOOD_PROFILE_NOTE: Record<string, string> = {
  '3 TPI':
    'Универсален зъб за замразено и охладено свинско, говеждо и агнешко, и за разполовяване на дълбоко замразена риба. По-едрият зъб отнема по-малко материал в реза и издържа на кост при висока подаваща скорост.',
  '4 TPI':
    'По-финият зъб оставя по-гладък срез на прясно и охладено месо, птици и риба — там, където видът на среза е част от продукта. На дълбоко замразен блок се затъпява по-бързо от 3 TPI.',
  'cleaner-tooth':
    'Зъбът чистач е за разполовяване на трупно и замразено трупно месо. Чистачът извежда кокалената каша от улея, вместо тя да се трамбова в него — лентата не се задръства, реже по-чисто и работи по-тихо.',
  'concave-wave':
    'Вдлъбнатата вълна захапва с върховете си кора, ципа и хлъзгава кожа, а полумесецът между тях реже. За риба, колбаси, сирене и зеленчуци, и за хляб с твърда кора.',
  'convex-wave':
    'Изпъкналата вълна е за рязане и филетиране на прясна, незамразена риба и за прерязване на тънки кости. Заобленият ръб влиза през кожата, без да къса влакното под нея.',
  'smooth-ground':
    'Гладко заточеният ръб няма зъб и няма чапраз — срязва, вместо да стърже. Най-чистият възможен срез на обезкостена риба и месо, без трохи и без накъсване; в кост не се използва.',
  wave: 'Вълнообразният ръб реже с плъзгане и не мачка продукта под себе си — перфектни резени с минимум трохи по хляб и хлебни изделия, и надежден избор по риба и рибни продукти.',
}

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
  name: string
  kind: EdgeKind
  /** In the price list, or quoted on enquiry. */
  stocked: boolean
  materials: string
  note: string
}

export const MATERIAL_EDGE_GUIDE: MaterialEdge[] = [
  {
    code: 'smooth-ground',
    name: 'Гладко заточен',
    kind: 'straight',
    stocked: true,
    materials: 'Мека пяна и дунапрен, текстил на пластове, кожа, хартия, картон, корк',
    note:
      'Прав, заточен ръб без зъб. Не отнема материал и не праши — минава през пакета като нож през масло и оставя отвесен срез. Първият избор за всичко меко и нископлътно; в плътен материал се хлъзга и се отклонява.',
  },
  {
    code: 'wave',
    name: 'Вълна',
    kind: 'wave',
    stocked: false,
    materials: 'Гъвкава полиуретанова пяна, филц, влакнести и пружиниращи материали, маркучи',
    note:
      'Плавни гребени без остри върхове. Захапва по-добре от гладкия ръб, но реже влакното, вместо да го дърпа както го прави зъбът — затова е изборът за филц и за пяна, която бяга пред острието. Праши минимално.',
  },
  {
    code: 'concave-wave',
    name: 'Вдлъбната вълна (скалоп)',
    kind: 'scallop',
    stocked: false,
    materials: 'По-плътна пяна, гума и гумени маркучи, картон и по-твърди пластове',
    note:
      'Изрязани полумесеци с ясен връх между тях. По-агресивна от вълната и по-контролирана от зъба — върховете пробиват плътния материал, а полумесецът довършва среза. Средното положение, което върши най-много работа.',
  },
  {
    code: 'v-tooth',
    name: 'Назъбен (V-зъб)',
    kind: 'teeth-fine',
    stocked: false,
    materials: 'Твърда и високоплътна пяна, среднотвърда пластмаса, плътен картон',
    note:
      'Остър насечен зъб, който гризе материала на малки хапки. В твърда пяна и пластмаса дава най-чистия срез от четирите, но отделя прах и в мек материал къса ръба.',
  },
]

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
function millWidthNote(width: number): string {
  if (width <= 35)
    return `На ${width} мм лентата е за по-малките и мобилните гатери — върви и на по-малки маховици, но в дълбок рез по-лесно тръгва по чепа.`
  if (width <= 50)
    return `${width} мм е работната ширина на повечето гатери — достатъчно корава, за да държи линията през цял труп, без да иска голяма машина.`
  if (width < 100)
    return `На ${width} мм лентата се съпротивлява много по-добре на отклонение в дебел материал и дава по-равна дъска. За сметка на това иска голям диаметър на маховиците и по-високо опъване.`
  return `${width} мм е ширина за производствени гатери с големи маховици — максимална коравина при дълбок рез през едър труп.`
}

/** Vertical saws — narrow bands turn, wide bands resaw. */
function verticalWidthNote(width: number): string {
  if (width <= 16)
    return `На ${width} мм лентата е за криволинеен рез: минималният радиус, който държи, е около ${minRadiusMm(width)} мм. По-тясната лента влиза в по-остър завой, но по-трудно пази права линия.`
  if (width <= 25)
    return `${width} мм е универсалната ширина за вертикална машина — реже право и все още завива, но не под радиус от около ${minRadiusMm(width)} мм.`
  if (width <= 50)
    return `На ${width} мм лентата е за прав разкрой и разбичване — достатъчно корава, за да не се извива в реза. За завои е вече прекалено широка.`
  return `На ${width} мм лентата е за разбичване на висок материал: широката лента държи опъването и върви право, но не прави завои.`
}

/** Metal saws — width is set by the machine, and pairs with the back thickness. */
function metalWidthNote(width: number, thickness: number): string {
  if (width <= 13)
    return `${width} × ${thickness} мм е за малки и преносими отрезни машини и за къс контур.`
  if (width <= 20)
    return `${width} × ${thickness} мм е ширината на работилничните банцизи и по-малките полуавтомати.`
  if (width <= 27)
    return `${width} × ${thickness} мм е стандартът за компактни полуавтоматични отрезни машини.`
  if (width <= 34)
    return `${width} × ${thickness} мм е най-разпространената лента за полуавтоматични отрезни машини — балансът между коравина и цена на метър.`
  if (width <= 41)
    return `${width} × ${thickness} мм е за големите полуавтомати и автомати: по-дебелият гръб държи опъването, което е нужно, за да излезе срезът прав в едро сечение.`
  return `${width} × ${thickness} мм е производствена ширина — за автомати и голямо плътно сечение, където всяко отклонение в среза струва материал.`
}

/** Food and slicer blades — narrow follows the contour, wide holds the line. */
function foodWidthNote(width: number, thickness: number, edge: FoodEdge): string {
  if (width <= 12)
    return `На ${width} × ${thickness} мм ножът е тесен и тънък — тънкото острие минава през резена, без да го смачка пред себе си, и отнема по-малко от самия хляб.`
  if (width <= 16)
    return edge === 'toothed' || edge === 'cleaner'
      ? `На ${width} мм лентата следва по-плътно контура — по-подходяща за рязане около кокал и за по-малките настолни машини.`
      : `На ${width} мм ножът е достатъчно тесен, за да заобиколи контура при филетиране, и достатъчно корав за прав срез.`
  return `На ${width} мм ножът е по-корав и държи по-права линия — за разполовяване, за замразен блок и за по-големите машини.`
}

// ===== Assembly =====

function identity(
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
        name: blade.brand === 'BiMetal' ? 'Биметална гатерна лента' : blade.brand,
        type: 'Биметал',
        application: 'Дърво — гатер',
        image: BIMETAL_IMAGE,
        base:
          'Гатерна лента с биметален зъб: бързорезна стомана, заварена върху пружинен гръб. ' +
          'Държи ръба си в пъти по-дълго от въглеродната лента и понася абразивен или замърсен ' +
          'материал — кора с пясък, стар и сух труп, вътрешни чепове. Цената на метър е по-висока, ' +
          'но между две заточвания се реже значително повече.',
      }
    }

    if (isBimetal(table, blade.brand)) {
      // M42 is the workhorse cobalt HSS tooth. The grades above it carry more
      // alloy in the tooth and are bought for the materials that eat M42.
      const premium = !/m42/i.test(blade.brand)
      return {
        series: null,
        name: blade.brand || 'Биметална лента',
        type: 'Биметал',
        application: premium ? 'Легирана и неръждаема' : 'Метал — обща употреба',
        image: BIMETAL_IMAGE,
        base: premium
          ? 'Биметална отрезна лента с по-високолегирана бързорезна стомана в зъба, заварена върху пружинен гръб. Купува се за неръждаема, легирана и трудно обработваема стомана, където стандартният M42 се затъпява бързо.'
          : 'Биметална отрезна лента: закалени бързорезни зъби, заварени върху пружинен гръб. Издържа на по-висока скорост и по-твърд материал от въглеродната лента, но е и по-скъпа — избира се за серийно рязане на метал.',
      }
    }

    // Böhler and the other wide carbon bands on the mill tables.
    return {
      series: null,
      name: blade.brand || 'Банцигова лента',
      type: 'Въглеродна',
      application: 'Дърво — гатер',
      image: SERIES_IMAGE.softcut,
      base:
        'Банцигова лента от закалена въглеродна лентова стомана за гатер. Тялото остава жилаво, а само зъбът е закален, така че лентата понася чапраз и заточване през целия си живот.',
    }
  }

  const s = SERIES[key]
  return {
    series: key,
    name: `Saw-Meister ${s.name}`,
    type: s.type,
    application: s.application,
    image: SERIES_IMAGE[key],
    base: s.description,
  }
}

/**
 * Food blades need their opening line to follow the edge, not the series.
 *
 * FineCut covers everything from a 3 TPI blade that splits frozen carcass to a
 * smooth-ground knife for filleting fish. One paragraph for both told half the
 * customers the wrong thing about their own blade.
 */
function foodBase(table: BladeTableKey, edge: FoodEdge): string {
  const steel =
    'Изпълнението е от неръждаема стомана, годна за контакт с храни и за ежедневно миене и дезинфекция.'

  // The edge itself is described in the profile note below the paragraph, so
  // this says what the product is and what it runs on instead of repeating it.
  if (table === 'textile')
    return 'Лентов нож за меки материали — пяна и дунапрен, текстил на пластове, кожа, хартия, картон и корк. Работи на лентоотрезна машина с вградено заточване: ръбът се подновява в движение, затова последният метър от пакета излиза като първия.'

  if (table === 'bread')
    return `Лентов нож за хлеборезна машина. Вълнообразният ръб срязва кората, вместо да я къса — оттам идват равните резени и малкото трохи. ${steel}`

  switch (edge) {
    case 'toothed':
      return `Лентов трион за месо с кост и за замразен блок. Зъбът е закален и чапразен, за да прореже кост, без улеят да се запуши с кокалена каша. ${steel}`
    case 'cleaner':
      return `Лентов трион с чистач за разполовяване на трупно месо. Чистачът върви след режещите зъби и изчиства улея, което държи лентата в права линия през целия труп. ${steel}`
    case 'wave':
      return `Лентов нож с вълнообразен ръб — срязва вместо да стърже, затова не отделя стърготина и не къса влакното на продукта. За обезкостено месо, риба и рибни продукти. ${steel}`
    case 'plain':
      return `Лентов нож с гладко заточен ръб, без зъб и без чапраз — за обезкостен продукт, където срезът трябва да е чист и без трохи. ${steel}`
  }
}

function widthNote(table: BladeTableKey, blade: BladeSelection): string {
  switch (table) {
    case 'wood-h':
      return millWidthNote(blade.width)
    case 'wood-v':
      return blade.brand === 'Flexback Carbon'
        ? `На ${blade.width} мм лентата е за криволинеен рез в работилницата: минималният радиус, който държи, е около ${minRadiusMm(blade.width)} мм.`
        : verticalWidthNote(blade.width)
    case 'metal-bi':
      return metalWidthNote(blade.width, blade.thickness)
    case 'metal-cs':
      return `На ${blade.width} мм лентата минава завой с радиус от около ${minRadiusMm(blade.width)} мм нагоре; по-широката държи по-права линия, но не завива толкова остро.`
    case 'meat':
    case 'bread':
      return foodWidthNote(blade.width, blade.thickness, foodEdge(table, blade.pitch))
    case 'textile':
      if (blade.width <= 10)
        return `На ${blade.width} мм ножът е за фигурален рез — влиза в най-острите контури, но в дебел блок се извива, ако бързаш с подаването.`
      if (blade.width <= 20)
        return `${blade.width} мм е универсалната ширина — реже контур и права линия еднакво добре и стои на повечето машини.`
      return `На ${blade.width} × ${blade.thickness} мм ножът е за прав рез и разкрой на дебел блок: по-широкото и по-дебело острие не се отклонява надолу през пакета, но не заобикаля контур.`
    default:
      return ''
  }
}

/**
 * The concave wave is stocked for both counters, and the reason it works is
 * the same in each — the points grip, the crescent cuts. Which side of that to
 * lead with depends on which tab the buyer is standing on.
 */
const BREAD_CONCAVE_WAVE =
  'Вдлъбнатата вълна захапва с върховете си твърдата кора, а полумесецът между тях реже средата. За селски и пълнозърнест хляб с корава коричка, където обикновената вълна се хлъзга, вместо да влезе.'

function pitchNoteFor(table: BladeTableKey, blade: BladeSelection): string | null {
  // On the soft-materials tab the same codes mean the same shapes but a wholly
  // different job, so the guide written for those materials answers instead of
  // the food copy.
  if (table === 'textile')
    return MATERIAL_EDGE_GUIDE.find((e) => e.code === blade.pitch)?.note ?? null

  if (table === 'bread' && blade.pitch === 'concave-wave') return BREAD_CONCAVE_WAVE

  if (table === 'meat' || table === 'bread') return FOOD_PROFILE_NOTE[blade.pitch] ?? null

  if (blade.pitch.includes('/')) return variablePitchNote(blade.pitch)

  const tpi = toothsPerInch(table, blade.pitch)
  if (tpi) return constantPitchNote(tpi)

  if (table === 'wood-h' || table === 'wood-v') return woodPitchNote(blade.pitch)
  return null
}

export function bladeGuide(table: BladeTableKey, blade: BladeSelection): BladeGuide {
  const id = identity(table, blade)
  const edge = foodEdge(table, blade.pitch)
  const isFood = table === 'meat' || table === 'bread' || table === 'textile'

  const base = isFood ? foodBase(table, edge) : id.base
  const width = widthNote(table, blade)

  return {
    series: id.series,
    name: id.name,
    // FineCut's "Хранителна" is right for the meat and bread counters but not
    // for a slicer band cutting textile, paper and foam.
    type: table === 'textile' ? 'Лентов нож' : id.type,
    application: isFood ? foodApplication(table, edge) : id.application,
    description: width ? `${base} ${width}` : base,
    image: id.image,
    pitchNote: pitchNoteFor(table, blade),
  }
}

/** The eyebrow above the name, so it names the job rather than the department. */
function foodApplication(table: BladeTableKey, edge: FoodEdge): string {
  if (table === 'textile') return 'Пяна, текстил, гума'
  if (table === 'bread') return 'Хляб и хлебни изделия'
  switch (edge) {
    case 'toothed':
      return 'Месо с кост и замразено'
    case 'cleaner':
      return 'Разполовяване на трупно месо'
    case 'wave':
      return 'Обезкостено месо и риба'
    case 'plain':
      return 'Филетиране'
  }
}
