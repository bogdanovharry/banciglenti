"use client";

import Link from "next/link";
import { Placeholder, Tag } from "@/components/ui/primitives";
import { IconPlus } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { currencySymbol, formatAmount } from "@/lib/market";
import { STOCK_LABELS, type StockState } from "@/lib/catalog-ui";


export interface ProductCardData {
  name: string;
  slug: string;
  sku: string;
  price: number;
  industry: string;
  dim: string;
  stock: StockState;
  badge?: "TOP" | "NEW" | null;
  image?: string;
  /** Drives the spec block that stands in for a photo. */
  specs?: { width?: number; thickness?: number; length?: number; material?: string };
  brandName?: string | null;
  stockCount?: number;
}

/**
 * These are commodity industrial parts: a buyer arrives knowing a size, not a
 * picture. So the dimensions are the card's focal point, set large in mono, and
 * a photo is used only when one actually exists. That inverts the usual
 * ecommerce card — and it means the 106 products with no photography read as
 * deliberate spec tiles rather than as missing images.
 */
function SpecBlock({
  specs,
  material,
}: {
  specs: { width?: number; thickness?: number; length?: number };
  material?: string;
}) {
  const hasDims = typeof specs.width === "number" && typeof specs.thickness === "number";
  const hasLength = typeof specs.length === "number";

  return (
    // 4:3 rather than square. A square tile left a lot of empty drafting grid
    // above and below a single line of figures, which read as a broken image
    // slot rather than as a deliberate spec panel.
    <div className="relative aspect-[4/3] bg-paper border-b border-ink-15 flex flex-col justify-center px-5 overflow-hidden">
      {/* Engineering grid, very low contrast — reads as drafting paper */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative">
        {hasLength ? (
          // Loop length leads: it is the one figure that must match the machine
          // exactly, so it gets the type size and the section rank.
          <>
            <div className="font-mono text-[38px] leading-none font-semibold text-ink tracking-[-0.03em] tabular-nums">
              {specs.length}
              <span className="text-[15px] text-ink-50 font-normal ml-1.5">мм</span>
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-50 mt-2">
              дължина на контура
            </div>
            {hasDims && (
              <div className="font-mono text-[12px] text-ink-70 mt-2.5 tabular-nums">
                {specs.width} × {specs.thickness} мм
              </div>
            )}
          </>
        ) : hasDims ? (
          <>
            <div className="font-mono text-[34px] leading-none font-semibold text-ink tracking-[-0.02em] tabular-nums">
              {specs.width}
              <span className="text-ink-30 mx-1.5">×</span>
              {specs.thickness}
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-50 mt-2">
              мм · широчина × дебелина
            </div>
          </>
        ) : null}
        {/* Products with no dimensions — machines, coolant, consumables — get
            the drafting grid and their material chip alone. The old fallback
            said "виж спецификация", which promises a specification the product
            does not have. */}

        {material && (
          <div className="mt-4 inline-flex font-mono text-[10px] tracking-[0.1em] uppercase bg-ink text-white px-2 py-1">
            {material}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCard({ p, compact }: { p: ProductCardData; compact?: boolean }) {
  const { addItem } = useCart();

  const stockColor =
    p.stock === "in" ? "text-ok" : p.stock === "low" ? "text-orange" : "text-ink-50";
  const soldOut = p.stock === "out";

  return (
    <article className="bg-white border border-ink-15 flex flex-col h-full transition-all duration-300 hover:border-ink hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(17,17,17,0.45)] group">
      <Link href={`/product/${p.slug}`} className="no-underline text-inherit flex flex-col h-full">
        {/* Visual: real photo when we have one, otherwise the spec itself */}
        <div className="relative overflow-hidden">
          {p.image ? (
            // Same 4:3 as the spec tile, so cards with and without photography
            // line up in the grid instead of stepping up and down.
            <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
              <Placeholder
                tone="paper"
                ratio="4/3"
                src={p.image}
                alt={p.name}
                fit="contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : (
            <SpecBlock specs={p.specs ?? {}} material={p.specs?.material} />
          )}

          {p.badge && (
            <div className="absolute top-3 left-3">
              <Tag tone={p.badge === "TOP" ? "orange" : "ink"}>{p.badge}</Tag>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`${compact ? "p-4" : "p-5"} flex flex-col gap-2 flex-1`}>
          <div className="flex justify-between items-center font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 gap-2">
            <span className="truncate">{p.brandName || p.industry}</span>
            <span className={`${stockColor} shrink-0`}>● {STOCK_LABELS[p.stock]}</span>
          </div>

          <h3 className="font-sans text-[14px] leading-snug tracking-[-0.01em] font-semibold text-ink m-0 line-clamp-2">
            {p.name}
          </h3>

          <div className="mt-auto pt-4 border-t border-ink-05 flex justify-between items-end gap-2">
            <div>
              <div className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink tabular-nums leading-none">
                {formatAmount(p.price)}{" "}
                <span className="text-[11px] text-ink-50 font-normal">{currencySymbol()}</span>
              </div>
              <div className="font-mono text-[10px] text-ink-50 mt-1 tabular-nums">без ДДС</div>
            </div>

            <button
              disabled={soldOut}
              className="flex items-center gap-1.5 px-3 py-2 bg-ink text-white border-none cursor-pointer font-mono text-[10px] tracking-[0.1em] uppercase hover:bg-orange transition-colors disabled:bg-ink-15 disabled:text-ink-50 disabled:cursor-not-allowed shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addItem({ sku: p.sku, name: p.name, dim: p.dim, price: p.price, quantity: 1 });
              }}
              aria-label={`Добави ${p.name} в количката`}
            >
              <IconPlus size={12} /> {soldOut ? "Няма" : "Добави"}
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
