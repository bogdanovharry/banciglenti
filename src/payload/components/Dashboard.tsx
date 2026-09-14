import Link from 'next/link'

import { money } from '@/lib/manage/format'
import { orderHref } from '@/lib/manage/routes'
import {
  catalogueBySeries,
  lowStock as readLowStock,
  LOW_STOCK_THRESHOLD,
  newEnquiryCount,
  orderStatusCounts,
  recentOrders,
  revenue,
} from '@/lib/manage/stats'
import { statusPill } from '@/lib/manage/vocabulary'
import { SERIES, type SeriesKey } from '@/lib/series'

/**
 * The dashboard, in the shape of the Flatlogic e-commerce admin: a row of stat
 * cards, then breakdown panels beneath.
 *
 * What it shows is ours, not theirs. Their template leads with revenue charts,
 * browser share and desktop-vs-mobile splits — the first is meaningless on a
 * shop with a handful of orders, and the other two answer questions nobody in
 * this workshop is asking. Every panel here is instead something a person can
 * act on this morning: orders waiting to be confirmed, enquiries nobody has
 * moved on, blades about to run out.
 *
 * Orders and customers are worked in /manage now, so this page points there
 * rather than competing with it. The figures come from src/lib/manage/stats.ts,
 * the same SQL the /manage dashboard reads, so the two screens cannot disagree.
 * This card used to add up the newest 100 orders, cancelled ones included, and
 * print the all-time order count under the result — a figure that was wrong at
 * the 101st order or the first cancellation, labelled as if it were complete.
 *
 * No session check here: Payload renders this inside its own admin, behind its
 * own login, which is the caller-authenticates contract stats.ts asks for.
 *
 * Inline styles, because Tailwind is not loaded inside Payload's admin; the
 * colours read from Payload's theme variables so dark mode still works.
 */

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },
  confirmed: { bg: '#DBEAFE', fg: '#1E40AF' },
  processing: { bg: '#E0E7FF', fg: '#3730A3' },
  shipped: { bg: '#D1FAE5', fg: '#065F46' },
  // Matches StatusPill in /manage, which a click on a row now lands on.
  delivered: { bg: '#BBF7D0', fg: '#14532D' },
  cancelled: { bg: '#FEE2E2', fg: '#991B1B' },
}

/**
 * Payload's list view reads a `where` query from the URL, so a card can open
 * the list already filtered to what the card counted.
 */
const LOW_STOCK_LIST =
  `/admin/collections/products?where[and][0][status][equals]=active` +
  `&where[and][1][stock][less_than_equal]=${LOW_STOCK_THRESHOLD}&sort=stock`

function StatCard({
  label,
  value,
  note,
  accent,
  href,
}: {
  label: string
  value: string
  note: string
  accent: string
  href: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        background: 'var(--theme-elevation-0)',
        border: '1px solid var(--theme-elevation-150)',
        borderTop: `3px solid ${accent}`,
        borderRadius: 4,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500)',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          margin: '6px 0 2px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--theme-elevation-600)' }}>{note}</div>
    </Link>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--theme-elevation-0)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-elevation-50)',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h3>
        {action}
      </header>
      {children}
    </section>
  )
}

const cell: React.CSSProperties = {
  padding: '9px 16px',
  borderBottom: '1px solid var(--theme-elevation-100)',
  fontSize: 13.5,
}

const muted: React.CSSProperties = { fontSize: 12.5, color: 'var(--theme-elevation-500)' }

const actionLink: React.CSSProperties = { fontSize: 12.5, color: '#004FC6', textDecoration: 'none' }

const empty = (text: string) => (
  <div style={{ padding: '18px 16px', fontSize: 13, color: 'var(--theme-elevation-500)' }}>{text}</div>
)

const footnote = (text: string) => (
  <div style={{ padding: '10px 16px', ...muted, fontSize: 12 }}>{text}</div>
)

const orderWord = (n: number) => `${n} ${n === 1 ? 'поръчка' : 'поръчки'}`

export async function Dashboard() {
  const [rev, statuses, enquiries, stock, recent, catalogue] = await Promise.all([
    revenue(),
    orderStatusCounts(),
    newEnquiryCount(),
    readLowStock(8),
    recentOrders(6),
    catalogueBySeries(),
  ])

  // Which Saw-Meister lines the catalogue offers — counted from products, not
  // from orders, so it says nothing about what sells; the /manage dashboard's
  // top lines do. Only active products are counted and the bars are shares of
  // every active product, so the products outside any series are named below
  // instead of silently making the bars add up to less than the whole.
  const activeTotal = catalogue.reduce((n, s) => n + s.active, 0)
  const noSeries = catalogue.find((s) => s.series === null)?.active ?? 0
  const bySeries = (Object.keys(SERIES) as SeriesKey[]).map((key) => {
    const row = catalogue.find((s) => s.series === key)
    return {
      key,
      active: row?.active ?? 0,
      inactive: row?.inactive ?? 0,
      outOfStock: row?.outOfStock ?? 0,
    }
  })

  return (
    <div style={{ marginBottom: 32 }}>
      <Link
        href="/manage"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px 16px',
          textDecoration: 'none',
          color: 'inherit',
          background: 'var(--theme-elevation-50)',
          border: '1px solid var(--theme-elevation-150)',
          borderLeft: '3px solid #D97706',
          borderRadius: 4,
          padding: '12px 16px',
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 13.5 }}>
          Поръчките, клиентите и оборотът се водят в таблото за управление.
        </span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#004FC6', whiteSpace: 'nowrap' }}>
          Отвори таблото →
        </span>
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Оборот този месец"
          value={money(rev.thisMonth.total)}
          note={`Без отказани · ${orderWord(rev.thisMonth.count)} · платени ${money(rev.thisMonthPaid.total)}`}
          accent="#16A34A"
          href="/manage"
        />
        <StatCard
          label="Чакащи поръчки"
          value={String(statuses.pending)}
          note={statuses.pending ? 'Чакат потвърждение' : 'Нищо не чака потвърждение'}
          accent="#D97706"
          href="/manage/orders?status=pending"
        />
        <StatCard
          label="Нови запитвания"
          value={String(enquiries)}
          note={enquiries ? 'Със статус „Ново“' : 'Няма със статус „Ново“'}
          accent="#004FC6"
          href="/admin/collections/enquiries?where[status][equals]=new"
        />
        <StatCard
          label="Ниска наличност"
          value={String(stock.total)}
          note={`Активни продукти с ${LOW_STOCK_THRESHOLD} бр. или по-малко`}
          accent="#DC2626"
          href={LOW_STOCK_LIST}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Panel
          title="Последни поръчки"
          action={
            <Link href="/manage/orders" style={actionLink}>
              Всички {statuses.all} →
            </Link>
          }
        >
          {recent.length === 0
            ? empty('Още няма поръчки.')
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {recent.map((o) => {
                    const tone = STATUS_TONE[o.status ?? ''] ?? { bg: '#F3F4F6', fg: '#374151' }
                    return (
                      <tr key={o.id}>
                        <td style={cell}>
                          <Link
                            href={orderHref(o.id)}
                            style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}
                          >
                            {o.orderNumber}
                          </Link>
                          <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginTop: 2 }}>
                            {o.customerName ?? '—'}
                          </div>
                        </td>
                        <td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              background: tone.bg,
                              color: tone.fg,
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 11.5,
                              fontWeight: 600,
                            }}
                          >
                            {statusPill(o.status)}
                          </span>
                        </td>
                        <td
                          style={{
                            ...cell,
                            textAlign: 'right',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {money(o.total)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </Panel>

        <Panel title="Активни продукти по серия">
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bySeries.map(({ key, active, inactive, outOfStock }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{SERIES[key].name}</span>
                  <span style={{ color: 'var(--theme-elevation-500)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                    {active} активни
                    {inactive > 0 && ` · ${inactive} неактивни`}
                    {outOfStock > 0 && ` · ${outOfStock} изчерпани`}
                    {' · '}
                    {SERIES[key].application}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--theme-elevation-100)', borderRadius: 3 }}>
                  <div
                    style={{
                      width: `${activeTotal ? Math.round((active / activeTotal) * 100) : 0}%`,
                      height: '100%',
                      background: '#004FC6',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {footnote(
            `Дял от всички ${activeTotal} активни продукта` +
              (noSeries > 0 ? `, от които ${noSeries} без серия.` : '.'),
          )}
        </Panel>

        <Panel
          title="Свършва наличността"
          action={
            stock.total > stock.rows.length ? (
              <Link href={LOW_STOCK_LIST} style={actionLink}>
                {stock.rows.length} от {stock.total} →
              </Link>
            ) : undefined
          }
        >
          {stock.rows.length === 0
            ? empty(`Всички активни продукти имат повече от ${LOW_STOCK_THRESHOLD} бр.`)
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {stock.rows.map((p) => (
                    <tr key={p.id}>
                      <td style={cell}>
                        <Link
                          href={`/admin/collections/products/${p.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td
                        style={{
                          ...cell,
                          textAlign: 'right',
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          color: p.stock <= 0 ? '#DC2626' : '#D97706',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.stock} бр.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          {footnote(`Активни продукти с ${LOW_STOCK_THRESHOLD} бр. или по-малко, най-малко наличните първо.`)}
        </Panel>
      </div>
    </div>
  )
}

export default Dashboard
