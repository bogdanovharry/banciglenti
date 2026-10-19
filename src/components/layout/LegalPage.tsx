import type { ReactNode } from 'react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

import { PageHeader } from '@/components/layout/PageHeader'

/**
 * Shared shell for the legal and informational pages. They carry the same
 * masthead as the rest of the site but no photograph — these are documents, and
 * a hero image over terms of sale reads as marketing.
 *
 * Measure is capped near 68 characters, which is the readable range for
 * continuous prose. The rest of the site runs much wider because it is mostly
 * cards and figures.
 */
export async function LegalPage({
  eyebrowNumber,
  eyebrowLabel,
  title,
  description,
  updated,
  children,
}: {
  eyebrowNumber: string
  eyebrowLabel: string
  title: string
  description?: string
  /** ISO date of the last substantive revision. */
  updated: string
  children: ReactNode
}) {
  const t = await getTranslations('legal.common')
  const locale = await getLocale()

  return (
    <div className="bg-paper">
      <PageHeader
        eyebrowNumber={eyebrowNumber}
        eyebrowLabel={eyebrowLabel}
        crumbs={[{ label: t('home'), href: '/' }, { label: title }]}
        title={title}
        description={description}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 pb-[120px]">
        <article className="tl-prose max-w-[68ch]">{children}</article>

        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 mt-14 pt-6 border-t border-ink-15 max-w-[68ch]">
          {t('updated')}{' '}
          <time dateTime={updated} className="tabular-nums">
            {new Date(updated).toLocaleDateString(locale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </p>
      </div>
    </div>
  )
}

/** Numbered section, matching the № convention used across the site. */
export function LegalSection({
  n,
  title,
  children,
}: {
  n: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-11">
      <h2 className="font-display text-[22px] md:text-2xl font-bold tracking-tight text-ink m-0 mb-4 flex gap-3 items-baseline">
        <span className="font-mono text-[12px] text-orange tracking-[0.1em] shrink-0">{n}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  )
}

/** One external link, opened in a new tab. */
const ext = (href: string) =>
  function ExternalLink(chunks: ReactNode) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {chunks}
      </a>
    )
  }

/**
 * The inline tags the legal messages use with `t.rich()`:
 * <b>, <terms>, <delivery>, <privacy> (internal links), <mail> and <tel>
 * (company contact), plus any per-page `extra` tags such as <kzp>.
 */
export function legalTags(
  contact: { email: string; telHref: string },
  extra: Record<string, string> = {},
) {
  const external = Object.fromEntries(Object.entries(extra).map(([k, href]) => [k, ext(href)]))
  return {
    b: (chunks: ReactNode) => <strong>{chunks}</strong>,
    terms: (chunks: ReactNode) => <Link href="/terms">{chunks}</Link>,
    delivery: (chunks: ReactNode) => <Link href="/delivery">{chunks}</Link>,
    privacy: (chunks: ReactNode) => <Link href="/privacy">{chunks}</Link>,
    mail: (chunks: ReactNode) => <a href={`mailto:${contact.email}`}>{chunks}</a>,
    tel: (chunks: ReactNode) => <a href={contact.telHref}>{chunks}</a>,
    ...external,
  }
}
