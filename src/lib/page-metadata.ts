import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { absoluteUrl } from './site-url'

/**
 * Title, canonical link and indexing for a page that cannot export `metadata`
 * itself.
 *
 * The cart, checkout, contact and configurator pages are Client Components, and
 * a Client Component cannot export metadata — so all four inherited the home
 * page's title in every tab and every search result. A `layout.tsx` beside the
 * page can, and each one calls this. `index: false` is for pages with nothing
 * to find: the cart and checkout.
 */
export async function pageMetadata(
  key: 'cart' | 'checkout' | 'contact' | 'configurator',
  path: string,
  { index = true }: { index?: boolean } = {},
): Promise<Metadata> {
  const t = await getTranslations('seo.pages')
  return {
    title: t(key),
    ...(index
      ? { alternates: { canonical: await absoluteUrl(path) } }
      : { robots: { index: false, follow: false } }),
  }
}
