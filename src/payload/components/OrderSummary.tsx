'use client'

import { useFormFields } from '@payloadcms/ui'

/**
 * The order as a document, above the form that edits it.
 *
 * Payload's default edit screen is a column of inputs — right for authoring
 * content, wrong for an order, which is read far more often than it is changed.
 * Someone opening TL-260807-714D wants to know who ordered what, how much, and
 * what to do next, without scrolling through four screens of blank fields.
 *
 * Reads the live form state rather than fetching, so it stays correct while the
 * status or tracking number is being edited beneath it.
 */

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Чакаща', bg: '#FEF3C7', fg: '#92400E' },
  confirmed: { label: 'Потвърдена', bg: '#DBEAFE', fg: '#1E40AF' },
  processing: { label: 'В обработка', bg: '#E0E7FF', fg: '#3730A3' },
  shipped: { label: 'Изпратена', bg: '#D1FAE5', fg: '#065F46' },
  delivered: { label: 'Доставена', bg: '#D1FAE5', fg: '#065F46' },
  cancelled: { label: 'Отказана', bg: '#FEE2E2', fg: '#991B1B' },
}

const PAYMENT: Record<string, string> = {
  pending: 'Очаква плащане',
  paid: 'Платена',
  failed: 'Неуспешна',
  refunded: 'Възстановена',
}

const METHOD: Record<string, string> = {
  bank_transfer: 'Банков превод',
  cod: 'Наложен платеж',
  mypos: 'Карта (myPOS)',
}

const money = (v: unknown) =>
  typeof v === 'number' ? v.toFixed(2).replace('.', ',') + ' €' : '—'

/**
 * "5 000 × 34 × 1.1 мм · M42 · заваряване, чапраз" — the sizes the workshop
 * cuts to, written the way the workshop writes them. This used to render as
 * raw JSON, which is a request to a programmer, not a work order.
 */
function describeSpecs(specs: unknown): string | null {
  if (!specs || typeof specs !== 'object') return null
  const s = specs as Record<string, unknown>

  const dims = [s.length, s.width, s.thickness]
    .filter((v) => typeof v === 'number')
    .join(' × ')

  const options = [
    s.welding && 'заваряване',
    s.setting && 'чапраз',
    s.sharpening && 'заточване',
    s.heatTreatment && 'термообработка',
  ].filter(Boolean) as string[]

  return [
    dims ? `${dims} мм` : null,
    typeof s.brand === 'string' ? s.brand : null,
    typeof s.pitch === 'string' ? `стъпка ${s.pitch}` : null,
    options.length ? options.join(', ') : 'без обработка',
  ]
    .filter(Boolean)
    .join(' · ')
}

type Row = { name: string; sku: string; qty: number; price: number; specs: string | null }

export function OrderSummary() {
  const fields = useFormFields(([f]) => f)
  const get = (path: string) => fields?.[path]?.value

  const status = String(get('status') ?? 'pending')
  const badge = STATUS[status] ?? { label: status, bg: '#F3F4F6', fg: '#374151' }

  // Array rows arrive as flattened paths: items.0.name, items.0.quantity, …
  const rows: Row[] = []
  for (let i = 0; ; i++) {
    if (fields?.[`items.${i}.name`] === undefined && fields?.[`items.${i}.quantity`] === undefined) break
    rows.push({
      name: String(get(`items.${i}.name`) ?? '—'),
      sku: String(get(`items.${i}.sku`) ?? ''),
      qty: Number(get(`items.${i}.quantity`) ?? 0),
      price: Number(get(`items.${i}.price`) ?? 0),
      specs: describeSpecs(get(`items.${i}.customSpecs`)),
    })
    if (i > 200) break // guard
  }

  const cell: React.CSSProperties = {
    padding: '10px 12px',
    borderBottom: '1px solid var(--theme-elevation-100)',
    verticalAlign: 'top',
  }
  const head: React.CSSProperties = {
    ...cell,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--theme-elevation-500)',
    fontWeight: 600,
  }

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        marginBottom: 28,
        background: 'var(--theme-elevation-0)',
        overflow: 'hidden',
      }}
    >
      {/* Header — everything you need before deciding to act */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          padding: '14px 16px',
          borderBottom: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-elevation-50)',
        }}
      >
        <strong style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
          {String(get('orderNumber') ?? '')}
        </strong>
        <span
          style={{
            background: badge.bg,
            color: badge.fg,
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {badge.label}
        </span>
        <span style={{ fontSize: 13, color: 'var(--theme-elevation-600)' }}>
          {PAYMENT[String(get('payment.status') ?? '')] ?? '—'}
          {' · '}
          {METHOD[String(get('payment.method') ?? '')] ?? '—'}
        </span>
        <strong style={{ marginLeft: 'auto', fontSize: 22, letterSpacing: '-0.02em' }}>
          {money(get('total'))}
        </strong>
      </div>

      {/* Items */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ ...head, textAlign: 'left' }}>Артикул</th>
              <th style={{ ...head, textAlign: 'right', whiteSpace: 'nowrap' }}>Кол.</th>
              <th style={{ ...head, textAlign: 'right', whiteSpace: 'nowrap' }}>Ед. цена</th>
              <th style={{ ...head, textAlign: 'right', whiteSpace: 'nowrap' }}>Сума</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={{ ...cell, color: 'var(--theme-elevation-500)' }} colSpan={4}>
                  Няма артикули по тази поръчка.
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={cell}>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                  {r.specs && (
                    <div style={{ fontSize: 12.5, color: 'var(--theme-elevation-600)', marginTop: 3 }}>
                      {r.specs}
                    </div>
                  )}
                  {r.sku && (
                    <div style={{ fontSize: 11.5, color: 'var(--theme-elevation-450)', marginTop: 3 }}>
                      SKU {r.sku}
                    </div>
                  )}
                </td>
                <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.qty}</td>
                <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {money(r.price)}
                </td>
                <td
                  style={{
                    ...cell,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 600,
                  }}
                >
                  {money(r.qty * r.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + where it goes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto',
          gap: 24,
          padding: '14px 16px',
          background: 'var(--theme-elevation-50)',
          borderTop: '1px solid var(--theme-elevation-150)',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--theme-elevation-600)', whiteSpace: 'pre-line' }}>
          <div style={{ ...head, padding: 0, marginBottom: 4 }}>Доставка</div>
          {String(get('shipping.address') ?? '—')}
          {get('shipping.trackingNumber') ? (
            <div style={{ marginTop: 6 }}>Товарителница: {String(get('shipping.trackingNumber'))}</div>
          ) : null}
        </div>
        <table style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          <tbody>
            <tr>
              <td style={{ padding: '2px 12px 2px 0', color: 'var(--theme-elevation-600)' }}>
                Междинна сума
              </td>
              <td style={{ textAlign: 'right' }}>{money(get('subtotal'))}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 12px 2px 0', color: 'var(--theme-elevation-600)' }}>Доставка</td>
              <td style={{ textAlign: 'right' }}>{money(get('shipping.cost'))}</td>
            </tr>
            <tr>
              <td style={{ padding: '2px 12px 2px 0', color: 'var(--theme-elevation-600)' }}>
                ДДС {Math.round(Number(get('vatRate') ?? 0.2) * 100)}%
              </td>
              <td style={{ textAlign: 'right' }}>{money(get('tax'))}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 12px 0 0', fontWeight: 700 }}>Общо</td>
              <td style={{ textAlign: 'right', paddingTop: 6, fontWeight: 700, fontSize: 15 }}>
                {money(get('total'))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrderSummary
