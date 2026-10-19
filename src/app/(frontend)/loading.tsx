import { getTranslations } from "next-intl/server";

/**
 * Shown while a database-backed route resolves. Every catalogue page now reads
 * from Payload, so without this a navigation left the previous page frozen with
 * no feedback.
 *
 * Deliberately a skeleton of the catalogue grid rather than a spinner: it
 * occupies the shape the content will take, so the page does not jump when the
 * real cards arrive.
 */
export default async function Loading() {
  const t = await getTranslations("loadingPage");
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{t("text")}</span>

      {/* Masthead */}
      <div className="bg-blue-deep">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-10 pb-12 md:pt-14 md:pb-16">
          <div className="h-3 w-40 bg-white/20 mb-7 tl-shimmer" />
          <div className="h-10 md:h-14 w-[min(560px,80%)] bg-white/25 tl-shimmer" />
          <div className="h-4 w-[min(420px,60%)] bg-white/15 mt-6 tl-shimmer" />
        </div>
      </div>

      {/* Card grid */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-ink-15 bg-white">
              <div className="aspect-[4/3] bg-paper tl-shimmer" />
              <div className="p-5">
                <div className="h-2.5 w-24 bg-ink-08 tl-shimmer" />
                <div className="h-4 w-3/4 bg-ink-08 mt-3 tl-shimmer" />
                <div className="h-4 w-1/2 bg-ink-08 mt-2 tl-shimmer" />
                <div className="mt-5 pt-4 border-t border-ink-05 flex justify-between">
                  <div className="h-6 w-20 bg-ink-08 tl-shimmer" />
                  <div className="h-8 w-24 bg-ink-08 tl-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
