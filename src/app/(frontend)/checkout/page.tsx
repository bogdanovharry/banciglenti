"use client";

import { useState } from "react";
import { SectionNumber, Placeholder, Btn } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";

const CART_ITEMS = [
  { sku: "M42-3810-27-09", name: "Биметална лента M42 HSS", qty: 10, price: 48.90 },
  { sku: "CIR-350-72-30", name: "Циркулярен трион HM", qty: 2, price: 96.40 },
  { sku: "CBN-200-3-10", name: "CBN заточен диск", qty: 1, price: 188.00 },
];

function Input({ label, placeholder = "" }: { label: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">{label}</span>
      <input placeholder={placeholder} className="w-full h-11 mt-1.5 px-3.5 border border-ink-15 font-sans text-sm outline-none bg-white focus:border-blue transition-colors" />
    </label>
  );
}

function CheckoutCard({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-ink-15 p-7">
      <div className="flex items-baseline gap-4 mb-5">
        <span className="font-mono text-[11px] text-orange tracking-[0.12em]">{num}</span>
        <h3 className="font-display text-[22px] font-bold m-0 text-ink tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function CheckoutPage() {
  const [method, setMethod] = useState("card");

  return (
    <div className="bg-paper">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 pb-[120px]">
        <div className="mb-12">
          <SectionNumber n="Step 02" label="Доставка и плащане" />
          <h1 className="font-display text-4xl md:text-[56px] leading-none tracking-[-0.04em] font-bold mt-5 text-ink">Завърши поръчка.</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          <div className="flex flex-col gap-6">
            <CheckoutCard num="01" title="Контакти">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Имейл" placeholder="you@company.bg" />
                <Input label="Телефон" placeholder="+359 …" />
              </div>
            </CheckoutCard>

            <CheckoutCard num="02" title="Адрес за доставка">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Име и фамилия" />
                <Input label="Фирма / ЕИК (незад.)" />
                <Input label="Град" />
                <Input label="Пощенски код" />
                <div className="md:col-span-2"><Input label="Адрес" placeholder="Улица, номер, офис" /></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[["Еконт", "24–48ч"], ["Спиди", "до 72ч"], ["Офис Tehnoles", "Габрово"]].map(([t, d], i) => (
                  <button key={t} className={`p-3.5 text-left border cursor-pointer ${i === 0 ? "border-ink bg-white" : "border-ink-15 bg-white hover:border-ink-30"} transition-colors`}>
                    <div className="font-display text-sm font-semibold text-ink">{t}</div>
                    <div className="font-mono text-[10px] text-ink-50 mt-0.5 tracking-[0.05em]">{d}</div>
                  </button>
                ))}
              </div>
            </CheckoutCard>

            <CheckoutCard num="03" title="Плащане">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[["card", "Карта · Visa / MC"], ["bank", "Банков превод"], ["cod", "Наложен платеж"]].map(([k, l]) => (
                  <button key={k} onClick={() => setMethod(k)} className={`py-4 px-3 border cursor-pointer font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${method === k ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}>
                    {l}
                  </button>
                ))}
              </div>
              {method === "card" && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3"><Input label="Номер на картата" placeholder="•••• •••• •••• ••••" /></div>
                  <Input label="Име на картата" />
                  <Input label="MM/YY" />
                  <Input label="CVC" />
                </div>
              )}
            </CheckoutCard>
          </div>

          {/* Summary sidebar */}
          <aside className="bg-white border border-ink-15 p-8 h-fit sticky top-[200px]">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-5">Поръчка · 3 артикула</div>
            {CART_ITEMS.map((it) => (
              <div key={it.sku} className="flex gap-3 py-3 border-b border-ink-05">
                <Placeholder tone="paper" ratio="1/1" className="w-12 shrink-0" caption="" />
                <div className="flex-1">
                  <div className="font-display text-[13px] font-semibold text-ink leading-tight">{it.name}</div>
                  <div className="font-mono text-[10px] text-ink-50 mt-0.5">{it.qty} × {it.price.toFixed(2)} лв</div>
                </div>
                <div className="font-mono text-[13px] font-semibold text-ink">{(it.qty * it.price).toFixed(2)}</div>
              </div>
            ))}
            <div className="mt-5 pt-5 border-t border-ink-15 flex justify-between items-baseline">
              <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">Общо с ДДС</span>
              <span className="font-display text-[32px] font-extrabold text-ink tracking-tight">993.44 <span className="text-xs font-normal text-ink-50">лв</span></span>
            </div>
            <div className="mt-5">
              <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />}>Потвърди поръчка</Btn>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
