/**
 * Box quantities and what they take off.
 *
 * A mill runs through blades; nobody buying for a working yard wants one. The
 * five-pack exists for convenience rather than for a discount — the saving
 * starts at ten.
 *
 * Kept in its own module, away from the catalogue data, so a client component
 * can ask "is this a box, and how much does it save?" without pulling two
 * hundred product rows into the browser bundle to find out.
 */
export const PACK_TIERS = [
  { qty: 1, discount: 0 },
  { qty: 5, discount: 0 },
  { qty: 10, discount: 0.05 },
  { qty: 20, discount: 0.1 },
] as const

export type Pack = {
  /**
   * "box" is N of one blade — the mill packs, where a per-blade price is the
   * number a buyer compares. "set" is N different blades, where a per-blade
   * price is meaningless and the contents are the whole selling point.
   */
  kind: 'box' | 'set'
  /** Blades in the package. */
  qty: number
  /** Whole percent off, ready to render. */
  percent: number
  /** Only on sets: which set it is, so the contents can be looked up. */
  setKey?: string
}

/** Box slugs end in the quantity: …-l4013-x20. Sets end in …-set-{key}. */
const BOX_SUFFIX = /-x(\d+)$/
const SET_SUFFIX = /-set-([a-z0-9-]+)$/

/**
 * What a slug says about its package, or null for a single blade.
 *
 * Reads the machine-generated suffix rather than the display name. The name is
 * copy — it gets rewritten, translated, and typo'd — while the slug is the
 * identifier the product was created under and cannot change without becoming
 * a different product. Quantities and percentages still come from PACK_TIERS
 * and BLADE_SETS, so the badge and the price are computed from one source.
 */
export function packFromSlug(slug: string): Pack | null {
  const s = SET_SUFFIX.exec(slug)
  if (s) {
    const set = BLADE_SETS.find((b) => b.key === s[1])
    if (!set) return null
    return {
      kind: 'set',
      qty: set.members.length,
      percent: Math.round(set.discount * 100),
      setKey: set.key,
    }
  }

  const m = BOX_SUFFIX.exec(slug)
  if (!m) return null

  const qty = Number(m[1])
  const tier = PACK_TIERS.find((t) => t.qty === qty)
  if (!tier || tier.qty === 1) return null

  return { kind: 'box', qty, percent: Math.round(tier.discount * 100) }
}

/**
 * Price of one blade inside a box, for the "per blade" line under the total.
 * Only meaningful for kind: 'box' — averaging three different blades produces
 * a number that describes none of them.
 */
export const unitPriceInPack = (total: number, qty: number) =>
  Math.round((total / qty) * 100) / 100

// ===== Mixed sets =====

export type SetMember = {
  width: number
  /** Bare TPI, matching METAL_CARBON_BLADES' pitch key. */
  pitch: string
  /** What this blade in the set is for — the reason it is in the box. */
  job: string
}

export type BladeSet = {
  key: string
  name: string
  /** One line on who the set is for. */
  intent: string
  /** Fraction off the sum of the singles. Zero until the promotion is decided. */
  discount: number
  members: SetMember[]
}

/**
 * Sets of different blades, named by the job rather than by the specification.
 *
 * A hobby saw takes one blade at a time and the owner changes it for the work:
 * narrow and fine to follow a curve, wide and coarse to rip. Selling only
 * singles makes them discover that one disappointing cut at a time.
 *
 * Named "Старт" and "Завои" rather than "6+10+13 mm 14/8/4 TPI" because the
 * buyer knows what they want to cut, not which pitch does it — which is the
 * same reason the range itself is organised by application.
 *
 * `discount` is 0 deliberately: the packaging is being built now and the
 * promotion decided later. The field exists so switching it on is a number
 * change, not a code change.
 */
export const BLADE_SETS: BladeSet[] = [
  {
    key: 'start',
    name: 'Старт',
    intent: 'Трите ленти, с които се покрива почти всичко на хоби банциг.',
    discount: 0,
    // 6 mm is stocked at 4 and 6 TPI only — there is no 6 mm at 14, so the
    // curve blade in these sets is 6/6. Composing a set out of a pitch the
    // price list does not carry silently drops the whole set.
    members: [
      { width: 6, pitch: '6', job: 'Завои и фигурален рез' },
      { width: 10, pitch: '8', job: 'Универсална — всекидневната лента' },
      { width: 13, pitch: '4', job: 'Разбичване и дебел материал' },
    ],
  },
  {
    key: 'curves',
    name: 'Завои',
    intent: 'За фигурален рез и шаблони, където радиусът е малък.',
    discount: 0,
    members: [
      { width: 6, pitch: '6', job: 'Най-малък радиус — около 19 мм' },
      { width: 8, pitch: '14', job: 'По-чист срез при радиус от ~25 мм' },
      { width: 10, pitch: '14', job: 'По-права линия на дълъг завой' },
    ],
  },
  {
    key: 'resaw',
    name: 'Разбичване',
    intent: 'За разрязване на дебел материал по дължина. Иска машина, която поема 20 мм.',
    discount: 0,
    members: [
      { width: 13, pitch: '4', job: 'Разбичване на средна височина' },
      { width: 20, pitch: '4', job: 'Максимална коравина — най-права дъска' },
      { width: 10, pitch: '8', job: 'Универсална, за останалата работа' },
    ],
  },
]
