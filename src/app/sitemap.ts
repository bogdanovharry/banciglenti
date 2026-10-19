import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

import { siteOrigin } from '@/lib/site-url'

/**
 * Every page worth finding, on the domain being asked.
 *
 * Built per request from the host, because one deployment answers for several
 * markets and a sitemap that listed another domain's URLs would be ignored — or
 * worse, trusted. Products and categories are read as slugs and dates only, so
 * the file stays cheap at a few hundred products; a retired product is left out,
 * matching the shop, which stops listing it.
 *
 * Not listed on purpose: the cart and checkout (nothing to index), /blog (it
 * returns 404 until it is backed by real articles) and the admin screens.
 *
 * hreflang alternates between the markets' domains are the one thing missing —
 * they need to know every domain, and the Romanian one is not bought yet. Add
 * `alternates.languages` here once the list of domains is complete.
 */
export const dynamic = 'force-dynamic'

const STATIC_PAGES = ['/', '/shop', '/configurator', '/contact', '/about', '/delivery', '/terms', '/privacy']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin()
  const payload = await getPayload({ config })

  const [products, categories] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { not_equals: 'inactive' } },
      select: { slug: true, updatedAt: true },
      limit: 2000,
      pagination: false,
      depth: 0,
    }),
    payload.find({
      collection: 'categories',
      select: { slug: true },
      limit: 500,
      pagination: false,
      depth: 0,
    }),
  ])

  const entry = (path: string, priority: number, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${origin}${path}`,
    priority,
    ...(lastModified ? { lastModified } : {}),
  })

  return [
    ...STATIC_PAGES.map((path) => entry(path, path === '/' ? 1 : 0.6)),
    ...(categories.docs as unknown as { slug?: string }[])
      .filter((c): c is { slug: string } => Boolean(c.slug))
      .map((c) => entry(`/category/${c.slug}`, 0.8)),
    ...(products.docs as unknown as { slug?: string; updatedAt?: string }[])
      .filter((p): p is { slug: string; updatedAt?: string } => Boolean(p.slug))
      .map((p) => entry(`/product/${p.slug}`, 0.7, p.updatedAt)),
  ]
}
