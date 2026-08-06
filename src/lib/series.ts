/**
 * Saw-Meister — the house product lines.
 *
 * Five series, each defined by what it cuts rather than by its steel, because
 * that is how a buyer arrives: "I saw softwood on a horizontal mill", not
 * "I need C75 spring steel at 1.1 mm".
 *
 * Bimetal (M42/M51) is deliberately absent. It is a different steel with a
 * different price and service life from carbon flexback, and folding it under
 * FlexCut would tell a customer the wrong thing about what they are buying.
 * Those products keep their existing naming until a series is decided.
 */
export type SeriesKey = 'softcut' | 'hardcut' | 'vector' | 'flexcut' | 'finecut'

export type Series = {
  key: SeriesKey
  /** Shown as "Saw-Meister SoftCut". */
  name: string
  /** Тип, as in the range sheet. */
  type: string
  /** Приложение — the one-line answer to "is this for me?". */
  application: string
  /** Two or three sentences for the product page and category header. */
  description: string
  /** Catalogue categories whose products belong to this series. */
  categories: string[]
}

export const SAW_MEISTER = 'Saw-Meister'

export const SERIES: Record<SeriesKey, Series> = {
  softcut: {
    key: 'softcut',
    name: 'SoftCut',
    type: 'Хоризонтален',
    application: 'Меко дърво',
    description:
      'За иглолистна дървесина — бор, ела, смърч, топола — и за свеж, влажен материал. ' +
      'Мекото дърво дава обемна и влажна стърготина, затова зъбът е с по-едра стъпка и ' +
      'по-дълбока междузъбна вдлъбнатина, която я извежда от реза, вместо да я трамбова. ' +
      'Това пази лентата от прегряване и от отклонение в дебелия материал.',
    categories: ['horizontalni-bantsizi'],
  },
  hardcut: {
    key: 'hardcut',
    name: 'HardCut',
    type: 'Хоризонтален',
    application: 'Твърдо дърво',
    description:
      'За бук, дъб, ясен, акация, орех и сух плътен материал. Твърдото дърво дава ситна ' +
      'стърготина и натоварва режещия ръб много повече, затова стъпката е по-фина, а ' +
      'ръбът — по-устойчив на затъпяване. Дава по-чиста повърхност на дъската и по-малко ' +
      'вълна при широк срез.',
    categories: ['horizontalni-bantsizi'],
  },
  vector: {
    key: 'vector',
    name: 'Vector',
    type: 'Вертикален',
    application: 'Wood-Mizer тип',
    description:
      'За вертикални банцизи и мобилни гатери от типа Wood-Mizer. Профилът е съобразен с ' +
      'по-малкия диаметър на маховиците при тези машини — лентата се огъва по-често на ' +
      'оборот, затова гърбът е с по-висока умора на огъване. Изработва се на дължината на ' +
      'вашата машина.',
    categories: ['vertikalni-bantsizi'],
  },
  flexcut: {
    key: 'flexcut',
    name: 'FlexCut',
    type: 'Въглеродна Flexback',
    application: 'Метал / общо',
    description:
      'Въглеродна лента с гъвкав гръб (flexback) за обща употреба — хоби и стационарни ' +
      'банцизи, цветни метали, пластмаса, тънък профил. Гъвкавият гръб понася малки ' +
      'радиуси на маховиците без да се напуква, което я прави подходяща за машините с ' +
      'малък диаметър в работилницата.',
    categories: ['hobi-bantsig'],
  },
  finecut: {
    key: 'finecut',
    name: 'FineCut',
    type: 'Хранителна',
    application: 'Месо и храни',
    description:
      'Лентови ножове за месо, риба, кост и замразени продукти. Изпълнението е от ' +
      'неръждаема стомана, подходяща за контакт с храни и за ежедневно миене и ' +
      'дезинфекция. Профилът на зъба се подбира според това дали се реже прясно месо, ' +
      'кост или замразен блок.',
    categories: ['meso-i-riba', 'hlebni-izdeliya', 'slicers'],
  },
}

export const SERIES_LIST = Object.values(SERIES)

/** "Saw-Meister SoftCut" */
export const seriesLabel = (key: SeriesKey) => `${SAW_MEISTER} ${SERIES[key].name}`

export const isSeriesKey = (v: unknown): v is SeriesKey =>
  typeof v === 'string' && v in SERIES
