import { headers } from 'next/headers'

import { MARKETS, DEFAULT_MARKET, type Market, type MarketCode } from '@/lib/market'
import { DOMAIN_MARKET } from '@/lib/domains'

/**
 * Which market a request belongs to, resolved from the domain it arrived on.
 *
 * Domain routing rather than a path prefix (`/ro/shop`), for three reasons:
 *
 *  - `next.config.ts` already owns 16 permanent redirects sourced from
 *    `/bg/...`, carried over from the old PHP site. A `/bg` locale prefix would
 *    collide with every one of them.
 *  - It needs no `app/[lang]/` restructure, so every existing route keeps its
 *    path and its accumulated SEO.
 *  - It needs no proxy. In Next 16 the `middleware` convention is deprecated in
 *    favour of `proxy`, which the docs describe as a last resort — reading the
 *    Host header inside a Server Component avoids that layer entirely.
 *
 * The tradeoff is that a market cannot be switched by a link; it is the domain
 * or nothing. For a business selling into three countries under three brands,
 * that is the correct behaviour anyway.
 */

function isMarketCode(v: string | undefined | null): v is MarketCode {
  return typeof v === 'string' && v in MARKETS
}

export async function getMarket(): Promise<Market> {
  const list = await headers()
  const host = (list.get('x-forwarded-host') ?? list.get('host') ?? '')
    .split(':')[0]
    .toLowerCase()

  const byDomain = DOMAIN_MARKET[host]
  if (byDomain) return MARKETS[byDomain]

  // Unknown host — a bare `localhost` or a preview URL. The header override is
  // for curl and automated checks; it is read only when the hostname did not
  // already identify a market, so it can never change what a customer sees.
  const override = list.get('x-market-override')
  if (isMarketCode(override)) return MARKETS[override]

  return DEFAULT_MARKET
}

export async function getLocale(): Promise<string> {
  return (await getMarket()).locale
}
