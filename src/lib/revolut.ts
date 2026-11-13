/**
 * Revolut Business — Merchant API, server side only.
 *
 * Three variables switch it on:
 *   REVOLUT_MERCHANT_SECRET  the Merchant API secret key (never sent to a browser)
 *   REVOLUT_WEBHOOK_SECRET   the signing secret of the webhook (see /api/payments/revolut)
 *   REVOLUT_ENV              "sandbox" for the test environment; anything else is live
 * Without the secret key the card option does not exist: the checkout does not
 * offer it and the routes refuse it.
 *
 * Hosted checkout: we create an order on Revolut's server, send the buyer to the
 * `checkout_url` it returns, and Revolut sends them back. Card details never
 * touch this site.
 */
const API_VERSION = process.env.REVOLUT_API_VERSION || '2024-09-01'

export const cardPaymentsEnabled = (): boolean => Boolean(process.env.REVOLUT_MERCHANT_SECRET)

/** REVOLUT_API_BASE points the calls somewhere else — a stand-in server in tests. Never set it in production. */
const baseUrl = () =>
  process.env.REVOLUT_API_BASE ||
  (process.env.REVOLUT_ENV === 'sandbox' ? 'https://sandbox-merchant.revolut.com' : 'https://merchant.revolut.com')

export type RevolutOrder = {
  id: string
  state: string
  amount: number
  currency: string
  outstanding_amount?: number
  checkout_url?: string
  merchant_order_data?: { reference?: string | null } | null
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = process.env.REVOLUT_MERCHANT_SECRET
  if (!secret) throw new Error('Revolut is not configured')
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      'Revolut-Api-Version': API_VERSION,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    // A slow provider must not hold the checkout open.
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Revolut ${response.status} on ${path}: ${detail.slice(0, 300)}`)
  }
  return (await response.json()) as T
}

export function createRevolutOrder(input: {
  amountMinor: number
  currency: string
  reference: string
  email: string
  description: string
  redirectUrl: string
  /** ISO 8601 duration after which an unpaid order is given up on. */
  expireAfter?: string
}): Promise<RevolutOrder> {
  return call<RevolutOrder>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      description: input.description,
      customer: { email: input.email },
      redirect_url: input.redirectUrl,
      merchant_order_data: { reference: input.reference },
      expire_pending_after: input.expireAfter ?? 'PT2H',
    }),
  })
}

export const getRevolutOrder = (id: string): Promise<RevolutOrder> =>
  call<RevolutOrder>(`/api/orders/${encodeURIComponent(id)}`)
