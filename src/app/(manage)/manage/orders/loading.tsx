/**
 * Shown while the order book resolves. Every navigation here is a fresh
 * database round trip — filters and search are in the URL — so without this the
 * previous list sat frozen with no sign that anything was happening.
 *
 * A skeleton of the table rather than a spinner, so the rows do not jump into
 * place when they arrive.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-w-0">
      <span className="sr-only">Зарежда…</span>

      <div className="border-b border-ink-15 px-6 py-4 flex items-end justify-between gap-4">
        <div>
          <div className="h-2.5 w-24 bg-ink-08 tl-shimmer" />
          <div className="h-6 w-44 bg-ink-08 mt-2.5 tl-shimmer" />
        </div>
        <div className="h-9 w-[290px] bg-ink-08 tl-shimmer" />
      </div>

      <div className="border-b border-ink-15 px-6 py-3 flex gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 w-16 bg-ink-08 tl-shimmer" />
        ))}
      </div>

      <div className="px-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-ink-08">
            <div className="h-3.5 w-20 bg-ink-08 tl-shimmer" />
            <div className="h-3.5 flex-1 max-w-[220px] bg-ink-08 tl-shimmer" />
            <div className="h-3.5 w-24 bg-ink-08 tl-shimmer" />
            <div className="h-3.5 w-14 bg-ink-08 tl-shimmer ml-auto" />
            <div className="h-3.5 w-20 bg-ink-08 tl-shimmer" />
            <div className="h-5 w-20 bg-ink-08 tl-shimmer rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
