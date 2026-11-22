import type { Metadata } from 'next'
import Link from 'next/link'

import { INDUSTRY_OPTIONS } from '@/lib/catalog-ui'
import { setEnquiryStatus } from '@/lib/manage/enquiry-actions'
import { ENQUIRY_STATUSES, isEnquiryStatus, listEnquiries, type EnquiryStatus } from '@/lib/manage/enquiries'
import { shortDate, shortTime } from '@/lib/manage/format'
import { requireUser } from '@/lib/manage/session'
import { ENQUIRY_LABEL } from '@/lib/manage/vocabulary'

export const metadata: Metadata = { title: 'Запитвания' }

type Search = Record<'status' | 'q' | 'page' | 'error', string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

const href = (p: { status?: EnquiryStatus | null; q?: string; page?: number }) => {
  const sp = new URLSearchParams()
  if (p.status) sp.set('status', p.status)
  if (p.q) sp.set('q', p.q)
  if (p.page && p.page > 1) sp.set('page', String(p.page))
  const s = sp.toString()
  return `/manage/enquiries${s ? `?${s}` : ''}`
}

const INDUSTRY = Object.fromEntries(INDUSTRY_OPTIONS.map((o) => [o.code, o.label])) as Record<string, string>

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser('/manage/enquiries')
  const sp = await searchParams
  const status = isEnquiryStatus(one(sp.status)) ? (one(sp.status) as EnquiryStatus) : null
  const q = (one(sp.q) ?? '').trim().slice(0, 100)
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1)

  const list = await listEnquiries({ status, q, page })

  return (
    <div className="min-w-0">
      <header className="border-b border-ink-15 px-4 sm:px-6 py-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-50">04 · Запитвания</div>
          <h1 className="text-[22px] font-semibold tracking-tight mt-1">
            {list.total === 0 ? 'Няма запитвания' : `${list.total} ${list.total === 1 ? 'запитване' : 'запитвания'}`}
            {q && <span className="text-ink-50 font-normal"> за „{q}“</span>}
          </h1>
        </div>
        <form method="get" action="/manage/enquiries" className="flex flex-wrap items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="q" className="sr-only">
            Търсене по име, имейл, телефон, фирма или текст
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Име, имейл, телефон, текст"
            autoComplete="off"
            className="h-9 w-full sm:w-[260px] border border-ink-15 px-3 text-[13px] placeholder:text-ink-30 focus:border-blue focus:outline-none"
          />
          <button type="submit" className="tl-btn h-9 px-4 bg-ink text-white text-[13px] font-semibold cursor-pointer">
            Търси
          </button>
        </form>
      </header>

      {one(sp.error) && (
        <p role="alert" className="px-4 sm:px-6 py-2 text-[13px] text-danger">
          Записът не мина — опитайте отново.
        </p>
      )}

      <div className="border-b border-ink-15 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto overflow-y-hidden">
        {[{ value: null, label: 'Всички', n: list.all }, ...ENQUIRY_STATUSES.map((s) => ({ ...s, n: list.counts[s.value] }))].map(
          (t) => {
            const active = t.value === status
            return (
              <Link
                key={t.value ?? 'all'}
                href={href({ status: t.value, q })}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap px-3 py-2.5 text-[13px] border-b-2 -mb-px transition-colors ${
                  active ? 'border-orange text-ink font-semibold' : 'border-transparent text-ink-70 hover:text-ink'
                }`}
              >
                {t.label} <span className="text-ink-50 tl-figures">{t.n}</span>
              </Link>
            )
          },
        )}
      </div>

      {list.rows.length === 0 ? (
        <p className="px-4 sm:px-6 py-10 text-[14px] text-ink-70">Няма запитвания тук.</p>
      ) : (
        <ul className="list-none m-0 p-0">
          {list.rows.map((e) => (
            <li key={e.id} className="border-b border-ink-08 px-4 sm:px-6 py-4">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-semibold text-[14px]">{e.name}</span>
                {e.company && <span className="text-[13px] text-ink-70">{e.company}</span>}
                {e.industry && INDUSTRY[e.industry] && (
                  <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50">{INDUSTRY[e.industry]}</span>
                )}
                <span className="ml-auto text-[12px] text-ink-50 tl-figures">
                  {shortDate(e.createdAt)} {shortTime(e.createdAt)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                <a href={`mailto:${e.email}`} className="text-blue hover:underline">
                  {e.email}
                </a>
                {e.phone && (
                  <a href={`tel:${e.phone.replace(/[^\d+]/g, '')}`} className="text-blue hover:underline">
                    {e.phone}
                  </a>
                )}
              </div>
              <p className="mt-2 mb-0 text-[13.5px] leading-relaxed whitespace-pre-wrap max-w-[760px]">{e.message}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[12px] text-ink-50 mr-1">
                  {ENQUIRY_LABEL[e.status]}
                </span>
                {ENQUIRY_STATUSES.filter((s) => s.value !== e.status).map((s) => (
                  <form key={s.value} action={setEnquiryStatus}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={s.value} />
                    {status && <input type="hidden" name="back-status" value={status} />}
                    {q && <input type="hidden" name="back-q" value={q} />}
                    {page > 1 && <input type="hidden" name="back-page" value={page} />}
                    <button
                      type="submit"
                      className="tl-btn h-8 px-3 border border-ink-15 text-[12px] font-semibold hover:bg-paper cursor-pointer"
                    >
                      → {s.label.toLowerCase()}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {list.pageCount > 1 && (
        <nav className="flex items-center justify-between px-4 sm:px-6 py-4 text-[13px]">
          {page > 1 ? <Link href={href({ status, q, page: page - 1 })} className="text-blue hover:underline">← Назад</Link> : <span />}
          <span className="text-ink-50">
            {page} / {list.pageCount}
          </span>
          {page < list.pageCount ? <Link href={href({ status, q, page: page + 1 })} className="text-blue hover:underline">Напред →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
