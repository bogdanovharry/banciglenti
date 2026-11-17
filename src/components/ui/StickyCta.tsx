"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

/**
 * A bar pinned to the bottom of a phone screen with the total and the main button,
 * for the pages where that button sits far down (cart, checkout). It is shown only
 * while the real button is still below the screen: once it is in view — or has been
 * scrolled past, into the footer — the bar steps aside, so there are never two of
 * the same button and the footer is never covered. Phones and tablets only.
 */
export function StickyCta({ target, children }: { target: RefObject<HTMLElement | null>; children: ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // A scroll listener rather than an IntersectionObserver: that one only reports
    // when the button crosses the screen edge, and a fast jump straight past it
    // (to the footer, say) would leave the bar showing.
    let frame = 0;
    const check = () => {
      frame = 0;
      const el = target.current;
      if (!el) return;
      setShow(el.getBoundingClientRect().top >= window.innerHeight - 8);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [target]);

  if (!show) return null;
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-ink-15 shadow-[0_-8px_24px_-12px_rgba(17,17,17,0.35)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-4">
      {children}
    </div>
  );
}
