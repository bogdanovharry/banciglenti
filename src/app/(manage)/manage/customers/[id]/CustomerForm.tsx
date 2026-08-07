'use client'

import { useActionState } from 'react'

import { saveCustomer } from '@/lib/manage/customer-actions'
import type { ActionResult } from '@/lib/manage/actions'
import type { CustomerDetail } from '@/lib/manage/customers'
import { FieldLabel, Result, SubmitButton, inputClass } from '../../../_components/form'

/**
 * Contact and tax details.
 *
 * Editable here because these are the fields that go stale — a customer moves,
 * changes number, or registers for VAT — and chasing them into Payload to fix a
 * phone number is exactly the round trip this admin exists to remove.
 *
 * The VIES check-box is not here. It is set by a validation that has not been
 * built, and a check-box a person can tick by hand is a claim the business
 * cannot support if a reverse-charge invoice is ever questioned.
 */
export function CustomerForm({ customer }: { customer: CustomerDetail }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveCustomer, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="customerId" value={customer.id} />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <FieldLabel htmlFor="name">Име</FieldLabel>
          <input id="name" name="name" required defaultValue={customer.name} className={inputClass} />
        </div>

        <div>
          <FieldLabel htmlFor="email">Имейл</FieldLabel>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={customer.email}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="phone">Телефон</FieldLabel>
          <input
            id="phone"
            name="phone"
            defaultValue={customer.phone ?? ''}
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <FieldLabel htmlFor="company">Фирма</FieldLabel>
          <input
            id="company"
            name="company"
            defaultValue={customer.company ?? ''}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="taxId">ЕИК / CUI</FieldLabel>
          <input
            id="taxId"
            name="taxId"
            defaultValue={customer.taxId ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="vatNumber">ДДС номер</FieldLabel>
          <input
            id="vatNumber"
            name="vatNumber"
            defaultValue={customer.vatNumber ?? ''}
            className={inputClass}
          />
        </div>
      </div>

      {customer.vatNumber && (
        <p className="mt-2 text-[11.5px] text-ink-50">
          {customer.vatNumberValidated
            ? 'Проверен във VIES.'
            : 'Непроверен във VIES — обратно начисляване изисква валиден номер и запазена товарителница.'}
        </p>
      )}

      <div className="mt-3">
        <SubmitButton>Запази</SubmitButton>
      </div>

      <Result state={state} />
    </form>
  )
}
