import Link from 'next/link'

/**
 * A number that is not an order. Reachable by editing the URL, or by opening a
 * link to an order somebody has since deleted.
 */
export default function OrderNotFound() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">404</div>
      <h1 className="text-[20px] font-semibold tracking-tight mt-2">Няма такава поръчка.</h1>
      <p className="text-[13.5px] text-ink-70 mt-1">
        Може да е изтрита, или номерът в адреса да е сгрешен.
      </p>
      <Link
        href="/manage/orders"
        className="inline-block mt-4 font-mono text-[10px] tracking-[0.12em] uppercase text-blue hover:underline"
      >
        ← Всички поръчки
      </Link>
    </div>
  )
}
