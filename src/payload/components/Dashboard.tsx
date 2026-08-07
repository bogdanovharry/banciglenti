import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

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
 * answered, blades about to run out.
 */

const money = (v: number) => v.toFixed(2).replace('.', ',') + ' €'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Чакаща',
  confirmed: 'Потвърдена',
  processing: 'В обработка',
  shipped: 'Изпратена',
  delivered: 'Доставена',
  cancelled: 'Отказана',
}

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },
  confirmed: { bg: '#DBEAFE', fg: '#1E40AF' },
  processing: { bg: '#E0E7FF', fg: '#3730A3' },
  shipped: { bg: '#D1FAE5', fg: '#065F46' },
  delivered: { bg: '#D1FAE5', fg: '#065F46' },
  cancelled: { bg: '#FEE2E2', fg: '#991B1B' },
}

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

const empty = (text: string) => (
  <div style={{ padding: '18px 16px', fontSize: 13, color: 'var(--theme-elevation-500)' }}>{text}</div>
)

export async function Dashboard() {
  const payload = await getPayload({ config })

  const [orders, pending, enquiries, lowStock] = await Promise.all([
    payload.find({ collection: 'orders', limit: 100, depth: 1, sort: '-createdAt' }),
    payload.count({ collection: 'orders', where: { status: { equals: 'pending' } } }),
    payload.count({ collection: 'enquiries', where: { status: { equals: 'new' } } }),
    payload.find({
      collection: 'products',
      where: { and: [{ stock: { less_than_equal: 5 } }, { status: { equals: 'active' } }] },
      limit: 8,
      depth: 0,
      sort: 'stock',
    }),
  ])

  const docs = orders.docs as unknown as {
    id: number
    orderNumber: string
    total?: number
    status?: string
    createdAt?: string
    customer?: { name?: string } | number | null
  }[]

  const revenue = docs.reduce((n, o) => n + (typeof o.total === 'number' ? o.total : 0), 0)

  // Which Saw-Meister lines are actually selling. Counted from the catalogue
  // rather than from orders, because with this few orders the order-based
  // split would be noise.
  const bySeries = await Promise.all(
    (Object.keys(SERIES) as SeriesKey[]).map(async (key) => ({
      key,
      count: (await payload.count({ collection: 'products', where: { series: { equals: key } } })).totalDocs,
    })),
  )
  const seriesTotal = bySeries.reduce((n, s) => n + s.count, 0) || 1

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <StatCard
          label="Оборот"
          value={money(revenue)}
          note={`${orders.totalDocs} поръчки общо`}
          accent="#16A34A"
          href="/admin/collections/orders"
        />
        <StatCard
          label="Чакащи поръчки"
          value={String(pending.totalDocs)}
          note={pending.totalDocs ? 'Чакат потвърждение' : 'Няма нищо за обработка'}
          accent="#D97706"
          href="/admin/collections/orders?where[status][equals]=pending"
        />
        <StatCard
          label="Нови запитвания"
          value={String(enquiries.totalDocs)}
          note={enquiries.totalDocs ? 'Никой не е отговорил' : 'Всички са обработени'}
          accent="#004FC6"
          href="/admin/collections/enquiries?where[status][equals]=new"
        />
        <StatCard
          label="Ниска наличност"
          value={String(lowStock.totalDocs)}
          note="5 бр. или по-малко"
          accent="#DC2626"
          href="/admin/collections/products"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <Panel title="Последни поръчки">
          {docs.length === 0
            ? empty('Още няма поръчки.')
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {docs.slice(0, 6).map((o) => {
                    const tone = STATUS_TONE[o.status ?? ''] ?? { bg: '#F3F4F6', fg: '#374151' }
                    return (
                      <tr key={o.id}>
                        <td style={cell}>
                          <Link
                            href={`/admin/collections/orders/${o.id}`}
                            style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}
                          >
                            {o.orderNumber}
                          </Link>
                          <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)', marginTop: 2 }}>
                            {o.customer && typeof o.customer === 'object' ? o.customer.name : '—'}
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
                            {STATUS_LABEL[o.status ?? ''] ?? o.status}
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
                          {money(o.total ?? 0)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
        </Panel>

        <Panel title="Каталог по серия">
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bySeries.map(({ key, count }) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{SERIES[key].name}</span>
                  <span style={{ color: 'var(--theme-elevation-500)', fontVariantNumeric: 'tabular-nums' }}>
                    {count} · {SERIES[key].application}
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--theme-elevation-100)', borderRadius: 3 }}>
                  <div
                    style={{
                      width: `${Math.round((count / seriesTotal) * 100)}%`,
                      height: '100%',
                      background: '#004FC6',
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Свършва наличността">
          {lowStock.docs.length === 0
            ? empty('Нищо не е под 5 броя.')
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(lowStock.docs as unknown as { id: number; name: string; stock?: number }[]).map((p) => (
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
                          color: (p.stock ?? 0) === 0 ? '#DC2626' : '#D97706',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.stock ?? 0} бр.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Panel>
      </div>
    </div>
  )
}

export default Dashboard
