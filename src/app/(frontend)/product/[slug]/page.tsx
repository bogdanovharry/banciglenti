import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategories, getProductBySlug } from "@/lib/catalog";
import { ProductClient, type ProductView } from "./ProductClient";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Продуктът не е намерен" };

  return {
    title: product.name,
    description:
      product.shortDescription ??
      `${product.name} — ${product.price.toFixed(2)} € без ДДС. Доставка за 24–48 часа.`,
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
    topProduct: product.badge === "TOP",
    specs: product.specs,
    breadcrumb: leaf ? { slug: leaf.slug, name: leaf.name } : null,
  };

  return <ProductClient product={view} />;
}
