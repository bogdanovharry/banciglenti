"use client";

import Link from "next/link";
import { Placeholder, Btn } from "@/components/ui/primitives";
import { PageHeader } from "@/components/layout/PageHeader";
import { CartSkeleton } from "@/components/layout/CartSkeleton";
import { IconMinus, IconPlus, IconClose, IconArrowRight } from "@/components/ui/icons";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart";
import { vatLabel } from "@/lib/market";
import { usePrices } from "@/lib/market-context";
import { DualPrice } from "@/components/ui/DualPrice";

export default function CartPage() {
  const { items, loaded, removeItem, updateQuantity, itemCount, vatRate, subtotal, shipping, tax, total } = useCart();
  const { market, amount, price, symbol } = usePrices();
  const tc = useTranslations("common");
  const t = useTranslations("cart");

  if (!loaded) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="bg-paper">
        <PageHeader
          eyebrowNumber={t("step1")}
          eyebrowLabel={tc("cart")}
          crumbs={[{ label: tc("home"), href: "/" }, { label: tc("cart") }]}
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

  const hasMadeToMeasure = items.some((i) => i.customSpecs);

  return (
    <div className="bg-paper min-h-dvh">
      {/* No photograph here on purpose — a large image competes with the
          figures a buyer is on this page to check. */}
      <PageHeader
        eyebrowNumber={t("step1")}
        eyebrowLabel={tc("cart")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: tc("cart") }]}
        title={t("title")}
      >
        <div className="flex gap-3 font-mono text-[11px] tracking-[0.1em] uppercase text-white/50">
          <span className="text-orange-light">● {t("stageCart")}</span>
          <span>○ {t("stageDelivery")}</span>
          <span>○ {t("stagePayment")}</span>
        </div>
      </PageHeader>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 pb-[120px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          {/* Items */}
          <div className="bg-white border border-ink-15 min-w-0">
            {/* Made to the buyer's specification, so not returnable — said here,
                before the checkout, as well as on each line. */}
            {hasMadeToMeasure && (
              <div role="note" className="px-6 py-4 border-b border-ink-15 bg-orange/10 font-sans text-sm text-ink">
                {t("madeToMeasureNotice")}
              </div>
            )}
            <div className="hidden md:grid grid-cols-[2fr_120px_140px_120px_40px] px-7 py-4 border-b border-ink-15 font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
              <span>{t("colItem")}</span><span>{t("colUnitPrice")}</span><span>{t("colQuantity")}</span><span className="text-right">{t("colAmount")}</span><span />
            </div>
            {items.map((it) => (
              <div key={it.id} className="p-6 border-b border-ink-15 grid grid-cols-1 md:grid-cols-[2fr_120px_140px_120px_40px] items-center gap-4">
                <div className="flex gap-4 items-center min-w-0">
                  <Placeholder tone="paper" ratio="1/1" className="w-[72px] shrink-0" caption="" src={it.image} alt="" sizes="72px" />
                  <div className="min-w-0">
                    <div className="font-display text-[15px] font-semibold text-ink">{it.name}</div>
                    <div className="font-mono text-[11px] text-ink-50 mt-1 break-words">{it.dim} · SKU {it.sku}</div>
                    {it.customSpecs && (
                      <div className="inline-block mt-2 px-2 py-1 bg-orange/10 border border-orange/40 font-mono text-[10px] tracking-[0.04em] text-ink">
                        {t("madeToMeasure")}
                      </div>
                    )}
                  </div>
                </div>
                <DualPrice net={it.price} size="xs" />
                <div className="inline-flex border border-ink-15 bg-white w-fit">
                  <button
                    type="button"
                    onClick={() => updateQuantity(it.id, it.quantity - 1)}
                    aria-label={t("decrease", { name: it.name })}
                    className="w-10 h-10 bg-transparent border-none cursor-pointer flex items-center justify-center"
                  ><IconMinus size={12} /></button>
                  <div className="w-10 h-10 flex items-center justify-center font-mono text-[13px] font-semibold" aria-live="polite">{it.quantity}</div>
                  <button
                    type="button"
                    onClick={() => updateQuantity(it.id, it.quantity + 1)}
                    aria-label={t("increase", { name: it.name })}
                    className="w-10 h-10 bg-transparent border-none cursor-pointer flex items-center justify-center"
                  ><IconPlus size={12} /></button>
                </div>
                <DualPrice net={it.quantity * it.price} size="sm" className="md:text-right" />
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  aria-label={t("remove", { name: it.name })}
                  className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-ink-50 hover:text-danger transition-colors"
                ><IconClose size={16} /></button>
              </div>
            ))}
            <div className="p-5">
              <Link href="/shop" className="font-mono text-xs text-ink-70 tracking-[0.05em] no-underline hover:text-ink">{t("continueShopping")}</Link>
            </div>
          </div>

          {/* Summary */}
          <aside className="bg-ink text-white p-8 h-fit lg:sticky lg:top-[200px]">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50 mb-5">{t("summary", { count: itemCount })}</div>
            <div className="flex flex-col gap-3.5 font-sans text-sm">
              {[
                [t("subtotal", { exVat: tc("exVat") }), price(subtotal)],
                [t("delivery"), market.carriage === "collect" ? tc("courierFee") : shipping === 0 ? tc("free") : price(shipping)],
                [tc("vat", { rate: vatLabel(vatRate) }), price(tax)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-white/65">{k}</span><span>{v}</span></div>
              ))}
              <div className="h-px bg-white/15 my-2" />
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-white/60">{t("total", { vatNote: tc("incVat") })}</span>
                <span className="font-display text-4xl font-extrabold tracking-tight tabular-nums">{amount(total)} <span className="text-[13px] text-white/60 font-normal">{symbol}</span></span>
              </div>
              {/* Carriage carries no VAT here, so the ex-VAT total is goods plus
                  delivery — the figure a trade buyer books. */}
              <div className="flex justify-between font-mono text-[11px] text-white/60 tabular-nums">
                <span>{t("total", { vatNote: tc("exVat") })}</span>
                <span>{price(subtotal + shipping)}</span>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/checkout" className="no-underline">
                <Btn variant="primary" size="lg" fullWidth iconRight={<IconArrowRight size={16} />}>{t("toCheckout")}</Btn>
              </Link>
            </div>
            <div className="mt-6 font-mono text-[10px] text-white/55 tracking-[0.05em] flex flex-col gap-2">
              {market.carriage === "collect" ? (
                <span>● {tc("courierFeeNote", { couriers: market.couriers.join(" / ") })}</span>
              ) : (
                <span>● {t("freeShipping", { amount: price(market.freeShippingThreshold), exVat: tc("exVat") })}</span>
              )}
              <span>● {t("weldWarranty")}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
