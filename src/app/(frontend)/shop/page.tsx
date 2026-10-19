import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { absoluteUrl } from "@/lib/site-url";
import { getCategories, getCategoryCounts, getProducts } from "@/lib/catalog";
import { ShopClient, type ShopFilter } from "./ShopClient";

// The full catalogue is identical for every visitor, so serve it from the cache
// and regenerate in the background. Without this the route prerenders at build
// time and /admin edits would not appear until the next deploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("catalog");
  return {
    title: t("meta.shopTitle"),
    description: t("meta.shopDescription"),
    alternates: { canonical: await absoluteUrl("/shop") },
  };
}

export default async function ShopPage() {
  const [products, categories, counts] = await Promise.all([
    getProducts(),
    getCategories(),
    getCategoryCounts(),
  ]);

  // Only the categories that actually hold products, so the sidebar never shows
  // a filter that yields an empty grid.
  const filters: ShopFilter[] = [
    // The "all" row's label is written by the client, in the visitor's language.
    { slug: "", label: "", count: products.length },
    ...categories
      .filter((category) => (counts[category.slug] ?? 0) > 0)
      .map((category) => ({
        slug: category.slug,
        label: category.name,
        count: counts[category.slug] ?? 0,
      })),
  ];

  return (
    // ShopClient reads the query string for deep links; the Suspense boundary
    // keeps the surrounding page prerenderable rather than forcing the whole
    // route dynamic.
    <Suspense fallback={null}>
      <ShopClient
        products={products.map((p) => ({
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          dim: p.dim,
          price: p.price,
          industry: p.industry,
          stock: p.stock,
          badge: p.badge,
          image: p.image,
          categorySlugs: p.categorySlugs,
          specs: p.specs,
          brandName: p.brandName,
          series: p.series,
          machines: p.machines,
          stockCount: p.stockCount,
        }))}
        filters={filters}
      />
    </Suspense>
  );
}
