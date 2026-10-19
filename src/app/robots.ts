import type { MetadataRoute } from 'next'

import { siteOrigin } from '@/lib/site-url'

/**
 * What crawlers may fetch, and where the sitemap is — for the domain asked.
 *
 * The cart and checkout hold nothing to index and would only dilute the site;
 * /manage and /admin are the order book and the content editor; /api is not a
 * page. Everything else is open.
 */
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin()

  // A preview or local deployment should not be indexed under its own name and
  // compete with the real domain. The platform's preview hosts end in .vercel.app.
  const preview = /\.vercel\.app$|localhost/.test(new URL(origin).hostname)

  return {
    rules: preview
      ? { userAgent: '*', disallow: '/' }
      : { userAgent: '*', allow: '/', disallow: ['/cart', '/checkout', '/manage', '/admin', '/api'] },
    sitemap: preview ? undefined : `${origin}/sitemap.xml`,
  }
}
