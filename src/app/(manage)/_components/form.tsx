'use client'

import { startTransition, useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import type { ActionResult } from '@/lib/manage/actions'

/**
 * The pieces every form on these screens needs: a way to submit that keeps what
 * was typed when the save is refused, a button that knows it is submitting, and
 * a line that says what happened.
 *
 * Shared because the alternative is a dozen forms each inventing their own idea
 * of "saving…", and because a control that gives no feedback gets clicked twice.
 */

type FormAction = (prev: ActionResult | null, form: FormData) => Promise<ActionResult>

/**
 * `useActionState`, submitted without React's automatic form reset.
 *
 * Handing an action straight to `<form action>` makes React reset every field
 * once the action settles — whether the save worked or not. So a refusal (a
 * duplicate email, a stale screen, a missing reason) cleared the form in the
 * same moment it showed the message: a typed comment, a new customer's details,
 * a stock-take's figures, gone. Controlled fields were not spared either. A
 * successful save navigates and remounts the form with fresh values anyway, so
 * the reset only ever cost typing, on failure. Dispatching from `onSubmit`
 * inside a transition does everything else the same way, minus the reset.
 *
 * `pending` is passed to SubmitButton, because `useFormStatus` only sees
 * submissions made through `<form action>`.
 */
export function useActionForm(action: FormAction) {
  const [state, dispatch, pending] = useActionState<ActionResult | null, FormData>(action, null)

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const data = new FormData(event.currentTarget, submitter)
    startTransition(() => dispatch(data))
  }

  return { state, onSubmit, pending }
}

export function SubmitButton({
  children,
  tone = 'dark',
  className = '',
  pending: pendingProp,
}: {
  children: React.ReactNode
  tone?: 'dark' | 'blue' | 'quiet'
  className?: string
  /** From useActionForm; falls back to the enclosing `<form action>`'s status. */
  pending?: boolean
}) {
  const status = useFormStatus()
  const pending = pendingProp ?? status.pending

  const tones = {
    dark: 'bg-ink text-white',
    blue: 'bg-blue text-white',
    quiet: 'bg-transparent text-ink-70 border border-ink-15 hover:bg-paper',
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className={`tl-btn inline-flex items-center justify-center h-9 px-4 text-[13px] font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-wait ${tones[tone]} ${className}`}
    >
      {pending ? 'Записва…' : children}
    </button>
  )
}

export function Result({ state }: { state: ActionResult | null }) {
  if (!state) return null

  return (
    <p
      role="status"
      className={`mt-2 text-[12.5px] ${state.ok ? 'text-ok' : 'text-danger'}`}
    >
      {state.ok ? (state.message ?? 'Записано.') : state.error}
    </p>
  )
}

/** Mono uppercase micro-label, the storefront's idiom for a field name. */
export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-1"
    >
      {children}
    </label>
  )
}

export const inputClass =
  'w-full h-9 border border-ink-15 px-2.5 text-[13px] bg-white focus:border-blue focus:outline-none'

export const selectClass = `${inputClass} cursor-pointer`
