"use client";

import { useTranslations } from "next-intl";

import { usePrices } from "@/lib/market-context";

/**
 * Every storefront price, stated both ways: with VAT set large, without VAT
 * on the line beneath.
 *
 * With VAT leads because a consumer has to be shown the final price — Directive
 * 98/6/EC, and HG 947/2000 in Romania. Without VAT stays one line below at a
 * readable size, because a trade buyer budgets against it and reclaims the tax.
 * Both are derived here from the one net figure and the market's rate, so they
 * cannot disagree with each other or with what the order route charges.
 *
 * Which figure leads is decided in this file only.
 */
const SIZES = {
  xs: { main: "text-[13px] font-semibold", symbol: "text-[10px]", sub: "text-[10px] mt-0.5" },
  sm: { main: "text-[21px] font-bold tracking-[-0.02em]", symbol: "text-[11px]", sub: "text-[10px] mt-1" },
  lg: { main: "text-[40px] font-extrabold tracking-[-0.03em]", symbol: "text-base", sub: "text-[11px] mt-1.5" },
} as const;

export function DualPrice({
  net,
  size = "sm",
  tone = "ink",
  className = "",
}: {
  /** EUR, without VAT — what the catalogue and the price tables store. */
  net: number;
  size?: keyof typeof SIZES;
  tone?: "ink" | "white";
  className?: string;
}) {
  const t = useTranslations("common");
  const { gross, amount, price, symbol } = usePrices();
  const s = SIZES[size];
  const strong = tone === "white" ? "text-white" : "text-ink";
  const muted = tone === "white" ? "text-white/60" : "text-ink-50";

  return (
    <div className={className}>
      <div className={`font-display ${s.main} ${strong} tabular-nums leading-none`}>
        {amount(gross(net))} <span className={`${s.symbol} ${muted} font-normal`}>{symbol}</span>
      </div>
      <div className={`font-mono ${s.sub} ${muted} tabular-nums`}>
        {t("incVat")} · {price(net)} {t("exVat")}
      </div>
    </div>
  );
}
