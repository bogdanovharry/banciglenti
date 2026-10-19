import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPage, LegalSection, legalTags } from "@/components/layout/LegalPage";
import { COMPANY, addressLine, companyFor, termsFor } from "@/lib/company";
import { getMarket } from "@/i18n/locale";
import { absoluteUrl } from "@/lib/site-url";

/*
 * DRAFT for review by a Romanian lawyer before the Romanian store goes live.
 * The owner must also set real retention periods (section 07 deliberately
 * names none) and confirm where the database is hosted.
 * Strings live in messages/parts/legal.{bg,ro}.json under `legal.privacy`.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy.meta");
  const market = await getMarket();
  return {
    title: t("title"),
    description: t("description", { name: companyFor(market.locale).legalName }),
    alternates: { canonical: await absoluteUrl("/privacy") },
  };
}

/**
 * Describes what this codebase actually does, not a template.
 *
 * Notably it does NOT claim analytics or marketing cookies: the GA4, Meta Pixel
 * and Google Ads IDs exist in .env.example but no loading code exists anywhere
 * in src/, so the site currently sets none. A policy that discloses tracking
 * which is not happening is as wrong as one that hides tracking which is.
 * When analytics are switched on this section has to be revised and a consent
 * banner added first.
 *
 * Processors are named by category (hosting, database, email, couriers) and the
 * couriers come from the market registry.
 */
export default async function PrivacyPage() {
  const t = await getTranslations("legal.privacy");
  const market = await getMarket();
  const co = companyFor(market.locale);
  const terms = termsFor(market);

  const tags = legalTags(
    { email: co.email, telHref: co.phone.office.href },
    { cpdp: "https://www.cpdp.bg", dp: "https://www.dataprotection.ro" },
  );
  const values = {
    name: co.legalName,
    vat: COMPANY.vatNumber,
    eik: COMPANY.eik,
    address: addressLine(market.locale),
    email: co.email,
    phone: co.phone.office.display,
    couriers: terms.couriers.join(market.locale.startsWith("bg") ? " или " : " sau "),
    methods: terms.bankTransfer ? "both" : "other",
  };
  const rich = (key: string) => t.rich(key, { ...values, ...tags });

  return (
    <LegalPage
      eyebrowNumber={t("eyebrowNumber")}
      eyebrowLabel={t("eyebrowLabel")}
      title={t("title")}
      description={t("lead")}
      updated="2026-10-19"
    >
      <LegalSection n="01" title={t("s01.title")}>
        <p>{rich("s01.p1")}</p>
        <p>{rich("s01.p2")}</p>
      </LegalSection>

      <LegalSection n="02" title={t("s02.title")}>
        <h3>{t("s02.orderTitle")}</h3>
        <p>{t("s02.order")}</p>

        <h3>{t("s02.inquiryTitle")}</h3>
        <p>{t("s02.inquiry")}</p>

        <h3>{t("s02.autoTitle")}</h3>
        <p>{rich("s02.auto1")}</p>
        <p>{t("s02.auto2")}</p>
        <p>{t("s02.payment", values)}</p>
      </LegalSection>

      <LegalSection n="03" title={t("s03.title")}>
        <dl>
          <dt>{t("s03.contract")}</dt>
          <dd>{t("s03.contractText")}</dd>
          <dt>{t("s03.legal")}</dt>
          <dd>{t("s03.legalText")}</dd>
          <dt>{t("s03.interest")}</dt>
          <dd>{t("s03.interestText")}</dd>
        </dl>
      </LegalSection>

      <LegalSection n="04" title={t("s04.title")}>
        <p>{t("s04.lead")}</p>
        <ul>
          <li>{rich("s04.courier")}</li>
          <li>{rich("s04.hosting")}</li>
          <li>{rich("s04.email")}</li>
          <li>{rich("s04.accounting")}</li>
        </ul>
        <p>{t("s04.noSale")}</p>
      </LegalSection>

      <LegalSection n="05" title={t("s05.title")}>
        <p>{t("s05.p1")}</p>
      </LegalSection>

      <LegalSection n="06" title={t("s06.title")}>
        <p>{rich("s06.p1")}</p>
        <p>{t("s06.p2")}</p>
        <p>{t("s06.p3")}</p>
      </LegalSection>

      <LegalSection n="07" title={t("s07.title")}>
        <p>{t("s07.p1")}</p>
      </LegalSection>

      <LegalSection n="08" title={t("s08.title")}>
        <p>{t("s08.lead")}</p>
        <ul>
          <li>{t("s08.r1")}</li>
          <li>{t("s08.r2")}</li>
          <li>{t("s08.r3")}</li>
          <li>{t("s08.r4")}</li>
          <li>{t("s08.r5")}</li>
          <li>{t("s08.r6")}</li>
        </ul>
        <p>{rich("s08.write")}</p>
        <p>{t("s08.noAuto")}</p>
      </LegalSection>

      <LegalSection n="09" title={t("s09.title")}>
        <p>{rich("s09.p1")}</p>
      </LegalSection>
    </LegalPage>
  );
}
