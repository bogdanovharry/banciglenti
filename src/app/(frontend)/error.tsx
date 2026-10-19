"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Btn } from "@/components/ui/primitives";
import { IconPhone, IconArrowRight } from "@/components/ui/icons";
import { companyFor } from "@/lib/company";

/**
 * Catches a render or data-fetch failure anywhere in the storefront — most
 * plausibly the database being unreachable, since every catalogue page reads
 * from Payload at request time.
 *
 * A customer who cannot browse can still phone, so the number is the primary
 * action rather than a footnote. `reset()` retries the segment without a full
 * reload, which is usually enough for a transient connection drop.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  const company = companyFor(useLocale());

  useEffect(() => {
    // Server-side causes are already logged; this captures client-side ones.
    console.error("Storefront error:", error);
  }, [error]);

  return (
    <div className="bg-paper min-h-[70vh] flex items-center">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-20 w-full">
        <div className="max-w-[640px]">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            {t("eyebrow")}
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-ink mt-5 mb-5">
            {t("title")}
          </h1>
          <p className="font-sans text-[17px] leading-relaxed text-ink-70 mb-8">
            {t("text")}
          </p>

          <div className="flex gap-3 flex-wrap items-center">
            <button onClick={reset} className="bg-transparent border-none p-0 cursor-pointer">
              <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>
                {t("retry")}
              </Btn>
            </button>
            <Link href="/"><Btn variant="ghost" size="lg">{t("home")}</Btn></Link>
          </div>

          <div className="mt-10 pt-8 border-t border-ink-15">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-2">
              {t("phoneOrders", { hours: t("hours") })}
            </div>
            <a
              href={company.phone.office.href}
              className="font-display text-3xl font-extrabold text-ink no-underline flex items-center gap-3 tabular-nums hover:text-orange transition-colors"
            >
              <IconPhone size={24} className="text-orange" /> {company.phone.office.display}
            </a>
          </div>

          {/* The digest is what correlates this with the server log. */}
          {error.digest && (
            <p className="font-mono text-[10px] text-ink-30 mt-8">{t("code", { digest: error.digest })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
