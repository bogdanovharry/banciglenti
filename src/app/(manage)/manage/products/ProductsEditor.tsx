'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { saveProducts } from '@/lib/manage/product-actions'
import { Result, SubmitButton, useActionForm } from '../../_components/form'

/**
 * One page of the catalogue as a single form.
 *
 * A stock-take is forty small edits in a row, and a save per product is forty
 * round trips and forty chances to lose count of where you were. So every row
 * on the page is live, and one button writes whichever of them changed.
 *
 * A Client Component for two things only: marking the rows that differ from
 * what is stored, so the person can see what the button is about to write, and
 * guarding those edits against a stray click on a page link. The save itself is
 * a plain form post to a Server Action, which re-checks every figure — nothing
 * here is trusted.
 */

export type EditorRow = {
  id: number
  name: string
  slug: string
  /** Display name of the series, or null. */
  series: string | null
  /** The stored figures, as strings exactly as the inputs start out. */
  stock: string
  status: string
  price: string
  /** The price as read-only text, for accounts that may not change it. */
  priceText: string
  version: string
}

/** A sortable header's target, worked out by the page, which owns the URL. */
export type SortLink = {
  href: string
  /** The direction when this column is the current sort; null when it is not. */
  dir: 'asc' | 'desc' | null
}

type Values = { stock: string; status: string; price: string }

/** Same figure? "20" and "20.0", or "12,5" and "12.50", are not edits. */
function sameFigure(typed: string, stored: string): boolean {
  const t = typed.trim().replace(',', '.')
  if (t === stored) return true
  if (t === '' || stored === '') return false
  return Number(t) === Number(stored)
}

const TH = 'px-3 py-2 text-left font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50'
const TD = 'px-3 py-2 align-middle border-t border-ink-08'

/** A sortable column header, as on the order book. */
function SortHeader({
  label,
  link,
  align = 'left',
}: {
  label: string
  link: SortLink
  align?: 'left' | 'right'
}) {
  const active = link.dir !== null
  return (
    <th scope="col" className={`${TH} ${align === 'right' ? 'text-right' : ''}`}>
      <Link
        href={link.href}
        className={`inline-flex items-center gap-1 hover:text-ink ${active ? 'text-ink' : ''}`}
      >
        {label}
        <span aria-hidden className={active ? 'text-orange' : 'text-ink-30'}>
          {link.dir === 'desc' ? '↓' : link.dir === 'asc' ? '↑' : '↕'}
        </span>
      </Link>
    </th>
  )
}

// The shared inputClass, minus its fixed border colour and full width: here the
// border says whether this particular figure has been edited.
const FIELD = 'h-8 border bg-white px-2 text-[13px] focus:border-blue focus:outline-none'

const LINK =
  'font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 hover:text-blue whitespace-nowrap'

export function ProductsEditor({
  rows,
  sorts,
  statuses,
  canEditPrice,
  returnTo,
}: {
  rows: EditorRow[]
  sorts: { name: SortLink; price: SortLink; stock: SortLink }
  statuses: { value: string; label: string }[]
  canEditPrice: boolean
  /** The list's query string, so the save lands back on the same filtered page. */
  returnTo: string
}) {
  // Not `<form action>`: React resets a form once its action settles, which on a
  // refused save wiped every figure typed across the page. See useActionForm.
  const { state, onSubmit, pending } = useActionForm(saveProducts)

  const [values, setValues] = useState<Record<number, Values>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, { stock: r.stock, status: r.status, price: r.price }])),
  )

  const set = (id: number, patch: Partial<Values>) =>
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const edited = (row: EditorRow) => {
    const v = values[row.id]
    return {
      stock: !sameFigure(v.stock, row.stock),
      status: v.status !== row.status,
      price: canEditPrice && !sameFigure(v.price, row.price),
    }
  }

  const changedCount = rows.filter((row) => {
    const e = edited(row)
    return e.stock || e.status || e.price
  }).length

  /**
   * Don't let unsaved figures vanish.
   *
   * The page links — paging, tabs, sort — are client-side navigations, which
   * `beforeunload` never sees, so they are caught at the click instead, ahead of
   * Next's own handler. Off while a save is in flight: that navigation is the
   * one that is supposed to happen.
   */
  const guard = changedCount > 0 && !pending
  useEffect(() => {
    if (!guard) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return
      }
      const link = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!link || link.getAttribute('target') === '_blank') return
      if (!window.confirm('Има незаписани промени. Да се изоставят ли?')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('click', onClick, true)
    }
  }, [guard])

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="returnTo" value={returnTo} />

      {/* `relative` is load-bearing: it makes this box the containing block for
          the screen-reader-only header label, which is absolutely positioned.
          Without it that label escaped the scroll box and widened the whole page
          on a phone to where the last column would have been. */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-[13.5px]">
          <thead className="bg-paper">
            <tr>
              <SortHeader label="Продукт" link={sorts.name} />
              <th scope="col" className={TH}>
                Серия
              </th>
              <SortHeader label="Цена без ДДС" link={sorts.price} align="right" />
              <SortHeader label="Наличност" link={sorts.stock} align="right" />
              <th scope="col" className={TH}>
                Статус
              </th>
              <th scope="col" className={TH}>
                <span className="sr-only">Връзки</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const v = values[row.id]
              const e = edited(row)
              const changed = e.stock || e.status || e.price

              return (
                <tr key={row.id} className={changed ? 'bg-orange/10' : 'hover:bg-paper/60'}>
                  <td
                    className={`${TD} max-w-[320px] ${
                      changed ? 'shadow-[inset_3px_0_0_var(--color-orange)]' : ''
                    }`}
                  >
                    <div className="font-semibold truncate" title={row.name}>
                      {row.name}
                    </div>
                    <div className="font-mono text-[11px] text-ink-50 truncate">{row.slug}</div>

                    {/* What the screen showed. The action uses these only to find
                        the touched rows; what it writes is decided against the
                        database, and `version` refuses a row someone else has
                        changed since. */}
                    <input type="hidden" name={`version:${row.id}`} value={row.version} />
                    <input type="hidden" name={`was-stock:${row.id}`} value={row.stock} />
                    <input type="hidden" name={`was-status:${row.id}`} value={row.status} />
                    {canEditPrice && (
                      <input type="hidden" name={`was-price:${row.id}`} value={row.price} />
                    )}
                  </td>

                  <td className={`${TD} whitespace-nowrap text-ink-70`}>
                    {row.series ?? <span className="text-ink-30">—</span>}
                  </td>

                  <td className={`${TD} text-right whitespace-nowrap`}>
                    {canEditPrice ? (
                      <input
                        type="number"
                        name={`price:${row.id}`}
                        aria-label={`Цена без ДДС — ${row.name}`}
                        value={v.price}
                        onChange={(ev) => set(row.id, { price: ev.target.value })}
                        // A focused number input takes the scroll wheel as an
                        // edit. On a long table that silently shifts a price
                        // while the person thinks they are scrolling the page.
                        onWheel={(ev) => ev.currentTarget.blur()}
                        min={0}
                        max={100000}
                        step={0.01}
                        inputMode="decimal"
                        className={`${FIELD} w-[104px] text-right tl-figures ${
                          e.price ? 'border-orange' : 'border-ink-15'
                        }`}
                      />
                    ) : (
                      <span className="tl-figures">{row.priceText}</span>
                    )}
                  </td>

                  <td className={`${TD} text-right whitespace-nowrap`}>
                    <input
                      type="number"
                      name={`stock:${row.id}`}
                      aria-label={`Наличност — ${row.name}`}
                      value={v.stock}
                      onChange={(ev) => set(row.id, { stock: ev.target.value })}
                      onWheel={(ev) => ev.currentTarget.blur()}
                      min={0}
                      max={100000}
                      step={1}
                      inputMode="numeric"
                      className={`${FIELD} w-[84px] text-right tl-figures ${
                        e.stock ? 'border-orange' : 'border-ink-15'
                      }`}
                    />
                  </td>

                  <td className={`${TD} whitespace-nowrap`}>
                    <select
                      name={`status:${row.id}`}
                      aria-label={`Статус — ${row.name}`}
                      value={v.status}
                      onChange={(ev) => set(row.id, { status: ev.target.value })}
                      className={`${FIELD} w-[124px] cursor-pointer ${
                        e.status ? 'border-orange' : 'border-ink-15'
                      }`}
                    >
                      {/* A row with no status stored gets an explicit blank.
                          Without it the select would show — and submit — the
                          first option, and the save would "change" a product
                          nobody touched. */}
                      {!statuses.some((s) => s.value === row.status) && (
                        <option value="">—</option>
                      )}
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* New tab, both: this page may be holding unsaved figures,
                      and looking something up should not cost them. */}
                  <td className={`${TD} whitespace-nowrap text-right`}>
                    <a
                      href={`/admin/collections/products/${row.id}`}
                      target="_blank"
                      rel="noopener"
                      className={LINK}
                    >
                      Payload
                    </a>
                    {row.slug && (
                      <a
                        href={`/product/${row.slug}`}
                        target="_blank"
                        rel="noopener"
                        className={`${LINK} ml-3`}
                      >
                        Сайт
                      </a>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pinned to the bottom of the window while the table scrolls under it:
          the button is needed at row 50 as much as at row 1. */}
      <div className="sticky bottom-0 z-10 border-t border-ink-15 bg-white px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <SubmitButton pending={pending}>Запази промените</SubmitButton>
          <span
            className={`font-mono text-[10px] tracking-[0.12em] uppercase tl-figures ${
              changedCount > 0 ? 'text-orange' : 'text-ink-30'
            }`}
          >
            {changedCount === 0
              ? 'Няма промени'
              : `${changedCount} ${changedCount === 1 ? 'променен ред' : 'променени реда'}`}
          </span>
        </div>
        <Result state={state} />
      </div>
    </form>
  )
}
