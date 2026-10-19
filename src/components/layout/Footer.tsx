import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Btn } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";
import { COMPANY, COMPANY_LATIN, companyFor } from "@/lib/company";
import { CATALOG_FACTS } from "@/lib/catalog-facts";
import { getLocale, getMarket } from "@/i18n/locale";

const columns = [
  { title: "colProducts", links: [
    { label: "pHorizontal", href: "/category/horizontalni-bantsizi" },
    { label: "pVertical", href: "/category/vertikalni-bantsizi" },
    { label: "pBimetal", href: "/category/bimetalni-lenti" },
    { label: "pCircular", href: "/category/tsirkulyarni-trioni" },
    { label: "pPlaner", href: "/category/nozhove-za-abriht" },
    { label: "pMachines", href: "/category/mashini" },
  ]},
  { title: "colIndustries", links: [
    { label: "iWood", href: "/category/dyrvo" },
    { label: "iMetal", href: "/category/metal" },
    { label: "iFood", href: "/category/hrani" },
    { label: "iHobby", href: "/category/hobi-bantsig" },
  ]},
  // No blog (hidden) and no certifications link: nothing on /about backs up
  // the TÜV NORD / CE claim that used to sit here, so it is not made.
  { title: "colCompany", links: [
    { label: "cAbout", href: "/about" },
    { label: "cContact", href: "/contact" },
  ]},
  { title: "colCustomers", links: [
    { label: "uDelivery", href: "/delivery" },
    { label: "uWarranty", href: "/terms" },
    { label: "uTerms", href: "/terms" },
    { label: "uPrivacy", href: "/privacy" },
  ]},
] as const;

export async function Footer() {
  const t = await getTranslations("siteFooter");
  const locale = await getLocale();
  const market = await getMarket();
  const company = companyFor(locale);
  // The footer states numbers in full international form: it is the formal
  // identity block, and it is read from outside Bulgaria. Display and href
  // come from the same object.
  const phone = COMPANY_LATIN.phone;
  const site = t("site");

  const facts: [string, string][] = [
    [String(COMPANY.foundedYear), t("factFounded")],
    [company.address.city, t("factWorkshop")],
    [`${CATALOG_FACTS.widthMin}–${CATALOG_FACTS.widthMax}`, t("factWidth")],
    [market.country, t("factDelivery")],
  ];

  return (
    <footer className="bg-blue-deep text-white pt-20">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10">
        {/* Top: wordmark + tagline.
            The tagline was set in orange italic at 88px, the only italic on the
            site — the June pass replaced that treatment with heavy upright
            everywhere else and the footer was missed. Scale comes down so the
            footer reads as a close, not as a second hero, and a measured rail
            of facts carries the credibility instead of a slab of display type. */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 pb-14 border-b border-white/10">
          <div>
            <div className="font-mono text-[11px] tracking-[0.15em] uppercase text-orange-light mb-5">
              № 00 — Tehnoles Ltd. · est. 1993
            </div>
            <div className="font-display text-4xl md:text-5xl lg:text-[56px] leading-[1.02] font-extrabold tracking-[-0.035em]">
              {t("headlineA")}<br />
              <span className="text-orange">{t("headlineB")}</span>
            </div>

            {/* Verifiable facts, set as data rather than as prose */}
            <dl className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 max-w-[520px]">
              {facts.map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-lg font-bold tracking-tight tabular-nums">{v}</dt>
                  <dd className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/50 mt-1 m-0">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="self-end">
            <p className="font-sans text-[15px] leading-relaxed text-white/70 max-w-[380px]">
              {t("blurb")}
            </p>
            <div className="mt-7 flex gap-3 flex-wrap">
              <Link href="/configurator">
                <Btn variant="primary" size="md" iconRight={<IconArrowRight size={14} />}>{t("ctaCustom")}</Btn>
              </Link>
              <Link href="/contact">
                <Btn variant="ghostLight" size="md">{t("ctaAdvice")}</Btn>
              </Link>
            </div>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 py-14">
          {/* Office column */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-4">{t("office")}</div>
            <div className="font-display text-lg font-semibold mb-1">{company.legalName}</div>
            <div className="font-sans text-sm text-white/70 leading-relaxed">
              {t("addressLine", { city: company.address.city, postalCode: company.address.postalCode })}<br />
              {company.address.street}<br />
              {company.address.country}
            </div>
            <div className="mt-5 flex flex-col gap-1.5 font-mono text-xs">
              <a href={phone.office.href} className="text-white no-underline hover:text-orange-light transition-colors">{phone.office.display}</a>
              <a href={phone.mobile.href} className="text-white no-underline hover:text-orange-light transition-colors">{phone.mobile.display}</a>
              <a href={`mailto:${company.email}`} className="text-orange-light no-underline hover:text-white transition-colors">{company.email}</a>
            </div>
          </div>

          {/* Nav columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-4">{t(col.title)}</div>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="font-sans text-sm text-white/75 no-underline hover:text-white transition-colors">
                      {t(l.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-6 border-t border-white/10 font-mono text-[11px] text-white/50 tracking-[0.04em]">
          <div>© {company.foundedYear}–{new Date().getFullYear()} {company.legalName}{site ? ` · ${site}` : ""} · {t("vatNo", { number: company.vatNumber })}</div>
          <div className="flex gap-5">
            <a href="https://www.facebook.com/tehnoles" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white no-underline transition-colors">Facebook</a>
            <a href="https://www.youtube.com/@Tehnolesltd" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white no-underline transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
