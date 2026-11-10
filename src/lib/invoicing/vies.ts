import type { ViesStatus } from './calculate'

/**
 * VIES VAT-number check (EU REST service).
 *
 * Never throws and never guesses: anything that is not a clear "valid" or a
 * clear "invalid" comes back as 'unavailable', and the invoicing code holds the
 * invoice instead of zero-rating it.
 *
 * The result is shaped like a row of `vies_checks`, so the caller can store it
 * as it is. `requestIdentifier` is only returned by VIES when the requester's
 * own VAT number is sent; the supplier's number is passed in, not hard-coded.
 */

export const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/rest-service/check-vat-number'

export type ViesCheckResult = {
  result: Exclude<ViesStatus, 'not_checked'>
  countryCode: string
  /** Number without country prefix and spaces, as sent to VIES. */
  vatNumber: string
  checkedAt: string
  requestIdentifier: string | null
  /** What VIES answered, kept as evidence. Null if there was no answer. */
  raw: unknown
}

type Requester = { countryCode: string; vatNumber: string }

/** "RO 1234-5678" → { countryCode: 'RO', vatNumber: '12345678' }, or null. */
export function parseVatNumber(input: string): { countryCode: string; vatNumber: string } | null {
  const clean = input.replace(/[\s.\-]/g, '').toUpperCase()
  const m = /^([A-Z]{2})([A-Z0-9]{2,12})$/.exec(clean)
  // At least one digit: no VAT number is made of letters only.
  return m && /[0-9]/.test(m[2]) ? { countryCode: m[1], vatNumber: m[2] } : null
}

export async function checkVat(
  input: string,
  options: {
    requester?: Requester
    fetchImpl?: typeof fetch
    timeoutMs?: number
    now?: () => Date
  } = {},
): Promise<ViesCheckResult> {
  const { requester, fetchImpl = fetch, timeoutMs = 10000, now = () => new Date() } = options
  const parsed = parseVatNumber(input)
  const base = { checkedAt: now().toISOString(), requestIdentifier: null, raw: null }

  // Not even shaped like a VAT number: no need to ask anyone.
  if (!parsed) return { ...base, result: 'invalid', countryCode: '', vatNumber: input.trim() }

  const body: Record<string, string> = { ...parsed }
  if (requester) {
    body.requesterMemberStateCode = requester.countryCode
    body.requesterNumber = requester.vatNumber
  }

  try {
    const res = await fetchImpl(VIES_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return { ...base, ...parsed, result: 'unavailable' }
    const data = (await res.json()) as { valid?: unknown; userError?: unknown; requestIdentifier?: unknown }
    const requestIdentifier = typeof data.requestIdentifier === 'string' && data.requestIdentifier ? data.requestIdentifier : null

    // Member-state outages and timeouts come back as 200 with an error code.
    const err = typeof data.userError === 'string' ? data.userError : 'VALID'
    if (err === 'INVALID_INPUT') return { ...base, ...parsed, result: 'invalid', raw: data }
    if (err !== 'VALID' && err !== 'INVALID') return { ...base, ...parsed, result: 'unavailable', raw: data }

    if (data.valid === true) return { ...base, ...parsed, result: 'valid', requestIdentifier, raw: data }
    if (data.valid === false) return { ...base, ...parsed, result: 'invalid', requestIdentifier, raw: data }
    return { ...base, ...parsed, result: 'unavailable', raw: data }
  } catch {
    return { ...base, ...parsed, result: 'unavailable' }
  }
}
