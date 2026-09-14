'use client'

import { useState } from 'react'

import { createOrder } from '@/lib/manage/actions'
import { PAYMENT_METHOD_LABEL } from '@/lib/manage/vocabulary'
import {
  FieldLabel,
  Result,
  SubmitButton,
  inputClass,
  selectClass,
  useActionForm,
} from '../../../_components/form'

export type OfferedMarket = {
  code: string
  country: string
  currency: string
  pickup: boolean
  paymentMethods: string[]
  couriers: string[]
}

/**
 * The order shell: which market it is sold in, how it travels, how it is paid.
 *
 * Lines are not here. They are added on the order screen itself, with the same
 * priced controls as any amendment — one place that turns a size into a price,
 * not two. The market decides the rest (VAT, currency, whether pickup exists,
 * which payments are taken), so changing it re-shapes the options below rather
 * than letting an impossible combination be submitted.
 */
export function NewOrderForm({
  customerId,
  markets,
  defaultMarket,
  defaultAddress,
  defaultOffice,
  prefill,
}: {
  customerId: number
  markets: OfferedMarket[]
  defaultMarket: string
  defaultAddress: string
  defaultOffice: string
  prefill: { length?: number; width?: number; thickness?: number } | null
}) {
  const { state, onSubmit, pending } = useActionForm(createOrder)
  const [marketCode, setMarketCode] = useState(defaultMarket)
  const [shipping, setShipping] = useState<'courier' | 'pickup'>('courier')

  const market = markets.find((m) => m.code === marketCode) ?? markets[0]
  const shippingMethod = shipping === 'pickup' && !market.pickup ? 'courier' : shipping

  return (
    <form onSubmit={onSubmit} className="max-w-[560px]">
      <input type="hidden" name="customerId" value={customerId} />
      {prefill?.length !== undefined && <input type="hidden" name="prefill-length" value={prefill.length} />}
      {prefill?.width !== undefined && <input type="hidden" name="prefill-width" value={prefill.width} />}
      {prefill?.thickness !== undefined && (
        <input type="hidden" name="prefill-thickness" value={prefill.thickness} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <FieldLabel htmlFor="market">Пазар</FieldLabel>
          <select
            id="market"
            name="market"
            value={marketCode}
            onChange={(e) => setMarketCode(e.target.value)}
            className={selectClass}
          >
            {markets.map((m) => (
              <option key={m.code} value={m.code}>
                {m.country} · {m.currency}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="shippingMethod">Доставка</FieldLabel>
          <select
            id="shippingMethod"
            name="shippingMethod"
            value={shippingMethod}
            onChange={(e) => setShipping(e.target.value as 'courier' | 'pickup')}
            className={selectClass}
          >
            <option value="courier">Куриер · {market.couriers.join(' / ')}</option>
            {market.pickup && <option value="pickup">Лично вземане</option>}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="paymentMethod">Плащане</FieldLabel>
          {/* Keyed on the market: a method the new market does not take must
              not stay selected from the old one. */}
          <select
            key={market.code}
            id="paymentMethod"
            name="paymentMethod"
            defaultValue={market.paymentMethods[0]}
            className={selectClass}
          >
            {market.paymentMethods.map((p) => (
              <option key={p} value={p}>
                {PAYMENT_METHOD_LABEL[p] ?? p}
              </option>
            ))}
          </select>
        </div>

        {shippingMethod === 'courier' && (
          <div>
            <FieldLabel htmlFor="office">Офис на куриера</FieldLabel>
            <input
              id="office"
              name="office"
              defaultValue={defaultOffice}
              placeholder="ако е до офис"
              autoComplete="off"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {shippingMethod === 'courier' && (
        <div className="mt-2">
          <FieldLabel htmlFor="address">Адрес за доставка</FieldLabel>
          <textarea
            id="address"
            name="address"
            rows={3}
            required
            defaultValue={defaultAddress}
            className="w-full border border-ink-15 px-2.5 py-2 text-[13px] bg-white focus:border-blue focus:outline-none resize-y"
          />
          {defaultAddress && (
            <p className="mt-1 text-[11.5px] text-ink-50">От последната доставка на клиента — проверете го.</p>
          )}
        </div>
      )}

      <div className="mt-2">
        <FieldLabel htmlFor="note">Бележка в историята</FieldLabel>
        <input
          id="note"
          name="note"
          placeholder="напр. поръча по телефона, иска до петък"
          autoComplete="off"
          className={inputClass}
        />
      </div>

      <div className="mt-3">
        <SubmitButton pending={pending}>Създай поръчката</SubmitButton>
      </div>
      <p className="mt-2 text-[11.5px] text-ink-50">
        Редовете се добавят на следващата стъпка, с цените от ценоразписа.
      </p>

      <Result state={state} />
    </form>
  )
}
