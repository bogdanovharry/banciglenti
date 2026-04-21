"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionNumber, Placeholder, Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconFilter, IconClose, IconMinus, IconRuler, IconArrowRight } from "@/components/ui/icons";

const PLP_PRODUCTS: ProductCardData[] = [
  { sku: "M42-3810-27-09", slug: "bimetalna-lenta-m42-hss", name: "Биметална лента M42 HSS", dim: "3810 × 27 × 0.9 мм · 3 TPI", price: 48.90, industry: "Метал", stock: "На склад", badge: "TOP" },
  { sku: "M42-2750-20-09", slug: "bimetalna-lenta-m42-2750", name: "Биметална лента M42 HSS", dim: "2750 × 20 × 0.9 мм · 4 TPI", price: 36.20, industry: "Метал", stock: "На склад", badge: null },
  { sku: "M51-5280-41-13", slug: "bimetalna-lenta-m51-cobalt", name: "Биметална лента M51 Cobalt", dim: "5280 × 41 × 1.3 мм · 2/3 TPI", price: 112.50, industry: "Метал", stock: "Изчерпан", badge: null },
  { sku: "CS-2240-13-06", slug: "vyglerodna-cs-hardback", name: "Въглеродна CS Hardback", dim: "2240 × 13 × 0.65 мм · 6 TPI", price: 18.40, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "CS-3350-20-08", slug: "vyglerodna-cs-flexback", name: "Въглеродна CS Flexback", dim: "3350 × 20 × 0.8 мм · 3 TPI", price: 24.80, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "SL-2455-16-05", slug: "lenta-za-slaysyr-bizerba", name: "Лента за слайсър Bizerba", dim: "2455 × 16 × 0.5 мм · 4 TPI", price: 32.00, industry: "Храни", stock: "Ниска наличност", badge: "NEW" },
  { sku: "CIR-350-72-30", slug: "tsirkulyaren-trion-hm-350", name: "Циркулярен трион HM", dim: "Ø350 × 3.2 · 72 зъба", price: 96.40, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "CIR-250-48-30", slug: "tsirkulyaren-trion-hm-250", name: "Циркулярен трион HM", dim: "Ø250 × 2.8 · 48 зъба", price: 64.20, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "CBN-200-3-10", slug: "cbn-zatochen-disk", name: "CBN заточен диск", dim: "Ø200 × 3 × 10 мм", price: 188.00, industry: "Абразиви", stock: "На склад", badge: null },
  { sku: "DIA-150-2-12", slug: "diamanten-zatochen-disk", name: "Диамантен заточен диск", dim: "Ø150 × 2 × 12 мм", price: 142.00, industry: "Абразиви", stock: "На склад", badge: null },
  { sku: "ABR-180-22-06", slug: "abraziven-nozh-za-abriht", name: "Абразивен нож за абрихт", dim: "180 × 22 × 6 мм", price: 38.00, industry: "Дърво", stock: "На склад", badge: null },
  { sku: "M42-4570-34-11", slug: "bimetalna-lenta-m42-4570", name: "Биметална лента M42 HSS", dim: "4570 × 34 × 1.1 мм · 3 TPI", price: 74.50, industry: "Метал", stock: "На склад", badge: null },
];

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

export default function ShopPage() {
  const [sort, setSort] = useState("Популярност");

  return (
    <>
      {/* Header */}
      <div className="bg-paper border-b border-ink-15">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 md:py-12">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-6">
            <Link href="/" className="cursor-pointer text-ink-50 no-underline hover:text-ink">Начало</Link>
            <span>/</span>
            <span className="text-ink">Биметални ленти M42</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-end">
            <div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-7xl leading-none tracking-[-0.04em] font-bold m-0 text-ink">
                Биметални ленти <span className="italic text-orange font-medium">M42 HSS</span>
              </h1>
              <p className="font-sans text-base leading-relaxed text-ink-70 max-w-[580px] mt-6">
                HSS зъб, пружинен гръб. За рязане на въглеродна, легирана, закалена стомана и инструментални профили до 68 HRC.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-0 border-l border-ink-15">
              {[["124", "артикула"], ["≤ 68", "HRC"], ["3 800+", "продажби"]].map(([v, l]) => (
                <div key={l} className="px-4 py-3 border-r border-ink-15">
                  <div className="font-display text-[28px] font-bold text-ink tracking-tight">{v}</div>
                  <div className="font-mono text-[9px] text-ink-50 tracking-[0.12em] uppercase mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-ink-15 bg-white sticky top-[168px] z-30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3.5 py-2 border border-ink-15 bg-white font-mono text-[11px] tracking-[0.08em] uppercase text-ink cursor-pointer">
              <IconFilter size={14} /> Филтри · 4
            </button>
            <div className="hidden md:flex gap-2">
              {["3810 мм", "27 мм", "M42", "На склад"].map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-paper font-mono text-[11px] text-ink">
                  {f} <IconClose size={12} className="text-ink-50 cursor-pointer" />
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.05em] text-ink-50">
            <span className="hidden md:inline">{PLP_PRODUCTS.length} от 124</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="font-mono text-[11px] p-2 border border-ink-15 bg-white">
              <option>Популярност</option>
              <option>Цена ↑</option>
              <option>Цена ↓</option>
              <option>Нови</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 md:py-[40px] pb-20 md:pb-[120px] grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <FilterGroup title="Индустрия" items={[["Метал", 48], ["Дърво", 32], ["Храни", 18], ["Абразиви", 26]]} />
          <FilterGroup title="Материал" items={[["M42 HSS", 72], ["M51 Cobalt", 14], ["CS Hardback", 24], ["CS Flexback", 14]]} />
          <FilterGroup title="Наличност" items={[["На склад", 98], ["По поръчка", 26]]} />
          <FilterRange title="Дължина, мм" min={1650} max={12000} />
          <FilterRange title="Широчина, мм" min={6} max={80} />
          <FilterRange title="Цена, лв" min={10} max={280} />
          <FilterGroup title="Марка" items={[["Tehnoles", 56], ["Sandvik", 32], ["Bahco", 18], ["Starrett", 12]]} />

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
            {PLP_PRODUCTS.map((p) => (
              <ProductCard key={p.sku} p={p} compact />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
