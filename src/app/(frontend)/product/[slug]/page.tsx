import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTranslations } from "next-intl/server";

import { getCategories, getProductBySlug } from "@/lib/catalog";
import { formatPrice, vatRateFor, withVat } from "@/lib/market";
import { getMarket } from "@/i18n/locale";
import { absoluteUrl } from "@/lib/site-url";
import { ProductClient, type ProductView } from "./ProductClient";

type PageProps = { params: Promise<{ slug: string }> };

/** JSON for a <script> block: a literal "<" could close the tag early. */
const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, "\u003c");

/** Uploaded photos are site-relative paths; structured data wants absolute URLs. */
const absoluteImage = async (src: string | undefined) =>
  src ? (/^https?:\/\//.test(src) ? src : await absoluteUrl(src)) : undefined;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [product, t] = await Promise.all([getProductBySlug(slug), getTranslations("catalog")]);

  if (!product) return { title: t("product.notFoundTitle") };

  const [market, tc] = await Promise.all([getMarket(), getTranslations("common")]);
  const gross = withVat(product.price, vatRateFor(market));
  const description =
    product.shortDescription ??
    t("meta.productDescription", {
      name: product.name,
      gross: formatPrice(gross, market),
      net: formatPrice(product.price, market),
      incVat: tc("incVat"),
      exVat: tc("exVat"),
    });
  const url = await absoluteUrl(`/product/${product.slug}`);
  const image = await absoluteImage(product.image);

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.name,
      description,
      url,
      type: "website",
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const [product, categories] = await Promise.all([getProductBySlug(slug), getCategories()]);

  if (!product) notFound();

  // Breadcrumb points at the most specific category the product belongs to,
  // i.e. the one that has a parent rather than the top-level industry.
  const attached = categories.filter((c) => product.categorySlugs.includes(c.slug));
  const leaf = attached.find((c) => c.parentSlug !== null) ?? attached[0] ?? null;

  const view: ProductView = {
    slug: product.slug,
    name: product.name,
    dim: product.dim,
    price: product.price,
    brand: product.brandName,
    shortDescription: product.shortDescription ?? null,
    stockCount: product.stockCount,
    stock: product.stock,
    topProduct: product.badge === "TOP",
    specs: product.specs,
    series: product.series,
    setContents: product.setContents,
    machines: product.machines,
    image: product.image ?? null,
    breadcrumb: leaf ? { slug: leaf.slug, name: leaf.name } : null,
  };

  // Structured data. The price is what the visitor pays — VAT included, in the
  // market's display currency — as a plain decimal string, which is what
  // schema.org asks for (no symbol, no thousands separator).
  const [market, tc, url, image] = await Promise.all([
    getMarket(),
    getTranslations("common"),
    absoluteUrl(`/product/${product.slug}`),
    absoluteImage(product.image),
  ]);
  const gross = withVat(product.price, vatRateFor(market)) * market.exchangeRate;

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.slug,
    ...(image ? { image: [image] } : {}),
    ...(product.brandName ? { brand: { "@type": "Brand", name: product.brandName } } : {}),
    description: product.shortDescription ?? product.name,
    offers: {
      "@type": "Offer",
      price: gross.toFixed(2),
      priceCurrency: market.displayCurrency,
      availability:
        product.stock === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tc("home"), item: await absoluteUrl("/") },
      ...(leaf
        ? [{ "@type": "ListItem", position: 2, name: leaf.name, item: await absoluteUrl(`/category/${leaf.slug}`) }]
        : []),
      { "@type": "ListItem", position: leaf ? 3 : 2, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonForScript(breadcrumbLd) }} />
      <ProductClient product={view} />
    </>
  );
}
