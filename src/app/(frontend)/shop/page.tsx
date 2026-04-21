"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionNumber, Placeholder, Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconFilter, IconClose, IconMinus, IconRuler, IconArrowRight } from "@/components/ui/icons";
import { ALL_PRODUCTS } from "@/lib/products-data";

const CATEGORY_MAP: Record<string, string> = {
  "horizontalni-bantsizi": "Дърво",
  "hobi-bantsig": "Хоби",
  "bimetalni-lenti": "Метал",
  "tsirkulyarni-trioni": "Дърво",
  "nozhove-za-abriht": "Дърво",
  "abrazivi": "Абразиви",
  "mashini": "Машини",
  "konsumativi": "Машини",
};

const PLP_PRODUCTS: ProductCardData[] = ALL_PRODUCTS.map((p) => ({
  sku: p.slug,
  slug: p.slug,
  name: p.name,
  dim: "",
  price: p.price,
  industry: CATEGORY_MAP[p.category] || "Друго",
  stock: p.stock > 0 ? "На склад" as const : "Изчерпан" as const,
  badge: p.topProduct ? "TOP" as const : null,
}));

function FilterGroup({ title, items }: { title: string; items: [string, number][] }) {
  return (
    <div className="mb-7 pb-7 border-b border-ink-15">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 font-semibold">{title}</h4>
        <IconMinus size={14} className="text-ink-50" />
      </div>
      <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
        {items.map(([name, count]) => (
          <li key={name} className="flex justify-between font-sans text-[13px] text-ink-70">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="w-3.5 h-3.5 border border-ink-30 inline-block" />
              {name}
            </label>
            <span className="font-mono text-[11px] text-ink-50">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterRange({ title, min, max }: { title: string; min: number; max: number }) {
  return (
    <div className="mb-7 pb-7 border-b border-ink-15">
      <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-4 font-semibold">{title}</h4>
      <div className="flex gap-2">
        <input defaultValue={min} className="w-1/2 h-9 px-2.5 border border-ink-15 font-mono text-xs" />
        <input defaultValue={max} className="w-1/2 h-9 px-2.5 border border-ink-15 font-mono text-xs" />
      </div>
      <div className="relative h-0.5 bg-ink-15 mt-3.5">
        <div className="absolute left-[15%] right-[30%] h-0.5 bg-orange" />
      </div>
    </div>
  );
}

const CATEGORY_FILTERS = [
  { slug: "", label: "Всички", count: ALL_PRODUCTS.length },
  { slug: "horizontalni-bantsizi", label: "Хоризонтални банцизи", count: ALL_PRODUCTS.filter(p => p.category === "horizontalni-bantsizi").length },
  { slug: "hobi-bantsig", label: "Хоби банциг", count: ALL_PRODUCTS.filter(p => p.category === "hobi-bantsig").length },
  { slug: "bimetalni-lenti", label: "Биметални ленти", count: ALL_PRODUCTS.filter(p => p.category === "bimetalni-lenti").length },
  { slug: "tsirkulyarni-trioni", label: "Циркулярни триони", count: ALL_PRODUCTS.filter(p => p.category === "tsirkulyarni-trioni").length },
  { slug: "nozhove-za-abriht", label: "Ножове за абрихт", count: ALL_PRODUCTS.filter(p => p.category === "nozhove-za-abriht").length },
  { slug: "abrazivi", label: "Абразиви", count: ALL_PRODUCTS.filter(p => p.category === "abrazivi").length },
  { slug: "mashini", label: "Машини", count: ALL_PRODUCTS.filter(p => p.category === "mashini").length },
  { slug: "konsumativi", label: "Консумативи", count: ALL_PRODUCTS.filter(p => p.category === "konsumativi").length },
];

export default function ShopPage() {
  const [sort, setSort] = useState("Популярност");
  const [activeCategory, setActiveCategory] = useState("");

  const filteredProducts = activeCategory
    ? PLP_PRODUCTS.filter(p => {
        const original = ALL_PRODUCTS.find(op => op.slug === p.slug);
        return original?.category === activeCategory;
      })
    : PLP_PRODUCTS;

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
            Всички <span className="italic text-orange font-medium">продукти</span>
          </h1>
          <p className="font-sans text-base leading-relaxed text-ink-70 max-w-[580px] mt-4">
            {sortedProducts.length} артикула от {ALL_PRODUCTS.length} в нашия каталог. Филтрирайте по категория или използвайте конфигуратора за поръчка по размер.
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
                {CATEGORY_FILTERS.find(c => c.slug === activeCategory)?.label} <IconClose size={12} className="text-ink-50" />
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
              {CATEGORY_FILTERS.map((cat) => (
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
