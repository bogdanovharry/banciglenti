import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { LOGIN_PATH } from '@/lib/manage/routes'

/**
 * Who is looking at the management screens.
 *
 * There is no second auth system: `payload.auth` reads the same session cookie
 * Payload's own admin issues, so a user logged into /admin is logged in here,
 * and revoking them there revokes them here. Login and logout stay Payload's —
 * see src/lib/manage/routes.ts.
 *
 * The guard lives in this module rather than in the layout because a layout is
 * not a security boundary: Next renders it once and reuses it across client-side
 * navigations between sibling routes. Next's own guidance is to verify next to
 * the data, which is why every read in src/lib/manage/ calls `requireUser()`
 * first. React's `cache` collapses those repeated calls into one lookup per
 * request, so the guard is free to be paranoid.
 *
 * Server-only, without the `server-only` package — it is not a dependency of
 * this project and the plan adds none. `next/headers` and `getPayload` both
 * fail to bundle for the browser, so importing this from a Client Component is
 * already a build error rather than a leak.
 */

export type ManageUser = {
  id: number
  email: string
  name: string | null
  /** 'admin' | 'editor' per Users.ts; unset on legacy rows. */
  role: string | null
}

export const getClient = cache(async () => getPayload({ config }))

/** The signed-in user, or null. Does not redirect — for the nav and for tests. */
export const currentUser = cache(async (): Promise<ManageUser | null> => {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) return null

  const doc = user as unknown as {
    id: number
    email: string
    name?: string | null
    role?: string | null
    collection?: string
  }

  // `auth` resolves whichever auth-enabled collection holds the session. Only
  // staff belong here; a customer session must not open the order book.
  if (doc.collection && doc.collection !== 'users') return null

  return {
    id: doc.id,
    email: doc.email,
    name: doc.name ?? null,
    role: doc.role ?? null,
  }
})

/**
 * The signed-in user, or a redirect to Payload's login with a return path.
 *
 * `returnTo` is the URL to come back to. Payload runs it through its own
 * getSafeRedirect, so only same-origin paths survive — an open redirect cannot
 * be smuggled in through this parameter.
 */
export async function requireUser(returnTo = '/manage/orders'): Promise<ManageUser> {
  const user = await currentUser()
  if (!user) redirect(`${LOGIN_PATH}?redirect=${encodeURIComponent(returnTo)}`)
  return user
}
