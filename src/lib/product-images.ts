/**
 * Stand-in photographs for two kinds of blade, until real per-product photos
 * are uploaded in /admin (an uploaded photo always wins).
 *
 * Both are white-background studio shots with a free corner at the top left,
 * where the product's width in millimetres is written in orange so a buyer sees the
 * size without reading the name — see PhotoDimensions. A product shown with any
 * other photo gets no such label.
 */
export const FLEXBACK_PHOTO = '/images/products/flexback-band.webp'
export const MEAT_PHOTO = '/images/products/meat-band.webp'

/**
 * How large the label is, as a percentage of the photo's width. One line must fit
 * in the free corner: the meat photo's animal icons start a third of the way
 * across, the flexback photo is empty up there.
 */
export const dimensionLabelSize = (image: string | null | undefined): number => (image === MEAT_PHOTO ? 8 : 10)

/** True when the product is shown with one of the photos that carries the size label. */
export const hasDimensionLabel = (image: string | null | undefined): boolean =>
  image === FLEXBACK_PHOTO || image === MEAT_PHOTO

/** Studio shots of our own blades, one per kind. The saw photos are kept for when the tooth type is told apart. */
export const PLANER_PHOTO = '/images/products/planer-knife.webp'
export const PROCUT_PHOTO = '/images/products/band-procut.webp'
export const SOFTCUT_PHOTO = '/images/products/band-softcut.webp'
export const CIRCULAR_OZ_PHOTO = '/images/products/circular-oz.webp'
export const CIRCULAR_VZ_PHOTO = '/images/products/circular-vz.webp'

/** What a planer knife is made of decides what it is for: HSS for hard wood, 100Cr6 for soft. */
export type KnifeKind = { steel: 'HSS' | '100Cr6'; wood: 'hard' | 'soft' }
export const knifeKind = (name: string): KnifeKind =>
  /HSS/i.test(name) ? { steel: 'HSS', wood: 'hard' } : { steel: '100Cr6', wood: 'soft' }

/** The photos that sit on a white frame (they are shot on white). */
export const hasWhiteFrame = (image: string | null | undefined): boolean =>
  hasDimensionLabel(image) ||
  image === PLANER_PHOTO ||
  image === PROCUT_PHOTO ||
  image === SOFTCUT_PHOTO ||
  image === CIRCULAR_OZ_PHOTO ||
  image === CIRCULAR_VZ_PHOTO

/** A plain circular saw is a product of its own per tooth type: …-oz (sharp tooth) or …-vz (wolf tooth). */
export const sawPhotoFor = (slug: string): string => (/-vz$/.test(slug) ? CIRCULAR_VZ_PHOTO : CIRCULAR_OZ_PHOTO)
