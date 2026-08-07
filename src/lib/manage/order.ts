import { pitchLabel } from '@/lib/pricing'
import { getClient, requireUser } from '@/lib/manage/session'

/**
 * One order, read whole.
 *
 * The list answers "what needs doing"; this answers "what is this, and who do I
 * ring". Everything the screen shows is resolved here in one pass — customer,
 * lines, totals, address, history — so the page component is layout and nothing
 * else.
 */

export type OrderLine = {
  /** Position in the stored array. Removing a line addresses it by this. */
  index: number
  name: string
  sku: string
  quantity: number
  price: number
  lineTotal: number
  /** "5 000 × 34 × 1,1 мм · Håkansson M42 · стъпка 1.4/2 · заваряване" */
  specs: string | null
  /** True for a made-to-measure blade, false for a catalogue product. */
  custom: boolean
}

export type OrderLogEntry = {
  note: string
  at: string | null
  author: string | null
}

export type OrderDetail = {
  id: number
  orderNumber: string
  status: string | null
  createdAt: string | null
  updatedAt: string | null

  customer: {
    id: number | null
    name: string | null
    company: string | null
    phone: string | null
    email: string | null
    taxId: string | null
    vatNumber: string | null
  }

  lines: OrderLine[]

  subtotal: number
  tax: number
  vatRate: number
  total: number
  currency: string
  exchangeRate: number

  payment: { method: string | null; status: string | null; transactionId: string | null }
  shipping: {
    method: string | null
    cost: number
    trackingNumber: string | null
    office: string | null
    address: string | null
  }

  /** What the customer typed at checkout. Theirs, not ours. */
  notes: string | null
  /** Internal history, newest first — the question is always what happened last. */
  log: OrderLogEntry[]
}

/**
 * "5 000 × 34 × 1,1 мм · Håkansson M42 · стъпка 1.4/2 · заваряване, чапраз"
 *
 * The sizes the workshop cuts to, written the way the workshop writes them.
 * This is the same description the Payload summary card renders, moved to the
 * server so the detail screen needs no client component to read a line.
 */
export function describeSpecs(specs: unknown): string | null {
  if (!specs || typeof specs !== 'object') return null
  const s = specs as Record<string, unknown>

  const dims = [s.length, s.width, s.thickness]
    .filter((v) => typeof v === 'number')
    .map((v) => String(v).replace('.', ','))
    .join(' × ')

  const options = [
    s.welding && 'заваряване',
    s.setting && 'чапраз',
    s.sharpening && 'заточване',
    s.heatTreatment && 'термообработка',
  ].filter(Boolean) as string[]

  const parts = [
    dims ? `${dims} мм` : null,
    typeof s.brand === 'string' ? s.brand : null,
    typeof s.pitch === 'string' ? `стъпка ${pitchLabel(s.pitch)}` : null,
    options.length ? options.join(', ') : 'без обработка',
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : null
}

type RawLine = {
  name?: string | null
  sku?: string | null
  quantity?: number | null
  price?: number | null
  customSpecs?: unknown
}

type RawOrder = {
  id: number
  orderNumber?: string | null
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  items?: RawLine[] | null
  customer?: unknown
  subtotal?: number | null
  tax?: number | null
  vatRate?: number | null
  total?: number | null
  currency?: string | null
  exchangeRate?: number | null
  payment?: { method?: string | null; status?: string | null; transactionId?: string | null } | null
  shipping?: {
    method?: string | null
    cost?: number | null
    trackingNumber?: string | null
    office?: string | null
    address?: string | null
  } | null
  notes?: string | null
  log?: { note?: string | null; at?: string | null; author?: unknown }[] | null
}

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** A relationship arrives as an id or a populated object, depending on depth. */
function authorName(value: unknown): string | null {
  if (value && typeof value === 'object') {
    const u = value as { name?: unknown; email?: unknown }
    if (typeof u.name === 'string' && u.name) return u.name
    if (typeof u.email === 'string') return u.email
  }
  return null
}

export async function getOrder(id: number): Promise<OrderDetail | null> {
  await requireUser(`/manage/orders/${id}`)
  const payload = await getClient()

  // depth 2: the order's customer, and the author on each history entry.
  let doc: RawOrder | null = null
  try {
    doc = (await payload.findByID({
      collection: 'orders',
      id,
      depth: 2,
    })) as unknown as RawOrder
  } catch {
    // Payload throws NotFound rather than returning null.
    return null
  }
  if (!doc) return null


  const c =
    doc.customer && typeof doc.customer === 'object'
      ? (doc.customer as {
          id?: number
          name?: string | null
          company?: string | null
          phone?: string | null
          email?: string | null
          taxId?: string | null
          vatNumber?: string | null
        })
      : null

  const lines: OrderLine[] = (doc.items ?? []).map((item, index) => {
    const quantity = num(item.quantity)
    const price = num(item.price)
    return {
      index,
      name: item.name ?? '—',
      sku: item.sku ?? '',
      quantity,
      price,
      lineTotal: Math.round(price * quantity * 100) / 100,
      specs: describeSpecs(item.customSpecs),
      custom: Boolean(item.customSpecs),
    }
  })

  const log: OrderLogEntry[] = (doc.log ?? [])
    .map((entry) => ({
      note: entry.note ?? '',
      at: entry.at ?? null,
      author: authorName(entry.author),
    }))
    .filter((entry) => entry.note.trim().length > 0)
    .reverse()

  return {
    id: doc.id,
    orderNumber: doc.orderNumber ?? String(doc.id),
    status: doc.status ?? null,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,

    customer: {
      id: c?.id ?? null,
      name: c?.name ?? null,
      company: c?.company ?? null,
      phone: c?.phone ?? null,
      email: c?.email ?? null,
      taxId: c?.taxId ?? null,
      vatNumber: c?.vatNumber ?? null,
    },

    lines,

    subtotal: num(doc.subtotal),
    tax: num(doc.tax),
    vatRate: num(doc.vatRate, 0.2),
    total: num(doc.total),
    currency: doc.currency ?? 'EUR',
    exchangeRate: num(doc.exchangeRate, 1),

    payment: {
      method: doc.payment?.method ?? null,
      status: doc.payment?.status ?? null,
      transactionId: doc.payment?.transactionId ?? null,
    },
    shipping: {
      method: doc.shipping?.method ?? null,
      cost: num(doc.shipping?.cost),
      trackingNumber: doc.shipping?.trackingNumber ?? null,
      office: doc.shipping?.office ?? null,
      address: doc.shipping?.address ?? null,
    },

    notes: doc.notes?.trim() ? doc.notes.trim() : null,
    log,
  }
}
