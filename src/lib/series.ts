/**
 * Saw-Meister — the house product lines.
 *
 * Five series, each defined by what it cuts rather than by its steel, because
 * that is how a buyer arrives: "I saw softwood on a horizontal mill", not
 * "I need C75 spring steel at 1.1 mm".
 *
 * The horizontal pair is split by tooth geometry, not by timber hardness.
 * ProCut at 10/30° is the flagship and the one to sell by default: it holds a
 * line in mixed timber, which is what most yards actually put through a mill.
 * SoftCut at 14° is the specialist — the steeper hook makes the tooth bite
 * hard and clear resinous sawdust, which is a real gain in pine and a liability
 * in oak. A buyer who does not know which they want wants ProCut.
 *
 * This replaces the earlier SoftCut/HardCut pair, which split the range by the
 * timber rather than by the tooth and left no flagship. `hardcut` is gone as a
 * key — see the migration note below.
 *
 * Bimetal (M42/M51) is deliberately absent. It is a different steel with a
 * different price and service life from carbon flexback, and folding it under
 * FlexCut would tell a customer the wrong thing about what they are buying.
 * Those products keep their existing naming until a series is decided.
 *
 * MIGRATION — products already stored in Payload with `series: 'hardcut'` will
 * not match any key here. `isSeriesKey` returns false for them, and the shop
 * treats them as unassigned rather than crashing, but they need re-tagging to
 * 'procut' before the range reads correctly. There is no automatic rewrite: a
 * blade that was sold as the hardwood line is not automatically the flagship,
 * and someone who knows the stock should make that call per product.
 */
export type SeriesKey = 'procut' | 'softcut' | 'vector' | 'flexcut' | 'finecut'

export type Series = {
  key: SeriesKey
  /** Shown as "Saw-Meister ProCut". */
  name: string
  /** Тип, as in the range sheet. */
  type: string
  /** Приложение — the one-line answer to "is this for me?". */
  application: string
  /**
   * Tooth geometry, where the series is defined by it. Named on the card
   * because two horizontal lines that differ only in hook angle are otherwise
   * indistinguishable to a buyer.
   */
  profile?: string
  /** Two or three sentences for the product page and category header. */
  description: string
  /** Catalogue categories whose products belong to this series. */
  categories: string[]
}

export const SAW_MEISTER = 'Saw-Meister'

export const SERIES: Record<SeriesKey, Series> = {
  procut: {
    key: 'procut',
    name: 'ProCut',
    type: 'Хоризонтален',
    application: 'Смесена дървесина',
    profile: '10/30°',
    description:
      'Флагманската лента на Saw-Meister и най-продаваната — универсална професионална лента ' +
      'за стандартни хоризонтални гатери. Профилът 10/30° е направен за смесен материал: ' +
      'работи еднакво уверено в иглолистна и в широколистна дървесина, без да се сменя лентата ' +
      'при смяна на трупа. Дава балансa между скорост на рязане и гладкост на среза — не е ' +
      'най-бързата в бор и не е най-фината в дъб, но е най-добрият избор, когато през гатера ' +
      'минава всичко.',
    categories: ['horizontalni-bantsizi'],
  },
  softcut: {
    key: 'softcut',
    name: 'SoftCut',
    type: 'Хоризонтален',
    application: 'Мека дървесина',
    profile: '14°',
    description:
      'Лента за високоскоростно рязане на мека дървесина — бор, смърч, ела, топола и смолист ' +
      'материал. По-големият челен ъгъл от 14° прави зъба значително по-агресивен: захапва ' +
      'сам и позволява много по-бързо подаване, без улеят да се задръсти с обемната влажна ' +
      'стърготина, която дава мекото дърво. В твърд и сух материал същата агресивност работи ' +
      'срещу вас — там е ProCut.',
    categories: ['horizontalni-bantsizi'],
  },
  vector: {
    key: 'vector',
    name: 'Vector',
    type: 'Вертикален',
    application: 'Работилница и мебелно производство',
    description:
      'Серия за вертикални банцизи от професионалния и средния индустриален клас — над хоби ' +
      'нивото. Ширини от 15 до 60 мм. Изработва се от същата стомана като ProCut, но със ' +
      'стъпки на зъба, предназначени за работилница и мебелно производство, а не за бичене на ' +
      'трупи. Оттам идва и разликата в резултата: стабилност, прецизност и чист срез при ' +
      'обработка на детайли.',
    categories: ['vertikalni-bantsizi'],
  },
  flexcut: {
    key: 'flexcut',
    name: 'FlexCut',
    type: 'Въглеродна Flexback',
    application: 'Дърво, пластмаса, цветни метали',
    description:
      'Гъвкава лента със закален зъб и гъвкав гръб (flexback) — за дърво, пластмаса и цветни ' +
      'метали, включително алуминий. Гъвкавият гръб понася многократно огъване без да се ' +
      'напуква, което я прави устойчива на умора на метала и на скъсване по шева. Това е и ' +
      'лентата за сложни криволинейни срезове и контури, където по-коравата лента би се ' +
      'извила в реза.',
    categories: ['hobi-bantsig'],
  },
  finecut: {
    key: 'finecut',
    name: 'FineCut',
    type: 'Хранителна',
    application: 'Месо, риба и хранителни продукти',
    description:
      'Специализирана серия за хранително-вкусовата промишленост — за рязане на месо със и ' +
      'без кост, риба, кост и замразени блокове. Изпълнението е от неръждаема стомана, годна ' +
      'за контакт с храни и за ежедневно миене и дезинфекция. Фокусът е върху прецизността на ' +
      'среза, чистотата му — без фири и накъсване — и хигиената.',
    categories: ['meso-i-riba', 'hlebni-izdeliya', 'slicers'],
  },
}

export const SERIES_LIST = Object.values(SERIES)

/** "Saw-Meister ProCut" */
export const seriesLabel = (key: SeriesKey) => `${SAW_MEISTER} ${SERIES[key].name}`

export const isSeriesKey = (v: unknown): v is SeriesKey =>
  typeof v === 'string' && v in SERIES

/**
 * The retired key, kept only so the admin can spot stock that still carries it.
 * Nothing maps it to a live series automatically — see the migration note above.
 */
export const RETIRED_SERIES_KEYS = ['hardcut'] as const
