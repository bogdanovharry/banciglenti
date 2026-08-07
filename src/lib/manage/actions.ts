'use server'

import { redirect } from 'next/navigation'

import {
  computeOrderTotals,
  parseCustomSpecs,
  priceCustomItem,
  round2,
  type CustomSpecs,
} from '@/lib/order-pricing'
import { getClient, requireUser, type ManageUser } from '@/lib/manage/session'
import { isOrderStatus, statusPill } from '@/lib/manage/vocabulary'

/**
 * Everything that changes an order.
 *
 * Three rules hold across every action here, and they are the reason this file
 * exists rather than a set of PATCH endpoints:
 *
 *  1. `requireUser()` runs first. A Server Action is a public HTTP endpoint
 *     with a generated name — it is reachable by anyone who finds the id, so
 *     "the page checked already" is not a check.
 *  2. No money crosses the boundary. The browser may say *what* to add and how
 *     many; the price comes from src/lib/pricing.ts and the totals from
 *     computeOrderTotals — the same function the checkout uses. There is no
 *     form field on any of these screens that writes a price.
 *  3. Anything a person would later ask "who did that, and when" about writes
 *     a history entry. The old platform had that and it is why an order can be
 *     argued about six weeks later.
 *
 * A failure returns an ActionResult and the form shows it in place. A success
 * never returns — it ends in `done()`, which navigates. See the note there:
 * these screens cannot be updated in place, and the reason is architectural.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
const PAYMENT_METHODS = ['mypos', 'cod', 'bank_transfer']
const SHIPPING_METHODS = ['courier', 'pickup']

/** Form fields arrive as strings or Files; only non-empty strings interest us. */
function str(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function orderId(form: FormData): number | null {
  const id = Number.parseInt(str(form, 'orderId'), 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

const pick = (value: string, allowed: string[]): string | null =>
  allowed.includes(value) ? value : null

/**
 * Finish a mutation by going to the order afresh. Never returns.
 *
 * A navigation, rather than any of the in-place mechanisms, because none of them
 * work on these screens — and the reason is architectural, not a missing call.
 * `(manage)` is a *second root layout*: src/app/layout.tsx is a pass-through, so
 * this group renders its own <html> and <body>, exactly as the storefront and
 * Payload's admin do. Next cannot reconcile an RSC re-render across that
 * boundary, and its own documentation says as much in a different guise —
 * navigating between routes with different root layouts forces a full page load.
 *
 * What that meant here, all confirmed by instrumenting a render timestamp into
 * the page and watching it in a browser:
 *
 *   - with no revalidation, the timestamp never changed at all;
 *   - `router.refresh()` from the client changed nothing, ever — it is a no-op
 *     on these routes, so do not add it back;
 *   - server-side `refresh()` and `revalidatePath()` updated the screen only
 *     sometimes, which is worse than never, because it looks like it works.
 *
 * The write itself was never the problem: a read issued immediately after the
 * update, in the same request, always saw the new value.
 *
 * A stale screen is not cosmetic on this page. The line table addresses rows by
 * position, so a table that has not caught up means the next "remove" click
 * deletes a different line — which is precisely what happened to a real order
 * during testing. `removeLine` now also refuses a row that does not match what
 * the button thought it was removing, so that failure mode is closed twice over.
 *
 * `saved` survives the navigation in the query string, since a redirect throws
 * away whatever the action would otherwise have returned.
 */
function done(id: number, saved: string): never {
  redirect(`/manage/orders/${id}?saved=${encodeURIComponent(saved)}`)
}

type StoredLine = {
  name?: string | null
  sku?: string | null
  quantity?: number | null
  price?: number | null
  product?: number | null
  variant?: number | null
  customSpecs?: unknown
}

type StoredOrder = {
  id: number
  status?: string | null
  items?: StoredLine[] | null
  vatRate?: number | null
  shipping?: { method?: string | null } | null
  log?: { note?: string | null; at?: string | null; author?: number | null }[] | null
}

/**
 * The order as plain data — relationships as ids, not populated objects, so it
 * can be written straight back without Payload having to unpick it.
 */
async function loadOrder(id: number): Promise<StoredOrder | null> {
  const payload = await getClient()
  try {
    return (await payload.findByID({ collection: 'orders', id, depth: 0 })) as unknown as StoredOrder
  } catch {
    return null
  }
}

/**
 * A history entry, stamped with who and when.
 *
 * The collection's own beforeChange hooks fill author and time, but only for
 * rows that arrive without them — so existing entries keep their original
 * author instead of being re-attributed to whoever touched the order last.
 */
function withEntry(
  existing: StoredOrder['log'],
  note: string,
  user: ManageUser,
): { note: string; at: string; author: number }[] {
  const kept = (existing ?? [])
    .filter((e) => typeof e.note === 'string' && e.note.trim())
    .map((e) => ({
      note: String(e.note),
      at: e.at ?? new Date().toISOString(),
      author: typeof e.author === 'number' ? e.author : user.id,
    }))

  return [...kept, { note, at: new Date().toISOString(), author: user.id }]
}

/**
 * Recompute subtotal, carriage, VAT and total from the lines as they now stand.
 *
 * Existing lines keep the price they were sold at — that is what the customer
 * agreed to and what the card was charged. Only the arithmetic over them is
 * redone, at the order's own VAT rate rather than today's.
 */
function totalsFor(order: StoredOrder, lines: StoredLine[]) {
  return computeOrderTotals({
    lines: lines.map((l) => ({ price: l.price ?? 0, quantity: l.quantity ?? 0 })),
    shippingMethod: order.shipping?.method === 'pickup' ? 'pickup' : 'courier',
    vatRate: typeof order.vatRate === 'number' ? order.vatRate : 0.2,
  })
}

// --- Status -----------------------------------------------------------------

export async function setStatus(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const next = str(form, 'status')
  if (!isOrderStatus(next)) return { ok: false, error: 'Непознат статус.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }
  if (order.status === next) return { ok: true, message: 'Статусът вече е такъв.' }

  // A refusal without a reason is the entry nobody can interpret later, so it
  // is the one status change that insists on a note.
  const reason = str(form, 'reason')
  if (next === 'cancelled' && !reason) {
    return { ok: false, error: 'Отказана поръчка иска причина.' }
  }

  const from = statusPill(order.status)
  const to = statusPill(next)
  const note = reason ? `Статус: ${from} → ${to}. ${reason}` : `Статус: ${from} → ${to}`

  const payload = await getClient()
  await payload.update({
    collection: 'orders',
    id,
    data: { status: next, log: withEntry(order.log, note, user) },
    user,
  })

  done(id, `Статусът е ${to.toLowerCase()}.`)
}

// --- Internal history -------------------------------------------------------

export async function addComment(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const note = str(form, 'note')
  if (!note) return { ok: false, error: 'Празен коментар.' }
  if (note.length > 2000) return { ok: false, error: 'Коментарът е твърде дълъг.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }

  const payload = await getClient()
  await payload.update({
    collection: 'orders',
    id,
    data: { log: withEntry(order.log, note, user) },
    user,
  })

  done(id, 'Коментарът е добавен.')
}

// --- Payment and dispatch ---------------------------------------------------

export async function saveFulfilment(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }

  const paymentStatus = pick(str(form, 'paymentStatus'), PAYMENT_STATUSES)
  const paymentMethod = pick(str(form, 'paymentMethod'), PAYMENT_METHODS)
  const shippingMethod = pick(str(form, 'shippingMethod'), SHIPPING_METHODS)
  const tracking = str(form, 'trackingNumber')
  const office = str(form, 'office')
  const address = str(form, 'address')

  // Collecting in person costs no carriage, so switching method re-prices the
  // order. Everything else here is descriptive and leaves the money alone.
  const nextOrder: StoredOrder = {
    ...order,
    shipping: { ...order.shipping, method: shippingMethod ?? order.shipping?.method },
  }
  const totals = totalsFor(nextOrder, order.items ?? [])

  const wasTracked = Boolean(str(form, 'previousTracking'))
  const notes: string[] = []
  if (tracking && !wasTracked) notes.push(`Товарителница ${tracking}`)
  if (paymentStatus === 'paid' && order.status !== 'cancelled') notes.push('Отбелязана като платена')

  const payload = await getClient()
  await payload.update({
    collection: 'orders',
    id,
    data: {
      payment: {
        ...(paymentMethod ? { method: paymentMethod } : {}),
        ...(paymentStatus ? { status: paymentStatus } : {}),
      },
      shipping: {
        ...(shippingMethod ? { method: shippingMethod } : {}),
        cost: totals.shippingCost,
        trackingNumber: tracking || null,
        office: office || null,
        address: address || null,
      },
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      ...(notes.length ? { log: withEntry(order.log, notes.join(' · '), user) } : {}),
    },
    user,
  })

  done(id, 'Записано.')
}

// --- Lines ------------------------------------------------------------------

/** Writes the new line set and the totals that follow from it. */
async function commitLines(
  order: StoredOrder,
  lines: StoredLine[],
  note: string,
  user: ManageUser,
): Promise<ActionResult> {
  const totals = totalsFor(order, lines)
  const payload = await getClient()

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: {
      items: lines,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      shipping: { ...order.shipping, cost: totals.shippingCost },
      log: withEntry(order.log, note, user),
    },
    user,
  })

  done(order.id, 'Поръчката е преизчислена.')
}

function quantityFrom(form: FormData): number | null {
  const q = Number.parseInt(str(form, 'quantity'), 10)
  return Number.isInteger(q) && q >= 1 && q <= 999 ? q : null
}

/**
 * A catalogue product, priced at what the catalogue says today — never at a
 * number the browser supplied.
 */
export async function addCatalogueLine(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const sku = str(form, 'sku')
  if (!sku) return { ok: false, error: 'Изберете артикул.' }

  const quantity = quantityFrom(form)
  if (!quantity) return { ok: false, error: 'Количеството е между 1 и 999.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }

  const payload = await getClient()
  const found = await payload.find({
    collection: 'products',
    limit: 1,
    depth: 0,
    where: { slug: { equals: sku } },
  })
  const product = found.docs[0] as unknown as
    | { id: number; name: string; basePrice?: number | null }
    | undefined

  if (!product) return { ok: false, error: `Няма артикул „${sku}“.` }

  const line: StoredLine = {
    product: product.id,
    name: product.name,
    sku,
    quantity,
    price: round2(product.basePrice ?? 0),
  }

  return commitLines(
    order,
    [...(order.items ?? []), line],
    `Добавен ред: ${product.name} × ${quantity}`,
    user,
  )
}

/**
 * A made-to-measure blade, priced from the same tables the configurator quotes
 * from. A combination that is not in the price list is refused rather than
 * guessed — which is also the answer to "can we make this?".
 */
export async function addCustomLine(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const quantity = quantityFrom(form)
  if (!quantity) return { ok: false, error: 'Количеството е между 1 и 999.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }

  const specs: CustomSpecs | null = parseCustomSpecs({
    table: str(form, 'table'),
    length: Number(str(form, 'length')),
    width: Number(str(form, 'width')),
    thickness: Number(str(form, 'thickness')),
    pitch: str(form, 'pitch'),
    brand: str(form, 'brand'),
    welding: form.get('welding') !== null,
    setting: form.get('setting') !== null,
    sharpening: form.get('sharpening') !== null,
    heatTreatment: form.get('heatTreatment') !== null,
  })

  if (!specs) return { ok: false, error: 'Проверете размерите — дължината е от 1000 мм нагоре.' }

  const unit = priceCustomItem(specs)
  if (unit === null) {
    return { ok: false, error: 'Тази комбинация не е в ценоразписа. Проверете ширина, дебелина, стъпка и марка.' }
  }

  const name = `Лента по размер ${specs.length}×${specs.width}×${specs.thickness} мм · ${specs.brand}`
  const line: StoredLine = {
    name,
    sku: `CUSTOM-${specs.width}x${specs.thickness}-${specs.length}-${specs.pitch}`,
    quantity,
    price: round2(unit),
    customSpecs: specs,
  }

  return commitLines(order, [...(order.items ?? []), line], `Добавен ред: ${name} × ${quantity}`, user)
}

/**
 * Undo for the two above. Adding without removing means a mistyped line can
 * only be fixed in Payload, which is the screen this one replaces.
 */
export async function removeLine(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const index = Number.parseInt(str(form, 'index'), 10)
  if (!Number.isInteger(index) || index < 0) return { ok: false, error: 'Няма такъв ред.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }

  const lines = order.items ?? []
  const target = lines[index]
  if (!target) return { ok: false, error: 'Няма такъв ред.' }
  if (lines.length === 1) {
    return { ok: false, error: 'Поръчка без редове няма смисъл — откажете я вместо това.' }
  }

  /**
   * Refuse to delete a line that is not the one the person was looking at.
   *
   * A position is only meaningful against the table that produced it. If the
   * screen has not caught up with a change — and on this page it sometimes does
   * not, see the note in _components/form.tsx — then row 3 on screen is not row
   * 3 in the database, and deleting by position alone would quietly remove a
   * different blade from a real order. The button sends what it thinks it is
   * removing; if the two disagree, nothing is deleted and the person is told to
   * reload rather than being lied to.
   */
  const expected = str(form, 'expect')
  const actual = target.sku ?? target.name ?? ''
  if (expected && expected !== actual) {
    return {
      ok: false,
      error: 'Редовете са се променили. Презаредете страницата и опитайте отново.',
    }
  }

  const remaining = lines.filter((_, i) => i !== index)

  return commitLines(
    order,
    remaining,
    `Премахнат ред: ${target.name ?? target.sku ?? '—'} × ${target.quantity ?? 0}`,
    user,
  )
}
