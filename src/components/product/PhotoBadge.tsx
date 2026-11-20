"use client";

import { useTranslations } from "next-intl";

import { knifeKind } from "@/lib/product-images";

/**
 * "HSS" and "for hard wood" (or "100Cr6" and "for soft wood"), in the brand orange,
 * in the top-left corner of the planer-knife photograph. Drawn on the square the
 * photo occupies, in container units, like PhotoDimensions, so it is the same share
 * of the picture on a small card and on the product page.
 *
 * Decorative for assistive technology: the product name already carries the steel.
 */
export function PhotoBadge({ name }: { name: string }) {
  const t = useTranslations("catalog");
  const kind = knifeKind(name);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="relative h-full aspect-square" style={{ containerType: "inline-size" }}>
        <div
          className="absolute top-[4%] left-[5%] font-display font-extrabold text-orange tracking-tight"
          style={{ lineHeight: 1.05, whiteSpace: "nowrap", textShadow: "0 0 0.35em #fff, 0 0 0.2em #fff" }}
        >
          <div style={{ fontSize: "12cqw" }}>{kind.steel}</div>
          <div style={{ fontSize: "5.2cqw", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {kind.wood === "hard" ? t("photo.hardwood") : t("photo.softwood")}
          </div>
        </div>
      </div>
    </div>
  );
}
