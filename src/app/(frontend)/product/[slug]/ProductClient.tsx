"use client";

import Link from "next/link";
import { useState } from "react";
import { Placeholder, Tag, Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconHeart, IconMinus, IconPlus, IconTruck, IconShield, IconWrench } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { SAW_MEISTER, SERIES, type SeriesKey } from "@/lib/series";
import { usePrices } from "@/lib/market-context";
import { DualPrice } from "@/components/ui/DualPrice";
import { packFromSlug, unitPriceInPack } from "@/lib/packs";

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
  series: SeriesKey | null;
  /** One line per blade in a mixed set; empty for everything else. */
  setContents?: string[];
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
  const { market, gross, amount, price, symbol } = usePrices();

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

  const series = product.series ? SERIES[product.series] : null;

  // What the box saves, in money. Derived from the tier rather than compared
  // against the single-blade product, which may not be on the page — and the
  // discount is defined as a percentage of the undiscounted total anyway.
  const pack = packFromSlug(product.slug);
  const contents = product.setContents ?? [];
  const fullUnitPrice = pack
    ? Math.round((product.price / pack.qty / (1 - pack.percent / 100)) * 100) / 100
    : 0;
  const packSaving = pack ? Math.round((fullUnitPrice * pack.qty - product.price) * 100) / 100 : 0;

  const materialRows: [string, string][] = [
    ...(product.specs.material ? ([["Материал", product.specs.material]] as [string, string][]) : []),
    ...(series ? ([["Серия", `${SAW_MEISTER} ${series.name}`], ["Тип", series.type]] as [string, string][]) : []),
    ...(product.brand && !series ? ([["Марка", product.brand]] as [string, string][]) : []),
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

            {/* What the series is for — the question behind "is this the right blade?" */}
            {series && (
              <div className="mb-8 border-l-2 border-orange pl-5">
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-50 mb-1.5">
                  Серия · {series.type} · {series.application}
                </div>
                <div className="font-display text-xl font-bold text-ink mb-2 tracking-tight">
                  {SAW_MEISTER} {series.name}
                </div>
                <p className="font-sans text-[14px] leading-relaxed text-ink-70 m-0">
                  {series.description}
                </p>
              </div>
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

            {/* What is in the box. The whole reason a set sells is that
                somebody already worked out which three blades cover the job —
                so the answer has to be on the page, above the price, not left
                to a count that says "3 blades" and nothing about which. */}
            {contents.length > 0 && (
              <div className="mb-6 border border-ink-15">
                <div className="px-5 py-3 bg-ink text-white font-mono text-[10px] tracking-[0.12em] uppercase">
                  В комплекта · {contents.length} ленти
                </div>
                <ul className="list-none m-0 p-0">
                  {contents.map((line, i) => {
                    const [spec, job] = line.split(" — ");
                    return (
                      <li
                        key={line}
                        className={`flex items-baseline gap-3 px-5 py-3 ${i > 0 ? "border-t border-ink-15" : ""}`}
                      >
                        <span className="font-mono text-[12px] text-ink font-semibold tabular-nums whitespace-nowrap">
                          {spec}
                        </span>
                        {job && <span className="font-sans text-[13px] text-ink-70">{job}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Price + Cart */}
            <div className="p-6 bg-paper mb-6">
              {/* The saving, stated as money rather than as a percent in
                  brackets at the end of the product name. A yard buys boxes on
                  the per-blade number, so that is the one set large; the
                  percentage is the hook that makes them look at it. */}
              {pack && pack.percent > 0 && (
                <div className="flex items-stretch gap-0 mb-5 -mt-1">
                  <div className="bg-orange text-white px-4 py-3 flex flex-col justify-center">
                    <div className="font-display text-[30px] font-extrabold leading-none tabular-nums tracking-[-0.02em]">
                      −{pack.percent}%
                    </div>
                  </div>
                  <div className="bg-ink text-white px-4 py-3 flex-1 flex flex-col justify-center">
                    <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-white/60">
                      Кутия {pack.qty} бр. — спестявате
                    </div>
                    <div className="font-display text-[18px] font-bold leading-none tabular-nums mt-1">
                      {amount(gross(packSaving))} {symbol}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                    {pack?.kind === "set"
                      ? `Цена за комплект · ${pack.qty} бр.`
                      : pack
                        ? `Цена за кутия · ${pack.qty} бр.`
                        : "Единична цена"}
                  </div>
                  <DualPrice net={product.price} size="lg" className="mt-1" />
                  {pack?.kind === "set" ? (
                    // Different blades — an average price describes none of
                    // them, so the count is stated and the contents are listed
                    // in the spec table below.
                    <div className="font-mono text-[11px] mt-1.5 text-orange font-semibold">
                      {pack.qty} различни ленти в комплекта
                    </div>
                  ) : pack ? (
                    // Per blade with VAT, like the headline figure above it, so
                    // the two can be compared without doing the tax in your head.
                    <div className="font-mono text-[11px] mt-1.5">
                      <span className="text-orange font-semibold">
                        {amount(gross(unitPriceInPack(product.price, pack.qty)))} {symbol}/бр.
                      </span>
                      {pack.percent > 0 && (
                        <span className="text-ink-50">
                          {" "}
                          · вместо {amount(gross(fullUnitPrice))} {symbol}
                        </span>
                      )}
                    </div>
                  ) : null}
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
                        : `Добави в количка · ${price(gross(product.price * qty))}`}
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
                {
                  Icon: IconTruck,
                  title: "Доставка с куриер",
                  desc:
                    market.carriage === "collect"
                      ? `${market.couriers.join(" · ")} · по тегло, на куриера`
                      : `безплатно над ${price(market.freeShippingThreshold)}`,
                },
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
