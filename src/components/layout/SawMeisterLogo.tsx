import { useId } from "react";
import Image from "next/image";

/**
 * The Saw-Meister brand mark and logo.
 *
 * The logo is the supplied artwork: the SAW-MEISTER wordmark in brushed steel
 * blue with the orange blade curling through the S. It is the lockup as
 * delivered, so it is used as an image rather than re-drawn in a webfont.
 *
 * Bulgaria does not see it. There the header carries the ТЕХНОЛЕС mark the
 * company has traded under since 1993; Saw-Meister is the name the other
 * markets lead with, so this is the Romanian and Greek storefronts' logo.
 *
 * saw-meister-logo-source.png is the file as delivered (its web copy is
 * saw-meister-brushed.png: a name of its own, so no cache anywhere can answer
 * with the artwork that used to live at the old path) — 2170x725, most of it
 * empty margin. The file used here is derived from it: trimmed to the artwork,
 * sized for the header, and quantised to 128 colours, which took it from 477KB
 * to 45KB with no banding at the size it is shown.
 *
 * This artwork carries its own transparency, so unlike the version before it
 * there is no white box around it and it can sit on a dark surface as readily
 * as on the white header. There is still no `tone`: the brushed blue is the
 * artwork. Use SawMeisterMark below where a single-colour brand element is
 * needed — a 10:1 wordmark cannot be a favicon, an avatar, or a stamp on a
 * work order anyway.
 */
type Tone = "brand" | "light" | "dark" | "mono";

/** Intrinsic size of the trimmed artwork, used to hold the aspect ratio. */
const LOGO_W = 1919;
const LOGO_H = 200;

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
  /**
   * Sized by width, with the height left to follow.
   *
   * The previous lockup was set by height, which is the right way round for a
   * mark whose height is what runs out. This one is 9.6:1, so width is: every
   * extra pixel of height costs ten of width. Worse, height plus `max-w-full`
   * squashed it — the wordmark sat in a column with the strapline, and when
   * the strapline was the narrower of the two the image was clamped to its
   * width at full height. Setting the width and letting the height follow
   * cannot distort it.
   *
   * Each step is the widest the row can give it: beside the cart and menu
   * buttons on a phone, beside the search box from tablet up.
   */
  className = "w-[165px] h-auto sm:w-[210px] md:w-[240px] lg:w-[295px] xl:w-[320px]",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/brands/saw-meister-brushed.png"
      alt="Saw-Meister"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      className={`max-w-full ${className}`}
    />
  );
}
