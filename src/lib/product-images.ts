/**
 * Stand-in photographs for two kinds of blade, until real per-product photos
 * are uploaded in /admin (an uploaded photo always wins).
 *
 * Both are white-background studio shots with a free corner at the top left,
 * where the product's width × thickness is written in orange so a buyer sees the
 * size without reading the name — see PhotoDimensions. A product shown with any
 * other photo gets no such label.
 */
export const FLEXBACK_PHOTO = '/images/products/flexback-band.webp'
export const MEAT_PHOTO = '/images/products/meat-band.webp'

/** True when the product is shown with one of the photos that carries the size label. */
export const hasDimensionLabel = (image: string | null | undefined): boolean =>
  image === FLEXBACK_PHOTO || image === MEAT_PHOTO
