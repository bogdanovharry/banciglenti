import Link from 'next/link'

export default function CustomerNotFound() {
  return (
    <div className="px-6 py-16 text-center">
      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">404</div>
      <h1 className="text-[20px] font-semibold tracking-tight mt-2">Няма такъв клиент.</h1>
      <p className="text-[13.5px] text-ink-70 mt-1">
        Може да е изтрит, или номерът в адреса да е сгрешен.
      </p>
      <Link
        href="/manage/customers"
        className="inline-block mt-4 font-mono text-[10px] tracking-[0.12em] uppercase text-blue hover:underline"
      >
        ← Всички клиенти
      </Link>
    </div>
  )
}
