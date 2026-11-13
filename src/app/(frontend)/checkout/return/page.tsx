import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { reconcileCardPayment } from "@/lib/card-payments";
import { ReturnClient } from "./ReturnClient";

/**
 * Where Revolut sends the buyer back to. The address carries the order's own
 * random key, so it cannot be guessed from an order number; the page shows no
 * personal data, only whether the payment went through. The state is read from
 * Revolut itself, so it is right even before the webhook has arrived.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("returnTitle"), robots: { index: false, follow: false } };
}

export default async function CheckoutReturn({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const { k } = await searchParams;
  const key = typeof k === "string" && k.length >= 16 && k.length <= 80 ? k : null;
  const result = key ? await reconcileCardPayment({ clientKey: key }) : { state: "unknown" as const };
  return <ReturnClient state={result.state} orderNumber={result.orderNumber ?? null} />;
}
