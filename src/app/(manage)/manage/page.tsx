import { redirect } from 'next/navigation'

/**
 * /manage has no screen of its own yet.
 *
 * Orders is where the day starts, so it is the front door. When the dashboard
 * moves across from Payload (it is already built — see
 * src/payload/components/Dashboard.tsx) it takes this route and the redirect
 * goes away.
 */
export default function ManageIndex() {
  redirect('/manage/orders')
}
