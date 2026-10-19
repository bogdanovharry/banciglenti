"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Placeholder, Btn } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartSkeleton } from "@/components/layout/CartSkeleton";
import { IconArrowRight } from "@/components/ui/icons";
import { useCart } from "@/lib/cart";
import { vatLabel, type CheckoutPaymentMethod } from "@/lib/market";
import { usePrices } from "@/lib/market-context";
import { COMPANY, companyFor } from "@/lib/company";

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

const BILLING_FIELDS = ["company", "taxId", "vatNumber", "address"] as const;
type BillingField = (typeof BILLING_FIELDS)[number];

/** [method, label, detail] */
type DeliveryOption = ["courier" | "pickup", string, string];

/** What the order route returns on success — all in EUR, the authored currency. */
type OrderResult = {
  orderNumber: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

/**
 * One key per visit to the page, resent on every submit, so a double click or a
 * retry after a dropped connection cannot create a second order. randomUUID
 * needs a secure context; the fallback covers the odd plain-http host.
 */
function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function CheckoutPage() {
  const { market, gross, amount, price, symbol } = usePrices();
  const tc = useTranslations("common");
  const tcart = useTranslations("cart");
  const t = useTranslations("checkout");
  const locale = useLocale();
  const company = companyFor(locale);

  // Which methods exist is the market's call (Romania: cash on delivery, no
  // pickup). Cards are deferred until a provider is connected; offering a card
  // option that cannot take a payment would lose the order at the last step.
  const [method, setMethod] = useState<CheckoutPaymentMethod>(market.paymentMethods[0]);
  const [shippingMethod, setShippingMethod] = useState<"courier" | "pickup">("courier");
  const [form, setForm] = useState<Record<Field, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<Field, string>,
  );
  const [notes, setNotes] = useState("");
  const [invoice, setInvoice] = useState(false);
  const [billing, setBilling] = useState<Record<BillingField, string>>(
    () => Object.fromEntries(BILLING_FIELDS.map((f) => [f, ""])) as Record<BillingField, string>,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [idempotencyKey] = useState(newIdempotencyKey);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);

  const { items, loaded, itemCount, vatRate, totalsFor, clearCart } = useCart();
  // Priced for the delivery actually selected — pickup carries no carriage.
  const { subtotal, shippingCost: shipping, tax, total } = totalsFor(shippingMethod);

  const hasMadeToMeasure = items.some((i) => i.customSpecs);

  const paymentLabels: Record<CheckoutPaymentMethod, string> = {
    bank_transfer: t("bankTransfer"),
    cod: t("cod"),
  };

  const pickupAddress =
    locale.startsWith("bg")
      ? `гр. ${company.address.city} ${company.address.postalCode}, ${company.address.street}`
      : `${company.address.postalCode} ${company.address.city}, ${company.address.street}`;

  const deliveryOptions: DeliveryOption[] = [
    ["courier", t("courier"), market.couriers.join(" · ")],
    ...(market.pickup
      ? [["pickup", t("pickup"), t("pickupDetail", { city: company.address.city })] as DeliveryOption]
      : []),
  ];

  const set = (field: Field) => (v: string) => setForm((prev) => ({ ...prev, [field]: v }));
  const setBill = (field: BillingField) => (v: string) => setBilling((prev) => ({ ...prev, [field]: v }));

  const toggleInvoice = (on: boolean) => {
    setInvoice(on);
    // The company a buyer already typed under Contact is almost always the one
    // to invoice; offer it rather than make them type it twice.
    if (on && !billing.company.trim() && form.company.trim()) {
      setBilling((prev) => ({ ...prev, company: form.company.trim() }));
    }
  };

  /** Client-side checks for what the server insists on, so the buyer sees them at once. */
  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!acceptedTerms) errors.acceptedTerms = t("consentRequired");
    if (invoice) {
      if (!billing.company.trim()) errors.billingCompany = t("fieldRequired");
      if (!billing.taxId.trim()) errors.billingTaxId = t("fieldRequired");
      if (!billing.address.trim()) errors.billingAddress = t("fieldRequired");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setFormError(null);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    setSubmitting(true);
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
          billing: {
            invoice,
            company: invoice ? billing.company.trim() : "",
            taxId: invoice ? billing.taxId.trim() : "",
            vatNumber: invoice ? billing.vatNumber.trim() : "",
            address: invoice ? billing.address.trim() : "",
          },
          acceptedTerms: true,
          idempotencyKey,
          // Only what we are buying. The server prices it — see /api/checkout.
          items: items.map((i) => ({
            sku: i.sku,
            quantity: i.quantity,
            ...(i.customSpecs ? { customSpecs: i.customSpecs } : {}),
          })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<OrderResult> & {
        error?: string;
        fields?: Record<string, string>;
      };

      if (!res.ok) {
        setFormError(data.error ?? t("genericError"));
        if (data.fields) setFieldErrors(data.fields);
        return;
      }

      // Clear only once the order is safely recorded.
      setResult({
        orderNumber: data.orderNumber ?? "",
        subtotal: data.subtotal ?? subtotal,
        shipping: data.shipping ?? shipping,
        tax: data.tax ?? tax,
        total: data.total ?? total,
      });
      clearCart();
    } catch {
      setFormError(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="bg-paper">
        <PageHeader
          eyebrowNumber={tcart("step3")}
          eyebrowLabel={t("stepConfirm")}
          title={t("successTitle")}
          description={t("successDescription")}
        >
          <div className="flex gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-white/50">
            <span>✓ {tcart("stageCart")}</span>
            <span>✓ {tcart("stageDelivery")}</span>
            <span className="text-orange-light">● {tcart("stagePayment")}</span>
          </div>
        </PageHeader>
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
          <div className="bg-white border border-ink-15 p-7 max-w-[520px] mb-8">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-2">
              {t("orderNumber")}
            </div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-ink tabular-nums break-all">
              {result.orderNumber}
            </div>

            <div className="mt-6 pt-5 border-t border-ink-15 text-sm">
              <div className="flex justify-between mb-1"><span className="text-ink-50">{t("subtotal", { exVat: tc("exVat") })}</span><span className="tabular-nums">{price(result.subtotal)}</span></div>
              <div className="flex justify-between mb-1">
                <span className="text-ink-50">{t("delivery")}</span>
                <span className="tabular-nums">{market.carriage === "collect" ? tc("courierFee") : result.shipping === 0 ? tc("free") : price(result.shipping)}</span>
              </div>
              <div className="flex justify-between mb-3"><span className="text-ink-50">{tc("vat", { rate: vatLabel(vatRate) })}</span><span className="tabular-nums">{price(result.tax)}</span></div>
              <div className="flex justify-between items-baseline pt-3 border-t border-ink-15">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">{t("total", { vatNote: tc("incVat") })}</span>
                <span className="font-display text-[28px] font-extrabold text-ink tracking-tight tabular-nums">{price(result.total)}</span>
              </div>
            </div>

            <p className="font-sans text-sm text-ink-70 mt-5 mb-0">
              {t("keepNumber")} {method === "bank_transfer" ? t("bankInstruction") : t("codInstruction")}
            </p>
            {market.carriage === "collect" && (
              <p className="font-sans text-sm text-ink-70 mt-2 mb-0">
                {tc("courierFeeNote", { couriers: market.couriers.join(" / ") })}
              </p>
            )}
          </div>
          <Link href="/"><Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>{t("backHome")}</Btn></Link>
        </div>
      </div>
    );
  }

  if (!loaded) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="bg-paper">
        <PageHeader
          eyebrowNumber={tcart("step2")}
          eyebrowLabel={t("stepDelivery")}
          crumbs={[{ label: tc("home"), href: "/" }, { label: tc("cart"), href: "/cart" }]}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
          <div className="flex gap-3 flex-wrap">
            <Link href="/shop"><Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>{t("toCatalogue")}</Btn></Link>
            <Link href="/configurator"><Btn variant="ghost" size="lg">{tc("configurator")}</Btn></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper">
      {/* Transactional page: same masthead typography, no photograph. */}
      <PageHeader
        eyebrowNumber={tcart("step2")}
        eyebrowLabel={t("stepDelivery")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: tc("cart"), href: "/cart" }, { label: t("crumbPayment") }]}
        title={t("title")}
      >
        <div className="flex gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-white/50">
          <span>✓ {tcart("stageCart")}</span>
          <span className="text-orange-light">● {tcart("stageDelivery")}</span>
          <span>○ {tcart("stagePayment")}</span>
        </div>
      </PageHeader>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 pb-[120px]">

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          <div className="flex flex-col gap-6 min-w-0">
            <CheckoutCard num="01" title={t("cardContact")}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={t("fieldName")} required autoComplete="name"
                  value={form.name} onChange={set("name")} error={fieldErrors.name} />
                <Input label={t("fieldCompany")} autoComplete="organization"
                  value={form.company} onChange={set("company")} />
                <Input label={t("fieldEmail")} placeholder={t("emailPlaceholder")} type="email" required autoComplete="email"
                  value={form.email} onChange={set("email")} error={fieldErrors.email} />
                <Input label={t("fieldPhone")} placeholder={t("phonePlaceholder")} type="tel" required autoComplete="tel"
                  value={form.phone} onChange={set("phone")} error={fieldErrors.phone} />
              </div>

              <label className="flex items-center gap-3 mt-5 cursor-pointer font-sans text-sm text-ink">
                <input
                  type="checkbox"
                  checked={invoice}
                  onChange={(e) => toggleInvoice(e.target.checked)}
                  className="w-5 h-5 accent-orange shrink-0"
                />
                {t("invoiceToggle")}
              </label>
              {invoice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="md:col-span-2">
                    <Input label={t("invoiceCompany")} required autoComplete="organization"
                      value={billing.company} onChange={setBill("company")} error={fieldErrors.billingCompany} />
                  </div>
                  <Input label={t("invoiceTaxId")} required
                    value={billing.taxId} onChange={setBill("taxId")} error={fieldErrors.billingTaxId} />
                  <Input label={t("invoiceVat")}
                    value={billing.vatNumber} onChange={setBill("vatNumber")} />
                  <div className="md:col-span-2">
                    <Input label={t("invoiceAddress")} required autoComplete="off"
                      value={billing.address} onChange={setBill("address")} error={fieldErrors.billingAddress} />
                  </div>
                </div>
              )}
            </CheckoutCard>

            <CheckoutCard num="02" title={t("cardDelivery")}>
              {/* A choice only where there is one. With courier alone, a single
                  pressed button reads as something that could be un-pressed. */}
              {deliveryOptions.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                  {deliveryOptions.map(([k, label, d]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setShippingMethod(k)}
                      aria-pressed={shippingMethod === k}
                      className={`p-3.5 text-left border cursor-pointer transition-colors ${
                        shippingMethod === k ? "border-ink bg-paper" : "border-ink-15 bg-white hover:border-ink-30"
                      }`}
                    >
                      <div className="font-display text-sm font-semibold text-ink">{label}</div>
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
                  <Input label={t("fieldCity")} required autoComplete="address-level2"
                    value={form.city} onChange={set("city")} error={fieldErrors.city} />
                  <Input label={t("fieldPostalCode")} autoComplete="postal-code"
                    value={form.postalCode} onChange={set("postalCode")} />
                  <div className="md:col-span-2">
                    <Input label={t("fieldStreet")} placeholder={t("streetPlaceholder")} required autoComplete="street-address"
                      value={form.street} onChange={set("street")} error={fieldErrors.street} />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  {t("pickupNote", { address: pickupAddress })}
                </div>
              )}
            </CheckoutCard>

            <CheckoutCard num="03" title={t("cardPayment")}>
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
                      {paymentLabels[k]}
                    </button>
                  ))}
                </div>
              )}
              {method === "bank_transfer" && (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  <p className="font-semibold text-ink mb-2 mt-0">{t("bankTransferTitle")}</p>
                  <p className="m-0">IBAN: {COMPANY.bank.iban}<br />BIC: {COMPANY.bank.bic}<br />{t("bankReference")}</p>
                </div>
              )}
              {method === "cod" && (
                <div className="p-4 bg-paper font-sans text-sm text-ink-70">
                  {t("codInstruction")}
                </div>
              )}
              <label className="block mt-4">
                <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  {t("fieldNotes")}
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
          <aside className="bg-white border border-ink-15 p-8 h-fit min-w-0 lg:sticky lg:top-[200px]">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-5">{t("orderSummary", { count: itemCount })}</div>
            {items.map((it) => (
              <div key={it.id} className="flex gap-3 py-3 border-b border-ink-05">
                <Placeholder tone="paper" ratio="1/1" className="w-12 shrink-0" caption="" src={it.image} alt="" sizes="48px" />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[13px] font-semibold text-ink leading-tight truncate">{it.name}</div>
                  <div className="font-mono text-[10px] text-ink-50 mt-0.5 tabular-nums">
                    {it.quantity} × {price(gross(it.price))} {tc("incVat")} · {price(it.price)} {tc("exVat")}
                  </div>
                  {it.customSpecs && (
                    <div className="inline-block mt-1.5 px-1.5 py-0.5 bg-orange/10 border border-orange/40 font-mono text-[10px] text-ink leading-snug">
                      {t("madeToMeasure")}
                    </div>
                  )}
                </div>
                <div className="font-mono text-[13px] font-semibold text-ink shrink-0 tabular-nums">{amount(gross(it.quantity * it.price))}</div>
              </div>
            ))}
            {hasMadeToMeasure && (
              <div role="note" className="mt-4 p-3.5 bg-orange/10 border border-orange/40 font-sans text-[13px] text-ink">
                {t("madeToMeasureNotice")}
              </div>
            )}
            <div className="mt-5 pt-5 border-t border-ink-15">
              <div className="flex justify-between text-sm mb-1"><span className="text-ink-50">{t("subtotal", { exVat: tc("exVat") })}</span><span>{price(subtotal)}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-ink-50">{t("delivery")}</span><span>{market.carriage === "collect" ? tc("courierFee") : shipping === 0 ? tc("free") : price(shipping)}</span></div>
              <div className="flex justify-between text-sm mb-3"><span className="text-ink-50">{tc("vat", { rate: vatLabel(vatRate) })}</span><span>{price(tax)}</span></div>
              <div className="flex justify-between items-baseline pt-3 border-t border-ink-15">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50">{t("total", { vatNote: tc("incVat") })}</span>
                <span className="font-display text-[32px] font-extrabold text-ink tracking-tight tabular-nums">{amount(total)} <span className="text-xs font-normal text-ink-50">{symbol}</span></span>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-ink-50 tabular-nums mt-1">
                <span>{t("total", { vatNote: tc("exVat") })}</span>
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

            {/* Required consent: unticked by default, links open in a new tab so
                the buyer does not lose the form. */}
            <div className="mt-5">
              <label className="flex items-start gap-3 cursor-pointer font-sans text-[13px] leading-snug text-ink">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setFieldErrors((prev) => ({ ...prev, acceptedTerms: "" }));
                  }}
                  aria-invalid={Boolean(fieldErrors.acceptedTerms)}
                  aria-required="true"
                  className="w-5 h-5 mt-0.5 accent-orange shrink-0"
                />
                <span>
                  {t.rich("consent", {
                    terms: (chunks) => (
                      <Link href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-blue">{chunks}</Link>
                    ),
                    privacy: (chunks) => (
                      <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-blue">{chunks}</Link>
                    ),
                  })}
                </span>
              </label>
              {fieldErrors.acceptedTerms && (
                <span role="alert" className="font-mono text-[10px] text-danger mt-1.5 block">{fieldErrors.acceptedTerms}</span>
              )}
            </div>

            <div className="mt-5">
              <Btn variant="primary" size="lg" fullWidth type="submit" disabled={submitting} iconRight={<IconArrowRight size={16} />}>
                {submitting ? t("submitting") : t("submit")}
              </Btn>
            </div>
            <p className="font-mono text-[10px] text-ink-50 mt-3 text-center leading-relaxed">
              {t("recalcNote")}
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
