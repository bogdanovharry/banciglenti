'use server'

import { redirect } from 'next/navigation'

import { isEnquiryStatus } from '@/lib/manage/enquiries'
import { getClient, requireUser } from '@/lib/manage/session'

/**
 * Move an enquiry to a new status. A plain form post, no client code, ending in
 * a redirect back to the list the person was on. `requireUser()` first — a
 * Server Action is a public endpoint.
 */
export async function setEnquiryStatus(form: FormData): Promise<void> {
  const user = await requireUser('/manage/enquiries')

  const id = Number.parseInt(String(form.get('id') ?? ''), 10)
  const status = String(form.get('status') ?? '')
  const back = new URLSearchParams()
  for (const key of ['status', 'q', 'page'] as const) {
    const v = String(form.get(`back-${key}`) ?? '').slice(0, 100)
    if (v) back.set(key, v)
  }

  if (Number.isInteger(id) && id > 0 && isEnquiryStatus(status)) {
    const payload = await getClient()
    try {
      await payload.update({ collection: 'enquiries', id, data: { status }, depth: 0, user })
    } catch (error) {
      console.error('[manage] enquiry status failed:', error)
      back.set('error', '1')
    }
  }
  const qs = back.toString()
  redirect(`/manage/enquiries${qs ? `?${qs}` : ''}`)
}
