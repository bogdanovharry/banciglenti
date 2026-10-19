import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPage, LegalSection, legalTags } from "@/components/layout/LegalPage";
import { COMPANY, addressLine, companyFor, rateLabel, termsFor } from "@/lib/company";
import { getMarket } from "@/i18n/locale";
import { currencySymbol, formatPrice } from "@/lib/market";
import { absoluteUrl } from "@/lib/site-url";

/*
 * DRAFT for review by a Romanian lawyer before the Romanian store goes live.
 * Strings live in messages/parts/legal.{bg,ro}.json under `legal.delivery`.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.delivery.meta");
  const market = await getMarket();
  return {
    title: t("title"),
    description: t("description", { name: companyFor(market.locale).tradeName }),
    alternates: { canonical: await absoluteUrl("/delivery") },
  };
}

/**
 * Every figure here is read from the market registry (src/lib/market.ts) via
 * termsFor(), which mirrors the values the cart and the order route actually
 * use. If the free-shipping threshold changes in code, this page changes with
 * it — a delivery page that disagrees with checkout is worse than no delivery
 * page.
 *
 * Per market: Bulgaria has a flat fee, a free-delivery threshold and workshop
 * pickup; Romania ('collect') has none of those — the courier bills its own
 * weight-based fee at the door.
 */
export default async function DeliveryPage() {
  const t = await getTranslations("legal.delivery");
  const market = await getMarket();
  const co = companyFor(market.locale);
  const terms = termsFor(market);
  const bg = market.locale.startsWith("bg");

  const tags = legalTags({ email: co.email, telHref: co.phone.office.href });
  const values = {
    country: market.country,
    couriers: terms.couriers.join(bg ? " и " : " și "),
    address: addressLine(market.locale),
    email: co.email,
    phone: co.phone.office.display,
    vatPercent: terms.vatPercent,
    rate: rateLabel(market),
    symbol: currencySymbol(market),
  };
  const rich = (key: string, extra: Record<string, string | number> = {}) =>
    t.rich(key, { ...values, ...extra, ...tags });

  // Card payments are announced on the Bulgarian store only; Romania launches
  // with cash on delivery and promises nothing further.
  const cardsAnnounced = market.code === "bg";

  return (
    <LegalPage
      eyebrowNumber={t("eyebrowNumber")}
      eyebrowLabel={t("eyebrowLabel")}
      title={t("title")}
      description={t("lead")}
      updated="2026-10-19"
    >
      <LegalSection n="01" title={t("s01.title")}>
        <p>{t("s01.p1", values)}</p>
        {terms.pickup && <p>{t("s01.pickup", values)}</p>}
      </LegalSection>

      <LegalSection n="02" title={t("s02.title")}>
        {terms.carriage === "collect" ? (
          <p>{t("s02.collect")}</p>
        ) : (
          <>
            <dl>
              <dt>{t("s02.standard")}</dt>
              <dd className="tabular-nums">
                {t("s02.standardText", { cost: formatPrice(terms.shippingCost, market) })}
              </dd>
              <dt>{t("s02.free")}</dt>
              <dd className="tabular-nums">
                {t("s02.freeText", { amount: formatPrice(terms.freeShippingThreshold, market) })}
              </dd>
              {terms.pickup && (
                <>
                  <dt>{t("s02.pickupLabel")}</dt>
                  <dd>{t("s02.pickupText", { city: co.address.city })}</dd>
                </>
              )}
            </dl>
            <p>{t("s02.auto")}</p>
          </>
        )}
      </LegalSection>

      <LegalSection n="03" title={t("s03.title")}>
        <p>{rich("s03.stock")}</p>
        <p>{rich("s03.custom")}</p>
        <p>{t("s03.courier")}</p>
      </LegalSection>

      <LegalSection n="04" title={t("s04.title")}>
        {terms.bankTransfer && (
          <>
            <h3>{t("s04.bankTitle")}</h3>
            <p>{t("s04.bank")}</p>
            <dl>
              <dt>{t("s04.payee")}</dt>
              <dd>{COMPANY.legalName}</dd>
              <dt>{t("s04.bankName")}</dt>
              <dd>{COMPANY.bank.name}</dd>
              <dt>{t("s04.iban")}</dt>
              <dd className="tabular-nums">{COMPANY.bank.iban}</dd>
              <dt>{t("s04.bic")}</dt>
              <dd>{COMPANY.bank.bic}</dd>
              <dt>{t("s04.reason")}</dt>
              <dd>{t("s04.reasonText")}</dd>
            </dl>
          </>
        )}

        {terms.cod && (
          <>
            <h3>{t("s04.codTitle")}</h3>
            <p>{t("s04.cod")}</p>
          </>
        )}

        {cardsAnnounced && (
          <>
            <h3>{t("s04.cardTitle")}</h3>
            <p>{t("s04.card")}</p>
          </>
        )}
      </LegalSection>

      <LegalSection n="05" title={t("s05.title")}>
        <p>{rich("s05.p1")}</p>
        {terms.exchangeRate !== 1 && <p>{t("s05.rate", values)}</p>}
        <p>{t("s05.p2")}</p>
      </LegalSection>

      <LegalSection n="06" title={t("s06.title")}>
        <p>{rich("s06.p1")}</p>
        <p>{rich("s06.p2")}</p>
      </LegalSection>
    </LegalPage>
  );
}
