import { getCategoryCounts, getProducts } from "@/lib/catalog";
import { HomeClient } from "./HomeClient";
import type { ProductCardData } from "@/components/product/ProductCard";

// The homepage is the same for everyone; regenerate on an interval so /admin
// edits to stock or the TOP flag appear without a redeploy.
export const revalidate = 60;

export default async function HomePage() {
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
      specs: p.specs,
      brandName: p.brandName,
      machines: p.machines,
      stockCount: p.stockCount,
    }));

  return <HomeClient bestsellers={bestsellers} categoryCounts={categoryCounts} />;
}
