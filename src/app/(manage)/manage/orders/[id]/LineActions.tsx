'use client'

import { useActionState } from 'react'

import { removeLine, type ActionResult } from '@/lib/manage/actions'

/**
 * Remove a line. Deliberately quiet — a small × at the end of the row rather
 * than a button, because removing is the rare case and the row is there to be
 * read, not operated.
 */
export function RemoveLineButton({
  orderId,
  index,
  label,
  expect,
  version,
}: {
  orderId: number
  index: number
  label: string
  /** What this row is, so the action can refuse if the table is out of date. */
  expect: string
  version: string
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(removeLine, null)

  return (
    <form action={formAction} className="tl-no-print inline">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="index" value={index} />
      <input type="hidden" name="expect" value={expect} />
      <button
        type="submit"
        title={`Премахни „${label}“`}
        aria-label={`Премахни ${label}`}
        className="w-6 h-6 inline-flex items-center justify-center text-ink-30 hover:text-danger hover:bg-paper cursor-pointer text-[15px] leading-none"
      >
        ×
      </button>
      {state && !state.ok && (
        <span role="status" className="block text-[11.5px] text-danger mt-1 max-w-[160px]">
          {state.error}
        </span>
      )}
    </form>
  )
}

/**
 * The print button. `window.print()` needs a click handler, which is the only
 * reason this is a Client Component — the work order it prints is entirely
 * server-rendered, so it prints correctly even if this never hydrates.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="tl-no-print h-9 px-4 border border-ink-15 text-[13px] font-semibold hover:bg-paper cursor-pointer"
    >
      Печат
    </button>
  )
}
