"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Placeholder, Btn } from "@/components/ui/primitives";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { IconFilter, IconRuler, IconArrowRight } from "@/components/ui/icons";
import { ALL_PRODUCTS } from "@/lib/products-data";

const CATEGORIES: Record<string, { name: string; description: string; industry: string; parent?: string }> = {
  "dyrvo": { name: "Дърво", description: "Банцигови ленти, циркулярни триони и ножове за абрихт за дървообработка.", industry: "Дърво" },
  "horizontalni-bantsizi": { name: "Хоризонтални банцизи / Гатери", description: "Банцигови ленти за хоризонтални банцизи и гатери. MasterGold, Kodiak, Böhler.", industry: "Дърво", parent: "Дърво" },
  "vertikalni-bantsizi": { name: "Вертикални банцизи", description: "Банцигови ленти за вертикални банцизи. Всички размери по поръчка.", industry: "Дърво", parent: "Дърво" },
  "tsirkulyarni-trioni": { name: "Циркулярни триони", description: "Обикновени и със сменяеми твърдосплавни пластини. Диаметри от Ø100 до Ø600.", industry: "Дърво", parent: "Дърво" },
  "nozhove-za-abriht": { name: "Ножове за абрихт", description: "HSS и 100Cr6 ножове за абрихт машини. Дължини от 260 до 810 мм.", industry: "Дърво", parent: "Дърво" },
  "abrazivi": { name: "Абразиви, диамант, CBN", description: "Абразивни, диамантени и CBN заточни дискове. Охлаждащи течности.", industry: "Абразиви" },
  "metal": { name: "Метал", description: "Биметални и въглеродни отрезни ленти за металообработка.", industry: "Метал" },
  "bimetalni-lenti": { name: "Биметални отрезни ленти", description: "M42 и M51 биметални ленти за рязане на стомана до 68 HRC.", industry: "Метал", parent: "Метал" },
  "vyglerodna-lenti-cs": { name: "Въглеродна стомана CS", description: "Отрезни ленти от въглеродна стомана. Flexback и Hardback.", industry: "Метал", parent: "Метал" },
  "hobi-bantsig": { name: "Хоби банциг", description: "Ленти за Einhell, Parkside, Raider, Metabo, Scheppach и други хоби банцизи.", industry: "Хоби" },
  "hrani": { name: "Храни", description: "Лентови ножове за месо, риба, хляб и слайсъри.", industry: "Храни" },
  "meso-i-riba": { name: "Месо и риба", description: "Лентови ножове за рязане на месо и риба.", industry: "Храни", parent: "Храни" },
  "hlebni-izdeliya": { name: "Хлебни изделия", description: "Лентови ножове за хлеборезни машини.", industry: "Храни", parent: "Храни" },
  "slicers": { name: "Слайсъри", description: "Лентови ножове за слайсъри Bizerba, Berkel и др.", industry: "Храни", parent: "Храни" },
  "mashini": { name: "Машини", description: "Заточни машини, устройства за чапраз и оборудване.", industry: "Машини" },
  "konsumativi": { name: "Консумативи", description: "Резервни части, гърбици и измервателни уреди.", industry: "Машини", parent: "Машини" },
};

// Map categories to which product categories they include
const CATEGORY_INCLUDES: Record<string, string[]> = {
  "dyrvo": ["horizontalni-bantsizi", "tsirkulyarni-trioni", "nozhove-za-abriht"],
  "metal": ["bimetalni-lenti", "vyglerodna-lenti-cs"],
  "hrani": ["meso-i-riba", "hlebni-izdeliya", "slicers"],
  "mashini": ["mashini", "konsumativi"],
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [sort, setSort] = useState("Популярност");

  const category = CATEGORIES[slug];
  const categoryName = category?.name || slug;
  const categoryDesc = category?.description || "";
  const parentName = category?.parent;

  // Get products for this category (including subcategories for parent categories)
  const products = useMemo(() => {
    const includedCategories = CATEGORY_INCLUDES[slug]
      ? CATEGORY_INCLUDES[slug]
      : [slug];

    const filtered = ALL_PRODUCTS
      .filter((p) => includedCategories.includes(p.category))
      .map((p): ProductCardData => ({
        sku: p.slug,
        slug: p.slug,
        name: p.name,
        dim: "",
        price: p.price,
        industry: category?.industry || "Друго",
        stock: p.stock > 0 ? "На склад" : "Изчерпан",
        badge: p.topProduct ? "TOP" : null,
      }));

    // Sort
    if (sort === "Цена ↑") filtered.sort((a, b) => a.price - b.price);
    else if (sort === "Цена ↓") filtered.sort((a, b) => b.price - a.price);

    return filtered;
  }, [slug, sort]);

  // Subcategories
  const subcategories = Object.entries(CATEGORIES)
    .filter(([, cat]) => cat.parent === categoryName)
    .map(([subSlug, cat]) => ({
      slug: subSlug,
      name: cat.name,
      count: ALL_PRODUCTS.filter((p) => p.category === subSlug).length,
    }))
    .filter((s) => s.count > 0);

  return (
    <>
      {/* Header */}
      <div className="bg-paper border-b border-ink-15">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 md:py-12">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-6">
            <Link href="/" className="text-ink-50 no-underline hover:text-ink">Начало</Link>
            <span>/</span>
            {parentName && (
              <>
                <Link href={`/category/${Object.entries(CATEGORIES).find(([, c]) => c.name === parentName)?.[0] || ""}`} className="text-ink-50 no-underline hover:text-ink">
                  {parentName}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-ink">{categoryName}</span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl lg:text-6xl leading-none tracking-[-0.04em] font-bold m-0 text-ink">
            {categoryName}
          </h1>
          {categoryDesc && (
            <p className="font-sans text-base leading-relaxed text-ink-70 max-w-[700px] mt-4">{categoryDesc}</p>
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
            <span className="font-mono text-[11px] text-ink-50">{products.length} продукта</span>
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
        {/* Configurator banner */}
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

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Няма продукти в тази категория</h2>
            <p className="text-ink-50 mb-6">Опитайте конфигуратора за поръчка по размер.</p>
            <Link href="/configurator"><Btn variant="primary" size="lg">Конфигуратор</Btn></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.sku} p={p} compact />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
