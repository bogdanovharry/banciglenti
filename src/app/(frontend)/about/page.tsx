import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LegalPage, LegalSection } from "@/components/layout/LegalPage";
import { companyFor, COMPANY, TERMS } from "@/lib/company";
import { getLocale } from "@/i18n/locale";
import { absoluteUrl } from "@/lib/site-url";

/** 1000 -> "1 000" (non-breaking space), the grouping both languages use here. */
const spaced = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("aboutPage"), getLocale()]);
  const company = companyFor(locale);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", {
      name: company.legalName,
      year: COMPANY.foundedYear,
      city: company.address.city,
    }),
    alternates: { canonical: await absoluteUrl("/about") },
  };
}

/**
 * Deliberately short on claims. Everything stated is either a company
 * registration detail or something the site itself demonstrably does. Figures
 * that appear elsewhere in marketing copy but are not verifiable from anything
 * in this repository — customer counts, tolerances, certifications — are left
 * out rather than repeated here, since this is the page people cite.
 */
export default async function AboutPage() {
  const [t, locale] = await Promise.all([getTranslations("aboutPage"), getLocale()]);
  const company = companyFor(locale);
  const year = COMPANY.foundedYear;
  const years = new Date().getFullYear() - year;

  return (
    <LegalPage
      eyebrowNumber="№ 00"
      eyebrowLabel={t("eyebrow", { year })}
      title={t("title")}
      description={t("description")}
      updated="2026-08-06"
    >
      <LegalSection n="01" title={t("s1")}>
        <p>{t("p1", { name: company.legalName })}</p>
        <p>
          {t.rich("p2", {
            min: spaced(TERMS.customLengthMin),
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p>{t("p3")}</p>
      </LegalSection>

      <LegalSection n="02" title={t("s2")}>
        <dl>
          <dt>{t("name")}</dt>
          <dd>{company.legalName}</dd>
          <dt>{t("vat")}</dt>
          <dd className="tabular-nums">{company.vatNumber}</dd>
          <dt>{t("address")}</dt>
          <dd>
            {company.address.street}
            <br />
            {company.address.postalCode} {company.address.city}, {company.address.country}
          </dd>
          <dt>{t("founded")}</dt>
          <dd className="tabular-nums">{t("foundedValue", { year, years })}</dd>
        </dl>
      </LegalSection>

      <LegalSection n="03" title={t("s3")}>
        <dl>
          <dt>{t("phone")}</dt>
          <dd>
            <a href={company.phone.office.href}>{company.phone.office.display}</a>
          </dd>
          <dt>{t("mobile")}</dt>
          <dd>
            <a href={company.phone.mobile.href}>{company.phone.mobile.display}</a>
          </dd>
          <dt>{t("email")}</dt>
          <dd>
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </dd>
          <dt>{t("hoursLabel")}</dt>
          <dd>{t("hours")}</dd>
        </dl>
        <p>
          {t.rich("contact", {
            link: (chunks) => <Link href="/contact">{chunks}</Link>,
          })}
        </p>
      </LegalSection>
    </LegalPage>
  );
}
