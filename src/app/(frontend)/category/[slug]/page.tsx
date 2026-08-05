import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCategories, getCategoryBySlug, getCategoryCounts, getProducts } from "@/lib/catalog";
import { CategoryClient, type Subcategory } from "./CategoryClient";

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Masthead photography per category. A child falls back to its parent's image,
 * and anything unmapped renders the header on flat blue rather than showing an
 * unrelated photograph.
 */
const CATEGORY_IMAGES: Record<string, string> = {
  dyrvo: "/images/hero/craftsman-using-bandsaw-for-splitting-wood-plank-i-2023-11-27-05-19-15-utc-2.avif",
  metal: "/images/hero/metal-cutting-2023-11-27-04-59-56-utc-2.avif",
  hrani: "/images/hero/shutterstock_1313584316.avif",
  "hobi-bantsig": "/images/hero/hardworking-man-doing-his-job-woodshop-2.avif",
  mashini: "/images/hero/man_working_bandsaw_blades.avif",
  abrazivi: "/images/hero/punching.webp",
  konsumativi: "/images/hero/man_working_bandsaw_blades.avif",
  slicers: "/images/hero/shutterstock_1510054877.avif",
};

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
      categoryImage={
        CATEGORY_IMAGES[category.slug] ??
        (category.parentSlug ? CATEGORY_IMAGES[category.parentSlug] : undefined)
      }
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
        image: p.image,
        specs: p.specs,
        brandName: p.brandName,
        machines: p.machines,
        stockCount: p.stockCount,
      }))}
    />
  );
}
