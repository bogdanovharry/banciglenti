import type { ReactNode } from 'react'

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
export function LegalPage({
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
  return (
    <div className="bg-paper">
      <PageHeader
        eyebrowNumber={eyebrowNumber}
        eyebrowLabel={eyebrowLabel}
        crumbs={[{ label: 'Начало', href: '/' }, { label: title }]}
        title={title}
        description={description}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 pb-[120px]">
        <article className="tl-prose max-w-[68ch]">{children}</article>

        <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 mt-14 pt-6 border-t border-ink-15 max-w-[68ch]">
          Последна редакция:{' '}
          <time dateTime={updated} className="tabular-nums">
            {new Date(updated).toLocaleDateString('bg-BG', {
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
