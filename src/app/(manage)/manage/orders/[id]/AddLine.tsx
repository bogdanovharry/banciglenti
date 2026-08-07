'use client'

import { useActionState, useMemo, useState } from 'react'

import { addCatalogueLine, addCustomLine, type ActionResult } from '@/lib/manage/actions'
import { BLADE_TABLES, MIN_CUSTOM_LENGTH, type BladeTableKey } from '@/lib/order-pricing'
import { pitchLabel } from '@/lib/pricing'
import { FieldLabel, Result, SubmitButton, inputClass, selectClass } from '../../../_components/form'

/**
 * Adding a line to an existing order — the thing the old platform could do and
 * this could not.
 *
 * It is the commonest amendment in this trade: the customer rings back an hour
 * later wanting a second blade, or the workshop finds the machine needs a size
 * nobody measured. Until now that meant refunding and re-ordering.
 *
 * Two ways in, because there are two kinds of line. A catalogue product is
 * picked by name. A made-to-measure blade is built from the same price tables
 * the configurator quotes from — the selects cascade, so only combinations that
 * exist can be chosen, and the server prices whatever comes out of them. No
 * price is ever typed here, by anyone.
 */

const TABLE_LABELS: Record<BladeTableKey, string> = {
  'wood-v': 'Вертикален банциг · дърво',
  'wood-h': 'Хоризонтален банциг · дърво',
  'metal-bi': 'Метал · биметал',
  'metal-cs': 'Метал · въглеродна',
  meat: 'Месо и риба',
  bread: 'Хлебни изделия',
  textile: 'Текстил',
}

const PROCESSES = [
  { name: 'welding', label: 'Заваряване' },
  { name: 'setting', label: 'Чапраз' },
  { name: 'sharpening', label: 'Заточване' },
  { name: 'heatTreatment', label: 'Термообработка' },
] as const

type Mode = 'custom' | 'catalogue'

export function AddLine({
  orderId,
  products,
}: {
  orderId: number
  products: { slug: string; name: string }[]
}) {
  const [mode, setMode] = useState<Mode>('custom')

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {(
          [
            ['custom', 'По размер'],
            ['catalogue', 'От каталога'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`h-8 px-3 text-[12.5px] font-semibold cursor-pointer border ${
              mode === value
                ? 'border-ink bg-ink text-white'
                : 'border-ink-15 text-ink-70 hover:bg-paper'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'custom' ? <CustomLine orderId={orderId} /> : <CatalogueLine orderId={orderId} products={products} />}
    </div>
  )
}

function CustomLine({ orderId }: { orderId: number }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(addCustomLine, null)

  const [table, setTable] = useState<BladeTableKey>('wood-v')
  const blades = BLADE_TABLES[table]

  const [width, setWidth] = useState<number | null>(null)
  const [thickness, setThickness] = useState<number | null>(null)
  const [brand, setBrand] = useState<string | null>(null)

  /**
   * Each choice narrows the next, and each level falls back to the first still
   * valid option rather than to what was picked before.
   *
   * That fallback has to happen *before* the next level is computed, not after:
   * switching from a wood table to a meat one leaves a width that the new table
   * has never heard of, and deriving thicknesses from it yields an empty list,
   * then an empty brand, then a select with no options at all. Resolving each
   * level against the corrected value above it means the form cannot reach a
   * combination that has no price.
   */
  const { widths, thicknesses, brands, pitches, safeWidth, safeThickness, safeBrand } = useMemo(() => {
    const ws = [...new Set(blades.map((b) => b.width))].sort((a, b) => a - b)
    const w = width !== null && ws.includes(width) ? width : ws[0]

    const ts = [...new Set(blades.filter((b) => b.width === w).map((b) => b.thickness))].sort(
      (a, b) => a - b,
    )
    const t = thickness !== null && ts.includes(thickness) ? thickness : ts[0]

    const bs = [...new Set(blades.filter((b) => b.width === w && b.thickness === t).map((b) => b.brand))]
    const br = brand !== null && bs.includes(brand) ? brand : bs[0]

    const ps = blades
      .filter((b) => b.width === w && b.thickness === t && b.brand === br)
      .map((b) => b.pitch)

    return {
      widths: ws,
      thicknesses: ts,
      brands: bs,
      pitches: ps,
      safeWidth: w,
      safeThickness: t,
      safeBrand: br,
    }
  }, [blades, width, thickness, brand])

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <FieldLabel htmlFor="table">Приложение</FieldLabel>
          <select
            id="table"
            name="table"
            value={table}
            onChange={(e) => setTable(e.target.value as BladeTableKey)}
            className={selectClass}
          >
            {(Object.keys(BLADE_TABLES) as BladeTableKey[]).map((key) => (
              <option key={key} value={key}>
                {TABLE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="width">Ширина, мм</FieldLabel>
          <select
            id="width"
            name="width"
            value={safeWidth}
            onChange={(e) => setWidth(Number(e.target.value))}
            className={selectClass}
          >
            {widths.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="thickness">Дебелина, мм</FieldLabel>
          <select
            id="thickness"
            name="thickness"
            value={safeThickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className={selectClass}
          >
            {thicknesses.map((t) => (
              <option key={t} value={t}>
                {String(t).replace('.', ',')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="brand">Марка</FieldLabel>
          <select
            id="brand"
            name="brand"
            value={safeBrand}
            onChange={(e) => setBrand(e.target.value)}
            className={selectClass}
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="pitch">Стъпка</FieldLabel>
          {/* Keyed on the option set so a narrowed cascade remounts the select
              rather than leaving a pitch selected that the new blade has not
              got. Uncontrolled otherwise — the pitch has no dependents. */}
          <select
            key={pitches.join('|')}
            id="pitch"
            name="pitch"
            className={selectClass}
            defaultValue={pitches[0]}
          >
            {pitches.map((p) => (
              <option key={p} value={p}>
                {pitchLabel(p)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="length">Дължина, мм</FieldLabel>
          <input
            id="length"
            name="length"
            type="number"
            min={MIN_CUSTOM_LENGTH}
            step={1}
            defaultValue={3000}
            required
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel htmlFor="quantity">Количество</FieldLabel>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={999}
            defaultValue={1}
            required
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="mt-3">
        <legend className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-50 mb-1.5">
          Обработка
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {PROCESSES.map((p) => (
            <label key={p.name} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input type="checkbox" name={p.name} className="accent-[#004FC6]" />
              {p.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-3">
        <SubmitButton>Добави реда</SubmitButton>
      </div>

      <Result state={state} />
    </form>
  )
}

function CatalogueLine({
  orderId,
  products,
}: {
  orderId: number
  products: { slug: string; name: string }[]
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(addCatalogueLine, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />

      <div>
        <FieldLabel htmlFor="sku">Артикул</FieldLabel>
        <select id="sku" name="sku" className={selectClass} defaultValue="">
          <option value="" disabled>
            Изберете от каталога…
          </option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 flex items-end gap-2">
        <div className="w-24">
          <FieldLabel htmlFor="catalogue-quantity">Количество</FieldLabel>
          <input
            id="catalogue-quantity"
            name="quantity"
            type="number"
            min={1}
            max={999}
            defaultValue={1}
            required
            className={inputClass}
          />
        </div>
        <SubmitButton>Добави реда</SubmitButton>
      </div>

      <p className="mt-2 text-[11.5px] text-ink-50">
        Цената се взима от каталога в момента на добавяне.
      </p>

      <Result state={state} />
    </form>
  )
}
