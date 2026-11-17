import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { SectionNumber } from "@/components/ui/primitives";

export type Crumb = { label: string; href?: string };

/**
 * The page masthead, shared so every route opens the same way as the homepage:
 * a blue-cast photograph of the actual work, the № label, and the headline.
 *
 * The blue comes from a `mix-blend-color` layer rather than a flat fill —
 * colour blending replaces hue while leaving the photograph's own luminance
 * alone, so the frame reads as a tinted photograph instead of a coloured panel.
 *
 * Pass no `image` for transactional pages. Cart and checkout deliberately run
 * without one: a large photograph competes with the figures a buyer is there to
 * check, so those pages get the same typography on flat blue.
 */
export function PageHeader({
  eyebrowNumber,
  eyebrowLabel,
  title,
  description,
  image,
  imageAlt = "",
  crumbs,
  children,
}: {
  eyebrowNumber: string;
  eyebrowLabel: string;
  title: ReactNode;
  description?: ReactNode;
  image?: string;
  imageAlt?: string;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  const t = useTranslations("pageHeader");
  return (
    <section className="relative isolate bg-blue-deep text-white overflow-hidden">
      {image && (
        <div className="absolute inset-0 -z-10">
          <Image src={image} alt={imageAlt} fill preload sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-blue mix-blend-color opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-deep/88 via-blue-ink/50 to-blue/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-deep/65 via-transparent to-blue-deep/20" />
        </div>
      )}

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-6 pb-7 md:pt-14 md:pb-16">
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label={t("breadcrumb")}
            className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/55 flex gap-2 mb-4 md:mb-8 flex-wrap"
          >
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex gap-2">
                {c.href ? (
                  <Link href={c.href} className="text-white/55 no-underline hover:text-white transition-colors py-2 -my-2">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white">{c.label}</span>
                )}
                {i < crumbs.length - 1 && <span aria-hidden>/</span>}
              </span>
            ))}
          </nav>
        )}

        <SectionNumber n={eyebrowNumber} label={eyebrowLabel} tone="light" />

        <h1 className="font-display text-[32px] md:text-5xl lg:text-[68px] leading-[1] tracking-[-0.04em] font-extrabold mt-4 md:mt-7 mb-0">
          {title}
        </h1>

        {description && (
          <p className="font-sans text-[15px] md:text-[17px] leading-snug md:leading-relaxed text-white/70 max-w-[620px] mt-3 md:mt-6 line-clamp-3 md:line-clamp-none">{description}</p>
        )}

        {children && <div className="mt-5 md:mt-9">{children}</div>}
      </div>
    </section>
  );
}
