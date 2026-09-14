/**
 * Shown while the catalogue resolves. Every tab, filter, sort and page is a
 * fresh database round trip — they are all in the URL — so without this the
 * previous rows sat there looking editable while the next page was on its way.
 *
 * A skeleton of the table rather than a spinner, so the rows do not jump into
 * place when they arrive.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-w-0">
      <span className="sr-only">Зарежда…</span>

      <div className="border-b border-ink-15 px-6 py-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-2.5 w-24 bg-ink-08 tl-shimmer" />
          <div className="h-6 w-44 bg-ink-08 mt-2.5 tl-shimmer" />
          <div className="h-3 w-[300px] max-w-full bg-ink-08 mt-2 tl-shimmer" />
        </div>
        <div className="h-9 w-[300px] max-w-full bg-ink-08 tl-shimmer" />
      </div>

      <div className="border-b border-ink-15 px-6 py-3 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-16 bg-ink-08 tl-shimmer" />
        ))}
      </div>

      <div className="border-b border-ink-15 px-6 py-2.5 flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-7 w-16 bg-ink-08 tl-shimmer" />
        ))}
      </div>

      <div className="px-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-ink-08">
            <div className="flex-1 max-w-[260px]">
              <div className="h-3.5 w-full bg-ink-08 tl-shimmer" />
              <div className="h-2.5 w-24 bg-ink-08 mt-1.5 tl-shimmer" />
            </div>
            <div className="h-3.5 w-16 bg-ink-08 tl-shimmer" />
            <div className="h-8 w-[104px] bg-ink-08 tl-shimmer ml-auto" />
            <div className="h-8 w-[84px] bg-ink-08 tl-shimmer" />
            <div className="h-8 w-[124px] bg-ink-08 tl-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}
