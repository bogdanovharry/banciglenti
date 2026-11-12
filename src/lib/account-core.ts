/**
 * The parts of the account module that touch nothing outside themselves, so they
 * can be tested without a database or a request.
 */
export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 128

export type Address = { label: string; street: string; city: string; postalCode: string; isDefault: boolean }
export type Machine = { brand: string; model: string; bladeLength: number | null; bladeWidth: number | null; bladeThickness: number | null }

export type AccountProfile = {
  id: number
  email: string
  name: string
  phone: string
  company: string
  taxId: string
  vatNumber: string
  addresses: Address[]
  machines: Machine[]
}

export type RawAccount = {
  id: number
  email: string
  name?: string | null
  phone?: string | null
  company?: string | null
  taxId?: string | null
  vatNumber?: string | null
  addresses?: { label?: string | null; street?: string | null; city?: string | null; postalCode?: string | null; isDefault?: boolean | null }[] | null
  machines?: { brand?: string | null; model?: string | null; bladeLength?: number | null; bladeWidth?: number | null; bladeThickness?: number | null }[] | null
}

/** Only what the shopper may see — never the hash, salt, reset token or lock state. */
export function toProfile(a: RawAccount): AccountProfile {
  return {
    id: a.id,
    email: a.email,
    name: a.name ?? '',
    phone: a.phone ?? '',
    company: a.company ?? '',
    taxId: a.taxId ?? '',
    vatNumber: a.vatNumber ?? '',
    addresses: (a.addresses ?? []).map((x) => ({
      label: x.label ?? '',
      street: x.street ?? '',
      city: x.city ?? '',
      postalCode: x.postalCode ?? '',
      isDefault: Boolean(x.isDefault),
    })),
    machines: (a.machines ?? []).map((m) => ({
      brand: m.brand ?? '',
      model: m.model ?? '',
      bladeLength: m.bladeLength ?? null,
      bladeWidth: m.bladeWidth ?? null,
      bladeThickness: m.bladeThickness ?? null,
    })),
  }
}

/**
 * A browser that sends an Origin header must be sending it from this site.
 *
 * The cookie is SameSite=Lax and the routes only take JSON, which a cross-site
 * form cannot send; this is the second lock. Requests with no Origin (a script,
 * the same-site navigation of an old browser) are left to the first.
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export const normaliseEmail = (v: unknown): string => (typeof v === 'string' ? v.trim().toLowerCase().slice(0, 160) : '')

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)

export const clean = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')

