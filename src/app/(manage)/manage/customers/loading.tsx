/**
 * Shown while the customer book resolves. It reads every order once to work out
 * what each customer has spent, so it is the slowest screen in here — which is
 * exactly why it needs to say it is working.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="min-w-0">
      <span className="sr-only">Зарежда…</span>

      <div className="border-b border-ink-15 px-6 py-4 flex items-end justify-between gap-4">
        <div>
          <div className="h-2.5 w-24 bg-ink-08 tl-shimmer" />
          <div className="h-6 w-40 bg-ink-08 mt-2.5 tl-shimmer" />
        </div>
        <div className="h-9 w-[320px] bg-ink-08 tl-shimmer" />
      </div>

      <div className="border-b border-ink-15 px-6 py-3 flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 w-24 bg-ink-08 tl-shimmer" />
        ))}
      </div>

      <div className="px-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-ink-08">
            <div className="h-3.5 w-40 bg-ink-08 tl-shimmer" />
            <div className="h-3.5 w-48 bg-ink-08 tl-shimmer" />
            <div className="h-3.5 w-10 bg-ink-08 tl-shimmer ml-auto" />
            <div className="h-3.5 w-10 bg-ink-08 tl-shimmer" />
            <div className="h-3.5 w-20 bg-ink-08 tl-shimmer" />
            <div className="h-3.5 w-20 bg-ink-08 tl-shimmer" />
          </div>
        ))}
      </div>
    </div>
  )
}
