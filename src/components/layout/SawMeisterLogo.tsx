import { useId } from "react";

/**
 * The Saw-Meister brand mark.
 *
 * A band with hook teeth on one edge, crossed by the weld seam — the seam
 * being the thing the business actually guarantees, so the mark states the
 * promise rather than just depicting a saw.
 *
 * The symbol is drawn as paths, not type, so it never depends on a webfont
 * loading. The wordmark is real HTML text in the site's own display face,
 * which keeps it selectable, translatable and crisp at every size — an image
 * of a word would go soft on a retina header and invisible to search.
 *
 * `tone="mono"` inherits `currentColor` for the single-colour uses that a
 * two-colour logo has to survive: stamped on packaging, embroidered, faxed on
 * an invoice, or rendered into a favicon.
 */
type Tone = "brand" | "light" | "dark" | "mono";

const BAND =
  "M5 38 L19 50 L22 38 L23 38 L37 50 L40 38 L41 38 L55 50 L58 38 L59 38 L59 14 L5 14 Z";

export function SawMeisterMark({
  size = 32,
  tone = "brand",
  className = "",
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  // Unique per instance: two marks on one page would otherwise share a
  // clipPath id, and the second would clip against the first.
  const clipId = `sm-band-${useId().replace(/:/g, "")}`;

  const band = tone === "brand" ? "#004FC6" : tone === "light" ? "#FFFFFF" : tone === "dark" ? "#111111" : "currentColor";
  const seam = tone === "brand" ? "#D97706" : tone === "mono" ? "currentColor" : "#D97706";

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Saw-Meister"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BAND} />
        </clipPath>
      </defs>
      <path d={BAND} fill={band} />
      <g clipPath={`url(#${clipId})`}>
        {/* In mono the seam has to read as absence, not a second colour. */}
        <path
          d="M46 8 L36 56"
          stroke={tone === "mono" ? "#FFFFFF" : seam}
          strokeWidth="4.5"
          fill="none"
          opacity={tone === "mono" ? 1 : undefined}
        />
      </g>
    </svg>
  );
}

export function SawMeisterLogo({
  size = 32,
  tone = "brand",
  tagline = false,
  className = "",
}: {
  size?: number;
  tone?: Tone;
  /** "Innovation sharpened to perfection" — omit it below ~28px, it turns to grey mush. */
  tagline?: boolean;
  className?: string;
}) {
  const text =
    tone === "light" ? "text-white" : tone === "mono" ? "text-current" : "text-ink";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SawMeisterMark size={size} tone={tone} />
      <span className="inline-flex flex-col justify-center leading-none">
        <span
          className={`font-display font-bold tracking-[-0.02em] ${text}`}
          style={{ fontSize: size * 0.5 }}
        >
          SAW<span className="text-orange">-</span>MEISTER
        </span>
        {tagline && (
          <span
            className={`font-mono uppercase ${tone === "light" ? "text-white/50" : "text-ink-50"}`}
            style={{ fontSize: size * 0.2, letterSpacing: "0.14em", marginTop: size * 0.09 }}
          >
            Innovation sharpened to perfection
          </span>
        )}
      </span>
    </span>
  );
}
