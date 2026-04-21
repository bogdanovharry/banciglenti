"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionNumber, Placeholder, Btn } from "@/components/ui/primitives";
import { IconArrowRight } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";

function Input({ label, placeholder = "", type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">{label}</span>
      <input type={type} placeholder={placeholder} className="w-full h-11 mt-1.5 px-3.5 border border-ink-15 font-sans text-sm outline-none bg-white focus:border-blue transition-colors" />
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
  const [submitted, setSubmitted] = useState(false);
  const { items, itemCount, subtotal, shipping, tax, total, clearCart } = useCart();

  if (submitted) {
    return (
      <div className="bg-paper min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="font-display text-3xl font-bold text-ink mb-4">Поръчката е изпратена!</h1>
          <p className="font-sans text-ink-50 mb-4">Ще получите потвърждение на имейла си. Нашият екип ще се свърже с вас до 24 часа.</p>
          <p className="font-mono text-[11px] text-ink-50 mb-8">Номер на поръчка: #TL-{Date.now().toString(36).toUpperCase()}</p>
          <Link href="/"><Btn variant="primary" size="lg">Към началото</Btn></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-paper min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink mb-4">Количката е празна</h1>
          <Link href="/shop"><Btn variant="primary" size="lg">Към каталога</Btn></Link>
        </div>
      </div>
    );
  }

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
                <Input label="Имейл" placeholder="you@company.bg" type="email" />
                <Input label="Телефон" placeholder="+359 …" type="tel" />
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
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[["Еконт", "24–48ч"], ["Спиди", "до 72ч"], ["Офис Tehnoles", "Габрово"]].map(([t, d], i) => (
                  <button key={t} className={`p-3.5 text-left border cursor-pointer transition-colors ${i === 0 ? "border-ink bg-white" : "border-ink-15 bg-white hover:border-ink-30"}`}>
                    <div className="font-display text-sm font-semibold text-ink">{t}</div>
                    <div className="font-mono text-[10px] text-ink-50 mt-0.5 tracking-[0.05em]">{d}</div>
                  </button>
                ))}
              </div>
            </CheckoutCard>

            <CheckoutCard num="03" title="Плащане">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                {[["card", "Карта · Visa / MC"], ["bank", "Банков превод"], ["cod", "Наложен платеж"]].map(([k, l]) => (
                  <button key={k} onClick={() => setMethod(k)} className={`py-4 px-3 border cursor-pointer font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${method === k ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"}`}>
                    {l}
                  </button>
                ))}
              </div>
              {method === "card" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3"><Input label="Номер на картата" placeholder="•••• •••• •••• ••••" /></div>
                  <Input label="Име на картата" />
                  <Input label="MM/YY" />
                  <Input label="CVC" />
                </div>
              )}
              {method === "bank" && (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  <p className="font-semibold text-ink mb-2">Банков превод:</p>
                  <p>IBAN: BG80 UNCR 7000 1522 5765 37<br />BIC: UNCRBGSF<br />Основание: Поръчка ТЕХНОЛЕС</p>
                </div>
              )}
              {method === "cod" && (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  Плащане при доставка на куриера. Допълнителна такса 2.00 € за наложен платеж.
                </div>
              )}
            </CheckoutCard>
          </div>

          {/* Summary sidebar */}
          <aside className="bg-white border border-ink-15 p-8 h-fit lg:sticky lg:top-[200px]">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-5">Поръчка · {itemCount} артикула</div>
            {items.map((it) => (
              <div key={it.id} className="flex gap-3 py-3 border-b border-ink-05">
                <Placeholder tone="paper" ratio="1/1" className="w-12 shrink-0" caption="" />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[13px] font-semibold text-ink leading-tight truncate">{it.name}</div>
                  <div className="font-mono text-[10px] text-ink-50 mt-0.5">{it.quantity} × {it.price.toFixed(2)} €</div>
                </div>
                <div className="font-mono text-[13px] font-semibold text-ink shrink-0">{(it.quantity * it.price).toFixed(2)}</div>
              </div>
            ))}
            <div className="mt-5 pt-5 border-t border-ink-15">
              <div className="flex justify-between text-sm mb-1"><span className="text-ink-50">Междинна сума</span><span>{subtotal.toFixed(2)} €</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-ink-50">Доставка</span><span>{shipping === 0 ? "Безплатно" : `${shipping.toFixed(2)} €`}</span></div>
              <div className="flex justify-between text-sm mb-3"><span className="text-ink-50">ДДС 20%</span><span>{tax.toFixed(2)} €</span></div>
              <div className="flex justify-between items-baseline pt-3 border-t border-ink-15">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">Общо</span>
                <span className="font-display text-[32px] font-extrabold text-ink tracking-tight">{total.toFixed(2)} <span className="text-xs font-normal text-ink-50">€</span></span>
              </div>
              <div className="font-mono text-[10px] text-ink-50 text-right mt-1">{(total * 1.95583).toFixed(2)} лв.</div>
            </div>
            <div className="mt-5">
              <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />} onClick={() => { clearCart(); setSubmitted(true); }}>
                Потвърди поръчка
              </Btn>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
