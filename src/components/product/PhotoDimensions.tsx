"use client";

import { useLocale } from "next-intl";

/**
 * "13 ×" over "0,65", in the brand orange, in the top-left corner of the photo.
 *
 * Sized in container-query units (cqw) of the square photo it sits on, so the
 * label is the same share of the picture on a small card and on the product page.
 * It is drawn on the square the photo occupies, not on the card around it: the
 * card is 4:3 and the photo is shown whole (contain) inside it. Stacked rather
 * than on one line because the free corner of the meat photo is narrow — the
 * animal icons start a third of the way across.
 *
 * Decorative for assistive technology: the product name already carries the size.
 */
export function PhotoDimensions({ width, thickness }: { width?: number; thickness?: number }) {
  const locale = useLocale();
  if (typeof width !== "number" || typeof thickness !== "number") return null;
  const f = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="relative h-full aspect-square" style={{ containerType: "inline-size" }}>
        <div
          className="absolute top-[4%] left-[5%] font-display font-extrabold text-orange tabular-nums tracking-tight"
          style={{ fontSize: "10cqw", lineHeight: 1.02, textShadow: "0 0 0.35em #fff, 0 0 0.2em #fff" }}
        >
          <div>{f(width)} ×</div>
          <div>{f(thickness)}</div>
        </div>
      </div>
    </div>
  );
}
