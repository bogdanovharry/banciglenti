import { DOMAIN_MARKET } from '../domains'
import type { MarketCode } from '../market'

/**
 * The shops /manage can send you to.
 *
 * Each shop is its own deployment with its own database and its own staff
 * accounts, so there is one /manage per shop and nothing here merges them. This
 * only builds the links of the switcher in the menu: the other shop's /manage, on
 * that shop's own address. Logging in there is a separate login — the session
 * cookie belongs to one address.
 *
 * The addresses come from src/lib/domains.ts, so buying the Romanian domain
 * changes the link by itself. In development the `*.localhost` names are used,
 * on the same port as the page you are looking at.
 */

export type ShopLink = { code: MarketCode; name: string; href: string; current: boolean }

const SHOPS: { code: MarketCode; name: string }[] = [
  { code: 'bg', name: 'България' },
  { code: 'ro', name: 'Румъния' },
]

/** The public host of a market: the first listed address that is not local and not a www. alias. */
function publicHost(code: MarketCode): string | null {
  const entry = Object.entries(DOMAIN_MARKET).find(
    ([host, market]) => market === code && !host.endsWith('.localhost') && !host.startsWith('www.'),
  )
  return entry ? entry[0] : null
}

export function shopLinks(currentCode: MarketCode, currentHost: string): ShopLink[] {
  const local = /(^|\.)localhost(:\d+)?$/.test(currentHost)
  const port = /:(\d+)$/.exec(currentHost)?.[1]

  const links: ShopLink[] = []
  for (const shop of SHOPS) {
    const current = shop.code === currentCode
    if (current) {
      links.push({ ...shop, href: '/manage', current })
      continue
    }
    const origin = local
      ? `http://${shop.code}.localhost${port ? `:${port}` : ''}`
      : publicHost(shop.code)
        ? `https://${publicHost(shop.code)}`
        : null
    // A shop with no address yet cannot be linked to.
    if (origin) links.push({ ...shop, href: `${origin}/manage`, current })
  }
  return links
}
