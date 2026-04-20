"use client";

import Link from "next/link";
import { SectionNumber, Placeholder, Btn } from "@/components/ui/primitives";
import { IconMinus, IconPlus, IconClose, IconArrowRight } from "@/components/ui/icons";

const CART_ITEMS = [
  { sku: "M42-3810-27-09", name: "Биметална лента M42 HSS", dim: "3810 × 27 × 0.9 · 3 TPI", qty: 10, price: 48.90 },
  { sku: "CIR-350-72-30", name: "Циркулярен трион HM", dim: "Ø350 × 3.2 · 72 зъба", qty: 2, price: 96.40 },
  { sku: "CBN-200-3-10", name: "CBN заточен диск", dim: "Ø200 × 3 × 10", qty: 1, price: 188.00 },
];

export default function CartPage() {
  const subtotal = CART_ITEMS.reduce((s, i) => s + i.qty * i.price, 0);
  const shipping = subtotal > 200 ? 0 : 12;
  const tax = subtotal * 0.2;
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 pb-[120px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div>
            <SectionNumber n="Step 01" label="Количка" />
            <h1 className="font-display text-4xl md:text-[64px] leading-none tracking-[-0.04em] font-bold mt-5 text-ink">Вашата поръчка.</h1>
          </div>
          <div className="flex gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">
            <span className="text-orange">● Количка</span>
            <span>○ Доставка</span>
            <span>○ Плащане</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          {/* Items */}
          <div className="bg-white border border-ink-15">
            <div className="hidden md:grid grid-cols-[2fr_120px_140px_120px_40px] px-7 py-4 border-b border-ink-15 font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
              <span>Артикул</span><span>Ед. цена</span><span>Количество</span><span className="text-right">Сума</span><span />
            </div>
            {CART_ITEMS.map((it) => (
              <div key={it.sku} className="p-6 border-b border-ink-15 grid grid-cols-1 md:grid-cols-[2fr_120px_140px_120px_40px] items-center gap-4">
                <div className="flex gap-4 items-center">
                  <Placeholder tone="paper" ratio="1/1" className="w-[72px] shrink-0" caption="" />
                  <div>
                    <div className="font-display text-[15px] font-semibold text-ink">{it.name}</div>
                    <div className="font-mono text-[11px] text-ink-50 mt-1">{it.dim} · SKU {it.sku}</div>
                  </div>
                </div>
                <div className="font-mono text-[13px] text-ink-70">{it.price.toFixed(2)} лв</div>
                <div className="inline-flex border border-ink-15 bg-white">
                  <button className="w-8 h-9 bg-transparent border-none cursor-pointer"><IconMinus size={12} /></button>
                  <div className="w-10 h-9 flex items-center justify-center font-mono text-[13px] font-semibold">{it.qty}</div>
                  <button className="w-8 h-9 bg-transparent border-none cursor-pointer"><IconPlus size={12} /></button>
                </div>
                <div className="text-right font-display text-lg font-bold text-ink">{(it.qty * it.price).toFixed(2)} <span className="text-[11px] font-normal text-ink-50">лв</span></div>
                <button className="bg-transparent border-none cursor-pointer text-ink-50 hover:text-ink"><IconClose size={16} /></button>
              </div>
            ))}
            <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
              <Link href="/shop" className="font-mono text-xs text-ink-70 tracking-[0.05em] no-underline hover:text-ink">← Продължи пазаруването</Link>
              <div className="flex gap-2">
                <input placeholder="Код за отстъпка" className="h-10 px-3.5 border border-ink-15 font-mono text-xs" />
                <Btn variant="ghost" size="sm">Приложи</Btn>
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="bg-ink text-white p-8 h-fit">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-5">Обобщение</div>
            <div className="flex flex-col gap-3.5 font-sans text-sm">
              {[
                ["Междинна сума", `${subtotal.toFixed(2)} лв`],
                ["Доставка", shipping === 0 ? "Безплатно" : `${shipping.toFixed(2)} лв`],
                ["ДДС 20%", `${tax.toFixed(2)} лв`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-white/65">{k}</span><span>{v}</span></div>
              ))}
              <div className="h-px bg-white/15 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-white/60">Общо</span>
                <span className="font-display text-4xl font-extrabold tracking-tight">{total.toFixed(2)} <span className="text-[13px] text-white/60 font-normal">лв</span></span>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/checkout" className="no-underline">
                <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />}>Към плащане</Btn>
              </Link>
            </div>
            <div className="mt-6 font-mono text-[10px] text-white/55 tracking-[0.05em] flex flex-col gap-2">
              <span>● Безплатна доставка над 200 лв</span>
              <span>● Гаранция за всеки артикул</span>
              <span>● Защитено плащане SSL</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
