"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Btn } from "@/components/ui/primitives";
import { IconPhone, IconArrowRight } from "@/components/ui/icons";
import { COMPANY } from "@/lib/company";

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
  useEffect(() => {
    // Server-side causes are already logged; this captures client-side ones.
    console.error("Storefront error:", error);
  }, [error]);

  return (
    <div className="bg-paper min-h-[70vh] flex items-center">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-20 w-full">
        <div className="max-w-[640px]">
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            Техническа грешка
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-ink mt-5 mb-5">
            Нещо се обърка.
          </h1>
          <p className="font-sans text-[17px] leading-relaxed text-ink-70 mb-8">
            Страницата не можа да се зареди. Опитайте отново — ако проблемът остане,
            обадете се и ще приемем поръчката по телефона.
          </p>

          <div className="flex gap-3 flex-wrap items-center">
            <button onClick={reset} className="bg-transparent border-none p-0 cursor-pointer">
              <Btn variant="primary" size="lg" iconRight={<IconArrowRight size={16} />}>
                Опитай отново
              </Btn>
            </button>
            <Link href="/"><Btn variant="ghost" size="lg">Към началото</Btn></Link>
          </div>

          <div className="mt-10 pt-8 border-t border-ink-15">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-2">
              Поръчки по телефона · {COMPANY.hours}
            </div>
            <a
              href={COMPANY.phone.office.href}
              className="font-display text-3xl font-extrabold text-ink no-underline flex items-center gap-3 tabular-nums hover:text-orange transition-colors"
            >
              <IconPhone size={24} className="text-orange" /> {COMPANY.phone.office.display}
            </a>
          </div>

          {/* The digest is what correlates this with the server log. */}
          {error.digest && (
            <p className="font-mono text-[10px] text-ink-30 mt-8">Код: {error.digest}</p>
          )}
        </div>
      </div>
    </div>
  );
}
