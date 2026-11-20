"use client";

import { useLocale } from "next-intl";

import { bimetalGrade } from "@/lib/product-images";

/**
 * The steel of a bimetal band (M42 or M51) in the brand orange, with its width underneath,
 * in the top-left corner of the photograph. Drawn like PhotoBadge, in container units on the
 * square the photo occupies. Decorative for assistive technology: the name carries both.
 */
export function BimetalBadge({ name, width }: { name: string; width?: number }) {
  const locale = useLocale();
  const grade = bimetalGrade(name);
  if (!grade) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-center">
      <div className="relative h-full aspect-square" style={{ containerType: "inline-size" }}>
        <div
          className="absolute top-[4%] left-[5%] font-display font-extrabold text-orange tracking-tight"
          style={{ lineHeight: 1.05, whiteSpace: "nowrap", textShadow: "0 0 0.35em #fff, 0 0 0.2em #fff" }}
        >
          <div style={{ fontSize: "12cqw" }}>{grade}</div>
          {typeof width === "number" && (
            <div style={{ fontSize: "6cqw" }}>{width.toLocaleString(locale, { maximumFractionDigits: 2 })}mm</div>
          )}
        </div>
      </div>
    </div>
  );
}
