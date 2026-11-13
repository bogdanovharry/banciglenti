"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/PageHeader";
import { Btn } from "@/components/ui/primitives";
import { useCart } from "@/lib/cart";

type State = "paid" | "failed" | "pending" | "mismatch" | "unknown";

/** The three things a buyer coming back from the card page can be told. */
export function ReturnClient({ state, orderNumber }: { state: State; orderNumber: string | null }) {
  const t = useTranslations("checkout");
  const tcart = useTranslations("cart");
  const router = useRouter();
  const { clearCart } = useCart();

  // The cart is emptied only now that the payment is confirmed.
  useEffect(() => {
    if (state === "paid") clearCart();
  }, [state, clearCart]);

  // Revolut can take a few seconds to settle: look again, a few times.
  useEffect(() => {
    if (state !== "pending") return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      router.refresh();
      if (tries >= 8) clearInterval(id);
    }, 4000);
    return () => clearInterval(id);
  }, [state, router]);

  const title =
    state === "paid" ? t("returnPaidTitle") : state === "pending" ? t("returnPendingTitle") : t("returnProblemTitle");
  const text =
    state === "paid" ? t("returnPaidText") : state === "pending" ? t("returnPendingText") : state === "failed" ? t("returnFailedText") : t("returnProblemText");

  return (
    <div className="bg-paper">
      <PageHeader eyebrowNumber={tcart("step3")} eyebrowLabel={t("stepConfirm")} title={title} description={text} />
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-16 pb-[120px]">
        {orderNumber && (
          <div className="bg-white border border-ink-15 p-7 max-w-[520px] mb-8">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50 mb-2">{t("orderNumber")}</div>
            <div className="font-display text-4xl font-extrabold tracking-tight text-ink tabular-nums break-all">{orderNumber}</div>
          </div>
        )}
        <div className="flex gap-3 flex-wrap">
          {state === "failed" || state === "unknown" || state === "mismatch" ? (
            <Link href="/checkout"><Btn variant="primary" size="lg">{t("returnTryAgain")}</Btn></Link>
          ) : null}
          <Link href="/"><Btn variant={state === "paid" ? "primary" : "ghost"} size="lg">{t("backHome")}</Btn></Link>
        </div>
      </div>
    </div>
  );
}
