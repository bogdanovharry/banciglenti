"use client";

import Link from "next/link";
import { useState } from "react";
import { Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconRuler, IconArrowRight } from "@/components/ui/icons";

export type Subcategory = { slug: string; name: string; count: number };

export function CategoryClient({
  categoryName,
  categoryDescription,
  parent,
  subcategories,
  products,
}: {
  categoryName: string;
  categoryDescription: string;
  parent: { slug: string; name: string } | null;
  subcategories: Subcategory[];
  products: ProductCardData[];
}) {
  const [sort, setSort] = useState("Популярност");

  const sortedProducts = [...products].sort((a, b) => {
    if (sort === "Цена ↑") return a.price - b.price;
    if (sort === "Цена ↓") return b.price - a.price;
    return 0;
  });

  return (
    <>
      {/* Header */}
      <div className="bg-paper border-b border-ink-15">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 md:py-12">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-6">
            <Link href="/" className="text-ink-50 no-underline hover:text-ink">Начало</Link>
            <span>/</span>
            {parent && (
              <>
                <Link href={`/category/${parent.slug}`} className="text-ink-50 no-underline hover:text-ink">
                  {parent.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-ink">{categoryName}</span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl leading-none tracking-[-0.04em] font-bold m-0 text-ink">
            {categoryName}
          </h1>
          {categoryDescription && (
            <p className="font-sans text-base leading-relaxed text-ink-70 max-w-[700px] mt-4">{categoryDescription}</p>
          )}

          <div className="flex items-center gap-6 mt-6 font-mono text-sm text-ink-50">
            <span><strong className="text-ink font-display text-2xl">{products.length}</strong> артикула</span>
          </div>
        </div>
      </div>

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

      {/* Toolbar */}
      <div className="border-b border-ink-15 bg-white sticky top-[168px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-ink-50">{sortedProducts.length} продукта</span>
          </div>
          <div className="flex items-center gap-4">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="font-mono text-[11px] p-2 border border-ink-15 bg-white">
              <option>Популярност</option>
              <option>Цена ↑</option>
              <option>Цена ↓</option>
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
                <div className="font-display text-base font-bold text-ink">Не намирате вашия размер?</div>
                <div className="font-mono text-[11px] text-ink-50 mt-0.5 tracking-[0.04em]">Поръчайте лента по индивидуални размери чрез конфигуратора</div>
              </div>
            </div>
            <Btn variant="primary" size="sm" iconRight={<IconArrowRight size={12} />}>Конфигуратор</Btn>
          </div>
        </Link>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Няма продукти в тази категория</h2>
            <p className="text-ink-50 mb-6">Опитайте конфигуратора за поръчка по размер.</p>
            <Link href="/configurator"><Btn variant="primary" size="lg">Конфигуратор</Btn></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedProducts.map((p) => (
              <ProductCard key={p.sku} p={p} compact />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
