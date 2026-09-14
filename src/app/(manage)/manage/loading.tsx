/**
 * Shown while the dashboard's figures resolve — eight aggregate queries, run
 * together, but still a round trip every time the page is opened.
 *
 * Laid out as the page is: the masthead, the four cards, then the wide column
 * of tables beside the narrow one of panels, so nothing jumps when it arrives.
 *
 * Next wraps every route under /manage in this boundary, not only the
 * dashboard. Orders, customers and products bring their own loading.tsx, which
 * is nearer and wins; a screen added here without one would borrow this
 * dashboard-shaped skeleton, so give it its own.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-w-0">
      <span className="sr-only">Зарежда…</span>

      <div className="border-b border-ink-15 px-6 py-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-2.5 w-24 bg-ink-08 tl-shimmer" />
          <div className="h-6 w-52 bg-ink-08 mt-2.5 tl-shimmer" />
        </div>
        <div className="h-3 w-36 bg-ink-08 tl-shimmer" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-ink-15 border-b border-ink-15">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white px-6 py-4">
            <div className="h-2.5 w-28 bg-ink-08 tl-shimmer" />
            <div className="h-7 w-32 bg-ink-08 mt-2.5 tl-shimmer" />
            <div className="h-3 w-44 max-w-full bg-ink-08 mt-2 tl-shimmer" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 border-b xl:border-b-0 xl:border-r border-ink-15">
          <div className="px-4 py-3 border-b border-ink-15 bg-paper">
            <div className="h-2.5 w-32 bg-ink-08 tl-shimmer" />
          </div>
          <div className="px-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-ink-08">
                <div className="h-3.5 w-28 bg-ink-08 tl-shimmer" />
                <div className="h-3.5 flex-1 max-w-[200px] bg-ink-08 tl-shimmer" />
                <div className="hidden sm:block h-3.5 w-24 bg-ink-08 tl-shimmer" />
                <div className="h-3.5 w-16 bg-ink-08 tl-shimmer ml-auto" />
                <div className="hidden sm:block h-5 w-20 bg-ink-08 tl-shimmer rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {[6, 6, 2].map((rows, panel) => (
            <div key={panel} className="border-b border-ink-15">
              <div className="px-4 py-3 border-b border-ink-15 bg-paper">
                <div className="h-2.5 w-28 bg-ink-08 tl-shimmer" />
              </div>
              {Array.from({ length: rows }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-ink-08 last:border-b-0"
                >
                  <div className="h-3.5 w-28 bg-ink-08 tl-shimmer" />
                  <div className="h-3.5 w-16 bg-ink-08 tl-shimmer" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
