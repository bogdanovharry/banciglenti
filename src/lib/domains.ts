import type { MarketCode } from './market'

/**
 * Which domain serves which market. Set a domain here as each market goes live.
 *
 * A plain module — nothing in it touches a request — because two readers need
 * it that cannot import `next/headers`: the Payload config (loaded by Payload's
 * own tooling as well as by Next) lists these hosts as the origins allowed to
 * use the admin, and the request-time lookup in src/i18n/locale.ts maps a
 * visitor's host to a market with it.
 *
 * The `*.localhost` entries make every market openable in a browser without
 * touching hosts files or DNS: browsers resolve any `*.localhost` name to the
 * loopback address on their own. Testing on http://ro.localhost:3000 therefore
 * exercises the *same* hostname lookup that production will, rather than a
 * development-only branch that could hide a bug until launch day.
 *
 * A host that is not listed is served as Bulgaria, the default market.
 */
export const DOMAIN_MARKET: Record<string, MarketCode> = {
  // Bulgaria — live
  'banciglenti.com': 'bg',
  'www.banciglenti.com': 'bg',
  'tehnoles.com': 'bg',
  'www.tehnoles.com': 'bg',

  // Romania — launches first. Add the domain and its www. form once bought,
  // e.g.  'example.ro': 'ro',  'www.example.ro': 'ro',

  // Local development
  'bg.localhost': 'bg',
  'ro.localhost': 'ro',
  'gr.localhost': 'gr',
}

/** Every real (non-local) host, as an https origin — what the admin may be used from. */
export const PRODUCTION_ORIGINS: string[] = Object.keys(DOMAIN_MARKET)
  .filter((host) => !host.endsWith('.localhost'))
  .map((host) => `https://${host}`)
