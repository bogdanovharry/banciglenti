import { ReactNode, ButtonHTMLAttributes } from "react";
import Image from "next/image";

// Design tokens inline (matching globals.css @theme)
const T = {
  ink: "#111111",
  ink50: "#808080",
  ink70: "#4D4D4D",
  ink15: "#D9D9D9",
  orange: "#D97706",
  paper: "#F5F5F5",
  paperDeep: "#EDEDED",
  navyDeep: "#001F5C",
  navyInk: "#111111",
  ok: "#16A34A",
};

// --- Placeholder: spec-sheet style image placeholder ---
export function Placeholder({
  label = "product",
  ratio = "1/1",
  tone = "paper",
  caption,
  children,
  className,
  src,
  alt,
  fit = "cover",
  sizes = "(max-width: 768px) 100vw, 33vw",
  preload,
}: {
  label?: string;
  ratio?: string;
  tone?: "paper" | "ink";
  caption?: string;
  children?: ReactNode;
  className?: string;
  /** When set, renders a real optimised image inside the tick-mark frame. */
  src?: string;
  alt?: string;
  fit?: "cover" | "contain";
  sizes?: string;
  preload?: boolean;
}) {
  const bg = tone === "ink" ? T.navyDeep : T.paperDeep;
  const fg = tone === "ink" ? "rgba(255,255,255,0.45)" : "rgba(17,24,39,0.45)";
  const line = tone === "ink" ? "rgba(255,255,255,0.06)" : "rgba(17,24,39,0.05)";

  return (
    <div
      className={className}
      style={{
        aspectRatio: ratio,
        position: "relative",
        background: bg,
        backgroundImage: src ? undefined : `repeating-linear-gradient(135deg, ${line} 0 1px, transparent 1px 14px)`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src && (
        <Image
          src={src}
          alt={alt ?? caption ?? label}
          fill
          sizes={sizes}
          preload={preload}
          style={{ objectFit: fit, objectPosition: "center" }}
        />
      )}

      {/* Corner tick marks */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => {
        const pos: Record<string, Record<string, number>> = {
          tl: { top: 8, left: 8 },
          tr: { top: 8, right: 8 },
          bl: { bottom: 8, left: 8 },
          br: { bottom: 8, right: 8 },
        };
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              borderColor: fg,
              borderStyle: "solid",
              borderWidth: 0,
              ...(c[0] === "t" ? { borderTopWidth: 1 } : { borderBottomWidth: 1 }),
              ...(c[1] === "l" ? { borderLeftWidth: 1 } : { borderRightWidth: 1 }),
              ...pos[c],
            }}
          />
        );
      })}
      {!src &&
        (children ?? (
          <div
            style={{
              textAlign: "center",
              color: fg,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <div>[ {label} ]</div>
            {caption && <div style={{ marginTop: 4, opacity: 0.75 }}>{caption}</div>}
          </div>
        ))}
    </div>
  );
}

// --- Button ---
type BtnVariant = "primary" | "dark" | "ghost" | "ghostLight" | "link";
type BtnSize = "sm" | "md" | "lg";

export function Btn({
  variant = "primary",
  size = "md",
  children,
  icon,
  iconRight,
  fullWidth,
  className,
  ...props
}: {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: "h-9 px-3.5 text-[13px]",
    md: "h-11 px-5 text-sm",
    lg: "h-14 px-7 text-[15px]",
  };

  const variantClasses = {
    primary: "bg-orange text-white hover:brightness-105",
    dark: "bg-ink text-white hover:brightness-110",
    ghost: "bg-transparent text-ink border-ink-15 hover:bg-ink-05",
    ghostLight: "bg-transparent text-white border-white/25 hover:bg-white/10",
    link: "bg-transparent text-ink underline underline-offset-4 !h-auto !px-0",
  };

  return (
    <button
      // A disabled button has to look disabled. Btn already forwarded the
      // attribute, so the click was blocked — but it kept full colour and a
      // pointer cursor, which reads as "broken" rather than "not yet".
      className={`tl-btn inline-flex items-center justify-center gap-2 font-semibold tracking-tight border border-transparent cursor-pointer transition-all whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className ?? ""}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}

// --- Tag ---
export function Tag({
  children,
  tone = "paper",
}: {
  children: ReactNode;
  tone?: "paper" | "ink" | "orange" | "ok" | "outline";
}) {
  const toneClasses = {
    paper: "bg-paper-deep text-ink",
    ink: "bg-ink text-white",
    orange: "bg-orange text-white",
    ok: "bg-ok/10 text-ok",
    outline: "bg-transparent text-ink-70 border border-ink-15",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] uppercase px-2 py-1 ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

// --- Section Number ---
export function SectionNumber({
  n,
  label,
  tone = "dark",
}: {
  n: string;
  label: string;
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[11px] tracking-[0.15em] uppercase ${tone === "light" ? "text-white/55" : "text-ink-50"}`}
    >
      <span className={tone === "light" ? "text-white" : "text-orange"}>{n}</span>
      <span className="w-6 h-px bg-current opacity-40" />
      <span>{label}</span>
    </div>
  );
}

// --- Tick Rule ---
export function TickRule({ color = "#D9D9D9" }: { color?: string }) {
  return (
    <div className="h-4 relative" style={{ borderTop: `1px solid ${color}` }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${(i / 19) * 100}%`,
            width: 1,
            height: i % 5 === 0 ? 8 : 4,
            background: color,
          }}
        />
      ))}
    </div>
  );
}
