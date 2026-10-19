/**
 * Sending email, through Resend's HTTP API.
 *
 * A plain `fetch` rather than an SDK: there is one endpoint and one payload,
 * and nothing here needs a dependency. The functions never throw — an order
 * that has been taken must not fail, or be reported to the buyer as failed,
 * because a notification could not be sent — and they say what happened in
 * their return value so the caller can leave a trace for staff.
 *
 * Until RESEND_API_KEY is set every call is skipped and logged, which is the
 * state of local development and of a deployment that has not been wired up
 * yet. Production sending needs three variables (see .env.example):
 *   RESEND_API_KEY      the API key
 *   EMAIL_FROM          "Saw-Meister <comenzi@your-domain>" — an address on a
 *                       domain verified with the provider, or it is rejected
 *   STAFF_NOTIFY_EMAIL  who is told about new orders and enquiries
 */
export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; skipped: true }
  | { ok: false; skipped?: false; error: string }

export type Message = {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Makes a retry of the same message safe: the provider drops the duplicate. */
  idempotencyKey?: string
}

let warned = false

export const emailConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

/** Who is told about new orders and enquiries; a comma-separated list. */
export function staffRecipients(): string[] {
  return (process.env.STAFF_NOTIFY_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export async function sendEmail(message: Message): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  const to = (Array.isArray(message.to) ? message.to : [message.to]).filter(Boolean)

  if (!key || !from) {
    if (!warned) {
      warned = true
      console.warn('[email] RESEND_API_KEY / EMAIL_FROM are not set — emails are not being sent.')
    }
    return { ok: false, skipped: true }
  }
  if (to.length === 0) return { ok: false, skipped: true }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(message.idempotencyKey ? { 'Idempotency-Key': message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      // A hung provider must not hold the request open until the platform kills it.
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300)
      console.error('[email] provider refused the message:', response.status, detail)
      return { ok: false, error: `HTTP ${response.status}` }
    }
    const json = (await response.json().catch(() => ({}))) as { id?: string }
    return { ok: true, id: json.id ?? null }
  } catch (error) {
    console.error('[email] sending failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'unknown error' }
  }
}

/** For text that goes into HTML: names, addresses and notes are typed by strangers. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
