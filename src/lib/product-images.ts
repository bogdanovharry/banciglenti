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
export const BIMETAL_PHOTO = '/images/products/band-bimetal.webp'
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
  image === BIMETAL_PHOTO ||
  image === CIRCULAR_OZ_PHOTO ||
  image === CIRCULAR_VZ_PHOTO ||
  isProfilePhoto(image)

/** A plain circular saw is a product of its own per tooth type: …-oz (sharp tooth) or …-vz (wolf tooth). */
export const sawPhotoFor = (slug: string): string => (/-vz$/.test(slug) ? CIRCULAR_VZ_PHOTO : CIRCULAR_OZ_PHOTO)

/** A ready-cut horizontal blade has no series in the database, only the line in its name. */
export const horizontalPhotoFromName = (name: string): string | undefined =>
  /ProCut/i.test(name) ? PROCUT_PHOTO : /SoftCut/i.test(name) ? SOFTCUT_PHOTO : undefined

/**
 * Which Saw-Meister line a horizontal blade belongs to: ProCut (the universal 10/30° tooth) or
 * SoftCut (the 14° tooth for soft wood). The series when the product has one, otherwise the line
 * written in its name, as on the ready-cut blades.
 */
export type BladeLine = 'procut' | 'softcut'
export const bladeLineOf = (p: { name?: string; series?: string | null }): BladeLine | null =>
  p.series === 'procut' || p.series === 'softcut'
    ? p.series
    : /ProCut/i.test(p.name ?? '')
      ? 'procut'
      : /SoftCut/i.test(p.name ?? '')
        ? 'softcut'
        : null

/** The steel of a bimetal band, read from its name: "M42" or "M51" (a Cyrillic М is read as the Latin one). */
export const bimetalGrade = (name: string): string | null => {
  const m = /[MМ]\s?(42|51|90)\b/.exec(name)
  return m ? `M${m[1]}` : null
}

/**
 * Studio shots of the edge profiles of food blades. Chosen profile → its photograph, replacing the
 * product's own photo on the product page (they are shot on white, with the tooth enlarged).
 */
export const PROFILE_WAVE_PHOTO = '/images/products/profile-wave.webp'
export const PROFILE_SLICER_PHOTO = '/images/products/profile-slicer-teeth.webp'
export const PROFILE_SMOOTH_PHOTO = '/images/products/profile-smooth.webp'
export const PROFILE_CONVEX_PHOTO = '/images/products/profile-convex.webp'

const PROFILE_PHOTOS: Record<string, string> = {
  wave: PROFILE_WAVE_PHOTO,
  'concave-wave': PROFILE_WAVE_PHOTO,
  'convex-wave': PROFILE_CONVEX_PHOTO,
  'smooth-ground': PROFILE_SMOOTH_PHOTO,
}

/** The photograph of an edge profile, or undefined when there is none (a TPI step, the cleaner tooth). */
export const profilePhoto = (pitch: string | null | undefined): string | undefined =>
  pitch ? PROFILE_PHOTOS[pitch] : undefined

function isProfilePhoto(image: string | null | undefined): boolean {
  return (
    image === PROFILE_WAVE_PHOTO ||
    image === PROFILE_SLICER_PHOTO ||
    image === PROFILE_SMOOTH_PHOTO ||
    image === PROFILE_CONVEX_PHOTO
  )
}
