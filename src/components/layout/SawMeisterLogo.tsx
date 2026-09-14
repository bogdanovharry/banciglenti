import { useId } from "react";
import Image from "next/image";

/**
 * The Saw-Meister brand mark and logo.
 *
 * The logo is now the supplied artwork: the SAW-MEISTER wordmark with the
 * blade rule beneath it, navy into orange. It replaces the drawn symbol plus
 * HTML text this file used to compose, because the delivered logo already is
 * the lockup and re-drawing it in a webfont would only approximate it.
 *
 * saw-meister-logo-new.png is the file as delivered — 1835x857, 87% of it
 * white padding, and no alpha channel, so on anything but a white surface it
 * would show as a white rectangle. The two files used here are derived from
 * it: trimmed to the 1538x255 artwork and de-matted off white, with the
 * baked-in highlight across SAW flattened out. -light swaps the navy half to
 * white, because a navy wordmark disappears on a dark surface.
 *
 * The square SawMeisterMark below is kept: a 6:1 wordmark cannot be a favicon,
 * an avatar, or a stamp on a work order, and those uses need a symbol.
 */
type Tone = "brand" | "light" | "dark" | "mono";

/** Intrinsic size of the trimmed artwork, used to hold the aspect ratio. */
const LOGO_W = 1538;
const LOGO_H = 255;

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
  tone = "brand",
  /**
   * Sized by height, never by width — a 6:1 wordmark set to a width will
   * collapse to nothing vertically. Defaults to the header's own scale, which
   * matches the ТЕХНОЛЕС mark beside it so the two markets read the same.
   */
  className = "h-8 w-auto md:h-9",
  priority = false,
}: {
  /**
   * Narrower than the mark's Tone on purpose: the artwork exists in two
   * versions, so promising "mono" or "dark" here would be promising a file
   * that does not exist. Use SawMeisterMark where a single-colour brand
   * element is needed.
   */
  tone?: "brand" | "light";
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={
        tone === "light"
          ? "/images/brands/saw-meister-logo-light.png"
          : "/images/brands/saw-meister-logo.png"
      }
      alt="Saw-Meister"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      className={`max-w-full ${className}`}
    />
  );
}
