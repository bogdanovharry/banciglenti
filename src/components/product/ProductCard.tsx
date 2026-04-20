import Link from "next/link";
import { Placeholder, Tag } from "@/components/ui/primitives";
import { IconHeart, IconPlus } from "@/components/ui/icons";

export interface ProductCardData {
  name: string;
  slug: string;
  sku: string;
  price: number;
  industry: string;
  dim: string;
  stock: "На склад" | "Ниска наличност" | "Изчерпан";
  badge?: "TOP" | "NEW" | null;
}

export function ProductCard({ p, compact }: { p: ProductCardData; compact?: boolean }) {
  const stockColor =
    p.stock === "На склад" ? "text-ok" : p.stock === "Ниска наличност" ? "text-orange" : "text-ink-50";

  return (
    <article className="bg-white border border-ink-15 cursor-pointer flex flex-col transition-colors duration-150 hover:border-ink group">
      <Link href={`/product/${p.slug}`} className="no-underline text-inherit">
        {/* Image */}
        <div className="relative">
          <Placeholder tone="paper" ratio="1/1" caption={p.sku} />
          {p.badge && (
            <div className="absolute top-3 left-3">
              <Tag tone={p.badge === "TOP" ? "orange" : "ink"}>{p.badge}</Tag>
            </div>
          )}
          <button
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white border border-ink-15 cursor-pointer text-ink-70 hover:text-ink hover:border-ink transition-colors"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Добави в списък"
          >
            <IconHeart size={14} />
          </button>
        </div>

        {/* Info */}
        <div className={`${compact ? "p-4" : "p-6"} flex flex-col gap-2 flex-1`}>
          <div className="flex justify-between font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50">
            <span>{p.industry}</span>
            <span className={stockColor}>● {p.stock}</span>
          </div>

          <h3 className={`font-display ${compact ? "text-base" : "text-lg"} leading-tight tracking-tight font-semibold text-ink m-0`}>
            {p.name}
          </h3>

          <div className="font-mono text-[11px] text-ink-70 tracking-[0.02em]">{p.dim}</div>

          <div className="mt-auto pt-4 border-t border-ink-05 flex justify-between items-end">
            <div>
              <div className="font-mono text-[9px] text-ink-50 tracking-[0.12em] uppercase">от</div>
              <div className="font-display text-[22px] font-bold tracking-tight text-ink">
                {p.price.toFixed(2)} <span className="text-[11px] text-ink-50 font-normal">лв</span>
              </div>
            </div>
            <button
              className="flex items-center gap-1.5 px-3 py-2 bg-ink text-white border-none cursor-pointer font-mono text-[10px] tracking-[0.1em] uppercase hover:bg-ink-80 transition-colors"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <IconPlus size={12} /> Добави
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
