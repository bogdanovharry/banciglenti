'use client'

import { useState } from 'react'

import { setStatus } from '@/lib/manage/actions'
import { statusPill, type OrderStatus } from '@/lib/manage/vocabulary'
import {
  FieldLabel,
  Result,
  SubmitButton,
  inputClass,
  selectClass,
  useActionForm,
} from '../../../_components/form'

/**
 * The status, and the one control that changes it.
 *
 * The select offers only the moves the order can make from where it is (see
 * `nextStatuses` in vocabulary.ts) — the action enforces the same list, so this
 * is a courtesy, not the rule. A closed order says who can reopen it instead of
 * showing a control that would only be refused.
 *
 * The reason box appears only for a refusal. Every other transition explains
 * itself — "Потвърдена" needs no note — but "Отказана" is the one somebody asks
 * about weeks later, so the action refuses it without a reason and this makes
 * that visible before the click rather than after it.
 */
export function StatusControl({
  orderId,
  status,
  options,
  version,
}: {
  orderId: number
  status: string | null
  options: OrderStatus[]
  version: string
}) {
  const { state, onSubmit, pending } = useActionForm(setStatus)
  const current = status ?? 'pending'
  const [next, setNext] = useState(current)

  if (options.length === 0) {
    return (
      <p className="text-[13px] text-ink-70">
        „{statusPill(current)}“ е крайно състояние. Само администратор може да го върне.
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="version" value={version} />

      <FieldLabel htmlFor="status">Статус</FieldLabel>
      <select
        id="status"
        name="status"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        className={selectClass}
      >
        <option value={current}>{statusPill(current)}</option>
        {options.map((value) => (
          <option key={value} value={value}>
            {statusPill(value)}
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
        <SubmitButton tone="blue" pending={pending}>
          Запази статуса
        </SubmitButton>
        {next !== current && (
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-orange">
            незаписано
          </span>
        )}
      </div>

      <Result state={state} />
    </form>
  )
}
