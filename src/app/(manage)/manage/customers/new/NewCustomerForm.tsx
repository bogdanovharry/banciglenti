'use client'

import { createCustomer } from '@/lib/manage/customer-actions'
import { FieldLabel, Result, SubmitButton, inputClass, useActionForm } from '../../../_components/form'

/**
 * The same fields as the contact form on a customer's own screen, empty.
 *
 * Name and email are required because the order route and the customer book
 * both key on the email — a customer without one could never be matched to an
 * order they later place online.
 */
export function NewCustomerForm({ next }: { next: string | null }) {
  const { state, onSubmit, pending } = useActionForm(createCustomer)

  return (
    <form onSubmit={onSubmit} className="max-w-[560px]">
      {next && <input type="hidden" name="next" value={next} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="name">Име</FieldLabel>
          <input id="name" name="name" required autoComplete="off" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="email">Имейл</FieldLabel>
          <input id="email" name="email" type="email" required autoComplete="off" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="phone">Телефон</FieldLabel>
          <input id="phone" name="phone" autoComplete="off" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="company">Фирма</FieldLabel>
          <input id="company" name="company" autoComplete="off" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="taxId">ЕИК / CUI</FieldLabel>
          <input id="taxId" name="taxId" autoComplete="off" className={inputClass} />
        </div>
        <div>
          <FieldLabel htmlFor="vatNumber">ДДС номер</FieldLabel>
          <input id="vatNumber" name="vatNumber" autoComplete="off" className={inputClass} />
        </div>
      </div>

      <div className="mt-3">
        <SubmitButton pending={pending}>
          {next === 'order' ? 'Създай и продължи към поръчката' : 'Създай клиента'}
        </SubmitButton>
      </div>

      <Result state={state} />
    </form>
  )
}
