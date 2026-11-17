import { getPayload, type Where } from 'payload'
import config from '@payload-config'

import type { MarketCode } from './market'

/** The slice of an article the pages read. */
export type ArticleCard = {
  id: number
  title: string
  slug: string
  category: 'blog' | 'technical' | null
  excerpt: string | null
  publishedAt: string | null
  image: { url: string; alt: string } | null
}

export type Article = ArticleCard & { body: unknown; updatedAt: string }

type Raw = {
  id: number
  title: string
  slug: string
  category?: 'blog' | 'technical' | null
  excerpt?: string | null
  body?: unknown
  publishedAt?: string | null
  updatedAt: string
  featuredImage?: { url?: string | null; alt?: string | null } | number | null
}

/**
 * What a visitor may see: published, dated no later than now, and written for this
 * shop (or for all of them). A draft, or an article for another market, is simply
 * not there — the same as one that does not exist.
 */
export function visibleWhere(market: MarketCode, category?: 'blog' | 'technical'): Where {
  const now = new Date().toISOString()
  return {
    and: [
      { status: { equals: 'published' } },
      { or: [{ market: { equals: market } }, { market: { equals: 'all' } }] },
      { or: [{ publishedAt: { less_than_equal: now } }, { publishedAt: { exists: false } }] },
      ...(category ? [{ category: { equals: category } }] : []),
    ],
  }
}

const card = (a: Raw): ArticleCard => ({
  id: a.id,
  title: a.title,
  slug: a.slug,
  category: a.category ?? null,
  excerpt: a.excerpt ?? null,
  publishedAt: a.publishedAt ?? null,
  image:
    a.featuredImage && typeof a.featuredImage === 'object' && a.featuredImage.url
      ? { url: a.featuredImage.url, alt: a.featuredImage.alt ?? '' }
      : null,
})

export async function listArticles(market: MarketCode, opts: { category?: 'blog' | 'technical'; page?: number; limit?: number } = {}) {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'articles',
    where: visibleWhere(market, opts.category),
    sort: '-publishedAt',
    limit: opts.limit ?? 12,
    page: opts.page ?? 1,
    depth: 1,
    overrideAccess: true,
  })
  return { articles: (res.docs as unknown as Raw[]).map(card), pages: res.totalPages, total: res.totalDocs }
}

export async function getArticle(market: MarketCode, slug: string): Promise<Article | null> {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'articles',
    where: { and: [{ slug: { equals: slug } }, visibleWhere(market)] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })
  const raw = res.docs[0] as unknown as Raw | undefined
  return raw ? { ...card(raw), body: raw.body ?? null, updatedAt: raw.updatedAt } : null
}

/** How many articles this shop has published — decides whether the blog is linked at all. */
export async function countArticles(market: MarketCode): Promise<number> {
  try {
    const payload = await getPayload({ config })
    const res = await payload.count({ collection: 'articles', where: visibleWhere(market), overrideAccess: true })
    return res.totalDocs
  } catch {
    return 0
  }
}
