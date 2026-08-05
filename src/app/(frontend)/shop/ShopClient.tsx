"use client";

import Link from "next/link";
import { useState } from "react";
import { Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconClose, IconRuler, IconArrowRight } from "@/components/ui/icons";

export type ShopFilter = { slug: string; label: string; count: number };

/** Card data plus the category membership the sidebar filter needs. */
export type ShopProduct = ProductCardData & { categorySlugs: string[] };

export function ShopClient({
  products,
  filters,
}: {
  products: ShopProduct[];
  filters: ShopFilter[];
}) {
  const [sort, setSort] = useState("Популярност");
  const [activeCategory, setActiveCategory] = useState("");

  const filteredProducts = activeCategory
    ? products.filter((p) => p.categorySlugs.includes(activeCategory))
    : products;

  const sortedProducts = [...filteredProducts].sort((a, b) => {
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
            <Link href="/" className="cursor-pointer text-ink-50 no-underline hover:text-ink">Начало</Link>
            <span>/</span>
            <span className="text-ink">Каталог</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-none tracking-[-0.04em] font-bold m-0 text-ink">
            Всички <span className="font-extrabold text-orange">продукти</span>
          </h1>
          <p className="font-sans text-base leading-relaxed text-ink-70 max-w-[580px] mt-4">
            {sortedProducts.length} артикула от {products.length} в нашия каталог. Филтрирайте по категория или използвайте конфигуратора за поръчка по размер.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-ink-15 bg-white sticky top-[168px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeCategory && (
              <button
                onClick={() => setActiveCategory("")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-paper font-mono text-[11px] text-ink cursor-pointer border-none"
              >
                {filters.find((c) => c.slug === activeCategory)?.label} <IconClose size={12} className="text-ink-50" />
              </button>
            )}
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

      {/* Grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 md:py-[40px] pb-20 md:pb-[120px] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          {/* Category filter */}
          <div className="mb-7 pb-7 border-b border-ink-15">
            <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-4 font-semibold">Категория</h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-1">
              {filters.map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 font-sans text-[13px] border-none cursor-pointer transition-colors flex justify-between items-center ${activeCategory === cat.slug ? "bg-ink text-white" : "bg-transparent text-ink-70 hover:bg-paper"}`}
                  >
                    <span>{cat.label}</span>
                    <span className={`font-mono text-[11px] ${activeCategory === cat.slug ? "text-white/60" : "text-ink-50"}`}>{cat.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Configurator CTA in sidebar */}
          <Link href="/configurator" className="block no-underline">
            <div className="bg-ink text-white p-5 hover:bg-ink-80 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <IconRuler size={24} className="text-orange" />
                <div className="font-display text-lg font-bold">Конфигуратор</div>
              </div>
              <p className="font-sans text-[13px] text-white/70 m-0 mb-4">
                Не намирате вашия размер? Поръчайте лента по индивидуални размери.
              </p>
              <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase text-orange">
                Отвори конфигуратор <IconArrowRight size={12} />
              </div>
            </div>
          </Link>
        </aside>

        {/* Products */}
        <div>
          {/* Configurator banner above products */}
          <Link href="/configurator" className="no-underline block mb-6">
            <div className="bg-paper border border-ink-15 p-5 flex items-center justify-between gap-4 hover:border-ink transition-colors">
              <div className="flex items-center gap-4">
                <IconRuler size={28} className="text-blue shrink-0" />
                <div>
                  <div className="font-display text-base font-bold text-ink">Поръчай лента по твоя размер</div>
                  <div className="font-mono text-[11px] text-ink-50 mt-0.5 tracking-[0.04em]">8 типа ленти · Дължина от 1650 до 12000 мм · Изработка за 24ч</div>
                </div>
              </div>
              <Btn variant="primary" size="sm" iconRight={<IconArrowRight size={12} />}>Конфигуратор</Btn>
            </div>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProducts.map((p) => (
              <ProductCard key={p.sku} p={p} compact />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
