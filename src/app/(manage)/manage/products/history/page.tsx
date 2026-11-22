import type { Metadata } from 'next'
import Link from 'next/link'

import { shortDate, shortTime } from '@/lib/manage/format'
import { getClient, requireUser } from '@/lib/manage/session'

export const metadata: Metadata = { title: 'История на промените' }

type Row = {
  id: number
  field: string
  oldValue: string | null
  newValue: string | null
  at: string
  product: { id: number; name: string } | null
  actor: { name: string | null; email: string } | null
}

/** The last hundred price, stock and status changes made on the stock-take screen: who, what, from what to what. */
export default async function ProductHistoryPage() {
  await requireUser('/manage/products/history')
  const payload = await getClient()

  let rows: Row[] = []
  let missing = false
  try {
    const result = await payload.find({ collection: 'product-changes', sort: '-at', limit: 100, depth: 1 })
    rows = (result.docs as unknown as Record<string, unknown>[]).map((d) => {
      const p = d.product as { id?: number; name?: string } | number | null
      const a = d.actor as { name?: string | null; email?: string } | number | null
      return {
        id: Number(d.id),
        field: String(d.field ?? ''),
        oldValue: (d.oldValue as string | null) ?? null,
        newValue: (d.newValue as string | null) ?? null,
        at: String(d.at ?? ''),
        product: p && typeof p === 'object' ? { id: Number(p.id), name: String(p.name ?? '—') } : null,
        actor: a && typeof a === 'object' ? { name: a.name ?? null, email: String(a.email ?? '') } : null,
      }
    })
  } catch {
    // The table is created with the migration; until then there is simply no history.
    missing = true
  }

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4">
        <Link href="/manage/products" className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink">
          ← Продукти
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight mt-2">История на промените</h1>
        <p className="mt-1 text-[12.5px] text-ink-50">Последните 100 промени на цена, наличност и статус от този екран.</p>
      </header>

      {missing ? (
        <p className="px-4 sm:px-6 py-10 text-[14px] text-ink-70">Историята още не е включена в базата.</p>
      ) : rows.length === 0 ? (
        <p className="px-4 sm:px-6 py-10 text-[14px] text-ink-70">Още няма записани промени.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="bg-paper">
              <tr className="text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                <th className="px-3 sm:px-6 py-2">Кога</th>
                <th className="px-3 py-2">Продукт</th>
                <th className="px-3 py-2">Поле</th>
                <th className="px-3 py-2">Промяна</th>
                <th className="px-3 sm:px-6 py-2">Кой</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink-08 align-top">
                  <td className="px-3 sm:px-6 py-2 whitespace-nowrap tl-figures">
                    {shortDate(r.at)} {shortTime(r.at)}
                  </td>
                  <td className="px-3 py-2">{r.product?.name ?? '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.field}</td>
                  <td className="px-3 py-2 whitespace-nowrap tl-figures">
                    {r.oldValue ?? '—'} → <strong>{r.newValue ?? '—'}</strong>
                  </td>
                  <td className="px-3 sm:px-6 py-2">{r.actor ? (r.actor.name ?? r.actor.email) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
