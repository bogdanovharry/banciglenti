"use client";

/**
 * Live band-saw blade visualisation for the configurator.
 * Reacts to length / width / TPI / material — width grows the blade body,
 * TPI changes the tooth pitch, material recolours the welded cutting edge.
 * A looping shimmer suggests the blade running. Respects reduced-motion via CSS.
 */

const MAT: Record<string, { edge: string; label: string }> = {
  CS: { edge: "#9CA3AF", label: "Въглеродна стомана" },
  M42: { edge: "#D97706", label: "Биметал · HSS M42" },
  M51: { edge: "#2563EB", label: "Биметал · Cobalt M51" },
  CBN: { edge: "#0EA5A4", label: "CBN заточен ръб" },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const map = (v: number, a: number, b: number, c: number, d: number) =>
  c + ((clamp(v, a, b) - a) / (b - a)) * (d - c);

export function BandPreview({
  len,
  w,
  tpi,
  mat,
}: {
  len: number;
  w: number;
  tpi: number;
  mat: string;
}) {
  const X0 = 46;
  const X1 = 514;
  const span = X1 - X0;
  const yBottom = 116;
  const bladeH = map(w, 6, 80, 18, 70);
  const yTop = yBottom - bladeH;

  // teeth: more teeth + shallower gullets as TPI rises
  const nTeeth = Math.round(clamp(tpi * 2.4 + 4, 6, 70));
  const pitch = span / nTeeth;
  const toothH = clamp(pitch * 0.62, 4, 15);

  let d = `M ${X0} ${yTop}`;
  for (let i = 0; i < nTeeth; i++) {
    const x = X0 + i * pitch;
    // rake face then back of tooth — points up
    d += ` L ${(x + pitch * 0.5).toFixed(1)} ${(yTop - toothH).toFixed(1)} L ${(x + pitch).toFixed(1)} ${yTop}`;
  }
  d += ` L ${X1} ${yBottom} L ${X0} ${yBottom} Z`;

  const m = MAT[mat] ?? MAT.M42;
  const edgeBand = clamp(bladeH * 0.26, 5, 16); // welded cutting-edge strip thickness

  return (
    <div className="relative bg-ink overflow-hidden" style={{ aspectRatio: "560 / 170" }}>
      {/* blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      <svg viewBox="0 0 560 170" className="absolute inset-0 w-full h-full" role="img" aria-label={`Преглед на лента ${len}×${w} мм, ${tpi} TPI, ${m.label}`}>
        <defs>
          <clipPath id="bp-blade">
            <path d={d} />
          </clipPath>
          <linearGradient id="bp-steel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b4250" />
            <stop offset="0.5" stopColor="#262b34" />
            <stop offset="1" stopColor="#1b1f26" />
          </linearGradient>
        </defs>

        {/* blade body (transition height on width change) */}
        <g style={{ transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)" }}>
          <path d={d} fill="url(#bp-steel)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          {/* welded cutting edge along the toothed side */}
          <rect x={X0} y={yTop} width={span} height={edgeBand} fill={m.edge} clipPath="url(#bp-blade)" opacity="0.92" />
          {/* running shimmer */}
          <g clipPath="url(#bp-blade)">
            <rect className="bp-shimmer" x={-160} y={yTop - toothH} width={120} height={bladeH + toothH} fill="url(#bp-glint)" />
          </g>
          <linearGradient id="bp-glint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </g>

        {/* length dimension line */}
        <g stroke="rgba(255,255,255,0.4)" strokeWidth="1" fontFamily="var(--font-mono)">
          <line x1={X0} y1="138" x2={X1} y2="138" />
          <line x1={X0} y1="133" x2={X0} y2="143" />
          <line x1={X1} y1="133" x2={X1} y2="143" />
          <text x={280} y="156" fill="rgba(255,255,255,0.85)" fontSize="11" textAnchor="middle" stroke="none" letterSpacing="1">
            {len.toLocaleString("bg-BG")} мм
          </text>
        </g>

        {/* width bracket */}
        <g stroke="rgba(255,255,255,0.4)" strokeWidth="1" fontFamily="var(--font-mono)">
          <line x1={34} y1={yTop} x2={34} y2={yBottom} />
          <line x1={30} y1={yTop} x2={38} y2={yTop} />
          <line x1={30} y1={yBottom} x2={38} y2={yBottom} />
        </g>

        {/* labels */}
        <text x={X1} y={yTop - toothH - 6} fill={m.edge} fontSize="11" textAnchor="end" fontFamily="var(--font-mono)" letterSpacing="0.5">
          {tpi} TPI · {mat}
        </text>
      </svg>

      {/* corner ticks */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <span
          key={c}
          className="absolute w-2.5 h-2.5 border-white/30"
          style={{
            top: c[0] === "t" ? 8 : undefined,
            bottom: c[0] === "b" ? 8 : undefined,
            left: c[1] === "l" ? 8 : undefined,
            right: c[1] === "r" ? 8 : undefined,
            borderTopWidth: c[0] === "t" ? 1 : 0,
            borderBottomWidth: c[0] === "b" ? 1 : 0,
            borderLeftWidth: c[1] === "l" ? 1 : 0,
            borderRightWidth: c[1] === "r" ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}
