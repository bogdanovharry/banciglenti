import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/layout/PageHeader";
import { ConfiguratorPanel } from "@/components/configurator/ConfiguratorPanel";
import { absoluteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("catalog");
  return {
    title: t("meta.configuratorTitle"),
    description: t("meta.configuratorDescription"),
    alternates: { canonical: await absoluteUrl("/configurator") },
  };
}

/**
 * The configurator keeps its own route for deep links and search, but the panel
 * itself also renders inside /shop so a buyer never has to leave the catalogue
 * to price a custom size.
 *
 * A server component: the masthead is static text, and only the panel needs the
 * browser. That also lets the route carry its own title and canonical link.
 */
export default async function ConfiguratorPage() {
  const [t, tc] = await Promise.all([getTranslations("catalog"), getTranslations("common")]);

  return (
    <div className="bg-white">
      <PageHeader
        eyebrowNumber="№ 01"
        eyebrowLabel={tc("configurator")}
        image="/images/hero/shutterstock_2512301009.webp"
        imageAlt={t("configurator.heroAlt")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: tc("configurator") }]}
        title={
          <>
            {t("configurator.titleLine1")}<br />
            <span className="text-orange-light">{t("configurator.titleLine2")}</span>
          </>
        }
        description={t("configurator.description")}
      />
      <ConfiguratorPanel />
    </div>
  );
}
