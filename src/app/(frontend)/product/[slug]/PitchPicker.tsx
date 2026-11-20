"use client";

import { useTranslations } from "next-intl";

import { bladeGuide, type Translate } from "@/lib/blade-guide";
import type { PitchInfo } from "@/lib/product-pitch";

/** Named edge shapes are words; "8 TPI" and "12.5" are numbers and read the same everywhere. */
const PROFILES = new Set(["cleaner-tooth", "concave-wave", "convex-wave", "smooth-ground", "wave"]);

/**
 * Choose the tooth pitch (or the edge profile, for food blades) of a ready-made
 * blade, and read what each one is for.
 *
 * The explanations are the configurator's own: `bladeGuide` turns the same
 * width, thickness, brand and pitch into the sentence a person behind the
 * counter would say. Here it is shown for every option at once, so the buyer
 * can compare before choosing instead of trying them one by one.
 */
export function PitchPicker({
  info,
  width,
  thickness,
  value,
  onChange,
  priceOf,
}: {
  info: PitchInfo;
  width: number;
  thickness: number;
  value: string | null;
  onChange: (pitch: string) => void;
  /** Net EUR → the text the page shows for a price (VAT and currency included). */
  priceOf: (net: number) => string;
}) {
  const t = useTranslations("catalog");
  const guideT = t as unknown as Translate;
  const label = (pitch: string) => (PROFILES.has(pitch) ? t(`pitch.${pitch}`) : pitch);
  const hasProfile = info.options.some((o) => PROFILES.has(o.pitch));
  const note = (o: PitchInfo["options"][number]) =>
    bladeGuide(guideT, info.table, { width, thickness, pitch: o.pitch, brand: o.brand }).pitchNote;

  // Prices are shown per option only when the options really differ in price.
  const priced = new Set(info.options.map((o) => o.unitPrice)).size > 1;
  const chosen = info.options.find((o) => o.pitch === value) ?? null;
  const single = info.options.length === 1;

  return (
    <div className="mb-6 border border-ink-15 p-4">
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-3">
        {hasProfile ? t("product.pitchTitleProfile") : t("product.pitchTitle")}
      </div>

      {!single && (
        <div role="radiogroup" aria-label={t("product.pitchTitle")} className="flex flex-wrap gap-2">
          {info.options.map((o) => {
            const on = o.pitch === value;
            return (
              <button
                key={o.pitch}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange(o.pitch)}
                className={`px-3.5 py-2 border font-sans text-sm cursor-pointer transition-colors ${
                  on ? "border-blue bg-blue text-white" : "border-ink-15 bg-white text-ink hover:border-ink"
                }`}
              >
                {label(o.pitch)}
                {priced && <span className={`ml-2 font-mono text-[11px] ${on ? "text-white/80" : "text-ink-50"}`}>{priceOf(o.unitPrice)}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* What the selection is for — or, before one is made, the reason it is needed. */}
      <p className="font-sans text-[13px] leading-relaxed text-ink-70 mt-3 mb-0" aria-live="polite">
        {single ? <strong className="text-ink">{label(info.options[0].pitch)}. </strong> : null}
        {chosen ? (
          <>
            {!single && <strong className="text-ink">{label(chosen.pitch)}. </strong>}
            {note(chosen)}
          </>
        ) : single ? (
          note(info.options[0])
        ) : (
          t("product.pitchChoose")
        )}
      </p>

      {!single && (
        <details className="mt-3 group">
          <summary className="cursor-pointer font-sans text-[13px] text-blue select-none">{t("product.pitchCompare")}</summary>
          <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-3">
            {info.options.map((o) => (
              <li key={o.pitch} className="font-sans text-[13px] leading-relaxed text-ink-70">
                <strong className="text-ink">{label(o.pitch)}.</strong> {note(o)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
