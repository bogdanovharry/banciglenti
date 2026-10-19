import { headers } from 'next/headers'

/**
 * The origin the visitor is on — "https://shop.example.ro" — for canonical
 * links, the sitemap and structured data.
 *
 * Deliberately taken from the request rather than from NEXT_PUBLIC_SITE_URL.
 * One deployment serves every market on its own domain, so a single configured
 * URL would make the Romanian pages declare the Bulgarian host canonical and
 * ask search engines to index the wrong one. Each domain is its own canonical.
 *
 * Plain http only for local development hosts; everything else is https, which
 * is what the platform terminates in front of the app.
 */
export async function siteOrigin(): Promise<string> {
  const list = await headers()
  const host = (list.get('x-forwarded-host') ?? list.get('host') ?? 'localhost:3000').split(',')[0].trim()
  const local = /^(localhost|127\.0\.0\.1|[^.]+\.localhost)(:\d+)?$/.test(host)
  return `${local ? 'http' : 'https'}://${host}`
}

/** An absolute URL on this domain for a path like "/product/abc". */
export async function absoluteUrl(path: string): Promise<string> {
  return `${await siteOrigin()}${path.startsWith('/') ? path : `/${path}`}`
}
