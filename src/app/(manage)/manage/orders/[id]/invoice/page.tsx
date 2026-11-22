import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { PrintButton } from '../LineActions'
import { InvoiceDocument } from './InvoiceDocument'
import { issueCreditNote, issueInvoice } from '@/lib/manage/invoice-actions'
import { getCreditNote, getIssuedInvoice, previewSnapshot, warningsFor, whyNoCreditNote, whyNotInvoiceable } from '@/lib/manage/invoices'
import { getOrder } from '@/lib/manage/order'
import { currentUser } from '@/lib/manage/session'

export const metadata: Metadata = { title: 'Фактура' }

/**
 * The invoice for one order: a preview until it is issued, the stored document
 * afterwards.
 *
 * The preview is for the owner to read before anything is numbered. It lists, in
 * plain words, what is still missing or unconfirmed. "Issue" is a plain form
 * post to a Server Action — no client code — and is offered only when the order
 * has shipped and the person is an administrator.
 */
export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<'error' | 'issued' | 'credited', string | string[] | undefined>>
}) {
  const { id } = await params
  const orderId = Number.parseInt(id, 10)
  if (!Number.isInteger(orderId)) notFound()

  const order = await getOrder(orderId)
  if (!order) notFound()

  const [issued, credit, user, sp] = await Promise.all([getIssuedInvoice(orderId), getCreditNote(orderId), currentUser(), searchParams])
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const error = first(sp.error)?.slice(0, 300)
  const justIssued = first(sp.issued)?.replace(/\D/g, '').slice(0, 10)
  const justCredited = first(sp.credited)?.replace(/\D/g, '').slice(0, 10)
  const creditRefusal = whyNoCreditNote(user, Boolean(issued), Boolean(credit))

  const snapshot = issued ? issued.snapshot : previewSnapshot(order)
  const warnings = issued ? [] : warningsFor(snapshot, order)
  const refusal = issued ? null : whyNotInvoiceable(order, user)

  return (
    <div>
      <header className="tl-no-print border-b border-ink-15 px-4 sm:px-6 py-4">
        <Link
          href={`/manage/orders/${orderId}`}
          className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-ink"
        >
          ← Поръчка {order.orderNumber}
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
          <h1 className="text-[20px] sm:text-[24px] font-semibold tracking-tight">
            {issued ? `Фактура № ${issued.number}` : 'Фактура — преглед'}
          </h1>
          <span
            className={`text-[11px] font-mono tracking-[0.1em] uppercase px-2 py-1 border ${
              issued ? 'border-ok text-ok' : 'border-orange text-orange'
            }`}
          >
            {issued ? 'издадена' : 'не е издадена'}
          </span>
          {issued && (
            <div className="ml-auto">
              <PrintButton />
            </div>
          )}
        </div>
        {justIssued && (
          <p role="status" className="mt-2 text-[12.5px] text-ok">
            Фактура № {justIssued} е издадена.
          </p>
        )}
        {justCredited && (
          <p role="status" className="mt-2 text-[12.5px] text-ok">
            Кредитно известие № {justCredited} е издадено.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-danger">
            {error}
          </p>
        )}
      </header>

      {!issued && (
        <section className="tl-no-print px-4 sm:px-6 py-4 border-b border-ink-15 bg-paper">
          {warnings.length > 0 && (
            <>
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-2">
                Проверете преди да издадете
              </div>
              <ul className="list-disc pl-5 text-[13px] space-y-1 mb-4">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </>
          )}

          <form action={issueInvoice} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="orderId" value={orderId} />
            <button
              type="submit"
              disabled={Boolean(refusal)}
              className="h-10 px-5 bg-blue text-white text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Издай фактурата
            </button>
            <span className="text-[12.5px] text-ink-70">
              {refusal ?? 'Издадената фактура получава номер и не може да се променя или изтрива.'}
            </span>
          </form>
        </section>
      )}

      {issued && !credit && !creditRefusal && (
        <section className="tl-no-print px-4 sm:px-6 py-4 border-b border-ink-15 bg-paper">
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-2">
            Сторниране на фактурата
          </div>
          <p className="text-[13px] text-ink-70 mb-3 max-w-[640px]">
            Нужно е, когато стоката се върне, поръчката се откаже след издаване на фактурата или в нея има грешка.
            Кредитното известие обръща цялата фактура и не може да се променя или изтрива. След него, ако е нужно,
            се издава нова фактура ръчно. Номерацията е временна, докато счетоводителят я потвърди.
          </p>
          <form action={issueCreditNote} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="orderId" value={orderId} />
            <input
              name="reason"
              required
              minLength={3}
              maxLength={300}
              placeholder="Основание (напр. върната стока)"
              className="h-10 w-full sm:w-[360px] border border-ink-15 px-3 text-[13px] focus:border-blue focus:outline-none"
            />
            <button type="submit" className="h-10 px-5 bg-danger text-white text-[13px] font-semibold cursor-pointer">
              Издай кредитно известие
            </button>
          </form>
        </section>
      )}
      {issued && !credit && creditRefusal && issued && user && (
        <p className="tl-no-print px-4 sm:px-6 py-3 border-b border-ink-15 text-[12.5px] text-ink-70">{creditRefusal}</p>
      )}

      <div className="px-4 sm:px-6 py-6">
        <InvoiceDocument s={snapshot} />
      </div>

      {credit && (
        <div className="px-4 sm:px-6 pb-10">
          <h2 className="tl-no-print text-[16px] font-semibold mb-3">Кредитно известие № {credit.number}</h2>
          <InvoiceDocument s={credit.snapshot} />
        </div>
      )}
    </div>
  )
}
