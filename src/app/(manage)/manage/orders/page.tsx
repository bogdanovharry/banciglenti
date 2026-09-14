import type { Metadata } from 'next'
import Link from 'next/link'

import { StatusPill } from '../../_components/StatusPill'
import { money, shortDate, shortTime } from '@/lib/manage/format'
import { orderHref } from '@/lib/manage/routes'
import { listOrders } from '@/lib/manage/orders'
import {
  DEFAULT_SORT,
  isOrderStatus,
  isSortKey,
  ORDER_STATUSES,
  PAGE_SIZE,
  PAYMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  type SortKey,
} from '@/lib/manage/vocabulary'

/**
 * The order book.
 *
 * Read before it is edited, so status and total lead and the row is dense: one
 * line per order, no card, no wrapping. Twenty-odd orders fit a laptop screen,
 * which is the whole reason this screen exists rather than Payload's list.
 *
 * Every control is a link or a plain GET form — no client JavaScript on this
 * page at all. That is not minimalism for its own sake: it means the filters
 * are in the URL, so a filtered view can be bookmarked, sent to someone, or
 * reopened tomorrow, and the back button does what it should.
 */

export const metadata: Metadata = { title: 'Поръчки' }

type Search = {
  status?: string | string[]
  q?: string | string[]
  sort?: string | string[]
  page?: string | string[]
}

/** Repeated keys ("?q=a&q=b") arrive as arrays; take the first and move on. */
const one = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v

function ordersHref(p: {
  status?: string | null
  q?: string
  sort?: SortKey
  page?: number
}): string {
  const sp = new URLSearchParams()
  if (p.status) sp.set('status', p.status)
  if (p.q) sp.set('q', p.q)
  if (p.sort && p.sort !== DEFAULT_SORT) sp.set('sort', p.sort)
  if (p.page && p.page > 1) sp.set('page', String(p.page))
  const query = sp.toString()
  return query ? `/manage/orders?${query}` : '/manage/orders'
}

const TH = 'px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50'
const TD = 'px-3 py-2.5 align-middle border-t border-ink-08'

/** A sortable column header. Clicking flips between the pair it owns. */
function SortHeader({
  label,
  asc,
  desc,
  current,
  status,
  q,
  align = 'left',
}: {
  label: string
  asc: SortKey
  desc: SortKey
  current: SortKey
  status: string | null
  q: string
  align?: 'left' | 'right'
}) {
  const active = current === asc || current === desc
  // Land on the descending option first: the newest order and the biggest
  // order are what someone is looking for far more often than the oldest.
  const next = current === desc ? asc : desc

  return (
    <th scope="col" className={`${TH} ${align === 'right' ? 'text-right' : ''}`}>
      <Link
        href={ordersHref({ status, q, sort: next })}
        className={`inline-flex items-center gap-1 hover:text-ink ${active ? 'text-ink' : ''}`}
      >
        {label}
        <span aria-hidden className={active ? 'text-orange' : 'text-ink-30'}>
          {active ? (current === desc ? '↓' : '↑') : '↕'}
        </span>
      </Link>
    </th>
  )
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams

  const statusParam = one(sp.status)
  const status = isOrderStatus(statusParam) ? statusParam : null
  const q = (one(sp.q) ?? '').trim()
  const sortParam = one(sp.sort)
  const sort: SortKey = isSortKey(sortParam) ? sortParam : DEFAULT_SORT
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1)

  const list = await listOrders({ status, q, sort, page })

  const from = (list.page - 1) * PAGE_SIZE + 1
  const to = Math.min(list.page * PAGE_SIZE, list.total)

  const tabs = [
    { value: null as string | null, label: 'Всички', count: list.countAll },
    ...ORDER_STATUSES.map((s) => ({
      value: s.value as string | null,
      label: s.label,
      count: list.counts[s.value] ?? 0,
    })),
  ]

  return (
    <div className="min-w-0">
      {/* Masthead — title, the count it is showing, and the search box. */}
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            01 · Поръчки
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1">
            {list.total === 0 ? 'Няма поръчки' : `${list.total} ${list.total === 1 ? 'поръчка' : 'поръчки'}`}
            {q && <span className="text-ink-50 font-normal"> за „{q}“</span>}
          </h1>
        </div>

        {/* A plain GET form: the query lands in the URL, where it belongs. The
            hidden fields carry the current tab and sort through the search so
            searching inside "Чакащи" stays inside "Чакащи". */}
        <form method="get" action="/manage/orders" className="flex flex-wrap items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          {/* Phone orders start here — the storefront was the only way in. */}
          <Link
            href="/manage/orders/new"
            className="tl-btn h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] font-semibold hover:bg-paper"
          >
            + Нова поръчка
          </Link>
          {sort !== DEFAULT_SORT && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="q" className="sr-only">
            Търсене по номер на поръчка
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Номер на поръчка"
            autoComplete="off"
            className="h-9 w-full sm:w-[210px] border border-ink-15 px-3 text-[13px] placeholder:text-ink-30 focus:border-blue focus:outline-none"
          />
          <button
            type="submit"
            className="tl-btn h-9 px-4 bg-ink text-white text-[13px] font-semibold cursor-pointer"
          >
            Търси
          </button>
          {q && (
            <Link
              href={ordersHref({ status, sort })}
              className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
            >
              Изчисти
            </Link>
          )}
        </form>
      </header>

      {/* Status tabs. The counts respect the search, so they never promise rows
          that the current query would not return. */}
      <div className="border-b border-ink-15 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto overflow-y-hidden">
        {tabs.map((tab) => {
          const active = tab.value === status
          return (
            <Link
              key={tab.value ?? 'all'}
              href={ordersHref({ status: tab.value, q, sort })}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap px-3 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-orange text-ink font-semibold'
                  : 'border-transparent text-ink-70 hover:text-ink'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 font-mono text-[11px] tl-figures ${
                  active ? 'text-orange' : 'text-ink-30'
                }`}
              >
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {list.rows.length === 0 ? (
        <div className="px-4 sm:px-6 py-16 text-center">
          <div className="text-[15px] text-ink-70">
            {q
              ? `Нищо не отговаря на „${q}“.`
              : status
                ? 'Няма поръчки с този статус.'
                : 'Още няма поръчки.'}
          </div>
          {(q || status) && (
            <Link
              href="/manage/orders"
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
                  Номер
                </th>
                <th scope="col" className={TH}>
                  Клиент
                </th>
                <SortHeader
                  label="Дата"
                  desc="newest"
                  asc="oldest"
                  current={sort}
                  status={status}
                  q={q}
                />
                <th scope="col" className={`${TH} text-right`}>
                  Артикули
                </th>
                <th scope="col" className={TH}>
                  Плащане
                </th>
                <th scope="col" className={TH}>
                  Товарителница
                </th>
                <SortHeader
                  label="Сума"
                  desc="largest"
                  asc="smallest"
                  current={sort}
                  status={status}
                  q={q}
                  align="right"
                />
                <th scope="col" className={`${TH} text-right`}>
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((order) => (
                <tr key={order.id} className="hover:bg-paper/60">
                  <td className={`${TD} whitespace-nowrap`}>
                    <Link
                      href={orderHref(order.id)}
                      className="font-mono font-semibold text-blue hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>

                  {/* Name over company: the name is who answers the phone. */}
                  <td className={`${TD} max-w-[240px]`}>
                    <div className="truncate">{order.customer.name ?? '—'}</div>
                    {(order.customer.company || order.customer.phone) && (
                      <div className="text-[12px] text-ink-50 truncate">
                        {[order.customer.company, order.customer.phone]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </td>

                  <td className={`${TD} whitespace-nowrap tl-figures`}>
                    {shortDate(order.createdAt)}
                    <span className="text-ink-50"> {shortTime(order.createdAt)}</span>
                  </td>

                  <td className={`${TD} text-right tl-figures text-ink-70 whitespace-nowrap`}>
                    {order.itemCount}
                  </td>

                  <td className={`${TD} whitespace-nowrap`}>
                    <span
                      className={
                        order.payment.status === 'paid'
                          ? 'text-ok font-semibold'
                          : order.payment.status === 'failed'
                            ? 'text-danger font-semibold'
                            : 'text-ink-70'
                      }
                    >
                      {PAYMENT_LABEL[order.payment.status ?? ''] ?? '—'}
                    </span>
                    {order.payment.method && (
                      <span className="text-[12px] text-ink-50">
                        {' · '}
                        {PAYMENT_METHOD_LABEL[order.payment.method] ?? order.payment.method}
                      </span>
                    )}
                  </td>

                  <td className={`${TD} whitespace-nowrap font-mono text-[12px]`}>
                    {order.trackingNumber ?? <span className="text-ink-30">—</span>}
                  </td>

                  <td className={`${TD} text-right font-semibold tl-figures whitespace-nowrap`}>
                    {money(order.total)}
                  </td>

                  <td className={`${TD} text-right`}>
                    <StatusPill status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paging. Stated in full — "51–100 от 214" — so a truncated list never
          reads as the whole list. */}
      {list.pageCount > 1 && (
        <div className="px-4 sm:px-6 py-4 border-t border-ink-15 flex items-center justify-between gap-4">
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-50 tl-figures">
            {from}–{to} от {list.total}
          </div>
          <div className="flex items-center gap-2">
            {list.page > 1 && (
              <Link
                href={ordersHref({ status, q, sort, page: list.page - 1 })}
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
                href={ordersHref({ status, q, sort, page: list.page + 1 })}
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
