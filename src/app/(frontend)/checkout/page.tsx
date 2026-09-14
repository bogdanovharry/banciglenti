"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Placeholder, Btn } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconArrowRight } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { vatLabel, type CheckoutPaymentMethod } from "@/lib/market";
import { usePrices } from "@/lib/market-context";
import { COMPANY } from "@/lib/company";

function Input({
  label,
  placeholder = "",
  type = "text",
  value,
  onChange,
  required,
  error,
  autoComplete,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
        {label} {required && <span className="text-danger">*</span>}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className={`w-full h-11 mt-1.5 px-3.5 border font-sans text-sm outline-none bg-white transition-colors ${
          error ? "border-danger" : "border-ink-15 focus:border-blue"
        }`}
      />
      {error && <span className="font-mono text-[10px] text-danger mt-1 block">{error}</span>}
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

const FIELDS = [
  "name", "email", "phone", "company",
  "city", "postalCode", "street",
] as const;
type Field = (typeof FIELDS)[number];

/** [method, label, detail] */
type DeliveryOption = ["courier" | "pickup", string, string];

const PAYMENT_LABELS: Record<CheckoutPaymentMethod, string> = {
  bank_transfer: "Банков превод",
  cod: "Наложен платеж",
};

export default function CheckoutPage() {
  const { market, gross, amount, price, symbol } = usePrices();
  const tc = useTranslations("common");

  // Which methods exist is the market's call (Romania: cash on delivery, no
  // pickup). Cards are deferred until a provider is connected; offering a card
  // option that cannot take a payment would lose the order at the last step.
  const [method, setMethod] = useState<CheckoutPaymentMethod>(market.paymentMethods[0]);
  const [shippingMethod, setShippingMethod] = useState<"courier" | "pickup">("courier");
  const [form, setForm] = useState<Record<Field, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<Field, string>,
  );
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field | "paymentMethod" | "items", string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const { items, itemCount, vatRate, totalsFor, clearCart } = useCart();
  // Priced for the delivery actually selected — pickup carries no carriage.
  const { subtotal, shippingCost: shipping, tax, total } = totalsFor(shippingMethod);

  const deliveryOptions: DeliveryOption[] = [
    ["courier", "Куриер", market.couriers.join(" · ")],
    ...(market.pickup
      ? [["pickup", "Лично вземане", `Цех ${COMPANY.address.city} · безплатно`] as DeliveryOption]
      : []),
  ];

  const set = (field: Field) => (v: string) => setForm((prev) => ({ ...prev, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: { name: form.name, email: form.email, phone: form.phone, company: form.company },
          shipping: {
            method: shippingMethod,
            city: form.city,
            postalCode: form.postalCode,
            street: form.street,
          },
          paymentMethod: method,
          notes,
          // Only what we are buying. The server prices it — see /api/checkout.
          items: items.map((i) => ({
            sku: i.sku,
            quantity: i.quantity,
            ...(i.customSpecs ? { customSpecs: i.customSpecs } : {}),
          })),
        }),
      });

      const data = (await res.json()) as {
        orderNumber?: string;
        error?: string;
        fields?: Record<string, string>;
      };

      if (!res.ok) {
        setFormError(data.error ?? "Възникна грешка. Опитайте отново.");
        if (data.fields) setFieldErrors(data.fields);
        return;
      }

      // Clear only once the order is safely recorded.
      setOrderNumber(data.orderNumber ?? null);
      clearCart();
    } catch {
      setFormError("Няма връзка със сървъра. Проверете интернет и опитайте отново.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = orderNumber !== null;

  if (submitted) {
    return (
      <div className="bg-paper">
        <PageHeader
          eyebrowNumber="Step 03"
          eyebrowLabel="Потвърждение"
          title="Поръчката е приета."
          description="Наш инженер ще се свърже с вас, за да потвърди размерите и срока за изработка."
        >
          <div className="flex gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-white/50">
            <span>✓ Количка</span>
            <span>✓ Доставка</span>
            <span className="text-orange-light">● Плащане</span>
          </div>
        </PageHeader>
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
          <div className="bg-white border border-ink-15 p-7 max-w-[520px] mb-8">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-2">
              Номер на поръчка
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-ink tabular-nums">
              {orderNumber}
            </div>
            <p className="font-sans text-sm text-ink-70 mt-4 mb-0">
              Запишете си номера. {method === "bank_transfer"
                ? "Ще получите данни за банков превод — поръчката тръгва след потвърждение на плащането."
                : "Плащате при доставка на куриера."}
            </p>
            {market.carriage === "collect" && (
              <p className="font-sans text-sm text-ink-70 mt-2 mb-0">
                {tc("courierFeeNote", { couriers: market.couriers.join(" / ") })}
              </p>
            )}
          </div>
          <Link href="/"><Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>Към началото</Btn></Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-paper">
        <PageHeader
          eyebrowNumber="Step 02"
          eyebrowLabel="Доставка и плащане"
          crumbs={[{ label: "Начало", href: "/" }, { label: "Количка", href: "/cart" }]}
          title="Няма какво да платите."
          description="Количката е празна — добавете артикул от каталога или конфигурирайте лента по размер."
        />
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
          <div className="flex gap-3 flex-wrap">
            <Link href="/shop"><Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>Към каталога</Btn></Link>
            <Link href="/configurator"><Btn variant="ghost" size="lg">Конфигуратор</Btn></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper">
      {/* Transactional page: same masthead typography, no photograph. */}
      <PageHeader
        eyebrowNumber="Step 02"
        eyebrowLabel="Доставка и плащане"
        crumbs={[{ label: "Начало", href: "/" }, { label: "Количка", href: "/cart" }, { label: "Плащане" }]}
        title="Завърши поръчка."
      >
        <div className="flex gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-white/50">
          <span>✓ Количка</span>
          <span className="text-orange-light">● Доставка</span>
          <span>○ Плащане</span>
        </div>
      </PageHeader>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 pb-[120px]">

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          <div className="flex flex-col gap-6">
            <CheckoutCard num="01" title="Контакти">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Име и фамилия" required autoComplete="name"
                  value={form.name} onChange={set("name")} error={fieldErrors.name} />
                <Input label="Фирма (незадължително)" autoComplete="organization"
                  value={form.company} onChange={set("company")} />
                <Input label="Имейл" placeholder="you@company.bg" type="email" required autoComplete="email"
                  value={form.email} onChange={set("email")} error={fieldErrors.email} />
                <Input label="Телефон" placeholder="+359 …" type="tel" required autoComplete="tel"
                  value={form.phone} onChange={set("phone")} error={fieldErrors.phone} />
              </div>
            </CheckoutCard>

            <CheckoutCard num="02" title="Доставка">
              {/* A choice only where there is one. With courier alone, a single
                  pressed button reads as something that could be un-pressed. */}
              {deliveryOptions.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                  {deliveryOptions.map(([k, t, d]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setShippingMethod(k)}
                      aria-pressed={shippingMethod === k}
                      className={`p-3.5 text-left border cursor-pointer transition-colors ${
                        shippingMethod === k ? "border-ink bg-paper" : "border-ink-15 bg-white hover:border-ink-30"
                      }`}
                    >
                      <div className="font-display text-sm font-semibold text-ink">{t}</div>
                      <div className="font-mono text-[10px] text-ink-50 mt-0.5 tracking-[0.05em]">{d}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="font-mono text-[11px] text-ink-50 tracking-[0.05em] mb-4">
                  {deliveryOptions[0][1]} · {deliveryOptions[0][2]}
                </div>
              )}
              {/* Said before the address is typed, not discovered at the door:
                  a charge the total leaves out has to be stated up front. */}
              {market.carriage === "collect" && (
                <div className="p-4 mb-4 bg-paper font-sans text-sm text-ink-70">
                  {tc("courierFeeNote", { couriers: market.couriers.join(" / ") })}
                </div>
              )}

              {shippingMethod === "courier" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input label="Град" required autoComplete="address-level2"
                    value={form.city} onChange={set("city")} error={fieldErrors.city} />
                  <Input label="Пощенски код" autoComplete="postal-code"
                    value={form.postalCode} onChange={set("postalCode")} />
                  <div className="md:col-span-2">
                    <Input label="Адрес" placeholder="Улица, номер, офис" required autoComplete="street-address"
                      value={form.street} onChange={set("street")} error={fieldErrors.street} />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  Вземане от цеха: гр. Габрово 5300, ул. „Негенска“ 2. Ще се обадим, когато лентата е готова.
                </div>
              )}
            </CheckoutCard>

            <CheckoutCard num="03" title="Плащане">
              {market.paymentMethods.length > 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {market.paymentMethods.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMethod(k)}
                      aria-pressed={method === k}
                      className={`py-4 px-3 border cursor-pointer font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${
                        method === k ? "bg-ink text-white border-ink" : "bg-white text-ink border-ink-15 hover:border-ink-30"
                      }`}
                    >
                      {PAYMENT_LABELS[k]}
                    </button>
                  ))}
                </div>
              )}
              {method === "bank_transfer" && (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  <p className="font-semibold text-ink mb-2 mt-0">Банков превод:</p>
                  <p className="m-0">IBAN: {COMPANY.bank.iban}<br />BIC: {COMPANY.bank.bic}<br />Основание: номерът на поръчката</p>
                </div>
              )}
              {method === "cod" && (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  Плащате при доставка на куриера.
                </div>
              )}
              <label className="block mt-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  Бележка към поръчката (незадължително)
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1.5 p-3.5 border border-ink-15 font-sans text-sm outline-none resize-y bg-white focus:border-blue transition-colors"
                />
              </label>
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
                  <div className="font-mono text-[10px] text-ink-50 mt-0.5 tabular-nums">
                    {it.quantity} × {price(gross(it.price))} {tc("incVat")} · {price(it.price)} {tc("exVat")}
                  </div>
                </div>
                <div className="font-mono text-[13px] font-semibold text-ink shrink-0 tabular-nums">{amount(gross(it.quantity * it.price))}</div>
              </div>
            ))}
            <div className="mt-5 pt-5 border-t border-ink-15">
              <div className="flex justify-between text-sm mb-1"><span className="text-ink-50">Междинна сума · {tc("exVat")}</span><span>{price(subtotal)}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-ink-50">Доставка</span><span>{market.carriage === "collect" ? tc("courierFee") : shipping === 0 ? tc("free") : price(shipping)}</span></div>
              <div className="flex justify-between text-sm mb-3"><span className="text-ink-50">{tc("vat", { rate: vatLabel(vatRate) })}</span><span>{price(tax)}</span></div>
              <div className="flex justify-between items-baseline pt-3 border-t border-ink-15">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">Общо · {tc("incVat")}</span>
                <span className="font-display text-[32px] font-extrabold text-ink tracking-tight tabular-nums">{amount(total)} <span className="text-xs font-normal text-ink-50">{symbol}</span></span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-ink-50 tabular-nums mt-1">
                <span>Общо · {tc("exVat")}</span>
                <span>{price(subtotal + shipping)}</span>
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-5 p-3.5 border border-danger bg-danger/5 font-sans text-[13px] text-danger"
              >
                {formError}
              </div>
            )}

            <div className="mt-5">
              <Btn variant="primary" size="lg" fullWidth type="submit" disabled={submitting} iconRight={<IconArrowRight size={16} />}>
                {submitting ? "Изпращане…" : "Потвърди поръчка"}
              </Btn>
            </div>
            <p className="font-mono text-[10px] text-ink-50 mt-3 text-center leading-relaxed">
              Сумата се преизчислява при потвърждение по актуалния ценоразпис.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
