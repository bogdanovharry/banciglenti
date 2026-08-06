"use client";

import Link from "next/link";
import { useState } from "react";
import { Placeholder, Tag, Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconHeart, IconMinus, IconPlus, IconTruck, IconShield, IconWrench } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";

export type ProductView = {
  slug: string;
  name: string;
  dim: string;
  price: number;
  brand: string | null;
  shortDescription: string | null;
  stockCount: number;
  topProduct: boolean;
  specs: { width?: number; thickness?: number; material?: string };
  breadcrumb: { slug: string; name: string } | null;
};

function SpecTable({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div>
      <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-4 font-semibold">{title}</h4>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-ink-15">
              <td className="py-3 font-sans text-sm text-ink-70">{k}</td>
              <td className="py-3 font-mono text-[13px] text-ink text-right">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductClient({ product }: { product: ProductView }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const inStock = product.stockCount > 0;

  const handleAddToCart = () => {
    addItem({
      sku: product.slug,
      name: product.name,
      dim: product.dim,
      price: product.price,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Only the specs actually recorded for this product — machines and consumables
  // carry no dimensions, so the table shrinks rather than inventing rows.
  const dimensionRows: [string, string][] = [
    ...(product.specs.width ? ([["Широчина / Ø", `${product.specs.width} мм`]] as [string, string][]) : []),
    ...(product.specs.thickness ? ([["Дебелина", `${product.specs.thickness} мм`]] as [string, string][]) : []),
  ];

  const materialRows: [string, string][] = [
    ...(product.specs.material ? ([["Материал", product.specs.material]] as [string, string][]) : []),
    ...(product.brand ? ([["Марка", product.brand]] as [string, string][]) : []),
    ["Наличност", inStock ? `${product.stockCount} бр.` : "Изчерпан"],
  ];

  return (
    <div className="bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-8 pb-20">
        {/* Breadcrumbs */}
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-10 flex-wrap">
          <Link href="/" className="cursor-pointer no-underline text-ink-50 hover:text-ink">Начало</Link>
          <span>/</span>
          {product.breadcrumb ? (
            <>
              <Link
                href={`/category/${product.breadcrumb.slug}`}
                className="cursor-pointer no-underline text-ink-50 hover:text-ink"
              >
                {product.breadcrumb.name}
              </Link>
              <span>/</span>
            </>
          ) : (
            <>
              <Link href="/shop" className="cursor-pointer no-underline text-ink-50 hover:text-ink">Каталог</Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">{product.slug}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            <Placeholder tone="paper" ratio="1/1" caption={product.name} />
          </div>

          {/* Info */}
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {product.topProduct && <Tag tone="orange">TOP</Tag>}
              <Tag tone={inStock ? "ok" : "outline"}>
                {inStock ? `На склад · ${product.stockCount} бр` : "Изчерпан"}
              </Tag>
            </div>

            <div className="font-mono text-[11px] text-ink-50 tracking-[0.1em] uppercase mb-2">
              SKU · {product.slug}
              {product.brand ? ` · ${product.brand}` : ""}
            </div>

            <h1 className="font-display text-3xl md:text-[44px] leading-[1.05] tracking-[-0.03em] font-bold m-0 mb-4 text-ink">
              {product.name}
              {product.dim && (
                <>
                  <br />
                  <span className="font-mono text-lg md:text-xl font-medium text-ink-70 tracking-[0.02em]">
                    {product.dim}
                  </span>
                </>
              )}
            </h1>

            {product.shortDescription && (
              <p className="font-sans text-[15px] leading-relaxed text-ink-70 m-0 mb-8">
                {product.shortDescription}
              </p>
            )}

            {/* Key specs */}
            {(product.specs.material || product.specs.width || product.specs.thickness) && (
              <div className="flex gap-0 border border-ink-15 mb-8">
                {[
                  product.specs.material ? [product.specs.material, "материал"] : null,
                  product.specs.width ? [`${product.specs.width} мм`, "широчина / Ø"] : null,
                  product.specs.thickness ? [`${product.specs.thickness} мм`, "дебелина"] : null,
                ]
                  .filter((x): x is string[] => x !== null)
                  .map(([v, l], i, arr) => (
                    <div key={l} className={`p-4 flex-1 ${i < arr.length - 1 ? "border-r border-ink-15" : ""}`}>
                      <div className="font-mono text-[9px] text-ink-50 tracking-[0.12em] uppercase">{l}</div>
                      <div className="font-display text-lg font-bold mt-1 text-ink">{v}</div>
                    </div>
                  ))}
              </div>
            )}

            {/* Custom size CTA */}
            <div className="mb-8 p-4 border border-ink-15 flex items-center justify-between gap-4">
              <div className="font-sans text-sm text-ink-70">Нужен ви е друг размер?</div>
              <Link href="/configurator" className="font-mono text-[11px] text-orange underline">
                Отвори конфигуратора →
              </Link>
            </div>

            {/* Price + Cart */}
            <div className="p-6 bg-paper mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">Единична цена</div>
                  <div className="font-display text-[44px] font-extrabold tracking-tight text-ink leading-none">
                    {product.price.toFixed(2)} <span className="text-base font-normal text-ink-50">€</span>
                  </div>
                  <div className="font-mono text-[11px] text-ink-50 mt-1">
                    {(product.price * 1.95583).toFixed(2)} лв · без ДДС
                  </div>
                </div>
                <div className="inline-flex items-center border border-ink-15 bg-white">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-12 bg-transparent border-none cursor-pointer text-ink-70"
                    aria-label="Намали количеството"
                  >
                    <IconMinus size={14} />
                  </button>
                  <input
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, +e.target.value || 1))}
                    className="w-12 h-12 text-center border-none font-mono text-base font-semibold outline-none"
                    aria-label="Количество"
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-12 bg-transparent border-none cursor-pointer text-ink-70"
                    aria-label="Увеличи количеството"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Btn
                    variant="primary"
                    size="lg"
                    fullWidth
                    iconRight={<IconArrowRight size={16} />}
                    onClick={handleAddToCart}
                    disabled={!inStock}
                  >
                    {!inStock
                      ? "Изчерпан"
                      : added
                        ? "✓ Добавено!"
                        : `Добави в количка · ${(product.price * qty).toFixed(2)} €`}
                  </Btn>
                </div>
                <button
                  className="w-14 h-14 border border-ink-15 bg-white cursor-pointer text-ink-70 flex items-center justify-center hover:text-ink transition-colors"
                  aria-label="Добави в списък"
                >
                  <IconHeart size={18} />
                </button>
              </div>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-0 border-t border-b border-ink-15">
              {[
                { Icon: IconTruck, title: "Доставка с куриер", desc: "безплатно над 200 €" },
                { Icon: IconShield, title: "Гаранция на заварката", desc: "скъсване на шева — подменяме" },
                { Icon: IconWrench, title: "Технически съвет", desc: "обадете се" },
              ].map((item, i) => (
                <div key={item.title} className={`p-4 flex gap-3 items-start ${i < 2 ? "border-r border-ink-15" : ""}`}>
                  <item.Icon size={22} className="text-orange shrink-0" />
                  <div>
                    <div className="font-display text-[13px] font-semibold text-ink">{item.title}</div>
                    <div className="font-mono text-[10px] text-ink-50 mt-0.5 tracking-[0.05em]">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specification */}
        {(dimensionRows.length > 0 || materialRows.length > 0) && (
          <div className="mt-24">
            <div className="border-b border-ink-15">
              <span className="inline-block px-6 py-4 font-mono text-xs tracking-[0.12em] uppercase text-ink border-b-2 border-orange -mb-px">
                Спецификация
              </span>
            </div>
            <div className="py-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              {dimensionRows.length > 0 && <SpecTable title="Размери" rows={dimensionRows} />}
              {materialRows.length > 0 && <SpecTable title="Изпълнение" rows={materialRows} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
