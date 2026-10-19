import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddLine } from './AddLine'
import { FulfilmentForm } from './FulfilmentForm'
import { HistoryPanel } from './HistoryPanel'
import { PrintButton, RemoveLineButton } from './LineActions'
import { StatusControl } from './StatusControl'
import { StatusPill } from '../../../_components/StatusPill'
import { getOrder } from '@/lib/manage/order'
import { currentUser, getClient, isAdmin } from '@/lib/manage/session'
import { customerMoney, money, shortDate, shortTime } from '@/lib/manage/format'
import { marketForOrder } from '@/lib/market'
import {
  PAYMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  moneyLockReason,
  nextStatuses,
} from '@/lib/manage/vocabulary'
import { COMPANY } from '@/lib/company'

/**
 * One order, in one view.
 *
 * This is the screen the whole plan exists for. The old PHP page fitted an
 * entire order — customer, items, specs, address, totals, comments, status — on
 * a single screen with no styling to speak of, and it won on information design:
 * nothing that matters is more than one glance away, and nothing that does not
 * matter is on it at all.
 *
 * The shape is two columns. The left is the order as a document — who, what,
 * how much — and is what prints. The right is the controls, and does not print.
 * Everything on the left is read-only by construction: subtotal, VAT and total
 * are computed server-side from the line prices and there is no field anywhere
 * on this page that writes one.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const order = await getOrder(Number(id))
  return { title: order ? order.orderNumber : 'Поръчка' }
}

/** The catalogue, for the "add a line" picker. Slug and name only. */
async function catalogueOptions(): Promise<{ slug: string; name: string }[]> {
  const payload = await getClient()
  const result = await payload.find({
    collection: 'products',
    limit: 500,
    depth: 0,
    sort: 'name',
    where: { status: { not_equals: 'inactive' } },
    select: { slug: true, name: true },
  })

  return (result.docs as unknown as { slug?: string; name?: string }[])
    .filter((p): p is { slug: string; name: string } => Boolean(p.slug && p.name))
    .map((p) => ({ slug: p.slug, name: p.name }))
}

const PANEL = 'border border-ink-15 bg-white'
const PANEL_HEAD =
  'px-4 py-2.5 border-b border-ink-15 bg-paper font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50'

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<'saved' | 'length' | 'width' | 'thickness', string | string[] | undefined>>
}) {
  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isInteger(numericId)) notFound()

  const order = await getOrder(numericId)
  if (!order) notFound()

  const [products, user] = await Promise.all([catalogueOptions(), currentUser()])

  // Left behind by the navigation a successful mutation ends on — see done() in
  // actions.ts. The screen itself already shows the result; this just names what
  // was saved, so a change with no visible trace (a payment method, say) still
  // acknowledges the click.
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const saved = first(sp.saved)?.slice(0, 120)

  // A machine's blade, carried here from "new order" on the customer screen.
  const numberParam = (v: string | string[] | undefined) => {
    const n = Number(first(v))
    return Number.isFinite(n) && n > 0 ? n : undefined
  }
  const lineDefaults = {
    length: numberParam(sp.length),
    width: numberParam(sp.width),
    thickness: numberParam(sp.thickness),
  }

  const phone = order.customer.phone?.replace(/\s/g, '')
  const vatPercent = Math.round(order.vatRate * 100)
  const orderMarket = marketForOrder(order)

  // Every form below posts this back; the action refuses if the order has moved
  // on since the screen was drawn.
  const version = order.updatedAt ?? ''
  const lockReason = moneyLockReason({ status: order.status, paymentStatus: order.payment.status })
  const statusOptions = nextStatuses(order.status, isAdmin(user))

  return (
    <div className="tl-order">
      {/* --- Masthead ---------------------------------------------------- */}
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4">
        <Link
          href="/manage/orders"
          className="tl-no-print font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
        >
          ← Всички поръчки
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
          <h1 className="text-[20px] sm:text-[24px] font-semibold tracking-tight font-mono">{order.orderNumber}</h1>
          <StatusPill status={order.status} />
          <span className="text-[13px] text-ink-70 tl-figures">
            {shortDate(order.createdAt)} {shortTime(order.createdAt)}
          </span>
          <span className="text-[13px] text-ink-70">
            {PAYMENT_LABEL[order.payment.status ?? ''] ?? '—'}
            {order.payment.method &&
              ` · ${PAYMENT_METHOD_LABEL[order.payment.method] ?? order.payment.method}`}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <strong className="text-[24px] font-semibold tracking-tight tl-figures">
              {money(order.total)}
            </strong>
            <PrintButton />
          </div>
        </div>

        {saved && (
          <p role="status" className="tl-no-print mt-2 text-[12.5px] text-ok">
            {saved}
          </p>
        )}

        {/* Printed sheets leave the building; the workshop copy needs to say
            whose workshop it is. Hidden on screen, where it is obvious. */}
        <div className="tl-print-only text-[12px] text-ink-70 mt-2">
          {COMPANY.legalName} · {COMPANY.address.street}, {COMPANY.address.postalCode}{' '}
          {COMPANY.address.city} · {COMPANY.phone.office.display} · {COMPANY.email}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* --- The order as a document --------------------------------- */}
        <div className="min-w-0 border-b xl:border-b-0 xl:border-r border-ink-15">
          {/* Who to ring. One line, because an order you cannot act on without
              opening a second record is a half-finished screen. */}
          <section className="px-4 sm:px-6 py-3 border-b border-ink-15 flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <strong className="text-[15px]">{order.customer.name ?? '—'}</strong>
            {order.customer.company && (
              <span className="text-[13px] text-ink-70">{order.customer.company}</span>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="text-[13px] text-blue hover:underline">
                {order.customer.phone}
              </a>
            )}
            {order.customer.email && (
              <a
                href={`mailto:${order.customer.email}`}
                className="text-[13px] text-blue hover:underline"
              >
                {order.customer.email}
              </a>
            )}
            {order.customer.taxId && (
              <span className="text-[12.5px] text-ink-50">ЕИК {order.customer.taxId}</span>
            )}
            {order.customer.vatNumber && (
              <span className="text-[12.5px] text-ink-50">ДДС {order.customer.vatNumber}</span>
            )}
          </section>

          {/* Lines. The made-to-measure sizes sit under the name as a sentence
              the workshop can read off, not as JSON. */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="bg-paper">
                  <th className="px-4 sm:px-6 py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                    Артикул
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                    Кол.
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                    Ед. цена
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                    Сума
                  </th>
                  <th className="tl-no-print w-10" />
                </tr>
              </thead>
              <tbody>
                {order.lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-6 text-ink-50">
                      Няма артикули по тази поръчка.
                    </td>
                  </tr>
                )}
                {order.lines.map((line) => (
                  <tr key={line.index} className="border-t border-ink-08 align-top">
                    <td className="px-4 sm:px-6 py-3">
                      <div className="font-semibold">{line.name}</div>
                      {line.specs && (
                        <div className="text-[12.5px] text-ink-70 mt-0.5">{line.specs}</div>
                      )}
                      {line.sku && (
                        <div className="font-mono text-[11px] text-ink-30 mt-0.5">SKU {line.sku}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tl-figures whitespace-nowrap">
                      {line.quantity}
                    </td>
                    <td className="px-3 py-3 text-right tl-figures whitespace-nowrap">
                      {money(line.price)}
                    </td>
                    <td className="px-3 py-3 text-right tl-figures font-semibold whitespace-nowrap">
                      {money(line.lineTotal)}
                    </td>
                    <td className="tl-no-print px-1 py-3 text-right">
                      {!lockReason && (
                        <RemoveLineButton
                          orderId={order.id}
                          index={line.index}
                          label={line.name}
                          expect={line.sku || line.name}
                          version={version}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Where it goes, and what it comes to. */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6 px-4 sm:px-6 py-4 bg-paper border-t border-ink-15">
            <div className="text-[13px]">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-1">
                Доставка
              </div>
              <div className="whitespace-pre-line text-ink-70">
                {order.shipping.address || '—'}
              </div>
              {order.shipping.office && (
                <div className="mt-1.5">
                  <span className="text-ink-50">Офис: </span>
                  {order.shipping.office}
                </div>
              )}
              {order.shipping.trackingNumber && (
                <div className="mt-1.5">
                  <span className="text-ink-50">Товарителница: </span>
                  <span className="font-mono">{order.shipping.trackingNumber}</span>
                </div>
              )}
            </div>

            <table className="text-[13px] tl-figures self-start">
              <tbody>
                <tr>
                  <td className="pr-8 py-0.5 text-ink-70">Междинна сума</td>
                  <td className="text-right py-0.5">{money(order.subtotal)}</td>
                </tr>
                <tr>
                  <td className="pr-8 py-0.5 text-ink-70">Доставка</td>
                  <td className="text-right py-0.5">
                    {/* Under 'collect' the 0 is not "free": the courier bills the
                        customer at the door, and the COD amount excludes it. */}
                    {orderMarket.carriage === 'collect'
                      ? `плаща се на ${orderMarket.couriers.join(' / ')}`
                      : money(order.shipping.cost)}
                  </td>
                </tr>
                <tr>
                  <td className="pr-8 py-0.5 text-ink-70">ДДС {vatPercent}%</td>
                  <td className="text-right py-0.5">{money(order.tax)}</td>
                </tr>
                <tr className="border-t border-ink-15">
                  <td className="pr-8 pt-1.5 font-bold">Общо</td>
                  <td className="text-right pt-1.5 font-bold text-[15px]">{money(order.total)}</td>
                </tr>
                {order.currency !== 'EUR' && (
                  <tr>
                    <td className="pr-8 pt-1 text-ink-50">
                      За клиента · курс {order.exchangeRate.toLocaleString('bg-BG', { maximumFractionDigits: 4 })}
                    </td>
                    <td className="text-right pt-1 font-semibold">
                      {customerMoney(order.total, order.currency, order.exchangeRate)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* What the customer wrote at checkout. Set apart because it is
              theirs, and it is the one thing on the order nobody can re-derive. */}
          {order.notes && (
            <section className="px-4 sm:px-6 py-3 border-t border-ink-15 border-l-[3px] border-l-orange">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-1">
                Коментар от клиента
              </div>
              <div className="text-[13.5px] whitespace-pre-line">{order.notes}</div>
            </section>
          )}

          {/* Asked for at checkout: the invoice goes to the company, not to the
              person who typed the order. Shown in full because it is what the
              accountant needs, and it prints with the work order. */}
          {order.billing && (
            <section className="px-4 sm:px-6 py-3 border-t border-ink-15 border-l-[3px] border-l-blue">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-1">
                Фактура на фирма
              </div>
              <div className="text-[13.5px]">
                <strong>{order.billing.company}</strong>
                <span className="text-ink-70">
                  {order.billing.taxId && ` · ЕИК/CUI ${order.billing.taxId}`}
                  {order.billing.vatNumber && ` · ДДС ${order.billing.vatNumber}`}
                </span>
              </div>
              {order.billing.address && (
                <div className="text-[13px] text-ink-70 whitespace-pre-line mt-0.5">{order.billing.address}</div>
              )}
            </section>
          )}

          <section className="tl-no-print px-4 sm:px-6 py-4 border-t border-ink-15">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-3">
              Добави ред
            </div>
            {lockReason ? (
              <p className="text-[13px] text-ink-50">{lockReason}</p>
            ) : (
              <AddLine
                key={version}
                orderId={order.id}
                products={products}
                version={version}
                defaults={lineDefaults}
              />
            )}
          </section>
        </div>

        {/* --- Controls ------------------------------------------------- */}
        <aside className="tl-no-print min-w-0">
          <section className={`${PANEL} border-0 border-b`}>
            <div className={PANEL_HEAD}>Статус</div>
            {/* Keyed on the saved status so the control remounts when the
                order changes underneath it. Without the key its `useState`
                keeps the value it was seeded with on first render, and after a
                save the select can sit on a status the order no longer has —
                which makes the "незаписано" marker lie, and submits the stale
                value if clicked again. */}
            <div className="p-4">
              <StatusControl
                key={`${order.status ?? 'none'}|${version}`}
                orderId={order.id}
                status={order.status}
                options={statusOptions}
                version={version}
              />
            </div>
          </section>

          <section className={`${PANEL} border-0 border-b`}>
            <div className={PANEL_HEAD}>Плащане и доставка</div>
            {/* Same reason: every field in here is uncontrolled with a
                defaultValue, which only applies on mount. Keyed on the
                version, which moves on every save of any field. */}
            <div className="p-4">
              <FulfilmentForm
                key={version}
                order={order}
                version={version}
                lockReason={lockReason}
                pickupOffered={orderMarket.pickup || order.shipping.method === 'pickup'}
              />
            </div>
          </section>

          <section className={`${PANEL} border-0`}>
            <div className={PANEL_HEAD}>История</div>
            <div className="p-4">
              {/* Keyed on the entry count: a saved comment adds one, which
                  remounts the box empty. A failed save leaves the count — and
                  the typed text — where they were. */}
              <HistoryPanel key={order.log.length} orderId={order.id} log={order.log} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
