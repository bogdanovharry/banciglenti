import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NewOrderForm, type OfferedMarket } from './NewOrderForm'
import { getCustomer, lastDelivery, listCustomers } from '@/lib/manage/customers'
import { MARKETS, type MarketCode } from '@/lib/market'

/**
 * A new order, taken by a person.
 *
 * Two steps on one route. Without `?customer=` it is a customer search — the
 * caller is either on file or gets created on the way (and brought back here).
 * With it, it is the order shell. `?machine=` is the index of one of that
 * customer's machines, whose blade size is carried through to the add-a-line
 * form so the most common phone order — "the same blade as last time" — is a
 * quantity and a click.
 */

export const metadata: Metadata = { title: 'Нова поръчка' }

/**
 * The markets a person can sell into today. Greece is in the registry but has
 * not launched — no carriers, no confirmed VAT rate — so it is not offered.
 */
const OFFERED: MarketCode[] = ['bg', 'ro']

type Search = { customer?: string | string[]; machine?: string | string[]; q?: string | string[] }
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const customerId = Number.parseInt(one(sp.customer) ?? '', 10)

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return <PickCustomer q={(one(sp.q) ?? '').trim()} />
  }

  const [customer, delivery] = await Promise.all([getCustomer(customerId), lastDelivery(customerId)])
  if (!customer) notFound()

  const machineIndex = Number.parseInt(one(sp.machine) ?? '', 10)
  const machine = Number.isInteger(machineIndex) ? customer.machines[machineIndex] : undefined
  const prefill =
    machine && machine.bladeLength !== null
      ? {
          length: machine.bladeLength,
          width: machine.bladeWidth ?? undefined,
          thickness: machine.bladeThickness ?? undefined,
        }
      : null

  const markets: OfferedMarket[] = OFFERED.map((code) => {
    const m = MARKETS[code]
    return {
      code,
      country: m.country,
      currency: m.displayCurrency,
      pickup: m.pickup,
      paymentMethods: m.paymentMethods,
      couriers: m.couriers,
    }
  })
  // The market their last order was sold in, which is where they most likely are.
  const defaultMarket = delivery.currency === 'RON' ? 'ro' : 'bg'

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4">
        <Link
          href="/manage/orders/new"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
        >
          ← Друг клиент
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight mt-2">Нова поръчка</h1>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
          <Link href={`/manage/customers/${customer.id}`} className="font-semibold text-blue hover:underline">
            {customer.name}
          </Link>
          {customer.company && <span className="text-ink-70">{customer.company}</span>}
          {customer.phone && <span className="text-ink-70">{customer.phone}</span>}
          <span className="text-ink-50">{customer.email}</span>
        </div>
        {machine && prefill && (
          <p className="mt-2 text-[12.5px] text-blue">
            Лента за {machine.brand} {machine.model} · {prefill.length} мм — размерът ще е попълнен на
            следващата стъпка.
          </p>
        )}
      </header>

      <div className="px-4 sm:px-6 py-5">
        <NewOrderForm
          customerId={customer.id}
          markets={markets}
          defaultMarket={defaultMarket}
          defaultAddress={delivery.address ?? ''}
          defaultOffice={delivery.office ?? ''}
          prefill={prefill}
        />
      </div>
    </div>
  )
}

/** Step one: who is the order for. */
async function PickCustomer({ q }: { q: string }) {
  const list = await listCustomers({ q, sort: q ? 'name' : 'recent', page: 1 })

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4">
        <Link
          href="/manage/orders"
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
        >
          ← Всички поръчки
        </Link>
        <h1 className="text-[22px] font-semibold tracking-tight mt-2">Нова поръчка · клиент</h1>

        <form method="get" action="/manage/orders/new" className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="q" className="sr-only">
            Търсене на клиент
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Име, фирма, имейл, телефон"
            autoComplete="off"
            className="h-9 w-full sm:w-[280px] border border-ink-15 px-3 text-[13px] placeholder:text-ink-30 focus:border-blue focus:outline-none"
          />
          <button type="submit" className="tl-btn h-9 px-4 bg-ink text-white text-[13px] font-semibold cursor-pointer">
            Търси
          </button>
          <Link
            href="/manage/customers/new?next=order"
            className="tl-btn h-9 px-4 inline-flex items-center border border-ink-15 text-[13px] font-semibold hover:bg-paper"
          >
            + Нов клиент
          </Link>
        </form>
      </header>

      {list.rows.length === 0 ? (
        <p className="px-4 sm:px-6 py-10 text-[14px] text-ink-70">
          {q ? `Няма клиент за „${q}“ — създайте го.` : 'Още няма клиенти — създайте първия.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead className="bg-paper">
              <tr>
                <th className="px-3 sm:px-6 py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  {q ? 'Намерени' : 'Последно поръчвали'}
                </th>
                <th className="px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">
                  Контакт
                </th>
                <th className="px-3 sm:px-6 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.rows.map((c) => (
                <tr key={c.id} className="border-t border-ink-08 hover:bg-paper/60">
                  <td className="px-3 sm:px-6 py-2.5">
                    <div className="font-semibold">{c.name}</div>
                    {c.company && <div className="text-[12px] text-ink-50">{c.company}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div>{c.phone ?? '—'}</div>
                    <div className="text-[12px] text-ink-50">{c.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-2.5 text-right whitespace-nowrap">
                    <Link
                      href={`/manage/orders/new?customer=${c.id}`}
                      className="font-mono text-[10px] tracking-[0.12em] uppercase text-blue hover:underline"
                    >
                      Избери →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
