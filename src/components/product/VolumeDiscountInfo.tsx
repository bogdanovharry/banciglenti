"use client";

import { useTranslations } from "next-intl";

import { VOLUME_TIERS, nextVolumeTier, volumePercent } from "@/lib/volume-discount";

/**
 * The quantity discount, shown where the quantity is chosen: both steps, the one in force
 * highlighted, and how many more pieces reach the next one. Always visible, so a buyer
 * who has not thought of ordering ten knows the option exists.
 */
export function VolumeDiscountInfo({ qty, className = "" }: { qty: number; className?: string }) {
  const t = useTranslations("catalog.volume");
  const active = volumePercent(qty);
  const next = nextVolumeTier(qty);

  return (
    <div className={`border border-ink-15 bg-white px-3.5 py-3 ${className}`} data-testid="volume-discount">
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-2">{t("title")}</div>
      <div className="flex flex-wrap gap-2">
        {VOLUME_TIERS.map((tier) => {
          const on = active === tier.percent;
          return (
            <span
              key={tier.min}
              className={`inline-flex items-baseline gap-1.5 border px-2.5 py-1.5 font-sans text-[13px] ${
                on ? "border-orange bg-orange text-white" : "border-ink-15 text-ink"
              }`}
            >
              <span className="tabular-nums">{t("from", { qty: tier.min })}</span>
              <strong className="tabular-nums">−{tier.percent}%</strong>
            </span>
          );
        })}
      </div>
      <p className="font-sans text-[12px] leading-snug text-ink-70 mt-2 mb-0">
        {active > 0
          ? next
            ? t("appliedNext", { percent: active, more: next.min - qty, next: next.percent })
            : t("applied", { percent: active })
          : t("hint", { more: (next?.min ?? 10) - qty, percent: next?.percent ?? 5 })}
      </p>
    </div>
  );
}

/** The small tag on a cart or checkout line that has the quantity discount applied. */
export function VolumeBadge({ percent }: { percent?: number }) {
  const t = useTranslations("catalog.volume");
  if (!percent) return null;
  return (
    <div className="inline-block mt-1.5 mr-1.5 px-1.5 py-0.5 bg-orange text-white font-mono text-[10px] leading-snug">
      {t("inCart", { percent })}
    </div>
  );
}
