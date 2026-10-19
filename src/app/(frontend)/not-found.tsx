import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/PageHeader";
import { Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconRuler, IconPhone } from "@/components/ui/icons";
import { companyFor } from "@/lib/company";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata() {
  const t = await getTranslations("notFound");
  return { title: t("metaTitle") };
}

/**
 * Reachable in normal use: /product/[slug] calls notFound() for any unknown
 * slug, and next.config.ts redirects sixteen legacy banciglenti.com URLs into
 * this app. Someone arriving from an old link or a stale search result lands
 * here, so it offers the three ways out rather than apologising.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tc = await getTranslations("common");
  const company = companyFor(await getLocale());

  return (
    <div className="bg-paper">
      <PageHeader
        eyebrowNumber="404"
        eyebrowLabel={t("eyebrow")}
        crumbs={[{ label: tc("home"), href: "/" }]}
        title={t("title")}
        description={t("description")}
      />

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-14 pb-[120px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-15 border border-ink-15">
          <Link href="/shop" className="group bg-white p-7 no-underline text-ink hover:bg-paper transition-colors">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">01</div>
            <div className="font-display text-xl font-bold tracking-tight mt-3">{t("catalogueTitle")}</div>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-4">
              {t("catalogueText")}
            </p>
            <span className="font-mono text-[11px] text-orange flex items-center gap-1.5">
              {t("browse")} <IconArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <Link href="/shop?mode=custom" className="group bg-white p-7 no-underline text-ink hover:bg-paper transition-colors">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">02</div>
            <div className="font-display text-xl font-bold tracking-tight mt-3 flex items-center gap-2">
              <IconRuler size={20} className="text-blue" /> {t("customTitle")}
            </div>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-4">
              {t("customText")}
            </p>
            <span className="font-mono text-[11px] text-orange flex items-center gap-1.5">
              {tc("configurator")} <IconArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <div className="bg-white p-7">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">03</div>
            <div className="font-display text-xl font-bold tracking-tight mt-3">{t("askTitle")}</div>
            <p className="font-sans text-sm text-ink-70 mt-2 mb-4">
              {t("askText")}
            </p>
            <a
              href={company.phone.office.href}
              className="font-display text-lg font-bold text-ink no-underline flex items-center gap-2 tabular-nums hover:text-orange transition-colors"
            >
              <IconPhone size={16} className="text-orange" /> {company.phone.office.display}
            </a>
          </div>
        </div>

        <div className="mt-10">
          <Link href="/"><Btn variant="ghost" size="lg">{t("backHome")}</Btn></Link>
        </div>
      </div>
    </div>
  );
}
