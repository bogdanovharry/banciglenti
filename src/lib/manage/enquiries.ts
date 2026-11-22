import type { Where } from 'payload'

import { getClient, requireUser } from '@/lib/manage/session'
import { PAGE_SIZE } from '@/lib/manage/vocabulary'

/**
 * Read side of the contact-form enquiries: the list, with a status tab and a
 * search, and the counts for the tabs. Writes are in enquiry-actions.ts.
 */

export const ENQUIRY_STATUSES = [
  { value: 'new', label: 'Нови' },
  { value: 'in_progress', label: 'В процес' },
  { value: 'closed', label: 'Приключени' },
] as const

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]['value']

export const isEnquiryStatus = (v: unknown): v is EnquiryStatus =>
  typeof v === 'string' && ENQUIRY_STATUSES.some((s) => s.value === v)

export type EnquiryRow = {
  id: number
  status: EnquiryStatus
  name: string
  email: string
  phone: string | null
  company: string | null
  industry: string | null
  message: string
  createdAt: string | null
  updatedAt: string | null
}

export type EnquiryList = {
  rows: EnquiryRow[]
  total: number
  page: number
  pageCount: number
  counts: Record<EnquiryStatus, number>
  all: number
}

function searchWhere(q: string): Where {
  return {
    or: [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { company: { contains: q } },
      { message: { contains: q } },
    ],
  }
}

export async function listEnquiries(
  input: { status?: EnquiryStatus | null; q?: string; page?: number } = {},
): Promise<EnquiryList> {
  await requireUser('/manage/enquiries')
  const payload = await getClient()

  const q = (input.q ?? '').trim()
  const page = Math.max(1, Math.trunc(input.page ?? 1))
  const search = q ? searchWhere(q) : undefined
  const byStatus: Where | undefined = input.status ? { status: { equals: input.status } } : undefined
  const where: Where | undefined = byStatus && search ? { and: [byStatus, search] } : (byStatus ?? search)

  const [result, all, ...perStatus] = await Promise.all([
    payload.find({ collection: 'enquiries', where, sort: '-createdAt', limit: PAGE_SIZE, page, depth: 0 }),
    payload.count({ collection: 'enquiries', where: search }),
    ...ENQUIRY_STATUSES.map((s) =>
      payload.count({
        collection: 'enquiries',
        where: search ? { and: [{ status: { equals: s.value } }, search] } : { status: { equals: s.value } },
      }),
    ),
  ])

  const counts = Object.fromEntries(ENQUIRY_STATUSES.map((s, i) => [s.value, perStatus[i].totalDocs])) as Record<
    EnquiryStatus,
    number
  >

  return {
    rows: (result.docs as unknown as Record<string, unknown>[]).map((d) => ({
      id: Number(d.id),
      status: isEnquiryStatus(d.status) ? d.status : 'new',
      name: String(d.name ?? '—'),
      email: String(d.email ?? ''),
      phone: typeof d.phone === 'string' && d.phone ? d.phone : null,
      company: typeof d.company === 'string' && d.company ? d.company : null,
      industry: typeof d.industry === 'string' ? d.industry : null,
      message: String(d.message ?? ''),
      createdAt: typeof d.createdAt === 'string' ? d.createdAt : null,
      updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : null,
    })),
    total: result.totalDocs,
    page,
    pageCount: Math.max(1, result.totalPages),
    counts,
    all: all.totalDocs,
  }
}
