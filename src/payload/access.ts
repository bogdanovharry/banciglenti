import type { Access, FieldAccess, PayloadRequest } from 'payload'

/**
 * Who may do what through Payload's own doors — its REST API, GraphQL and the
 * /admin screens.
 *
 * Before this file every collection fell back to Payload's default, which is
 * "anyone logged in may do anything": an editor could PATCH an order's total,
 * make themselves an administrator, or delete the order book. That was tolerable
 * with one account and is not with a Romanian and a Greek team on the way.
 *
 * None of this touches the storefront or the /manage screens. Both write through
 * the Local API, which skips access control by default — they enforce their own
 * rules next to the data (src/lib/manage/actions.ts), and the order route
 * re-prices everything it writes. What these functions close is the side door:
 * a logged-in browser talking to /api/<collection> directly.
 *
 * Two roles, as Users.ts defines them. An account with no role at all is a
 * legacy row and is treated as an editor — the safe reading of "unknown".
 */

type StaffUser = { id: number | string; role?: string | null; collection?: string }

function staffUser(req: PayloadRequest): StaffUser | null {
  const user = req.user as StaffUser | null | undefined
  if (!user) return null
  // Only the staff collection. Should a customer login ever exist, its session
  // must not open anything here.
  if (user.collection && user.collection !== 'users') return null
  return user
}

export const isStaff: Access = ({ req }) => Boolean(staffUser(req))

export const isAdmin: Access = ({ req }) => staffUser(req)?.role === 'admin'

/** An administrator, or the account itself — for changing one's own name or password. */
export const isAdminOrSelf: Access = ({ req }) => {
  const user = staffUser(req)
  if (!user) return false
  if (user.role === 'admin') return true
  return { id: { equals: user.id } }
}

export const isAdminField: FieldAccess = ({ req }) => staffUser(req)?.role === 'admin'

/**
 * A field nobody may write through the API or the admin form.
 *
 * For values the server derives — an order's totals, its lines, its currency.
 * The order route and the /manage actions still write them, through the Local
 * API; everyone else gets the field stripped from their request and the stored
 * value kept.
 */
export const serverOnly: { create: FieldAccess; update: FieldAccess } = {
  create: () => false,
  update: () => false,
}

/** Catalogue and content: staff edit, administrators delete. */
export const staffEditAdminDelete = {
  read: isStaff,
  create: isStaff,
  update: isStaff,
  delete: isAdmin,
}
