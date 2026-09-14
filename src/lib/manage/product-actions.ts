'use server'

import { redirect } from 'next/navigation'

import type { ActionResult } from '@/lib/manage/actions'
import { isProductStatus, PRODUCT_LIST_PARAMS } from '@/lib/manage/products'
import { getClient, isAdmin, requireUser } from '@/lib/manage/session'
import { PAGE_SIZE } from '@/lib/manage/vocabulary'

/**
 * The stock-take save: one page of products, one submit.
 *
 * The same rules as actions.ts — `requireUser()` first, because a Server Action
 * is a public endpoint; everything validated here, never trusted from the form;
 * a navigation on success, for the reason documented on `done()` there — plus
 * three that only a bulk save needs:
 *
 *  1. All or nothing at validation. One mistyped figure refuses the whole save
 *     and names the product, rather than writing the other forty-nine and
 *     leaving someone to work out which one did not take.
 *  2. The price is the owner's. An editor's save that would change a price is
 *     refused outright, the same rule Products.ts applies to Payload's form.
 *     The Local API skips that field rule, so it is enforced here.
 *  3. A row is written only if nobody else has changed it since the screen was
 *     drawn. A stock-take takes a while; a sale or a colleague in Payload can
 *     land in the middle of it, and the later save must not quietly put back
 *     the figure they just replaced.
 *
 * Field names per row: `stock:<id>`, `status:<id>`, `price:<id>` (administrators
 * only), and hidden `version:<id>` plus `was-stock:<id>`, `was-status:<id>`,
 * `was-price:<id>` — what the screen showed. The originals only pick out the
 * rows that were touched, so a product edited elsewhere does not block a save
 * that never went near it. What is written is always decided against the
 * database, never against those hidden fields.
 */

const STOCK_MAX = 100000
const PRICE_MAX = 100000

function str(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

/** A whole number of pieces. "20.0" is 20 — a number input can send either. */
function parseStock(raw: string): number | null {
  const t = raw.replace(/\.0+$/, '')
  if (!/^\d{1,6}$/.test(t)) return null
  const n = Number(t)
  return n <= STOCK_MAX ? n : null
}

/**
 * EUR to the cent. Accepts a decimal comma, because that is how a Bulgarian
 * keyboard types a price, and ignores trailing zeros, so "12.500" is 12.50
 * rather than a refusal for having three decimals.
 */
function parsePrice(raw: string): number | null {
  const t = raw.replace(',', '.').replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  if (!/^(\d{1,6}|\d{0,6}\.\d{1,2})$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) && n <= PRICE_MAX ? n : null
}

/** Did the figure change? Compared as numbers, so "020" against "20" is not an edit. */
function figureChanged(raw: string, was: string, parse: (s: string) => number | null): boolean {
  if (raw === was) return false
  const a = parse(raw)
  const b = parse(was)
  return a === null || b === null || a !== b
}

/** "A, B, C и още 4" — enough to find them on the page without a wall of names. */
function names(list: string[]): string {
  const shown = list.slice(0, 5).map((n) => `„${n}“`)
  return list.length > 5 ? `${shown.join(', ')} и още ${list.length - 5}` : shown.join(', ')
}

const savedMessage = (n: number) => (n === 1 ? 'Записан 1 продукт.' : `Записани ${n} продукта.`)

/**
 * Back to the list the person was on, with what happened.
 *
 * The filters come from the form, so only the list's own keys survive — the
 * page validates each of them again when it reads them. Never called inside a
 * try: `redirect()` works by throwing.
 */
function done(returnTo: string, saved: string, unsaved?: string): never {
  const from = new URLSearchParams(returnTo)
  const sp = new URLSearchParams()
  for (const key of PRODUCT_LIST_PARAMS) {
    const value = from.get(key)
    if (value) sp.set(key, value.slice(0, 200))
  }
  sp.set('saved', saved)
  if (unsaved) sp.set('unsaved', unsaved)
  redirect(`/manage/products?${sp.toString()}`)
}

type StoredProduct = {
  id: number
  name?: string | null
  basePrice?: number | null
  stock?: number | null
  status?: string | null
  updatedAt?: string | null
}

type Edit = {
  id: number
  version: string
  stock: string
  status: string
  /** Absent when the form had no price field — every editor's form. */
  price: string | null
}

export async function saveProducts(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser('/manage/products')
  const admin = isAdmin(user)
  const returnTo = str(form, 'returnTo')

  // --- Which rows were touched ---------------------------------------------

  const ids = new Set<number>()
  for (const key of form.keys()) {
    const match = /^version:(\d{1,9})$/.exec(key)
    if (match) ids.add(Number(match[1]))
  }
  // One page is what the screen renders. More than that is not this form.
  if (ids.size > PAGE_SIZE) return { ok: false, error: 'Твърде много редове наведнъж.' }

  const edits: Edit[] = []
  for (const id of ids) {
    const edit: Edit = {
      id,
      version: str(form, `version:${id}`),
      stock: str(form, `stock:${id}`),
      status: str(form, `status:${id}`),
      price: form.has(`price:${id}`) ? str(form, `price:${id}`) : null,
    }

    const touched =
      figureChanged(edit.stock, str(form, `was-stock:${id}`), parseStock) ||
      edit.status !== str(form, `was-status:${id}`) ||
      (edit.price !== null && figureChanged(edit.price, str(form, `was-price:${id}`), parsePrice))

    if (touched) edits.push(edit)
  }

  if (edits.length === 0) return { ok: true, message: 'Няма промени за запис.' }

  // --- Validate everything before writing anything --------------------------

  const payload = await getClient()
  const found = await payload.find({
    collection: 'products',
    where: { id: { in: edits.map((e) => e.id) } },
    depth: 0,
    pagination: false,
    select: { name: true, basePrice: true, stock: true, status: true, updatedAt: true },
  })
  const stored = new Map(
    (found.docs as unknown as StoredProduct[]).map((doc) => [doc.id, doc]),
  )

  // Grouped by what is wrong, so the message reads as a few sentences rather
  // than one line per product.
  const problems = new Map<string, string[]>()
  const flag = (message: string, name: string) =>
    problems.set(message, [...(problems.get(message) ?? []), name])

  const conflicts: string[] = []
  const writes: { id: number; name: string; data: Record<string, unknown> }[] = []

  for (const edit of edits) {
    const current = stored.get(edit.id)
    if (!current) {
      flag('Вече не съществуват', `#${edit.id}`)
      continue
    }
    const name = current.name?.trim() || `#${edit.id}`

    // Checked first: if the row moved under the form, whatever else was typed
    // into it was typed against figures that are no longer true.
    if (!edit.version || edit.version !== current.updatedAt) {
      conflicts.push(name)
      continue
    }

    const data: Record<string, unknown> = {}

    // A blank left blank on a row that never had the figure is not an edit —
    // otherwise a product with no stock recorded could not have its status
    // changed without someone first inventing a count for it.
    const stock = parseStock(edit.stock)
    if (edit.stock === '' && current.stock == null) {
      // unchanged
    } else if (stock === null) {
      flag(`Наличността е цяло число от 0 до ${STOCK_MAX.toLocaleString('bg-BG')}`, name)
    } else if (stock !== current.stock) {
      data.stock = stock
    }

    if (edit.status === '' && current.status == null) {
      // unchanged
    } else if (!isProductStatus(edit.status)) {
      flag('Непознат статус', name)
    } else if (edit.status !== current.status) {
      data.status = edit.status
    }

    if (edit.price !== null && !(edit.price === '' && current.basePrice == null)) {
      const price = parsePrice(edit.price)
      if (price === null) {
        flag(`Цената е число от 0 до ${PRICE_MAX.toLocaleString('bg-BG')} с най-много два знака след десетичната запетая`, name)
      } else if (price !== current.basePrice) {
        if (admin) data.basePrice = price
        else flag('Цените се променят само от администратор', name)
      }
    }

    if (Object.keys(data).length > 0) writes.push({ id: edit.id, name, data })
  }

  if (conflicts.length > 0) {
    return {
      ok: false,
      error:
        `Междувременно ${conflicts.length === 1 ? 'е променен' : 'са променени'} ${names(conflicts)}. ` +
        'Нищо не е записано — презаредете страницата и въведете промените отново.',
    }
  }

  if (problems.size > 0) {
    const sentences = [...problems].map(([message, list]) => `${message}: ${names(list)}.`)
    return { ok: false, error: `${sentences.join(' ')} Нищо не е записано.` }
  }

  // Touched, but back to what is stored — a figure typed and then retyped.
  if (writes.length === 0) return { ok: true, message: 'Няма промени за запис.' }

  // --- Write ----------------------------------------------------------------

  // One at a time, each on its own. Payload has no multi-row update that takes
  // different values per row, and a failure on one product must not be allowed
  // to hide whether the others went through.
  const saved: string[] = []
  const failed: string[] = []
  for (const write of writes) {
    try {
      await payload.update({
        collection: 'products',
        id: write.id,
        data: write.data,
        depth: 0,
        user,
      })
      saved.push(write.name)
    } catch {
      failed.push(write.name)
    }
  }

  // Nothing changed in the database, so the screen is still true: stay on it
  // with every figure still typed in, and let the person try again.
  if (saved.length === 0) {
    return {
      ok: false,
      error: `Записът не успя за ${names(failed)}. Нищо не е записано — опитайте отново.`,
    }
  }

  // Some rows did change, so this screen is now out of date — a second click
  // would trip the version check on the rows that did save. Go to the list
  // afresh and name what still needs entering.
  if (failed.length > 0) {
    done(returnTo, savedMessage(saved.length), `Не са записани: ${names(failed)}. Въведете ги отново.`)
  }

  done(returnTo, savedMessage(saved.length))
}
