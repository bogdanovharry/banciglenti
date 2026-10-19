import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCategoryCounts, getProducts } from "@/lib/catalog";
import { companyFor } from "@/lib/company";
import { CATALOG_FACTS } from "@/lib/catalog-facts";
import { getLocale } from "@/i18n/locale";
import { absoluteUrl } from "@/lib/site-url";
import { HomeClient } from "./HomeClient";
import type { ProductCardData } from "@/components/product/ProductCard";

// The homepage is the same for everyone; regenerate on an interval so /admin
// edits to stock or the TOP flag appear without a redeploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [t, tc, locale] = await Promise.all([
    getTranslations("homepage"),
    getTranslations("common"),
    getLocale(),
  ]);
  const company = companyFor(locale);
  const spaced = CATALOG_FACTS.lengthMin.toLocaleString("en-US").replace(/,/g, String.fromCharCode(160));
  return {
    // "absolute": the layout template appends the brand, and on the homepage the
    // brand leads instead.
    title: { absolute: `${tc("brand")} — ${t("metaTitle")}` },
    description: t("metaDescription", { min: spaced, year: company.foundedYear }),
    alternates: { canonical: await absoluteUrl("/") },
  };
}

/**
 * Organization structured data. Only facts the site already states elsewhere:
 * the name, address and phone come from companyFor() so they match the footer
 * and the contact page. No sameAs list — there are no verified profiles to
 * point at.
 */
async function organizationJsonLd(locale: string) {
  const company = companyFor(locale);
  const bulgarian = locale.startsWith("bg");
  const logo = bulgarian ? "/images/hero/tehnoles-logo.png" : "/images/brands/saw-meister-brushed.png";
  const tc = await getTranslations("common");
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    // The consumer-facing brand ("Saw-Meister" outside Bulgaria), with the
    // legal entity as legalName.
    name: bulgarian ? company.tradeName : tc("brand"),
    legalName: company.legalName,
    url: await absoluteUrl("/"),
    logo: await absoluteUrl(logo),
    telephone: company.phone.office.href.replace(/^tel:/, ""),
    email: company.email,
    foundingDate: String(company.foundedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      postalCode: company.address.postalCode,
      addressLocality: company.address.city,
      addressCountry: "BG",
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const jsonLd = await organizationJsonLd(locale);
  const [products, categoryCounts] = await Promise.all([getProducts(), getCategoryCounts()]);

  // Bestsellers are the products actually flagged TOP in the CMS. Previously
  // this block was hardcoded and every one of its six links 404'd, because none
  // of those slugs existed in the catalogue.
  // Machines are excluded even when flagged TOP. A €5,742 sharpening machine is
  // not an impulse buy from a homepage row, and having no width or thickness it
  // renders an empty spec tile beside blades that have both. It still appears
  // under its own category, where a buyer is actually shopping for one.
  const bestsellers: ProductCardData[] = products
    .filter((p) => p.badge === "TOP" && !p.categorySlugs.includes("mashini"))
    .slice(0, 6)
    .map((p) => ({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      dim: p.dim,
      price: p.price,
      industry: p.industry,
      stock: p.stock,
      badge: p.badge,
      image: p.image,
      specs: p.specs,
      brandName: p.brandName,
      machines: p.machines,
      stockCount: p.stockCount,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        // "<" escaped so no value can close the script element early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      <HomeClient bestsellers={bestsellers} categoryCounts={categoryCounts} />
    </>
  );
}
