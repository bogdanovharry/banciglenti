"use client";

import { useTranslations } from "next-intl";

import { bladeLineOf } from "@/lib/product-images";

/**
 * What the tooth is for, in the brand orange, in the top-left corner of the ProCut and SoftCut
 * photographs: "10/30° · universal" or "14° · for soft wood". Drawn like PhotoBadge, in
 * container units on the square the photo occupies.
 *
 * Decorative for assistive technology: the product name already carries the line.
 */
export function LineBadge({ name, series }: { name: string; series?: string | null }) {
  const t = useTranslations("catalog");
  const line = bladeLineOf({ name, series });
  if (!line) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="relative h-full aspect-square" style={{ containerType: "inline-size" }}>
        <div
          className="absolute top-[4%] left-[5%] font-display font-extrabold text-orange tracking-tight"
          style={{ lineHeight: 1.05, whiteSpace: "nowrap", textShadow: "0 0 0.35em #fff, 0 0 0.2em #fff" }}
        >
          <div style={{ fontSize: "12cqw" }}>{line === "procut" ? "10/30°" : "14°"}</div>
          <div style={{ fontSize: "5.2cqw", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {line === "procut" ? t("photo.universal") : t("photo.softLine")}
          </div>
        </div>
      </div>
    </div>
  );
}
