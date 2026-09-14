'use server'

import { redirect } from 'next/navigation'

import { getClient, requireUser } from '@/lib/manage/session'
import type { ActionResult } from '@/lib/manage/actions'

/**
 * Everything that changes a customer.
 *
 * Same rules as the order actions in actions.ts — `requireUser()` first,
 * because a Server Action is a public endpoint; validation server-side; a form
 * drawn from an older copy of the customer is refused rather than allowed to
 * overwrite a newer save; a failed write is reported to the form rather than
 * thrown; and a navigation on success rather than an in-place update, for the
 * architectural reason documented on `done()` there.
 *
 * Nothing here touches an order. A customer's spend is derived from their
 * orders and is never stored on the customer, so there is no figure on this
 * screen that editing a contact detail could put out of step.
 */

function str(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function customerId(form: FormData): number | null {
  const id = Number.parseInt(str(form, 'customerId'), 10)
  return Number.isInteger(id) && id > 0 ? id : null
}

/** A number field that is allowed to be blank, but not to be nonsense. */
function optionalNumber(form: FormData, key: string): number | null | 'invalid' {
  const raw = str(form, key)
  if (!raw) return null
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) && n > 0 && n < 100000 ? n : 'invalid'
}

function done(id: number, saved: string): never {
  redirect(`/manage/customers/${id}?saved=${encodeURIComponent(saved)}`)
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STALE: ActionResult = {
  ok: false,
  error: 'Клиентът е променен междувременно — презаредете страницата и опитайте отново.',
}

const FAILED: ActionResult = {
  ok: false,
  error: 'Записът не мина — опитайте отново. Ако се повтаря, презаредете страницата.',
}

type StoredCustomer = {
  id: number
  updatedAt?: string | null
  machines?: Record<string, unknown>[] | null
}

async function loadCustomer(id: number): Promise<StoredCustomer | null> {
  const payload = await getClient()
  try {
    return (await payload.findByID({
      collection: 'customers',
      id,
      depth: 0,
    })) as unknown as StoredCustomer
  } catch {
    return null
  }
}

function isStale(form: FormData, customer: StoredCustomer): boolean {
  const version = str(form, 'version')
  return Boolean(version && customer.updatedAt && version !== customer.updatedAt)
}

/**
 * The order route reuses a customer record by email, so two customers sharing
 * one would silently merge future orders into whichever it found first.
 */
async function emailTaken(email: string, exceptId?: number): Promise<boolean> {
  const payload = await getClient()
  const clash = await payload.find({
    collection: 'customers',
    where: exceptId
      ? { and: [{ email: { equals: email } }, { id: { not_equals: exceptId } }] }
      : { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  return clash.docs.length > 0
}

// --- New customer -----------------------------------------------------------

/**
 * A customer who has not ordered online — the phone caller, the walk-in, the
 * sawmill that has bought by invoice for years. Until now a customer record
 * only came into being through the checkout.
 *
 * `next=order` sends the person straight on to a new order for them, which is
 * the usual reason for creating one mid-call.
 */
export async function createCustomer(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser('/manage/customers/new')

  const name = str(form, 'name')
  const email = str(form, 'email').toLowerCase()
  if (!name) return { ok: false, error: 'Името е задължително.' }
  if (!EMAIL.test(email)) return { ok: false, error: 'Невалиден имейл.' }
  if (await emailTaken(email)) {
    return { ok: false, error: 'Вече има клиент с този имейл — потърсете го в списъка.' }
  }

  const payload = await getClient()
  let id: number
  try {
    const created = (await payload.create({
      collection: 'customers',
      data: {
        name,
        email,
        phone: str(form, 'phone') || null,
        company: str(form, 'company') || null,
        taxId: str(form, 'taxId') || null,
        vatNumber: str(form, 'vatNumber') || null,
      },
      user,
    })) as unknown as { id: number }
    id = created.id
  } catch (error) {
    console.error('[manage] customer create failed:', error)
    return FAILED
  }

  if (str(form, 'next') === 'order') {
    redirect(`/manage/orders/new?customer=${id}`)
  }
  done(id, 'Клиентът е създаден.')
}

// --- Contact and tax details ------------------------------------------------

export async function saveCustomer(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const id = customerId(form)
  if (!id) return { ok: false, error: 'Липсва клиент.' }

  const name = str(form, 'name')
  const email = str(form, 'email').toLowerCase()

  if (!name) return { ok: false, error: 'Името е задължително.' }
  if (!EMAIL.test(email)) return { ok: false, error: 'Невалиден имейл.' }

  const customer = await loadCustomer(id)
  if (!customer) return { ok: false, error: 'Клиентът не е намерен.' }
  if (isStale(form, customer)) return STALE

  if (await emailTaken(email, id)) {
    return { ok: false, error: 'Друг клиент вече използва този имейл.' }
  }

  const payload = await getClient()
  try {
    await payload.update({
      collection: 'customers',
      id,
      data: {
        name,
        email,
        phone: str(form, 'phone') || null,
        company: str(form, 'company') || null,
        taxId: str(form, 'taxId') || null,
        vatNumber: str(form, 'vatNumber') || null,
      },
      user,
    })
  } catch (error) {
    console.error('[manage] customer save failed:', error)
    return FAILED
  }

  done(id, 'Данните са записани.')
}

// --- Machines ---------------------------------------------------------------

export async function addMachine(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const id = customerId(form)
  if (!id) return { ok: false, error: 'Липсва клиент.' }

  const brand = str(form, 'brand')
  const model = str(form, 'model')
  if (!brand || !model) return { ok: false, error: 'Марка и модел са задължителни.' }

  const bladeLength = optionalNumber(form, 'bladeLength')
  const bladeWidth = optionalNumber(form, 'bladeWidth')
  const bladeThickness = optionalNumber(form, 'bladeThickness')
  if (bladeLength === 'invalid' || bladeWidth === 'invalid' || bladeThickness === 'invalid') {
    return { ok: false, error: 'Размерите трябва да са числа в милиметри.' }
  }

  const customer = await loadCustomer(id)
  if (!customer) return { ok: false, error: 'Клиентът не е намерен.' }
  if (isStale(form, customer)) return STALE

  const existing = customer.machines ?? []
  // The same machine twice is a data-entry slip, not a customer with two of
  // them — and if it genuinely is two, the blade size is identical anyway.
  const duplicate = existing.some(
    (m) =>
      String(m.brand ?? '').toLowerCase() === brand.toLowerCase() &&
      String(m.model ?? '').toLowerCase() === model.toLowerCase(),
  )
  if (duplicate) return { ok: false, error: `${brand} ${model} вече е записана.` }

  const payload = await getClient()
  try {
    await payload.update({
      collection: 'customers',
      id,
      data: {
        machines: [
          ...existing,
          {
            brand,
            model,
            bladeLength,
            bladeWidth,
            bladeThickness,
            source: str(form, 'source') || null,
            notes: str(form, 'notes') || null,
          },
        ],
      },
      user,
    })
  } catch (error) {
    console.error('[manage] add machine failed:', error)
    return FAILED
  }

  done(id, `${brand} ${model} е добавена.`)
}

export async function removeMachine(
  _prev: ActionResult | null,
  form: FormData,
): Promise<ActionResult> {
  const user = await requireUser()
  const id = customerId(form)
  if (!id) return { ok: false, error: 'Липсва клиент.' }

  const index = Number.parseInt(str(form, 'index'), 10)
  if (!Number.isInteger(index) || index < 0) return { ok: false, error: 'Няма такава машина.' }

  const customer = await loadCustomer(id)
  if (!customer) return { ok: false, error: 'Клиентът не е намерен.' }
  if (isStale(form, customer)) return STALE

  const machines = customer.machines ?? []
  const target = machines[index]
  if (!target) return { ok: false, error: 'Няма такава машина.' }

  // Same guard as removing an order line: a position only means anything
  // against the list that produced it.
  const expected = str(form, 'expect')
  const actual = `${target.brand ?? ''} ${target.model ?? ''}`.trim()
  if (expected && expected !== actual) {
    return { ok: false, error: 'Списъкът се е променил. Презаредете страницата.' }
  }

  const payload = await getClient()
  try {
    await payload.update({
      collection: 'customers',
      id,
      data: { machines: machines.filter((_, i) => i !== index) },
      user,
    })
  } catch (error) {
    console.error('[manage] remove machine failed:', error)
    return FAILED
  }

  done(id, `${actual} е премахната.`)
}
