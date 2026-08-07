'use client'

import { useFormStatus } from 'react-dom'

import type { ActionResult } from '@/lib/manage/actions'

/**
 * The two pieces every form on the order screen needs: a button that knows it
 * is submitting, and a line that says what happened.
 *
 * Shared because the alternative is six forms each inventing their own idea of
 * "saving…", and because a control that gives no feedback gets clicked twice.
 */

export function SubmitButton({
  children,
  tone = 'dark',
  className = '',
}: {
  children: React.ReactNode
  tone?: 'dark' | 'blue' | 'quiet'
  className?: string
}) {
  const { pending } = useFormStatus()

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
