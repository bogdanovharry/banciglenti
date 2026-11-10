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

/**
 * A buyer in Romania often types only the digits ("12345678"). Put the market's
 * country in front when there is no prefix; VIES calls Greece "EL", not "GR".
 */
export function withCountryPrefix(input: string, marketCountry: string): string {
  const clean = input.replace(/[\s.\-]/g, '')
  if (/^[A-Za-z]{2}/.test(clean)) return clean
  const code = marketCountry.toUpperCase() === 'GR' ? 'EL' : marketCountry.toUpperCase()
  return code + clean
}

type ViesBody = {
  valid?: unknown
  userError?: unknown
  requestIdentifier?: unknown
  errorWrappers?: { error?: unknown }[]
}

/** The error codes VIES puts in a 4xx/5xx body ({ errorWrappers: [{ error }] }) or in `userError`. */
const errorCodes = (data: ViesBody | null): string[] => {
  if (!data) return []
  const codes = (data.errorWrappers ?? []).map((e) => String(e?.error ?? ''))
  if (typeof data.userError === 'string') codes.push(data.userError)
  return codes.filter(Boolean)
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
  const base = { checkedAt: now().toISOString(), requestIdentifier: null, raw: null as unknown }

  // Not even shaped like a VAT number: no need to ask anyone.
  if (!parsed) return { ...base, result: 'invalid', countryCode: '', vatNumber: input.trim() }

  const ask = async (withRequester: boolean) => {
    const body: Record<string, string> = { ...parsed }
    if (withRequester && requester) {
      body.requesterMemberStateCode = requester.countryCode
      body.requesterNumber = requester.vatNumber
    }
    const res = await fetchImpl(VIES_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const text = await res.text()
    let data: ViesBody | null = null
    try {
      data = JSON.parse(text) as ViesBody
    } catch {
      /* not JSON — kept as text below */
    }
    return { httpStatus: res.status, ok: res.ok, data, text: text.slice(0, 2000) }
  }

  try {
    let answer = await ask(true)
    let retriedWithoutRequester = false

    // VIES refuses the whole request when the requester's own number is not
    // accepted. We still want the answer about the buyer's number, so ask again
    // without it. The identifier (proof of the check) is lost; the raw record
    // says why.
    if (requester && errorCodes(answer.data).includes('INVALID_REQUESTER_INFO')) {
      answer = await ask(false)
      retriedWithoutRequester = true
    }

    // Everything VIES said — or the HTTP status and body when it was not JSON —
    // is kept, so "no answer" can always be explained afterwards.
    const raw = { httpStatus: answer.httpStatus, ...(retriedWithoutRequester ? { retriedWithoutRequester } : {}), body: answer.data ?? answer.text }
    const codes = errorCodes(answer.data)
    const requestIdentifier =
      typeof answer.data?.requestIdentifier === 'string' && answer.data.requestIdentifier ? answer.data.requestIdentifier : null

    if (codes.includes('INVALID_INPUT')) return { ...base, ...parsed, result: 'invalid', raw }
    if (!answer.ok) return { ...base, ...parsed, result: 'unavailable', raw }

    // Member-state outages and timeouts come back as 200 with an error code.
    if (codes.some((c) => c !== 'VALID' && c !== 'INVALID')) return { ...base, ...parsed, result: 'unavailable', raw }

    if (answer.data?.valid === true) return { ...base, ...parsed, result: 'valid', requestIdentifier, raw }
    if (answer.data?.valid === false) return { ...base, ...parsed, result: 'invalid', requestIdentifier, raw }
    return { ...base, ...parsed, result: 'unavailable', raw }
  } catch (error) {
    return { ...base, ...parsed, result: 'unavailable', raw: { error: String(error).slice(0, 500) } }
  }
}
