import type { Metadata } from 'next'
import Link from 'next/link'

import { StatusPill } from '../_components/StatusPill'
import { customerMoney, money, shortDate, shortTime } from '@/lib/manage/format'
import { orderHref } from '@/lib/manage/routes'
import { requireUser } from '@/lib/manage/session'
import {
  getDashboardStats,
  LOW_STOCK_THRESHOLD,
  TOP_LINES_DAYS,
  type Figure,
} from '@/lib/manage/stats'
import { ORDER_STATUSES, PAYMENT_LABEL } from '@/lib/manage/vocabulary'
import type { MarketCode } from '@/lib/market'

/**
 * The front door: what needs doing, then how the shop is doing.
 *
 * The top row is split the same way. The first two cards are work — orders
 * nobody has confirmed, enquiries nobody has moved on — and each is a link to
 * the list where that work is done. The other two are money, and are not links,
 * because there is no screen behind a total to go and act on.
 *
 * Every figure says what it counts. The dashboard this replaces printed a sum
 * of the newest hundred orders, cancelled ones included, under the all-time
 * order count, and it read as authoritative right up until someone checked it.
 * So the labels here carry the period, "без отказани" and "платени" wherever
 * they apply, and the rules behind them are written once in
 * src/lib/manage/stats.ts, where the SQL is.
 */

export const metadata: Metadata = { title: 'Табло' }

const PANEL_HEAD =
  'px-4 py-2.5 border-b border-ink-15 bg-paper font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex items-center justify-between gap-2'
const HEAD_LINK = 'text-blue hover:underline'

// Horizontal padding is kept out of the cell classes and chosen per column, so
// the outer columns line up with the 16px of the panel header above them
// without two padding utilities competing on one element.
const TH = 'py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50'
const TD = 'py-2.5 align-middle border-t border-ink-08'
const MID = 'px-3'
const FIRST = 'pl-4 pr-3'
const LAST = 'pl-3 pr-4'

const HEADLINE_DATE = new Intl.DateTimeFormat('bg-BG', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  // The workshop's day, for the same reason format.ts pins it.
  timeZone: 'Europe/Sofia',
})

/**
 * Market names as the team says them. MARKETS carries each country in its own
 * language, which is what a courier label needs and not what a Bulgarian
 * reading a dashboard does.
 */
const MARKET_NAME: Record<MarketCode, string> = {
  bg: 'България',
  ro: 'Румъния',
  gr: 'Гърция',
}

/** "1 поръчка" / "3 поръчки". */
const ordersLabel = (n: number): string => `${n} ${n === 1 ? 'поръчка' : 'поръчки'}`

/** Quantities are whole pieces almost always; a fractional one keeps its comma. */
const QUANTITY = new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 3 })

function StatCard({
  label,
  value,
  note,
  href,
  attention = false,
}: {
  label: string
  value: string
  note: string
  href?: string
  /** The figure is work waiting — set it in the accent colour. */
  attention?: boolean
}) {
  const body = (
    <>
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex items-center justify-between gap-2">
        <span>{label}</span>
        {href && (
          <span aria-hidden className="text-ink-30 group-hover:text-orange">
            →
          </span>
        )}
      </div>
      <div
        className={`text-[28px] leading-tight font-semibold tracking-tight tl-figures mt-1.5 ${
          attention ? 'text-orange' : ''
        }`}
      >
        {value}
      </div>
      <div className="text-[12.5px] text-ink-50 mt-1">{note}</div>
    </>
  )

  return href ? (
    <Link href={href} className="group block bg-white px-4 sm:px-6 py-4 hover:bg-paper transition-colors">
      {body}
    </Link>
  ) : (
    <div className="bg-white px-4 sm:px-6 py-4">{body}</div>
  )
}

/** One row of the revenue table. */
function PeriodRow({ label, figure, sub = false }: { label: string; figure: Figure; sub?: boolean }) {
  return (
    <tr className="border-t border-ink-08">
      <td className={`py-2 pr-3 ${sub ? 'pl-8 text-ink-50' : 'pl-4 text-ink-70'}`}>{label}</td>
      <td className={`py-2 ${MID} text-right tl-figures text-ink-50 whitespace-nowrap`}>
        {figure.count}
      </td>
      <td
        className={`py-2 ${LAST} text-right tl-figures whitespace-nowrap ${
          sub ? 'text-ink-70' : 'font-semibold'
        }`}
      >
        {money(figure.total)}
      </td>
    </tr>
  )
}

export default async function DashboardPage() {
  await requireUser('/manage')

  const stats = await getDashboardStats()
  const { revenue, statuses, customers, lowStock } = stats

  // Rendered per request, so this is the moment the figures were read.
  const now = new Date()
  const asOf = now.toISOString()
  const today = HEADLINE_DATE.format(now)

  const marketTotal = stats.markets.reduce((sum, m) => sum + m.total, 0)
  const repeatShare =
    customers.buyers > 0 ? Math.round((customers.repeat / customers.buyers) * 100) : null

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">
            00 · Табло
          </div>
          {/* The date, because "днес" and "този месец" below are only as
              meaningful as knowing which day and month the screen means. */}
          <h1 className="text-[22px] font-semibold tracking-tight mt-1 first-letter:uppercase">
            {today}
          </h1>
        </div>
        <div className="text-[12.5px] text-ink-50 tl-figures">
          Данни към {shortDate(asOf)}, {shortTime(asOf)}
        </div>
      </header>

      {/* Four cards, one line of hairlines between them. The gap shows the
          grid's background through, so the rules stay right whether the row is
          one, two or four columns wide. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-ink-15 border-b border-ink-15">
        <StatCard
          label="Чакащи поръчки"
          value={String(statuses.pending)}
          note={statuses.pending ? 'чакат потвърждение' : 'нищо не чака потвърждение'}
          href="/manage/orders?status=pending"
          attention={statuses.pending > 0}
        />
        <StatCard
          label="Нови запитвания"
          value={String(stats.newEnquiries)}
          note={stats.newEnquiries ? 'със статус „Ново“ · в Payload' : 'няма със статус „Ново“'}
          href="/admin/collections/enquiries?where[status][equals]=new"
          attention={stats.newEnquiries > 0}
        />
        <StatCard
          label="Оборот този месец"
          value={money(revenue.thisMonth.total)}
          note={`без отказани · ${ordersLabel(revenue.thisMonth.count)} · платени ${money(revenue.thisMonthPaid.total)}`}
        />
        <StatCard
          label="Последни 30 дни"
          value={money(revenue.last30Days.total)}
          note={`без отказани · ${ordersLabel(revenue.last30Days.count)}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* --- What came in, and what it was -------------------------------- */}
        <div className="min-w-0 border-b xl:border-b-0 xl:border-r border-ink-15">
          <section>
            <div className={PANEL_HEAD}>
              <span>Последни поръчки</span>
              <Link href="/manage/orders" className={HEAD_LINK}>
                Всички →
              </Link>
            </div>

            {stats.recentOrders.length === 0 ? (
              <p className="px-4 py-6 text-[13.5px] text-ink-50">Още няма поръчки.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px]">
                  <thead>
                    <tr>
                      <th scope="col" className={`${TH} ${FIRST}`}>
                        Номер
                      </th>
                      <th scope="col" className={`${TH} ${MID}`}>
                        Клиент
                      </th>
                      <th scope="col" className={`${TH} ${MID}`}>
                        Дата
                      </th>
                      <th scope="col" className={`${TH} ${MID}`}>
                        Плащане
                      </th>
                      <th scope="col" className={`${TH} ${MID} text-right`}>
                        Сума
                      </th>
                      <th scope="col" className={`${TH} ${LAST} text-right`}>
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-paper/60">
                        <td className={`${TD} ${FIRST} whitespace-nowrap`}>
                          <Link
                            href={orderHref(order.id)}
                            className="font-mono font-semibold text-blue hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className={`${TD} ${MID} max-w-[220px]`}>
                          <div className="truncate">{order.customerName ?? '—'}</div>
                          {order.customerCompany && (
                            <div className="text-[12px] text-ink-50 truncate">
                              {order.customerCompany}
                            </div>
                          )}
                        </td>
                        <td className={`${TD} ${MID} whitespace-nowrap tl-figures`}>
                          {shortDate(order.createdAt)}
                          <span className="text-ink-50"> {shortTime(order.createdAt)}</span>
                        </td>
                        <td className={`${TD} ${MID} whitespace-nowrap`}>
                          <span
                            className={
                              order.paymentStatus === 'paid'
                                ? 'text-ok font-semibold'
                                : order.paymentStatus === 'failed'
                                  ? 'text-danger font-semibold'
                                  : 'text-ink-70'
                            }
                          >
                            {PAYMENT_LABEL[order.paymentStatus ?? ''] ?? '—'}
                          </span>
                        </td>
                        <td className={`${TD} ${MID} text-right font-semibold tl-figures whitespace-nowrap`}>
                          {money(order.total)}
                        </td>
                        <td className={`${TD} ${LAST} text-right`}>
                          <StatusPill status={order.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border-t border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Най-продавани · {TOP_LINES_DAYS} дни</span>
              <span className="text-right">по количество · без отказани</span>
            </div>

            {stats.topLines.length === 0 ? (
              <p className="px-4 py-6 text-[13.5px] text-ink-50">
                Няма продажби през последните {TOP_LINES_DAYS} дни.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13.5px]">
                    <thead>
                      <tr>
                        <th scope="col" className={`${TH} ${FIRST}`}>
                          Артикул
                        </th>
                        <th scope="col" className={`${TH} ${MID} text-right`}>
                          Кол.
                        </th>
                        <th scope="col" className={`${TH} ${MID} text-right`}>
                          Поръчки
                        </th>
                        <th scope="col" className={`${TH} ${LAST} text-right`}>
                          Стойност без ДДС
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topLines.map((line, i) => (
                        <tr key={`${i}:${line.sku ?? line.name}`} className="align-top">
                          <td className={`${TD} ${FIRST} min-w-[220px]`}>
                            <div className="font-semibold">{line.name}</div>
                            {(line.sku || line.names > 1) && (
                              <div className="font-mono text-[11px] text-ink-30 mt-0.5">
                                {line.sku && `SKU ${line.sku}`}
                                {/* A made-to-measure SKU is the size, not the
                                    brand, so it can gather several names. Say
                                    so rather than let the newest name speak for
                                    blades that were sold under another. */}
                                {line.names > 1 && (
                                  <span className="text-orange">
                                    {line.sku ? ' · ' : ''}
                                    {line.names} наименования
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className={`${TD} ${MID} text-right tl-figures font-semibold whitespace-nowrap`}>
                            {QUANTITY.format(line.quantity)}
                          </td>
                          <td className={`${TD} ${MID} text-right tl-figures text-ink-70 whitespace-nowrap`}>
                            {line.orders}
                          </td>
                          <td className={`${TD} ${LAST} text-right tl-figures whitespace-nowrap`}>
                            {money(line.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="px-4 py-2.5 border-t border-ink-08 text-[12px] text-ink-50">
                  Стойността е единична цена × количество — без ДДС и без доставка.
                </p>
              </>
            )}
          </section>
        </div>

        {/* --- Where things stand ------------------------------------------ */}
        <aside className="min-w-0">
          <section className="border-b border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Поръчки по статус</span>
              <Link href="/manage/orders" className={HEAD_LINK}>
                Всички {statuses.all}
              </Link>
            </div>
            <ul>
              {ORDER_STATUSES.map((s, i) => {
                const n = statuses.counts[s.value]
                return (
                  <li key={s.value} className={i > 0 ? 'border-t border-ink-08' : ''}>
                    <Link
                      href={`/manage/orders?status=${s.value}`}
                      className="flex items-center justify-between gap-3 px-4 py-2 text-[13.5px] hover:bg-paper"
                    >
                      <span className={n ? 'text-ink' : 'text-ink-50'}>{s.label}</span>
                      <span
                        className={`tl-figures ${
                          n === 0
                            ? 'text-ink-30'
                            : s.value === 'pending'
                              ? 'text-orange font-semibold'
                              : 'font-semibold'
                        }`}
                      >
                        {n}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="border-b border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Оборот</span>
              <span>без отказани</span>
            </div>
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  <th scope="col" className={`${TH} ${FIRST}`}>
                    <span className="sr-only">Период</span>
                  </th>
                  <th scope="col" className={`${TH} ${MID} text-right`}>
                    Поръчки
                  </th>
                  <th scope="col" className={`${TH} ${LAST} text-right`}>
                    Сума
                  </th>
                </tr>
              </thead>
              <tbody>
                <PeriodRow label="Днес" figure={revenue.today} />
                <PeriodRow label="Последни 7 дни" figure={revenue.last7Days} />
                <PeriodRow label="Този месец" figure={revenue.thisMonth} />
                <PeriodRow label="от тях платени" figure={revenue.thisMonthPaid} sub />
                <PeriodRow label="Последни 30 дни" figure={revenue.last30Days} />
                <PeriodRow label="От началото" figure={revenue.allTime} />
              </tbody>
            </table>
            <p className="px-4 py-2.5 border-t border-ink-08 text-[12px] text-ink-50">
              Общите суми на поръчките в EUR — с ДДС и с доставката, когато е в поръчката.
              Дните са по часа в София; 7 и 30 дни включват днес.
            </p>
          </section>

          <section className="border-b border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Пазари · 30 дни</span>
              <span>без отказани</span>
            </div>
            <ul>
              {stats.markets.map((m, i) => {
                const share = marketTotal > 0 ? Math.round((m.total / marketTotal) * 100) : 0
                return (
                  <li key={m.market} className={`px-4 py-2.5 ${i > 0 ? 'border-t border-ink-08' : ''}`}>
                    <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className={m.count ? 'font-semibold' : 'text-ink-50'}>
                        {MARKET_NAME[m.market]}
                      </span>
                      <span className={`tl-figures whitespace-nowrap ${m.count ? 'font-semibold' : 'text-ink-30'}`}>
                        {money(m.total)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-[12px] text-ink-50 mt-0.5">
                      <span className="tl-figures">{ordersLabel(m.count)}</span>
                      {/* Already converted order by order at each order's own
                          rate, so it is formatted here, not converted again. */}
                      {m.shown && m.count > 0 && (
                        <span className="tl-figures whitespace-nowrap">
                          за клиента {customerMoney(m.shown.amount, m.shown.currency, 1)}
                        </span>
                      )}
                    </div>
                    {marketTotal > 0 && (
                      <div className="h-1 bg-ink-08 mt-1.5" aria-hidden>
                        <div className="h-full bg-blue" style={{ width: `${share}%` }} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="border-b border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Клиенти</span>
              <Link href="/manage/customers" className={HEAD_LINK}>
                Всички {customers.total}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-ink-08">
              <div className="bg-white px-4 py-3">
                <div className="text-[12px] text-ink-50">Нови този месец</div>
                <div className="text-[22px] font-semibold tracking-tight tl-figures mt-0.5">
                  {customers.newThisMonth}
                </div>
              </div>
              <div className="bg-white px-4 py-3">
                <div className="text-[12px] text-ink-50">Поръчали повторно</div>
                <div className="text-[22px] font-semibold tracking-tight tl-figures mt-0.5">
                  {repeatShare === null ? '—' : `${repeatShare}%`}
                </div>
                <div className="text-[12px] text-ink-50 tl-figures">
                  {customers.buyers > 0
                    ? `${customers.repeat} от ${customers.buyers} с поръчка`
                    : 'още няма поръчки'}
                </div>
              </div>
            </div>
            <p className="px-4 py-2.5 border-t border-ink-08 text-[12px] text-ink-50">
              Повторно — с поне две поръчки, без отказаните.
            </p>
          </section>

          <section>
            <div className={PANEL_HEAD}>
              <span>Ниска наличност · ≤ {LOW_STOCK_THRESHOLD} бр.</span>
              {lowStock.total > 0 && (
                <span className="tl-figures">
                  {lowStock.total > lowStock.rows.length
                    ? `${lowStock.rows.length} от ${lowStock.total}`
                    : lowStock.total}
                </span>
              )}
            </div>

            {lowStock.rows.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-ink-50">
                Всички активни продукти имат повече от {LOW_STOCK_THRESHOLD} бр.
              </p>
            ) : (
              <ul>
                {lowStock.rows.map((p, i) => (
                  <li key={p.id} className={i > 0 ? 'border-t border-ink-08' : ''}>
                    <Link
                      href={`/manage/products?q=${encodeURIComponent(p.slug)}`}
                      className="flex items-baseline justify-between gap-3 px-4 py-2 text-[13px] hover:bg-paper"
                    >
                      <span className="min-w-0 truncate">{p.name}</span>
                      <span
                        className={`tl-figures font-semibold whitespace-nowrap ${
                          p.stock <= 0 ? 'text-danger' : 'text-orange'
                        }`}
                      >
                        {QUANTITY.format(p.stock)} бр.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="px-4 py-2.5 border-t border-ink-08 text-[12px] text-ink-50">
              Само активни продукти. Маркираните като „Изчерпан“ не са тук.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
