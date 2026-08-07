import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CustomerForm } from './CustomerForm'
import { AddMachine, RemoveMachineButton } from './MachineForms'
import { StatusPill } from '../../../_components/StatusPill'
import { getCustomer } from '@/lib/manage/customers'
import { money, shortDate } from '@/lib/manage/format'
import { ENQUIRY_LABEL } from '@/lib/manage/vocabulary'

/**
 * One customer, whole.
 *
 * The order of the page is the order of the questions: who are they and how do
 * I reach them, what do they run, what have they bought, what have they asked.
 *
 * The machines panel leads the right-hand column rather than the contact form,
 * because it is the only thing on this screen that cannot be reconstructed from
 * an order. A phone number is on every order they have ever placed; the fact
 * that their saw takes 2 240 mm is written down here or nowhere.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const customer = await getCustomer(Number(id))
  return { title: customer ? customer.name : 'Клиент' }
}

const PANEL_HEAD =
  'px-4 py-2.5 border-b border-ink-15 bg-paper font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 flex items-center justify-between gap-2'

/** "2 240 × 27 × 0,9 мм" — length first, because that is what must match. */
function bladeSize(m: {
  bladeLength: number | null
  bladeWidth: number | null
  bladeThickness: number | null
}): string | null {
  if (m.bladeLength === null) return null
  const rest = [m.bladeWidth, m.bladeThickness]
    .filter((n): n is number => n !== null)
    .map((n) => String(n).replace('.', ','))
  return [String(m.bladeLength), ...rest].join(' × ') + ' мм'
}

export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ saved?: string | string[] }>
}) {
  const { id } = await params
  const numericId = Number.parseInt(id, 10)
  if (!Number.isInteger(numericId)) notFound()

  const customer = await getCustomer(numericId)
  if (!customer) notFound()

  const savedParam = (await searchParams).saved
  const saved = (Array.isArray(savedParam) ? savedParam[0] : savedParam)?.slice(0, 120)

  const phone = customer.phone?.replace(/\s/g, '')
  const openEnquiries = customer.enquiries.filter((e) => e.status === 'new').length

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-6 py-4">
        <Link
          href="/manage/customers"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
        >
          ← Всички клиенти
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
          <h1 className="text-[24px] font-semibold tracking-tight">{customer.name}</h1>
          {customer.company && (
            <span className="text-[14px] text-ink-70">{customer.company}</span>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="text-[13px] text-blue hover:underline">
              {customer.phone}
            </a>
          )}
          <a href={`mailto:${customer.email}`} className="text-[13px] text-blue hover:underline">
            {customer.email}
          </a>

          <div className="ml-auto text-right">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
              Похарчено
            </div>
            <strong className="text-[22px] font-semibold tracking-tight tl-figures">
              {money(customer.totalSpent)}
            </strong>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-x-4 text-[12.5px] text-ink-50">
          <span>
            {customer.orderCount} {customer.orderCount === 1 ? 'поръчка' : 'поръчки'}
          </span>
          {customer.taxId && <span>ЕИК {customer.taxId}</span>}
          {customer.vatNumber && <span>ДДС {customer.vatNumber}</span>}
          {customer.createdAt && <span>клиент от {shortDate(customer.createdAt)}</span>}
        </div>

        {saved && (
          <p role="status" className="mt-2 text-[12.5px] text-ok">
            {saved}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* --- What they have bought and asked -------------------------- */}
        <div className="min-w-0 border-b xl:border-b-0 xl:border-r border-ink-15">
          <section>
            <div className={PANEL_HEAD}>
              <span>Поръчки</span>
              {customer.orderCount > 0 && (
                <span className="tl-figures">{customer.orderCount}</span>
              )}
            </div>

            {customer.orders.length === 0 ? (
              <p className="px-6 py-6 text-[13.5px] text-ink-50">
                Още няма поръчки от този клиент.
              </p>
            ) : (
              <table className="w-full border-collapse text-[13.5px]">
                <tbody>
                  {customer.orders.map((o) => (
                    <tr key={o.id} className="border-t border-ink-08 hover:bg-paper/60">
                      <td className="px-6 py-2.5">
                        <Link
                          href={`/manage/orders/${o.id}`}
                          className="font-mono font-semibold text-blue hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 tl-figures text-ink-70 whitespace-nowrap">
                        {shortDate(o.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-right tl-figures text-ink-70 whitespace-nowrap">
                        {o.itemCount} {o.itemCount === 1 ? 'ред' : 'реда'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tl-figures whitespace-nowrap">
                        {money(o.total)}
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <StatusPill status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="border-t border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Запитвания</span>
              {openEnquiries > 0 && (
                <span className="text-orange">{openEnquiries} нови</span>
              )}
            </div>

            {customer.enquiries.length === 0 ? (
              <p className="px-6 py-6 text-[13.5px] text-ink-50">
                Няма запитвания от този имейл.
              </p>
            ) : (
              <ul>
                {customer.enquiries.map((e) => (
                  <li key={e.id} className="px-6 py-3 border-t border-ink-08">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 tl-figures">
                        {shortDate(e.createdAt)}
                      </span>
                      <span
                        className={`text-[11.5px] font-semibold ${
                          e.status === 'new' ? 'text-orange' : 'text-ink-50'
                        }`}
                      >
                        {ENQUIRY_LABEL[e.status ?? ''] ?? e.status}
                      </span>
                    </div>
                    <p className="text-[13.5px] mt-1 whitespace-pre-line">{e.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {customer.addresses.length > 0 && (
            <section className="border-t border-ink-15">
              <div className={PANEL_HEAD}>
                <span>Адреси</span>
              </div>
              <ul className="px-6 py-3 flex flex-wrap gap-6">
                {customer.addresses.map((a, i) => (
                  <li key={i} className="text-[13px]">
                    <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50">
                      {a.label ?? 'Адрес'}
                      {a.isDefault && <span className="text-orange"> · по подразбиране</span>}
                    </div>
                    <div className="mt-0.5">{a.street ?? '—'}</div>
                    <div className="text-ink-70">
                      {[a.postalCode, a.city].filter(Boolean).join(' ')}
                    </div>
                    {a.country && <div className="text-ink-50">{a.country}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* --- What only this screen knows ------------------------------ */}
        <aside className="min-w-0">
          <section className="border-b border-ink-15">
            <div className={PANEL_HEAD}>
              <span>Машини</span>
              {customer.machines.length > 0 && (
                <span className="tl-figures">{customer.machines.length}</span>
              )}
            </div>

            {customer.machines.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-ink-50">
                Няма записани машини. Размерът, който клиентът поръчва всеки път, се пази тук.
              </p>
            ) : (
              <ul>
                {customer.machines.map((m) => {
                  const size = bladeSize(m)
                  return (
                    <li
                      key={m.index}
                      className="px-4 py-2.5 border-b border-ink-08 flex items-start gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">
                          {m.brand} {m.model}
                        </div>
                        {size ? (
                          <div className="font-mono text-[12.5px] text-blue">{size}</div>
                        ) : (
                          <div className="text-[12px] text-ink-30">размерът не е записан</div>
                        )}
                        {(m.source || m.notes) && (
                          <div className="text-[11.5px] text-ink-50 mt-0.5">
                            {[m.source, m.notes].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                      <RemoveMachineButton
                        customerId={customer.id}
                        index={m.index}
                        label={`${m.brand} ${m.model}`}
                      />
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Folded away, and native rather than a Client Component. The
                panel is read far more often than it is added to — the whole
                point of it is glancing at a size before ringing someone — and
                eight fields permanently open pushed the contact details off the
                bottom of the screen. Open by default only when there is nothing
                to read yet, which is also when it is the thing to do next. */}
            <details className="border-t border-ink-08" open={customer.machines.length === 0}>
              <summary className="px-4 py-2.5 text-[13px] font-semibold cursor-pointer select-none hover:bg-paper marker:text-ink-30">
                Добави машина
              </summary>
              <div className="px-4 pb-4">
                <AddMachine customerId={customer.id} />
              </div>
            </details>
          </section>

          <section>
            <div className={PANEL_HEAD}>
              <span>Данни за контакт</span>
            </div>
            <div className="p-4">
              {/* Keyed on the saved values: the fields are uncontrolled, and a
                  defaultValue only applies on mount, so without this the form
                  would keep showing what was there before the save. */}
              <CustomerForm
                key={[
                  customer.name,
                  customer.email,
                  customer.phone,
                  customer.company,
                  customer.taxId,
                  customer.vatNumber,
                ].join('|')}
                customer={customer}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
