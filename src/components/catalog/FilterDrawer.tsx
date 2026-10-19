"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { IconClose } from "@/components/ui/icons";

/**
 * The filter panel as a full-height sheet, for screens too narrow for a sidebar.
 *
 * Below 1024px the shop's sidebar is hidden, which left a phone with no way to
 * filter at all. This holds the same panel in a dialog: Escape closes it, the
 * page behind stops scrolling while it is open, and focus moves to the close
 * button on open and back to whatever opened it on close. A full focus trap is
 * not attempted — the backdrop and the close button are the only other things
 * on screen.
 *
 * Render it only while open; the caller owns the state. That keeps a second
 * copy of the filter controls out of the page when the sheet is shut.
 */
export function FilterDrawer({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Sticky action row under the panel — "Show 12 products". */
  footer?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("catalog");
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest handler without re-running the open/close effect below.
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-ink/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 w-full max-w-[400px] bg-white flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 px-5 h-16 border-b border-ink-15 shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink m-0">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("filters.close")}
            className="w-10 h-10 flex items-center justify-center bg-transparent border border-ink-15 cursor-pointer text-ink hover:border-ink transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-6">{children}</div>

        {footer && <div className="shrink-0 border-t border-ink-15 p-4 bg-white">{footer}</div>}
      </div>
    </div>
  );
}
