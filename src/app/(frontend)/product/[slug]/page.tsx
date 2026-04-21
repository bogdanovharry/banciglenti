"use client";

import Link from "next/link";
import { useState } from "react";
import { Placeholder, Tag, Btn } from "@/components/ui/primitives";
import { IconArrowRight, IconHeart, IconMinus, IconPlus, IconTruck, IconShield, IconWrench, IconDoc } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";

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

export default function ProductPage() {
  const [tab, setTab] = useState("specs");
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState("3810×27");
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      sku: "M42-3810-27-09",
      name: "Биметална лента M42 HSS",
      dim: `${variant} мм · 3 TPI`,
      price: 48.90,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-8 pb-20">
        {/* Breadcrumbs */}
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex gap-2 mb-10">
          <Link href="/" className="cursor-pointer no-underline text-ink-50 hover:text-ink">Начало</Link>
          <span>/</span>
          <Link href="/shop" className="cursor-pointer no-underline text-ink-50 hover:text-ink">Биметални ленти M42</Link>
          <span>/</span>
          <span className="text-ink">M42-3810-27-09</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="grid grid-cols-[80px_1fr] gap-4">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Placeholder key={i} tone="paper" ratio="1/1" caption={`0${i + 1}`} className={i === 0 ? "border-2 border-ink" : "border border-ink-15"} />
              ))}
            </div>
            <Placeholder tone="paper" ratio="1/1" caption="Main product photo · M42 HSS · 3810×27×0.9" />
          </div>

          {/* Info */}
          <div>
            <div className="flex gap-2 mb-5 flex-wrap">
              <Tag tone="orange">TOP SELLER</Tag>
              <Tag tone="ok">На склад · 128 бр</Tag>
              <Tag tone="outline">TÜV NORD</Tag>
            </div>
            <div className="font-mono text-[11px] text-ink-50 tracking-[0.1em] uppercase mb-2">SKU · M42-3810-27-09 · Tehnoles</div>
            <h1 className="font-display text-3xl md:text-[44px] leading-[1.05] tracking-[-0.03em] font-bold m-0 mb-4 text-ink">
              Биметална лента M42 HSS<br />
              <span className="font-mono text-lg md:text-xl font-medium text-ink-70 tracking-[0.02em]">3810 × 27 × 0.9 мм · 3 TPI</span>
            </h1>
            <p className="font-sans text-[15px] leading-relaxed text-ink-70 m-0 mb-8">
              Висококачествена биметална банцигова лента с HSS зъб и пружинен въглероден гръб. За рязане на въглеродна, легирана стомана и инструментални профили до 68 HRC.
            </p>

            {/* Key specs */}
            <div className="grid grid-cols-4 gap-0 border border-ink-15 mb-8">
              {[["M42", "материал"], ["3 TPI", "зъби"], ["0.9 мм", "дебелина"], ["68 HRC", "max"]].map(([v, l], i) => (
                <div key={l} className={`p-4 ${i < 3 ? "border-r border-ink-15" : ""}`}>
                  <div className="font-mono text-[9px] text-ink-50 tracking-[0.12em] uppercase">{l}</div>
                  <div className="font-display text-lg font-bold mt-1 text-ink">{v}</div>
                </div>
              ))}
            </div>

            {/* Variants */}
            <div className="mb-8">
              <div className="flex justify-between mb-3">
                <label className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-50">Размер · мм</label>
                <Link href="/configurator" className="font-mono text-[11px] text-orange underline">Друг размер → Конфигуратор</Link>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {["2750×20", "3350×27", "3810×27", "4570×34"].map((v) => (
                  <button key={v} onClick={() => setVariant(v)} className={`py-3.5 font-mono text-[13px] font-medium cursor-pointer border transition-colors ${variant === v ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* TPI */}
            <div className="mb-8">
              <label className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-50 block mb-3">Зъби / инч</label>
              <div className="grid grid-cols-6 gap-1.5">
                {["2/3", "3", "4", "5/8", "8", "10"].map((v, i) => (
                  <button key={v} className={`py-3 font-mono text-xs cursor-pointer border transition-colors ${i === 1 ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Price + Cart */}
            <div className="p-6 bg-paper mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-5">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">Единична цена</div>
                  <div className="font-display text-[44px] font-extrabold tracking-tight text-ink leading-none">48.90 <span className="text-base font-normal text-ink-50">лв</span></div>
                  <div className="font-mono text-[11px] text-ink-50 mt-1">от 5 бр · 44.00 лв · от 20 бр · 38.80 лв</div>
                </div>
                <div className="inline-flex items-center border border-ink-15 bg-white">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-12 bg-transparent border-none cursor-pointer text-ink-70"><IconMinus size={14} /></button>
                  <input value={qty} onChange={(e) => setQty(+e.target.value || 1)} className="w-12 h-12 text-center border-none font-mono text-base font-semibold outline-none" />
                  <button onClick={() => setQty(qty + 1)} className="w-10 h-12 bg-transparent border-none cursor-pointer text-ink-70"><IconPlus size={14} /></button>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />} onClick={handleAddToCart}>
                    {added ? "✓ Добавено!" : `Добави в количка · ${(48.9 * qty).toFixed(2)} лв`}
                  </Btn>
                </div>
                <button className="w-14 h-14 border border-ink-15 bg-white cursor-pointer text-ink-70 flex items-center justify-center hover:text-ink transition-colors">
                  <IconHeart size={18} />
                </button>
              </div>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-0 border-t border-b border-ink-15">
              {[
                { Icon: IconTruck, title: "Доставка 24–48ч", desc: "безплатно над 200 лв" },
                { Icon: IconShield, title: "Гаранция 12м", desc: "или връщане" },
                { Icon: IconWrench, title: "Технически съвет", desc: "обадете се" },
              ].map((item, i) => (
                <div key={i} className={`p-4 flex gap-3 items-start ${i < 2 ? "border-r border-ink-15" : ""}`}>
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

        {/* Spec tabs */}
        <div className="mt-24">
          <div className="border-b border-ink-15 flex gap-0">
            {[["specs", "Спецификация"], ["app", "Приложения"], ["down", "Документи"], ["rev", "Отзиви · 48"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-6 py-4 font-mono text-xs tracking-[0.12em] uppercase bg-transparent border-none cursor-pointer -mb-px transition-colors ${tab === k ? "text-ink border-b-2 border-orange" : "text-ink-50 border-b-2 border-transparent"}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === "specs" && (
            <div className="py-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              <SpecTable title="Размери" rows={[["Обща дължина", "3 810 мм"], ["Широчина", "27 мм"], ["Дебелина", "0.9 мм"], ["Допуск", "±0.01 мм"]]} />
              <SpecTable title="Зъб" rows={[["Тип", "M42 HSS"], ["Зъби на инч", "3 TPI"], ["Форма", "Positive rake"], ["Коравина", "68 HRC"]]} />
              <SpecTable title="Гръб" rows={[["Материал", "C75 пруж. стомана"], ["Коравина", "42 HRC"], ["Заваръка", "Индукционна"], ["Термообработка", "Отпусната"]]} />
              <SpecTable title="Приложение" rows={[["Въглеродна стомана", "★★★★★"], ["Легирана стомана", "★★★★☆"], ["Неръждавейка", "★★★★☆"], ["Алуминий", "★★★☆☆"]]} />
            </div>
          )}
          {tab === "app" && (
            <div className="py-10 font-sans text-[15px] text-ink-70 leading-relaxed max-w-[720px]">
              <p>Идеална за ежедневна производствена работа по рязане на пълен материал и профили: греди, тръби, листи, шинни пакети.</p>
              <ul className="mt-3">
                <li>Конструкционна стомана S235–S355</li>
                <li>Легирана и инструментална стомана до 68 HRC</li>
                <li>Неръждавейки серии 300 и 400</li>
                <li>Алуминиеви сплави и цветни метали</li>
              </ul>
            </div>
          )}
          {tab === "down" && (
            <div className="py-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-[960px]">
              {["Техническа спецификация · PDF", "Сертификат за качество · PDF", "Инструкция за монтаж · PDF"].map((d) => (
                <div key={d} className="p-5 border border-ink-15 flex gap-3 cursor-pointer hover:border-ink transition-colors">
                  <IconDoc size={28} className="text-navy" />
                  <div>
                    <div className="font-display text-sm font-semibold text-ink">{d}</div>
                    <div className="font-mono text-[10px] text-ink-50 mt-1">2.4 MB · BG / EN</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "rev" && (
            <div className="py-10 font-sans text-sm text-ink-50">Отзиви от професионални клиенти · 4.8 / 5 от 48 оценки.</div>
          )}
        </div>
      </div>
    </div>
  );
}
