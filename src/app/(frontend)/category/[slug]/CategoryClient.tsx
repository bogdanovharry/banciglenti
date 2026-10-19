"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconRuler, IconArrowRight } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { SORT_OPTIONS, compareBy, type SortKey } from "@/lib/catalog-ui";
import { useSizeFilters } from "@/components/catalog/SizeFilters";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";

export type Subcategory = { slug: string; name: string; count: number };

export function CategoryClient({
  categoryName,
  categoryDescription,
  categoryImage,
  parent,
  subcategories,
  products,
}: {
  categoryName: string;
  categoryDescription: string;
  categoryImage?: string;
  parent: { slug: string; name: string } | null;
  subcategories: Subcategory[];
  // Richer than the card needs: the size filters read specs.length and the
  // machine list, which the page already passes through.
  products: (ProductCardData & { machines?: string[] })[];
}) {
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const tSort = useTranslations("sort");
  const [sort, setSort] = useState<SortKey>("popularity");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { filtered, panel, clear, active, hasFilters } = useSizeFilters(products);
  const sortedProducts = [...filtered].sort(compareBy(sort));

  return (
    <>
      <PageHeader
        eyebrowNumber="№ 05"
        eyebrowLabel={t("category.eyebrow")}
        image={categoryImage}
        imageAlt=""
        crumbs={[
          { label: tc("home"), href: "/" },
          ...(parent ? [{ label: parent.name, href: `/category/${parent.slug}` }] : []),
          { label: categoryName },
        ]}
        title={categoryName}
        description={categoryDescription || undefined}
      >
        <div className="font-mono text-sm text-white/60">
          <strong className="text-white font-display text-2xl tabular-nums">{products.length}</strong> {t("category.items")}
        </div>
      </PageHeader>

      {/* Subcategories if any */}
      {subcategories.length > 0 && (
        <div className="border-b border-ink-15 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 flex gap-3 flex-wrap">
            {subcategories.map((sub) => (
              <Link
                key={sub.slug}
                href={`/category/${sub.slug}`}
                className="px-4 py-2.5 border border-ink-15 font-sans text-sm text-ink no-underline hover:border-ink hover:bg-paper transition-colors"
              >
                {sub.name} <span className="text-ink-50 ml-1 font-mono text-[11px]">{sub.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar. Sticks under the header: 169-173px is the tablet/desktop header (utility
          bar + brand row + nav); on a phone the header is the shorter
          one-row version, so the offset is smaller there. */}
      <div className="border-b border-ink-15 bg-white sticky top-[114px] md:top-[169px] lg:top-[173px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {hasFilters && products.length > 0 && (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 h-9 px-3 border border-ink-15 bg-white font-mono text-[11px] uppercase tracking-[0.08em] text-ink cursor-pointer hover:border-ink transition-colors"
              >
                {t("filters.button")}
                {active > 0 && (
                  <span className="min-w-5 h-5 px-1 inline-flex items-center justify-center bg-orange text-white text-[10px] tabular-nums">
                    {active}
                  </span>
                )}
              </button>
            )}
            <span className="font-mono text-[11px] text-ink-50">{t("category.productCount", { count: sortedProducts.length })}</span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label={t("shop.sortBy")}
              className="font-mono text-[11px] p-2 border border-ink-15 bg-white"
            >
              {/* No width sort here: a category mixes blades with circular saws,
                  planer knives and abrasives, where width means different things. */}
              {SORT_OPTIONS.filter((o) => o.key !== "width").map((o) => (
                <option key={o.key} value={o.key}>
                  {tSort(o.msg)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products + Configurator CTA */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 pb-20">
        <Link href="/configurator" className="no-underline block mb-8">
          <div className="bg-paper border border-ink-15 p-5 flex items-center justify-between gap-4 hover:border-ink transition-colors">
            <div className="flex items-center gap-4">
              <IconRuler size={28} className="text-blue shrink-0" />
              <div>
                <div className="font-display text-base font-bold text-ink">{t("category.cantFindTitle")}</div>
                <div className="font-mono text-[11px] text-ink-50 mt-0.5 tracking-[0.04em]">{t("category.cantFindHint")}</div>
              </div>
            </div>
            <Btn variant="primary" size="sm" iconRight={<IconArrowRight size={12} />}>{tc("configurator")}</Btn>
          </div>
        </Link>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">{t("category.emptyTitle")}</h2>
            <p className="text-ink-50 mb-6">{t("category.emptyHint")}</p>
            <Link href="/configurator"><Btn variant="primary" size="lg">{tc("configurator")}</Btn></Link>
          </div>
        ) : (
          /* Sidebar only where there is something to filter on — a category of
             machines or consumables has no loop length, and an empty column
             beside the grid just makes the page narrower for no gain. */
          <div className={hasFilters ? "grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 lg:gap-10" : ""}>
            {hasFilters && <aside className="hidden lg:block">{panel}</aside>}

            {sortedProducts.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="font-display text-xl font-bold text-ink mb-2">{t("category.noMatchTitle")}</h2>
                <p className="text-ink-50 mb-6">{t("category.noMatchHint")}</p>
                <Btn variant="ghost" size="md" onClick={clear}>{t("filters.clearAll")}</Btn>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${hasFilters ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"}`}>
                {sortedProducts.map((p) => (
                  <ProductCard key={p.sku} p={p} compact />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {drawerOpen && (
        <FilterDrawer
          title={t("filters.title")}
          onClose={() => setDrawerOpen(false)}
          footer={
            <Btn variant="primary" size="lg" fullWidth onClick={() => setDrawerOpen(false)}>
              {t("filters.show", { count: sortedProducts.length })}
            </Btn>
          }
        >
          {panel}
        </FilterDrawer>
      )}
    </>
  );
}
