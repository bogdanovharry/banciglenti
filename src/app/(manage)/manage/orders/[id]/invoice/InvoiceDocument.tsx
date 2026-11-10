import { LABELS, type InvoiceSnapshot } from '@/lib/invoicing/document'

/**
 * The invoice, drawn from a snapshot and nothing else.
 *
 * Reads no database and no clock, so the same snapshot always draws the same
 * page — which is what "regenerating the document gives the same document"
 * means in practice. Romanian first, Bulgarian beneath, each label once.
 */

const NUMBER = new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const lei = (bani: number): string => NUMBER.format(bani / 100)
const day = (iso: string): string => iso.split('-').reverse().join('.')

type Label = { ro: string; bg: string }

function L({ label }: { label: Label }) {
  return (
    <>
      <span>{label.ro}</span>
      <span className="block text-[10px] font-normal text-ink-50">{label.bg}</span>
    </>
  )
}

function Party({ title, lines }: { title: Label; lines: React.ReactNode[] }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-1">
        {title.ro} / {title.bg}
      </div>
      <div className="text-[13px] leading-[1.5]">
        {lines.filter(Boolean).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  )
}

export function InvoiceDocument({ s }: { s: InvoiceSnapshot }) {
  const preview = s.number === null
  const vat = s.vatRateBp / 100
  const sup = s.supplier
  const buy = s.buyer

  return (
    <article className="tl-invoice relative bg-white border border-ink-15 p-6 sm:p-10 max-w-[820px] mx-auto text-ink">
      {preview && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          <span className="-rotate-[24deg] text-[88px] font-bold tracking-widest text-ink/[0.06] select-none">
            ПРЕГЛЕД
          </span>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink pb-4">
        <div>
          <h2 className="text-[26px] font-semibold tracking-tight leading-none">
            {LABELS.invoice.ro} <span className="text-ink-50 font-normal">/ {LABELS.invoice.bg}</span>
          </h2>
          <div className="mt-2 font-mono text-[15px] tl-figures">
            {LABELS.number.ro} {s.number ?? '— (se atribuie la emitere / се присвоява при издаване)'}
          </div>
        </div>
        <div className="text-right text-[13px]">
          <div className="font-semibold">
            {LABELS.date.ro} / {LABELS.date.bg}
          </div>
          <div className="tl-figures">{day(s.issueDate)}</div>
        </div>
      </header>

      <section className="grid sm:grid-cols-2 gap-x-10 gap-y-6 py-5 border-b border-ink-15">
        <Party
          title={LABELS.supplier}
          lines={[
            <strong key="n">{sup.nameBg} / {sup.nameLatin}</strong>,
            `${LABELS.vatNo.ro} / ${LABELS.vatNo.bg}: ${sup.vatNumber}`,
            `${LABELS.regNo.ro} / ${LABELS.regNo.bg}: ${sup.registrationNumber}`,
            `${sup.addressLatin}`,
            sup.addressBg,
            sup.representative && `${LABELS.representative.ro} / ${LABELS.representative.bg}: ${sup.representative}`,
          ]}
        />
        <Party
          title={LABELS.buyer}
          lines={[
            <strong key="n">{buy.name}</strong>,
            buy.taxId && `${LABELS.cui.ro} / ${LABELS.cui.bg}: ${buy.taxId}`,
            buy.vatNumber && `${LABELS.vatNo.ro} / ${LABELS.vatNo.bg}: ${buy.vatNumber}`,
            buy.address,
          ]}
        />
      </section>

      <table className="w-full text-[13px] mt-5 border-collapse">
        <thead>
          <tr className="border-b border-ink text-left align-bottom">
            <th className="py-2 pr-3 font-semibold"><L label={LABELS.item} /></th>
            <th className="py-2 px-3 font-semibold text-right"><L label={LABELS.qty} /></th>
            <th className="py-2 px-3 font-semibold text-right"><L label={LABELS.net} /></th>
            <th className="py-2 px-3 font-semibold text-right">
              {LABELS.vat.ro} {vat}%<span className="block text-[10px] font-normal text-ink-50">{LABELS.vat.bg} {vat}%</span>
            </th>
            <th className="py-2 pl-3 font-semibold text-right"><L label={LABELS.gross} /></th>
          </tr>
        </thead>
        <tbody>
          {s.lines.map((l, i) => (
            <tr key={i} className="border-b border-ink-15 align-top">
              <td className="py-2 pr-3">
                <div>{l.nameRo}</div>
                {l.nameBg && l.nameBg !== l.nameRo && <div className="text-[11.5px] text-ink-50">{l.nameBg}</div>}
              </td>
              <td className="py-2 px-3 text-right tl-figures">{l.quantity}</td>
              <td className="py-2 px-3 text-right tl-figures">{lei(l.netBani)}</td>
              <td className="py-2 px-3 text-right tl-figures">{lei(l.vatBani)}</td>
              <td className="py-2 pl-3 text-right tl-figures">{lei(l.grossBani)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-5 ml-auto max-w-[360px] text-[13px]">
        <div className="flex justify-between py-1">
          <span>{LABELS.taxBase.ro} / {LABELS.taxBase.bg}</span>
          <span className="tl-figures">{lei(s.totals.netBani)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span>{LABELS.vatAmount.ro} {vat}% / {LABELS.vatAmount.bg} {vat}%</span>
          <span className="tl-figures">{lei(s.totals.vatBani)}</span>
        </div>
        <div className="flex justify-between py-2 mt-1 border-t border-ink font-semibold text-[15px]">
          <span>{LABELS.totalDue.ro} / {LABELS.totalDue.bg}</span>
          <span className="tl-figures">{lei(s.totals.totalBani)} RON</span>
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t border-ink-15 text-[12px] text-ink-70 space-y-1">
        <div>
          {LABELS.payment.ro} / {LABELS.payment.bg}:{' '}
          {s.order.paymentMethod === 'cod'
            ? `${LABELS.cod.ro} / ${LABELS.cod.bg}`
            : s.order.paymentMethod === 'bank_transfer'
              ? `${LABELS.bankTransfer.ro} / ${LABELS.bankTransfer.bg}`
              : '—'}
        </div>
        <div>
          {LABELS.order.ro} / {LABELS.order.bg}: {s.order.number}
          {s.order.waybill && <> · {LABELS.waybill.ro} / {LABELS.waybill.bg}: {s.order.waybill}</>}
        </div>
        <div>{LABELS.currency.ro} / {LABELS.currency.bg}</div>
        <div>
          {LABELS.rate.ro} / {LABELS.rate.bg}: {String(s.shopRate).replace('.', ',')}
        </div>
        {sup.iban && (
          <div>
            {LABELS.bank.ro} / {LABELS.bank.bg}: {sup.bankName} · IBAN {sup.iban}
            {sup.bic && ` · BIC ${sup.bic}`}
          </div>
        )}
      </footer>
    </article>
  )
}
