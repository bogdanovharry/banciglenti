'use client'

import { useActionState, useState } from 'react'

import { setStatus, type ActionResult } from '@/lib/manage/actions'
import { ORDER_STATUSES } from '@/lib/manage/vocabulary'
import { FieldLabel, Result, SubmitButton, selectClass, inputClass } from '../../../_components/form'

/**
 * The status, and the one control that changes it.
 *
 * The reason box appears only for a refusal. Every other transition explains
 * itself — "Потвърдена" needs no note — but "Отказана" is the one somebody asks
 * about weeks later, so the action refuses it without a reason and this makes
 * that visible before the click rather than after it.
 */
export function StatusControl({ orderId, status }: { orderId: number; status: string | null }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(setStatus, null)
  const [next, setNext] = useState(status ?? 'pending')

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />

      <FieldLabel htmlFor="status">Статус</FieldLabel>
      <select
        id="status"
        name="status"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className={selectClass}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.pill}
          </option>
        ))}
      </select>

      {next === 'cancelled' && (
        <div className="mt-2">
          <FieldLabel htmlFor="reason">Причина за отказа</FieldLabel>
          <input
            id="reason"
            name="reason"
            className={inputClass}
            placeholder="напр. клиентът се отказа"
            autoComplete="off"
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <SubmitButton tone="blue">Запази статуса</SubmitButton>
        {next !== (status ?? 'pending') && (
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-orange">
            незаписано
          </span>
        )}
      </div>

      <Result state={state} />
    </form>
  )
}
