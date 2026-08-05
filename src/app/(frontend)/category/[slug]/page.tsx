import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategories, getCategoryBySlug, getCategoryCounts, getProducts } from "@/lib/catalog";
import { CategoryClient, type Subcategory } from "./CategoryClient";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Категорията не е намерена" };

  return {
    title: category.name,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [category, categories, products, counts] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    // Products are attached to their own category and its parent, so a top-level
    // slug returns everything beneath it without needing an explicit include map.
    getProducts(slug),
    getCategoryCounts(),
  ]);

  if (!category) notFound();

  const parentCategory = category.parentSlug
    ? categories.find((c) => c.slug === category.parentSlug)
    : null;

  const subcategories: Subcategory[] = categories
    .filter((c) => c.parentSlug === category.slug)
    .map((c) => ({ slug: c.slug, name: c.name, count: counts[c.slug] ?? 0 }))
    .filter((c) => c.count > 0);

  return (
    <CategoryClient
      categoryName={category.name}
      categoryDescription={category.description}
      parent={parentCategory ? { slug: parentCategory.slug, name: parentCategory.name } : null}
      subcategories={subcategories}
      products={products.map((p) => ({
        sku: p.sku,
        slug: p.slug,
        name: p.name,
        dim: p.dim,
        price: p.price,
        industry: p.industry,
        stock: p.stock,
        badge: p.badge,
        specs: p.specs,
        brandName: p.brandName,
        stockCount: p.stockCount,
      }))}
    />
  );
}
