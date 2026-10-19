"use client";

import { useEffect, useRef, type ReactNode, type ElementType } from "react";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Scroll-reveal wrapper: fades and lifts its content into view once, the first
 * time it scrolls into the viewport.
 *
 * Progressive enhancement. The server-rendered HTML is fully visible; nothing is
 * hidden by the markup, so with slow, failed or no JavaScript every section is
 * still readable. After hydration an effect hides only what is still below the
 * fold and plays the entrance when it arrives. It manipulates the DOM directly
 * (inline style, then the Web Animations API) instead of keeping a `shown`
 * state, which is both what removes the set-state-in-effect problem and what
 * avoids a re-render per revealed block.
 *
 * Nothing runs for visitors who ask for reduced motion, or in a browser without
 * IntersectionObserver / element.animate: the content simply stays as rendered.
 *
 * `stagger` cascades the direct children (70 ms apart) instead of moving the
 * wrapper — used where the wrapper owns grid borders that must not move.
 */
export function Reveal({
  children,
  as,
  delay = 0,
  y = 18,
  className,
  stagger = false,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  y?: number;
  className?: string;
  stagger?: boolean;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined" ||
      typeof el.animate !== "function"
    ) {
      return;
    }

    // Already on screen when the page hydrates: leave it alone, hiding it now
    // would only make visible content blink.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.93 && rect.bottom > 0) return;

    const targets: HTMLElement[] = stagger
      ? (Array.from(el.children) as HTMLElement[])
      : [el];
    if (targets.length === 0) return;

    const lift = stagger ? 14 : y;
    const duration = stagger ? 550 : 650;
    const hide = () => {
      for (const t of targets) {
        t.style.opacity = "0";
        t.style.transform = `translate3d(0, ${lift}px, 0)`;
      }
    };
    const unhide = () => {
      for (const t of targets) {
        t.style.opacity = "";
        t.style.transform = "";
      }
    };
    hide();

    const animations: Animation[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        targets.forEach((t, i) => {
          // `backwards` fill holds the first keyframe through the delay, so
          // clearing the inline hide below cannot flash the content.
          animations.push(
            t.animate(
              [
                { opacity: 0, transform: `translate3d(0, ${lift}px, 0)` },
                { opacity: 1, transform: "translate3d(0, 0, 0)" },
              ],
              {
                duration,
                delay: delay + (stagger ? i * 70 : 0),
                easing: EASE,
                fill: "backwards",
              },
            ),
          );
        });
        unhide();
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      for (const a of animations) a.cancel();
      unhide();
    };
  }, [delay, y, stagger]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
