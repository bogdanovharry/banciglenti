"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Placeholder, Tag, Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconMinus, IconPlus, IconTruck, IconShield, IconWrench } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { SAW_MEISTER, SERIES, type SeriesKey } from "@/lib/series";
import { usePrices } from "@/lib/market-context";
import { DualPrice } from "@/components/ui/DualPrice";
import { packFromSlug, unitPriceInPack } from "@/lib/packs";
import type { StockState } from "@/lib/catalog-ui";

export type ProductView = {
  slug: string;
  name: string;
  dim: string;
  price: number;
  brand: string | null;
  shortDescription: string | null;
  stockCount: number;
  /** in / low / out / order — what the page says and whether it can be bought. */
  stock: StockState;
  topProduct: boolean;
  specs: { width?: number; thickness?: number; material?: string };
  series: SeriesKey | null;
  /** One line per blade in a mixed set; empty for everything else. */
  setContents?: string[];
  /** "Holzmann BS128HDR" — machines this size is known to fit. */
  machines?: string[];
  /** Uploaded photo, or the representative one — same as the product card. */
  image?: string | null;
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
  const t = useTranslations("catalog");
  const tc = useTranslations("common");
  const tStock = useTranslations("stock");

  // Made to order is always buyable; only a real zero in stock is refused.
  const inStock = product.stock !== "out";
  // A piece count is shown only when it is a warning. The number on an ordinary
  // product is a placeholder, and on a made-to-order one it means nothing.
  const stockText =
    product.stock === "low"
      ? `${tStock("low")} · ${t("product.piecesShort", { count: product.stockCount })}`
      : tStock(product.stock);
  const mm = t("unit.mm");
  const machines = product.machines ?? [];

  const handleAddToCart = () => {
    addItem({
      sku: product.slug,
      name: product.name,
      dim: product.dim,
      price: product.price,
      quantity: qty,
      image: product.image ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Only the specs actually recorded for this product — machines and consumables
  // carry no dimensions, so the table shrinks rather than inventing rows.
  const dimensionRows: [string, string][] = [
    ...(product.specs.width ? ([[t("product.widthDiameter"), `${product.specs.width} ${mm}`]] as [string, string][]) : []),
    ...(product.specs.thickness ? ([[t("product.thickness"), `${product.specs.thickness} ${mm}`]] as [string, string][]) : []),
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
    ...(product.specs.material ? ([[t("product.material"), product.specs.material]] as [string, string][]) : []),
    ...(series ? ([[t("product.series"), `${SAW_MEISTER} ${series.name}`], [t("product.type"), t(`series.${series.key}.type`)]] as [string, string][]) : []),
    ...(product.brand && !series ? ([[t("product.brand"), product.brand]] as [string, string][]) : []),
    [t("product.availability"), stockText],
  ];

  return (
    <div className="bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-8 pb-20">
        {/* Breadcrumbs */}
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-10 flex-wrap">
          <Link href="/" className="cursor-pointer no-underline text-ink-50 hover:text-ink">{tc("home")}</Link>
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
              <Link href="/shop" className="cursor-pointer no-underline text-ink-50 hover:text-ink">{tc("catalogue")}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div>
            {product.image ? (
              <Placeholder
                tone="paper"
                ratio="1/1"
                src={product.image}
                alt={product.name}
                fit="contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                preload
              />
            ) : (
              <Placeholder tone="paper" ratio="1/1" caption={product.name} />
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {product.topProduct && <Tag tone="orange">TOP</Tag>}
              <Tag tone={inStock ? "ok" : "outline"}>{stockText}</Tag>
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
                  {t("product.series")} · {t(`series.${series.key}.type`)} · {t(`series.${series.key}.application`)}
                </div>
                <div className="font-display text-xl font-bold text-ink mb-2 tracking-tight">
                  {SAW_MEISTER} {series.name}
                </div>
                <p className="font-sans text-[14px] leading-relaxed text-ink-70 m-0">
                  {t(`series.${series.key}.description`)}
                </p>
              </div>
            )}

            {/* Key specs */}
            {(product.specs.material || product.specs.width || product.specs.thickness) && (
              <div className="flex gap-0 border border-ink-15 mb-8">
                {[
                  product.specs.material ? [product.specs.material, t("product.materialLower")] : null,
                  product.specs.width ? [`${product.specs.width} ${mm}`, t("product.widthDiameterLower")] : null,
                  product.specs.thickness ? [`${product.specs.thickness} ${mm}`, t("product.thicknessLower")] : null,
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
              <div className="font-sans text-sm text-ink-70">{t("product.otherSize")}</div>
              <Link href="/configurator" className="font-mono text-[11px] text-orange underline">
                {t("product.openConfigurator")}
              </Link>
            </div>

            {/* What is in the box. The whole reason a set sells is that
                somebody already worked out which three blades cover the job —
                so the answer has to be on the page, above the price, not left
                to a count that says "3 blades" and nothing about which. */}
            {contents.length > 0 && (
              <div className="mb-6 border border-ink-15">
                <div className="px-5 py-3 bg-ink text-white font-mono text-[10px] tracking-[0.12em] uppercase">
                  {t("product.inTheBox", { count: contents.length })}
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
                      {t("product.boxSaving", { qty: pack.qty })}
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
                      ? t("product.setPrice", { qty: pack.qty })
                      : pack
                        ? t("product.boxPrice", { qty: pack.qty })
                        : t("product.unitPrice")}
                  </div>
                  <DualPrice net={product.price} size="lg" className="mt-1" />
                  {pack?.kind === "set" ? (
                    // Different blades — an average price describes none of
                    // them, so the count is stated and the contents are listed
                    // in the spec table below.
                    <div className="font-mono text-[11px] mt-1.5 text-orange font-semibold">
                      {t("product.differentInSet", { qty: pack.qty })}
                    </div>
                  ) : pack ? (
                    // Per blade with VAT, like the headline figure above it, so
                    // the two can be compared without doing the tax in your head.
                    <div className="font-mono text-[11px] mt-1.5">
                      <span className="text-orange font-semibold">
                        {t("pack.perPiece", { amount: amount(gross(unitPriceInPack(product.price, pack.qty))), symbol })}
                      </span>
                      {pack.percent > 0 && (
                        <span className="text-ink-50">
                          {" "}
                          · {t("product.insteadOf", { amount: amount(gross(fullUnitPrice)), symbol })}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="inline-flex items-center border border-ink-15 bg-white">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-12 bg-transparent border-none cursor-pointer text-ink-70"
                    aria-label={t("product.qtyDecrease")}
                  >
                    <IconMinus size={14} />
                  </button>
                  <input
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, +e.target.value || 1))}
                    className="w-12 h-12 text-center border-none font-mono text-base font-semibold outline-none"
                    aria-label={t("product.qty")}
                  />
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-12 bg-transparent border-none cursor-pointer text-ink-70"
                    aria-label={t("product.qtyIncrease")}
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
                      ? tStock("out")
                      : added
                        ? t("product.added")
                        : t("product.addToCart", { price: price(gross(product.price * qty)) })}
                  </Btn>
                </div>
              </div>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-0 border-t border-b border-ink-15">
              {[
                {
                  Icon: IconTruck,
                  title: t("product.courierDelivery"),
                  desc:
                    market.carriage === "collect"
                      ? t("product.courierCollect", { couriers: market.couriers.join(" · ") })
                      : t("product.freeOver", { threshold: price(market.freeShippingThreshold) }),
                },
                { Icon: IconShield, title: t("product.weldWarranty"), desc: t("product.weldWarrantyNote") },
                { Icon: IconWrench, title: t("product.techAdvice"), desc: t("product.techAdviceNote") },
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
        {(dimensionRows.length > 0 || materialRows.length > 0 || machines.length > 0) && (
          <div className="mt-24">
            <div className="border-b border-ink-15">
              <span className="inline-block px-6 py-4 font-mono text-xs tracking-[0.12em] uppercase text-ink border-b-2 border-orange -mb-px">
                {t("product.specification")}
              </span>
            </div>
            <div className="py-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              {dimensionRows.length > 0 && <SpecTable title={t("product.dimensions")} rows={dimensionRows} />}
              {materialRows.length > 0 && <SpecTable title={t("product.construction")} rows={materialRows} />}
            </div>
            {machines.length > 0 && (
              <div className="pb-10">
                <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink m-0 mb-4 font-semibold">
                  {t("product.fitsMachines")}
                </h4>
                <ul className="list-none m-0 p-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12">
                  {machines.map((m) => (
                    <li key={m} className="py-3 border-b border-ink-15 font-sans text-sm text-ink-70">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
