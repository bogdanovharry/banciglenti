'use client'

import { useActionState } from 'react'

import { saveFulfilment, type ActionResult } from '@/lib/manage/actions'
import { FieldLabel, Result, SubmitButton, inputClass, selectClass } from '../../../_components/form'
import type { OrderDetail } from '@/lib/manage/order'

/**
 * Payment and dispatch — the fields that actually change between an order
 * arriving and a blade leaving.
 *
 * One form, one save, because these are decided together: you mark it paid, put
 * the courier office in and write the waybill number in the same thirty seconds.
 * Splitting them into three saves was what made the old screen feel like data
 * entry rather than work.
 */
export function FulfilmentForm({ order }: { order: OrderDetail }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(saveFulfilment, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={order.id} />
      {/* Lets the action tell "waybill added" from "waybill edited", so it only
          writes a history entry for the first one. */}
      <input type="hidden" name="previousTracking" value={order.shipping.trackingNumber ?? ''} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <FieldLabel htmlFor="paymentStatus">Плащане</FieldLabel>
          <select
            id="paymentStatus"
            name="paymentStatus"
            defaultValue={order.payment.status ?? 'pending'}
            className={selectClass}
          >
            <option value="pending">Очаква</option>
            <option value="paid">Платена</option>
            <option value="failed">Неуспешна</option>
            <option value="refunded">Възстановена</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="paymentMethod">Метод</FieldLabel>
          <select
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={order.payment.method ?? 'bank_transfer'}
            className={selectClass}
          >
            <option value="bank_transfer">Банков превод</option>
            <option value="cod">Наложен платеж</option>
            <option value="mypos">myPOS (карта)</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="shippingMethod">Доставка</FieldLabel>
          <select
            id="shippingMethod"
            name="shippingMethod"
            defaultValue={order.shipping.method ?? 'courier'}
            className={selectClass}
          >
            <option value="courier">Куриер</option>
            <option value="pickup">Лично вземане</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="trackingNumber">Товарителница</FieldLabel>
          <input
            id="trackingNumber"
            name="trackingNumber"
            defaultValue={order.shipping.trackingNumber ?? ''}
            className={`${inputClass} font-mono`}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="mt-2">
        <FieldLabel htmlFor="office">Офис на куриера</FieldLabel>
        <input
          id="office"
          name="office"
          defaultValue={order.shipping.office ?? ''}
          placeholder="напр. Еконт Габрово — Шиварска"
          className={inputClass}
          autoComplete="off"
        />
      </div>

      <div className="mt-2">
        <FieldLabel htmlFor="address">Адрес за доставка</FieldLabel>
        <textarea
          id="address"
          name="address"
          rows={3}
          defaultValue={order.shipping.address ?? ''}
          className="w-full border border-ink-15 px-2.5 py-2 text-[13px] bg-white focus:border-blue focus:outline-none resize-y"
        />
      </div>

      <div className="mt-2">
        <SubmitButton>Запази</SubmitButton>
      </div>

      {/* Switching to "Лично вземане" drops the carriage, so the total moves.
          Said here rather than discovered afterwards. */}
      <p className="mt-2 text-[11.5px] text-ink-50">
        Смяната на метода на доставка преизчислява сумата.
      </p>

      <Result state={state} />
    </form>
  )
}
