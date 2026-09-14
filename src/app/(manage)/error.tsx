'use client' // Error boundaries must be Client Components

import Link from 'next/link'

/**
 * When a management screen fails to render.
 *
 * Without this, a database that did not answer in time meant Next's bare error
 * page — no nav, no way back, and nothing to say whether anything was lost. Saves
 * no longer land here (the actions return their failures to the form), so what
 * reaches this screen is a read that failed: retrying is the right first move,
 * and nothing typed has been thrown away by it.
 *
 * The layout above stays mounted, so the nav is still there to leave by.
 */
export default function ManageError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">Грешка</div>
      <h1 className="text-[20px] font-semibold tracking-tight mt-2">Екранът не се зареди.</h1>
      <p className="text-[13.5px] text-ink-70 mt-1 max-w-[440px] mx-auto">
        Най-често е временно — базата данни не отговори навреме. Опитайте отново; нищо записано не е
        загубено.
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-ink-30 mt-2">Код за поддръжката: {error.digest}</p>
      )}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="tl-btn h-9 px-4 bg-ink text-white text-[13px] font-semibold cursor-pointer"
        >
          Опитай отново
        </button>
        <Link
          href="/manage/orders"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-blue hover:underline"
        >
          ← Поръчки
        </Link>
      </div>
    </div>
  )
}
