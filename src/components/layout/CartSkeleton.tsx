import { useTranslations } from "next-intl";

/**
 * Stands in for /cart and /checkout until the stored cart has been read.
 * Without it the server-rendered, still-empty cart flashed "cart is empty" for
 * a frame before the real contents arrived.
 */
export function CartSkeleton() {
  const t = useTranslations("cart");
  return (
    <div className="bg-paper min-h-dvh" aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("loading")}</span>
      <div className="bg-blue-deep">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-10 pb-12 md:pt-14 md:pb-16">
          <div className="h-3 w-40 bg-white/20 mb-7 tl-shimmer" />
          <div className="h-10 md:h-14 w-[min(480px,80%)] bg-white/25 tl-shimmer" />
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 pb-[120px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8">
          <div className="bg-white border border-ink-15 p-6 flex flex-col gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="w-[72px] aspect-square bg-ink-08 tl-shimmer shrink-0" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-ink-08 tl-shimmer" />
                  <div className="h-3 w-1/2 bg-ink-08 mt-2 tl-shimmer" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-ink-08 h-64 tl-shimmer" />
        </div>
      </div>
    </div>
  );
}
