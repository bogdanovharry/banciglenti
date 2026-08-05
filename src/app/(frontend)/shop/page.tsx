import type { Metadata } from "next";

import { getCategories, getCategoryCounts, getProducts } from "@/lib/catalog";
import { ShopClient, type ShopFilter } from "./ShopClient";

// The full catalogue is identical for every visitor, so serve it from the cache
// and regenerate in the background. Without this the route prerenders at build
// time and /admin edits would not appear until the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Пълен каталог банцигови ленти, циркулярни триони, ножове за абрихт и абразиви. Филтрирайте по категория или поръчайте по размер.",
};

export default async function ShopPage() {
  const [products, categories, counts] = await Promise.all([
    getProducts(),
    getCategories(),
    getCategoryCounts(),
  ]);

  // Only the categories that actually hold products, so the sidebar never shows
  // a filter that yields an empty grid.
  const filters: ShopFilter[] = [
    { slug: "", label: "Всички", count: products.length },
    ...categories
      .filter((category) => (counts[category.slug] ?? 0) > 0)
      .map((category) => ({
        slug: category.slug,
        label: category.name,
        count: counts[category.slug] ?? 0,
      })),
  ];

  return (
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
        categorySlugs: p.categorySlugs,
        specs: p.specs,
        brandName: p.brandName,
        stockCount: p.stockCount,
      }))}
      filters={filters}
    />
  );
}
