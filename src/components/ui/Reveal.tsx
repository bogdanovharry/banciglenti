"use client";

import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react";

/**
 * Scroll-reveal wrapper — fades + lifts its children into view once, the first
 * time they enter the viewport. Zero dependencies (IntersectionObserver) and
 * fully respects prefers-reduced-motion (renders instantly, no transform).
 */
export function Reveal({
  children,
  as,
  delay = 0,
  y = 18,
  className,
  once = true,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setInstant(true);
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={className}
      // Exposed so a caller can cascade its own children in CSS (see .tl-stagger)
      // instead of the whole block arriving at once.
      data-shown={shown ? "true" : "false"}
      style={
        instant
          ? undefined
          : {
              opacity: shown ? 1 : 0,
              transform: shown ? "none" : `translate3d(0, ${y}px, 0)`,
              transition: `opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
              willChange: "opacity, transform",
            }
      }
    >
      {children}
    </Tag>
  );
}
