import type { Metadata } from 'next'
import Link from 'next/link'

import { money, shortDate } from '@/lib/manage/format'
import { PAGE_SIZE } from '@/lib/manage/vocabulary'
import {
  CUSTOMER_SORTS,
  DEFAULT_CUSTOMER_SORT,
  isCustomerSortKey,
  listCustomers,
  type CustomerSortKey,
} from '@/lib/manage/customers'

/**
 * The customer book.
 *
 * Ordered by what they have spent, because the question this screen answers is
 * "who matters" — not "who registered most recently", which is what every
 * generated admin gives you and nobody has ever needed.
 *
 * The machine count is on the row for the same reason it exists at all: a
 * customer with a machine on file is one you can ring about a blade without
 * asking them to go and measure it.
 */

export const metadata: Metadata = { title: 'Клиенти' }

type Search = { q?: string | string[]; sort?: string | string[]; page?: string | string[] }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

function customersHref(p: { q?: string; sort?: CustomerSortKey; page?: number }): string {
  const sp = new URLSearchParams()
  if (p.q) sp.set('q', p.q)
  if (p.sort && p.sort !== DEFAULT_CUSTOMER_SORT) sp.set('sort', p.sort)
  if (p.page && p.page > 1) sp.set('page', String(p.page))
  const query = sp.toString()
  return query ? `/manage/customers?${query}` : '/manage/customers'
}

const TH = 'px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50'
const TD = 'px-3 py-2.5 align-middle border-t border-ink-08'

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const sp = await searchParams
  const q = (one(sp.q) ?? '').trim()
  const sortParam = one(sp.sort)
  const sort: CustomerSortKey = isCustomerSortKey(sortParam) ? sortParam : DEFAULT_CUSTOMER_SORT
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1)

  const list = await listCustomers({ q, sort, page })

  const from = (list.page - 1) * PAGE_SIZE + 1
  const to = Math.min(list.page * PAGE_SIZE, list.total)

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            02 · Клиенти
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1">
            {list.total === 0
              ? 'Няма клиенти'
              : `${list.total} ${list.total === 1 ? 'клиент' : 'клиенти'}`}
            {q && <span className="text-ink-50 font-normal"> за „{q}“</span>}
          </h1>
        </div>

        <form method="get" action="/manage/customers" className="flex flex-wrap items-center gap-2">
          {sort !== DEFAULT_CUSTOMER_SORT && <input type="hidden" name="sort" value={sort} />}
          <Link
            href="/manage/customers/new"
            className="tl-btn h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] font-semibold hover:bg-paper"
          >
            + Нов клиент
          </Link>
          <label htmlFor="q" className="sr-only">
            Търсене по име, фирма, имейл или телефон
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Име, фирма, имейл, телефон"
            autoComplete="off"
            className="h-9 w-full sm:w-[240px] border border-ink-15 px-3 text-[13px] placeholder:text-ink-30 focus:border-blue focus:outline-none"
          />
          <button
            type="submit"
            className="tl-btn h-9 px-4 bg-ink text-white text-[13px] font-semibold cursor-pointer"
          >
            Търси
          </button>
          {q && (
            <Link
              href={customersHref({ sort })}
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
            >
              Изчисти
            </Link>
          )}
        </form>
      </header>

      <div className="border-b border-ink-15 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto overflow-y-hidden">
        {(Object.keys(CUSTOMER_SORTS) as CustomerSortKey[]).map((key) => {
          const active = key === sort
          return (
            <Link
              key={key}
              href={customersHref({ q, sort: key })}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap px-3 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-orange text-ink font-semibold'
                  : 'border-transparent text-ink-70 hover:text-ink'
              }`}
            >
              {CUSTOMER_SORTS[key].label}
            </Link>
          )
        })}
      </div>

      {list.rows.length === 0 ? (
        <div className="px-4 sm:px-6 py-16 text-center">
          <div className="text-[15px] text-ink-70">
            {q ? `Нищо не отговаря на „${q}“.` : 'Още няма клиенти.'}
          </div>
          {q && (
            <Link
              href="/manage/customers"
              className="inline-block mt-3 font-mono text-[10px] tracking-[0.12em] uppercase text-blue hover:underline"
            >
              Покажи всички
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead className="bg-paper">
              <tr>
                <th scope="col" className={TH}>
                  Клиент
                </th>
                <th scope="col" className={TH}>
                  Контакт
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Машини
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Поръчки
                </th>
                <th scope="col" className={TH}>
                  Последна
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Похарчено
                </th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((c) => (
                <tr key={c.id} className="hover:bg-paper/60">
                  <td className={`${TD} max-w-[260px]`}>
                    <Link
                      href={`/manage/customers/${c.id}`}
                      className="font-semibold text-blue hover:underline"
                    >
                      {c.name}
                    </Link>
                    {c.company && (
                      <div className="text-[12px] text-ink-50 truncate">{c.company}</div>
                    )}
                  </td>

                  <td className={`${TD} max-w-[240px]`}>
                    {c.phone && (
                      <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="hover:underline">
                        {c.phone}
                      </a>
                    )}
                    <div className="text-[12px] text-ink-50 truncate">{c.email}</div>
                  </td>

                  <td className={`${TD} text-right tl-figures whitespace-nowrap`}>
                    {c.machineCount > 0 ? (
                      <span className="font-semibold">{c.machineCount}</span>
                    ) : (
                      <span className="text-ink-30">—</span>
                    )}
                  </td>

                  <td className={`${TD} text-right tl-figures whitespace-nowrap`}>
                    {c.orderCount || <span className="text-ink-30">—</span>}
                  </td>

                  <td className={`${TD} whitespace-nowrap tl-figures text-ink-70`}>
                    {c.lastOrderAt ? shortDate(c.lastOrderAt) : <span className="text-ink-30">—</span>}
                  </td>

                  <td className={`${TD} text-right font-semibold tl-figures whitespace-nowrap`}>
                    {c.totalSpent > 0 ? money(c.totalSpent) : <span className="text-ink-30">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list.pageCount > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-ink-15 flex items-center justify-between gap-4">
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50 tl-figures">
            {from}–{to} от {list.total}
          </div>
          <div className="flex items-center gap-2">
            {list.page > 1 && (
              <Link
                href={customersHref({ q, sort, page: list.page - 1 })}
                className="h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] hover:bg-paper"
              >
                ← Назад
              </Link>
            )}
            <span className="font-mono text-[11px] text-ink-50 tl-figures">
              {list.page} / {list.pageCount}
            </span>
            {list.page < list.pageCount && (
              <Link
                href={customersHref({ q, sort, page: list.page + 1 })}
                className="h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] hover:bg-paper"
              >
                Напред →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
