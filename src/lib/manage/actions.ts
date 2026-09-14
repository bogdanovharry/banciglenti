'use server'

import { redirect } from 'next/navigation'

import {
  computeOrderTotals,
  customSku,
  parseCustomSpecs,
  priceCustomItem,
  round2,
  type CustomSpecs,
} from '@/lib/order-pricing'
import { MARKETS, carriageTerms, marketForOrder, vatRateFor, type MarketCode } from '@/lib/market'
import { withOrderNumber } from '@/lib/order-number'
import { money } from '@/lib/manage/format'
import { getClient, isAdmin, requireUser, type ManageUser } from '@/lib/manage/session'
import {
  PAYMENT_LABEL,
  PAYMENT_METHOD_LABEL,
  isOrderStatus,
  moneyLockReason,
  nextStatuses,
  statusPill,
} from '@/lib/manage/vocabulary'

/**
 * Everything that changes an order.
 *
 * Five rules hold across every action here, and they are the reason this file
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
 *     a history entry — and only when something actually changed. The history
 *     is append-only (enforced in the Orders collection too).
 *  4. A form carries the version of the order it was drawn from. If the order
 *     has changed since — someone else saved first — the save is refused rather
 *     than quietly overwriting their work with a stale screen.
 *  5. Once an order has shipped, closed or been paid, nothing that moves its
 *     total can change. See `moneyLockReason` in vocabulary.ts.
 *
 * A failure returns an ActionResult and the form shows it in place. A success
 * never returns — it ends in `done()`, which navigates. See the note there:
 * these screens cannot be updated in place, and the reason is architectural.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
const PAYMENT_METHODS = ['mypos', 'cod', 'bank_transfer']
const SHIPPING_METHODS = ['courier', 'pickup']

const SHIPPING_LABEL: Record<string, string> = { courier: 'Куриер', pickup: 'Лично вземане' }

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
 * during testing. `removeLine` refuses a row that does not match what the button
 * thought it was removing, and every action refuses a stale version, so that
 * failure mode is closed three times over.
 *
 * `saved` survives the navigation in the query string, since a redirect throws
 * away whatever the action would otherwise have returned. It is always called
 * outside a try block: `redirect()` works by throwing.
 */
function done(id: number, saved: string, extra = ''): never {
  redirect(`/manage/orders/${id}?saved=${encodeURIComponent(saved)}${extra}`)
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

type StoredLogRow = { id?: string | null; note?: string | null; at?: string | null; author?: unknown }

type StoredOrder = {
  id: number
  status?: string | null
  updatedAt?: string | null
  items?: StoredLine[] | null
  vatRate?: number | null
  currency?: string | null
  payment?: { method?: string | null; status?: string | null; transactionId?: string | null } | null
  shipping?: {
    method?: string | null
    cost?: number | null
    trackingNumber?: string | null
    office?: string | null
    address?: string | null
  } | null
  total?: number | null
  log?: StoredLogRow[] | null
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

/** The screen was drawn from an older copy of this order than the one stored. */
function isStale(form: FormData, order: { updatedAt?: string | null }): boolean {
  const version = str(form, 'version')
  return Boolean(version && order.updatedAt && version !== order.updatedAt)
}

const STALE: ActionResult = {
  ok: false,
  error: 'Поръчката е променена междувременно — презаредете страницата и опитайте отново.',
}

/**
 * The history with one entry added.
 *
 * Existing rows go back exactly as stored, id included. The id is how Payload
 * matches a row to its stored self; without it every old entry looked new and
 * was re-signed by whoever saved last — and the collection now refuses any
 * write that alters an existing entry, so an honest copy is also the only one
 * that saves. The new entry's author and time are stamped by the collection.
 */
function withEntry(existing: StoredOrder['log'], note: string, user: ManageUser) {
  const kept = (existing ?? []).map((e) => ({
    id: e.id ?? undefined,
    note: e.note ?? '',
    at: e.at ?? null,
    author:
      e.author && typeof e.author === 'object' && 'id' in e.author
        ? (e.author as { id: number }).id
        : ((e.author as number | null | undefined) ?? null),
  }))
  return [...kept, { note, at: new Date().toISOString(), author: user.id }]
}

/**
 * Recompute subtotal, carriage, VAT and total from the lines as they now stand.
 *
 * Existing lines keep the price they were sold at — that is what the customer
 * agreed to and what the card was charged. Only the arithmetic over them is
 * redone, at the order's own VAT rate rather than today's, and under its own
 * market's carriage — a Romanian order must never pick up Bulgaria's €6.
 */
function totalsFor(order: StoredOrder, lines: StoredLine[], shippingMethod = order.shipping?.method) {
  return computeOrderTotals({
    lines: lines.map((l) => ({ price: l.price ?? 0, quantity: l.quantity ?? 0 })),
    shippingMethod: shippingMethod === 'pickup' ? 'pickup' : 'courier',
    vatRate: typeof order.vatRate === 'number' ? order.vatRate : 0.2,
    ...carriageTerms(marketForOrder(order)),
  })
}

/**
 * The write, with its failure turned into something the form can show.
 *
 * Without this a database hiccup threw straight through the action and the
 * person got Next's error page and lost what they had typed. A refusal from the
 * append-only history means someone else wrote to the order in the same moment,
 * which is the same advice as a stale version: reload.
 */
async function write(run: () => Promise<unknown>): Promise<ActionResult | null> {
  try {
    await run()
    return null
  } catch (error) {
    return writeFailure(error)
  }
}

function writeFailure(error: unknown): ActionResult {
  const paths = ((error as { data?: { errors?: { path?: string }[] } }).data?.errors ?? []).map((e) => e.path)
  if (paths.includes('log')) return STALE
  console.error('[manage] order write failed:', error)
  return { ok: false, error: 'Записът не мина — опитайте отново. Ако се повтаря, презаредете страницата.' }
}

/** Browsers submit a textarea's line breaks as CRLF; stored text uses LF. */
const lf = (text: string): string => text.replace(/\r\n?/g, '\n')

// --- Status -----------------------------------------------------------------

export async function setStatus(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser()
  const id = orderId(form)
  if (!id) return { ok: false, error: 'Липсва поръчка.' }

  const next = str(form, 'status')
  if (!isOrderStatus(next)) return { ok: false, error: 'Непознат статус.' }

  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }
  if (isStale(form, order)) return STALE
  if (order.status === next) return { ok: true, message: 'Статусът вече е такъв.' }

  if (!nextStatuses(order.status, isAdmin(user)).includes(next)) {
    return {
      ok: false,
      error: `От „${statusPill(order.status)}“ не се преминава в „${statusPill(next)}“.`,
    }
  }

  // A refusal without a reason is the entry nobody can interpret later, so it
  // is the one status change that insists on a note.
  const reason = str(form, 'reason')
  if (next === 'cancelled' && !reason) {
    return { ok: false, error: 'Отказана поръчка иска причина.' }
  }

  const from = statusPill(order.status)
  const to = statusPill(next)
  const parts = [`Статус: ${from} → ${to}`]
  if (reason) parts.push(reason)
  // Money already taken on an order that will not be fulfilled has to go back,
  // and the history is where the next person looks for whether it did.
  if (next === 'cancelled' && order.payment?.status === 'paid') {
    parts.push('Плащането е получено — нужно е възстановяване.')
  }

  const payload = await getClient()
  const failed = await write(() =>
    payload.update({
      collection: 'orders',
      id,
      data: { status: next, log: withEntry(order.log, parts.join('. '), user) },
      user,
    }),
  )
  if (failed) return failed

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

  // No version check: a comment changes nothing anyone else is editing, so a
  // status saved a moment ago is no reason to refuse it. Two comments landing
  // at once are still safe — the history refuses the second write rather than
  // losing the first, and the person is asked to send it again.
  const order = await loadOrder(id)
  if (!order) return { ok: false, error: 'Поръчката не е намерена.' }

  const payload = await getClient()
  const failed = await write(() =>
    payload.update({
      collection: 'orders',
      id,
      data: { log: withEntry(order.log, note, user) },
      user,
    }),
  )
  if (failed) return failed

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
  if (isStale(form, order)) return STALE

  const before = {
    paymentStatus: order.payment?.status ?? 'pending',
    paymentMethod: order.payment?.method ?? null,
    shippingMethod: order.shipping?.method ?? 'courier',
    tracking: order.shipping?.trackingNumber ?? '',
    office: order.shipping?.office ?? '',
    address: lf(order.shipping?.address ?? ''),
  }

  // A select the screen disabled is not submitted; absent means "unchanged".
  const after = {
    paymentStatus: pick(str(form, 'paymentStatus'), PAYMENT_STATUSES) ?? before.paymentStatus,
    paymentMethod: pick(str(form, 'paymentMethod'), PAYMENT_METHODS) ?? before.paymentMethod,
    shippingMethod: pick(str(form, 'shippingMethod'), SHIPPING_METHODS) ?? before.shippingMethod,
    tracking: str(form, 'trackingNumber'),
    office: str(form, 'office'),
    address: lf(str(form, 'address')),
  }

  const methodChanged = after.shippingMethod !== before.shippingMethod
  if (methodChanged) {
    const locked = moneyLockReason({ status: order.status, paymentStatus: order.payment?.status })
    if (locked) return { ok: false, error: locked }
    if (after.shippingMethod === 'pickup' && !marketForOrder(order).pickup) {
      return { ok: false, error: 'Лично вземане не се предлага за този пазар.' }
    }
  }

  // Only a change of delivery method moves money. Re-pricing on every save
  // meant a waybill typed into an old order could quietly change its total if
  // the carriage rules had moved since.
  const totals = methodChanged ? totalsFor(order, order.items ?? [], after.shippingMethod) : null

  // One entry per save, naming what changed. The old version logged "marked as
  // paid" on every save of an already-paid order and said nothing at all when a
  // delivery change moved the total.
  const notes: string[] = []
  if (after.paymentStatus !== before.paymentStatus) {
    notes.push(`Плащане: ${PAYMENT_LABEL[before.paymentStatus] ?? before.paymentStatus} → ${PAYMENT_LABEL[after.paymentStatus] ?? after.paymentStatus}`)
  }
  if (after.paymentMethod !== before.paymentMethod) {
    notes.push(
      `Метод на плащане: ${PAYMENT_METHOD_LABEL[before.paymentMethod ?? ''] ?? '—'} → ${PAYMENT_METHOD_LABEL[after.paymentMethod ?? ''] ?? '—'}`,
    )
  }
  if (methodChanged && totals) {
    notes.push(
      `Доставка: ${SHIPPING_LABEL[before.shippingMethod] ?? before.shippingMethod} → ${SHIPPING_LABEL[after.shippingMethod] ?? after.shippingMethod}, сума ${money(order.total ?? 0)} → ${money(totals.total)}`,
    )
  }
  if (after.tracking !== before.tracking) {
    notes.push(
      !before.tracking
        ? `Товарителница ${after.tracking}`
        : after.tracking
          ? `Товарителница: ${before.tracking} → ${after.tracking}`
          : `Товарителницата ${before.tracking} е изтрита`,
    )
  }
  if (after.office !== before.office) {
    notes.push(after.office ? `Офис на куриера: ${after.office}` : 'Офисът на куриера е изтрит')
  }
  if (after.address !== before.address) notes.push('Адресът за доставка е променен')

  if (notes.length === 0) return { ok: true, message: 'Няма промени.' }

  const payload = await getClient()
  const failed = await write(() =>
    payload.update({
      collection: 'orders',
      id,
      data: {
        // Whole groups, carrying forward what this form does not show, so a
        // partial group can never blank a field such as the transaction id.
        payment: {
          method: after.paymentMethod,
          status: after.paymentStatus,
          transactionId: order.payment?.transactionId ?? null,
        },
        shipping: {
          method: after.shippingMethod,
          cost: totals ? totals.shippingCost : (order.shipping?.cost ?? 0),
          trackingNumber: after.tracking || null,
          office: after.office || null,
          address: after.address || null,
        },
        ...(totals ? { subtotal: totals.subtotal, tax: totals.tax, total: totals.total } : {}),
        log: withEntry(order.log, notes.join(' · '), user),
      },
      user,
    }),
  )
  if (failed) return failed

  done(id, 'Записано.')
}

// --- Lines ------------------------------------------------------------------

/** Shared gate for the three line actions: the order exists, is current and is open. */
async function openOrder(form: FormData): Promise<{ order: StoredOrder } | { error: ActionResult }> {
  const id = orderId(form)
  if (!id) return { error: { ok: false, error: 'Липсва поръчка.' } }

  const order = await loadOrder(id)
  if (!order) return { error: { ok: false, error: 'Поръчката не е намерена.' } }
  if (isStale(form, order)) return { error: STALE }

  const locked = moneyLockReason({ status: order.status, paymentStatus: order.payment?.status })
  if (locked) return { error: { ok: false, error: locked } }

  return { order }
}

/** Writes the new line set and the totals that follow from it. */
async function commitLines(
  order: StoredOrder,
  lines: StoredLine[],
  note: string,
  user: ManageUser,
): Promise<ActionResult> {
  const totals = totalsFor(order, lines)
  const payload = await getClient()

  const failed = await write(() =>
    payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        items: lines,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        shipping: { ...order.shipping, cost: totals.shippingCost },
        log: withEntry(order.log, `${note} · сума ${money(order.total ?? 0)} → ${money(totals.total)}`, user),
      },
      user,
    }),
  )
  if (failed) return failed

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

  const sku = str(form, 'sku')
  if (!sku) return { ok: false, error: 'Изберете артикул.' }

  const quantity = quantityFrom(form)
  if (!quantity) return { ok: false, error: 'Количеството е между 1 и 999.' }

  const gate = await openOrder(form)
  if ('error' in gate) return gate.error
  const { order } = gate

  const payload = await getClient()
  const found = await payload.find({
    collection: 'products',
    limit: 1,
    depth: 0,
    where: { slug: { equals: sku } },
  })
  const product = found.docs[0] as unknown as
    | { id: number; name: string; basePrice?: number | null; status?: string | null }
    | undefined

  if (!product) return { ok: false, error: `Няма артикул „${sku}“.` }
  if (product.status === 'inactive') return { ok: false, error: `„${product.name}“ вече не се предлага.` }

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

  const quantity = quantityFrom(form)
  if (!quantity) return { ok: false, error: 'Количеството е между 1 и 999.' }

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

  const gate = await openOrder(form)
  if ('error' in gate) return gate.error
  const { order } = gate

  const name = `Лента по размер ${specs.length}×${specs.width}×${specs.thickness} мм · ${specs.brand}`
  const line: StoredLine = {
    name,
    sku: customSku(specs),
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

  const index = Number.parseInt(str(form, 'index'), 10)
  if (!Number.isInteger(index) || index < 0) return { ok: false, error: 'Няма такъв ред.' }

  const gate = await openOrder(form)
  if ('error' in gate) return gate.error
  const { order } = gate

  const lines = order.items ?? []
  const target = lines[index]
  if (!target) return { ok: false, error: 'Няма такъв ред.' }
  if (lines.length === 1) {
    return { ok: false, error: 'Поръчка без редове няма смисъл — откажете я вместо това.' }
  }

  /**
   * Refuse to delete a line that is not the one the person was looking at.
   *
   * A position is only meaningful against the table that produced it. The
   * version check above already refuses a stale screen; this is the second
   * lock, kept because deleting the wrong blade from a real order is the one
   * mistake this page has actually made.
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

// --- New order (phone and walk-in) ------------------------------------------

/**
 * An order taken by a person rather than the checkout.
 *
 * Most orders in this trade arrive by phone, and until now the only way to
 * record one was to type it into the storefront as if you were the customer.
 * This creates the order shell — customer, market, delivery, payment — and
 * lands on the order screen, where lines are added with the same priced
 * controls as any other amendment. The market is chosen, not inferred from a
 * domain, because the call did not come through one.
 */
export async function createOrder(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser('/manage/orders/new')

  const customerId = Number.parseInt(str(form, 'customerId'), 10)
  if (!Number.isInteger(customerId) || customerId <= 0) return { ok: false, error: 'Изберете клиент.' }

  const marketCode = str(form, 'market')
  if (!(marketCode in MARKETS)) return { ok: false, error: 'Изберете пазар.' }
  const market = MARKETS[marketCode as MarketCode]

  const shippingMethod = pick(str(form, 'shippingMethod'), SHIPPING_METHODS)
  if (!shippingMethod) return { ok: false, error: 'Изберете начин на доставка.' }
  if (shippingMethod === 'pickup' && !market.pickup) {
    return { ok: false, error: 'Лично вземане не се предлага за този пазар.' }
  }

  const paymentMethod = str(form, 'paymentMethod')
  if (!(market.paymentMethods as string[]).includes(paymentMethod)) {
    return { ok: false, error: 'Този начин на плащане не се предлага за избрания пазар.' }
  }

  const address = str(form, 'address')
  if (shippingMethod === 'courier' && !address) return { ok: false, error: 'Въведете адрес за доставка.' }

  const payload = await getClient()
  try {
    await payload.findByID({ collection: 'customers', id: customerId, depth: 0 })
  } catch {
    return { ok: false, error: 'Клиентът не е намерен.' }
  }

  const vatRate = vatRateFor(market)
  const totals = computeOrderTotals({
    lines: [],
    shippingMethod: shippingMethod === 'pickup' ? 'pickup' : 'courier',
    vatRate,
    ...carriageTerms(market),
  })

  const internalNote = str(form, 'note')
  const firstEntry = [`Създадена ръчно · ${market.country}`, internalNote].filter(Boolean).join('. ')

  let createdId: number
  try {
    const created = (await withOrderNumber((orderNumber) =>
      payload.create({
        collection: 'orders',
        data: {
          orderNumber,
          customer: customerId,
          items: [],
          status: 'pending',
          payment: { method: paymentMethod as 'cod' | 'bank_transfer', status: 'pending' },
          shipping: {
            method: shippingMethod as 'courier' | 'pickup',
            address: shippingMethod === 'pickup' ? 'Лично вземане · Габрово' : address,
            office: str(form, 'office') || null,
            cost: totals.shippingCost,
          },
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          vatRate,
          currency: market.displayCurrency,
          exchangeRate: market.exchangeRate,
          log: [{ note: firstEntry, at: new Date().toISOString(), author: user.id }],
        },
        user,
      }),
    )) as unknown as { id: number }
    createdId = created.id
  } catch (error) {
    return writeFailure(error)
  }

  // A machine picked on the customer screen travels on to the add-a-line form,
  // so the blade it takes is already filled in.
  const prefill = new URLSearchParams()
  for (const key of ['length', 'width', 'thickness'] as const) {
    const value = Number(str(form, `prefill-${key}`))
    if (Number.isFinite(value) && value > 0) prefill.set(key, String(value))
  }
  const extra = prefill.size ? `&${prefill.toString()}` : ''

  done(createdId, 'Поръчката е създадена — добавете редовете.', extra)
}
