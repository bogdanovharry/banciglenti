"use client";

import { useLocale } from "next-intl";

/**
 * "13mm" (the width), in the brand orange, in the top-left corner of the photo.
 *
 * Sized in container-query units (cqw) of the square photo it sits on, so the
 * label is the same share of the picture on a small card and on the product page.
 * It is drawn on the square the photo occupies, not on the card around it: the
 * card is 4:3 and the photo is shown whole (contain) inside it. One line, so the
 * size is set per photo (see dimensionLabelSize) to fit the free corner.
 *
 * Decorative for assistive technology: the product name already carries the size.
 */
export function PhotoDimensions({ width, size = 10 }: { width?: number; size?: number }) {
  const locale = useLocale();
  if (typeof width !== "number") return null;
  const f = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="relative h-full aspect-square" style={{ containerType: "inline-size" }}>
        <div
          className="absolute top-[4%] left-[5%] font-display font-extrabold text-orange tabular-nums tracking-tight"
          style={{ fontSize: `${size}cqw`, lineHeight: 1.05, whiteSpace: "nowrap", textShadow: "0 0 0.35em #fff, 0 0 0.2em #fff" }}
        >
          {f(width)}mm
        </div>
      </div>
    </div>
  );
}
