'use client'

import { useActionState, useRef } from 'react'

import { addComment, type ActionResult } from '@/lib/manage/actions'
import { Result, SubmitButton } from '../../../_components/form'
import type { OrderLogEntry } from '@/lib/manage/order'

/**
 * Internal history, newest first, with the box that adds to it.
 *
 * A single notes field loses everything but the last edit — who rang, why an
 * order was refused, when the workshop confirmed the size. Those are the
 * questions asked weeks later and a textarea cannot answer them, so each entry
 * keeps its author and its time and nothing is ever overwritten.
 */
export function HistoryPanel({ orderId, log }: { orderId: number; log: OrderLogEntry[] }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(addComment, null)
  const boxRef = useRef<HTMLTextAreaElement>(null)

  const when = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('bg-BG', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Sofia',
        })
      : '—'

  return (
    <div>
      <form
        action={(formData) => {
          formAction(formData)
          // Clearing here rather than through state: the entry is already on
          // its way to the list below, and leaving the text sitting in the box
          // invites it being sent twice.
          if (boxRef.current) boxRef.current.value = ''
        }}
      >
        <input type="hidden" name="orderId" value={orderId} />
        <textarea
          ref={boxRef}
          name="note"
          rows={2}
          required
          placeholder="Звънях — потвърди размера…"
          className="w-full border border-ink-15 px-2.5 py-2 text-[13px] bg-white focus:border-blue focus:outline-none resize-y"
        />
        <div className="mt-2">
          <SubmitButton tone="quiet">Добави коментар</SubmitButton>
        </div>
        <Result state={state} />
      </form>

      {log.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {log.map((entry, i) => (
            <li key={i} className="text-[13px] border-l-2 border-ink-15 pl-3">
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-ink-50 tl-figures">
                {when(entry.at)}
                {entry.author && <span className="text-ink-30"> · {entry.author}</span>}
              </div>
              <div className="whitespace-pre-line mt-0.5">{entry.note}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
