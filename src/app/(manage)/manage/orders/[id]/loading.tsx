/**
 * Shaped like the order, not like the list.
 *
 * Without this the list's table skeleton was inherited here, so opening an
 * order flashed twelve table rows before showing something with two columns —
 * which reads as the wrong page arriving rather than the right one loading.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Зарежда…</span>

      <div className="border-b border-ink-15 px-6 py-4">
        <div className="h-2.5 w-28 bg-ink-08 tl-shimmer" />
        <div className="flex items-center gap-4 mt-3">
          <div className="h-7 w-44 bg-ink-08 tl-shimmer" />
          <div className="h-5 w-20 bg-ink-08 tl-shimmer rounded-full" />
          <div className="h-7 w-28 bg-ink-08 tl-shimmer ml-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-r border-ink-15">
          <div className="px-6 py-3 border-b border-ink-15 flex gap-5">
            <div className="h-4 w-32 bg-ink-08 tl-shimmer" />
            <div className="h-4 w-28 bg-ink-08 tl-shimmer" />
            <div className="h-4 w-40 bg-ink-08 tl-shimmer" />
          </div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-6 py-3 border-b border-ink-08">
              <div className="h-4 w-1/2 bg-ink-08 tl-shimmer" />
              <div className="h-3 w-1/3 bg-ink-08 tl-shimmer mt-2" />
            </div>
          ))}

          <div className="px-6 py-4 bg-paper flex justify-end">
            <div className="w-48">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3.5 bg-ink-08 tl-shimmer mb-2" />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 bg-ink-08 tl-shimmer" />
          ))}
        </div>
      </div>
    </div>
  )
}
