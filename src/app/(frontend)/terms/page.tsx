import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPage, LegalSection, legalTags } from "@/components/layout/LegalPage";
import { COMPANY, addressLine, companyFor, rateLabel, termsFor } from "@/lib/company";
import { getMarket } from "@/i18n/locale";
import { currencySymbol } from "@/lib/market";
import { absoluteUrl } from "@/lib/site-url";

/*
 * DRAFT for review by a Romanian lawyer (the ro text, and the Romanian-law
 * citations in it) before the Romanian store goes live. The Bulgarian text is
 * the existing baseline plus the corrections listed in the engineering report.
 * Strings live in messages/parts/legal.{bg,ro}.json under `legal.terms`.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms.meta");
  const market = await getMarket();
  return {
    title: t("title"),
    description: t("description", { name: companyFor(market.locale).legalName }),
    alternates: { canonical: await absoluteUrl("/terms") },
  };
}

/**
 * States statutory positions (EU distance-selling and conformity rules as
 * transposed into Bulgarian and Romanian law) rather than inventing company
 * policy, so nothing here commits the business to more than the law already does.
 *
 * Two points are deliberately explicit because they are commercially material
 * and easy to get wrong:
 *   - blades made to the consumer's specification (configured length, width…)
 *     are exempt from the 14-day withdrawal right; standard catalogue items
 *     that are merely welded on request are not;
 *   - consumers have a two-year conformity guarantee, which cannot be reduced.
 */
export default async function TermsPage() {
  const t = await getTranslations("legal.terms");
  const market = await getMarket();
  const co = companyFor(market.locale);
  const terms = termsFor(market);

  const contact = { email: co.email, telHref: co.phone.office.href };
  const tags = legalTags(contact, {
    kzp: "https://kzp.bg",
    anpc: "https://anpc.ro",
    sal: "https://anpc.ro/sal/",
  });
  const company = {
    name: co.legalName,
    vat: COMPANY.vatNumber,
    eik: COMPANY.eik,
    address: addressLine(market.locale),
    email: co.email,
    phone: co.phone.office.display,
  };
  const rich = (key: string, values: Record<string, string | number> = {}) =>
    t.rich(key, { ...company, ...values, ...tags });

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
        <p>{t("s01.p2")}</p>
      </LegalSection>

      <LegalSection n="02" title={t("s02.title")}>
        <p>{t("s02.p1")}</p>
        <p>{t("s02.p2")}</p>
      </LegalSection>

      <LegalSection n="03" title={t("s03.title")}>
        <p>{t("s03.p1", { vatPercent: terms.vatPercent })}</p>
        {terms.exchangeRate !== 1 && (
          <p>{t("s03.rate", { rate: rateLabel(market), symbol: currencySymbol(market) })}</p>
        )}
        <p>{t("s03.p2")}</p>
      </LegalSection>

      <LegalSection n="04" title={t("s04.title")}>
        <p>{rich("s04.p1", { methods: terms.bankTransfer ? "both" : "other" })}</p>
      </LegalSection>

      <LegalSection n="05" title={t("s05.title")}>
        <p>{rich("s05.p1")}</p>
        <p>{rich("s05.p2", { formSection: "06" })}</p>
        <p>{t("s05.refund")}</p>

        <h3>{t("s05.exTitle")}</h3>
        <p>{rich("s05.exP1")}</p>
        <p>{t("s05.exP2")}</p>
      </LegalSection>

      <LegalSection n="06" title={t("s06.title")}>
        <p>{rich("s06.intro")}</p>
        <div className="border border-ink-15 p-5 md:p-6 my-5">
          <p>{t("s06.to", company)}</p>
          <p>{t("s06.body")}</p>
          <p>{t("s06.ordered")}</p>
          <p>{t("s06.consumerName")}</p>
          <p>{t("s06.consumerAddress")}</p>
          <p>{t("s06.sign")}</p>
          <p>{t("s06.date")}</p>
          <p className="text-ink-50">{t("s06.note")}</p>
        </div>
      </LegalSection>

      <LegalSection n="07" title={t("s07.title")}>
        <p>{rich("s07.p1")}</p>
        <p>{t("s07.p2")}</p>

        <h3>{t("s07.seamTitle")}</h3>
        <p>{rich("s07.seamP1")}</p>
        <p>{t("s07.seamP2")}</p>
        <p>{rich("s07.claim")}</p>
      </LegalSection>

      <LegalSection n="08" title={t("s08.title")}>
        <p>{t("s08.p1", { withdrawal: "05", conformity: "07" })}</p>
      </LegalSection>

      <LegalSection n="09" title={t("s09.title")}>
        <p>{t("s09.p1")}</p>
        <p>{rich("s09.p2")}</p>
      </LegalSection>

      <LegalSection n="10" title={t("s10.title")}>
        <p>{t("s10.p1")}</p>
      </LegalSection>
    </LegalPage>
  );
}
