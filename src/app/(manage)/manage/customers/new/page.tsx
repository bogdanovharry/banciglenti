import type { Metadata } from 'next'
import Link from 'next/link'

import { NewCustomerForm } from './NewCustomerForm'
import { requireUser } from '@/lib/manage/session'

/**
 * A customer created by hand.
 *
 * Reached from the customer list, and from "new order" when the caller is not
 * on file yet — in which case it hands straight back to the order.
 */

export const metadata: Metadata = { title: 'Нов клиент' }

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>
}) {
  await requireUser('/manage/customers/new')
  const nextParam = (await searchParams).next
  const next = (Array.isArray(nextParam) ? nextParam[0] : nextParam) === 'order' ? 'order' : null

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4">
        <Link
          href={next === 'order' ? '/manage/orders/new' : '/manage/customers'}
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
        >
          ← {next === 'order' ? 'Нова поръчка' : 'Всички клиенти'}
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight mt-2">Нов клиент</h1>
      </header>

      <div className="px-4 sm:px-6 py-5">
        <NewCustomerForm next={next} />
      </div>
    </div>
  )
}
