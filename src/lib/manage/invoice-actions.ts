'use server'

import { redirect } from 'next/navigation'

import { InvoiceError, issueInvoiceFor } from '@/lib/manage/invoices'
import { requireUser } from '@/lib/manage/session'

/**
 * Issue the invoice for an order. A plain form post, no client code: the result
 * is a redirect back to the invoice page, with the reason in the address when it
 * was refused. `requireUser()` first, like every action here — a Server Action is
 * a public endpoint.
 */
export async function issueInvoice(form: FormData): Promise<void> {
  const id = Number.parseInt(String(form.get('orderId') ?? ''), 10)
  if (!Number.isInteger(id) || id <= 0) redirect('/manage/orders')
  await requireUser(`/manage/orders/${id}/invoice`)

  let outcome: { error: string } | { number: string }
  try {
    outcome = await issueInvoiceFor(id)
  } catch (error) {
    if (!(error instanceof InvoiceError)) throw error
    outcome = { error: error.message }
  }

  if ('error' in outcome) redirect(`/manage/orders/${id}/invoice?error=${encodeURIComponent(outcome.error)}`)
  redirect(`/manage/orders/${id}/invoice?issued=${outcome.number}`)
}
