'use client'

import { useActionState, useState } from 'react'

import { addMachine, removeMachine } from '@/lib/manage/customer-actions'
import type { ActionResult } from '@/lib/manage/actions'
import { MACHINES, machineLabel } from '@/lib/machines'
import { FieldLabel, Result, SubmitButton, inputClass, selectClass } from '../../../_components/form'

/**
 * Recording which machine a customer runs.
 *
 * Picking from the registry fills the blade size in, which is the entire point:
 * whoever is on the phone should not have to know that a Holzmann HBS300J takes
 * 2 240 mm. But every field stays editable afterwards, because the registry is
 * a compilation from manufacturer sheets and dealer listings — its own header
 * says entries are provisional — and the customer standing next to the machine
 * with a tape measure outranks all of it.
 *
 * "Друга машина" is not an afterthought either. This trade is full of machines
 * older than the manufacturer's website, and a customer whose saw is not in a
 * registry still needs blades.
 */

const OTHER = '__other__'

export function AddMachine({ customerId }: { customerId: number }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(addMachine, null)
  const [choice, setChoice] = useState<string>(MACHINES[0] ? machineLabel(MACHINES[0]) : OTHER)

  const picked = MACHINES.find((m) => machineLabel(m) === choice) ?? null
  const custom = choice === OTHER

  return (
    <form action={formAction}>
      <input type="hidden" name="customerId" value={customerId} />

      <div>
        <FieldLabel htmlFor="machine">Машина</FieldLabel>
        <select
          id="machine"
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className={selectClass}
        >
          {MACHINES.map((m) => (
            <option key={machineLabel(m)} value={machineLabel(m)}>
              {machineLabel(m)} · {m.length} мм{m.verified ? '' : ' (непотвърдено)'}
            </option>
          ))}
          <option value={OTHER}>Друга машина…</option>
        </select>
      </div>

      {/* Keyed on the choice so the fields re-fill when a different machine is
          picked — they are uncontrolled, and defaultValue only applies on mount. */}
      <div key={choice} className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <FieldLabel htmlFor="brand">Марка</FieldLabel>
          <input
            id="brand"
            name="brand"
            required
            defaultValue={picked?.brand ?? ''}
            readOnly={!custom}
            className={`${inputClass} ${!custom ? 'bg-paper text-ink-70' : ''}`}
          />
        </div>
        <div>
          <FieldLabel htmlFor="model">Модел</FieldLabel>
          <input
            id="model"
            name="model"
            required
            defaultValue={picked?.model ?? ''}
            readOnly={!custom}
            className={`${inputClass} ${!custom ? 'bg-paper text-ink-70' : ''}`}
          />
        </div>

        <div>
          <FieldLabel htmlFor="bladeLength">Дължина, мм</FieldLabel>
          <input
            id="bladeLength"
            name="bladeLength"
            inputMode="numeric"
            defaultValue={picked?.length ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="bladeWidth">Ширина, мм</FieldLabel>
          <input
            id="bladeWidth"
            name="bladeWidth"
            inputMode="numeric"
            defaultValue={picked?.width ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="bladeThickness">Дебелина, мм</FieldLabel>
          <input
            id="bladeThickness"
            name="bladeThickness"
            inputMode="numeric"
            defaultValue={picked?.thickness ?? ''}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel htmlFor="source">Източник</FieldLabel>
          <input
            id="source"
            name="source"
            defaultValue={picked ? (picked.verified ? 'регистър' : 'регистър (непотвърдено)') : ''}
            placeholder="напр. потвърдено от клиента"
            className={inputClass}
          />
        </div>

        <div className="col-span-2">
          <FieldLabel htmlFor="notes">Бележка</FieldLabel>
          <input
            id="notes"
            name="notes"
            placeholder="напр. втора машина в цеха"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3">
        <SubmitButton>Добави машината</SubmitButton>
      </div>

      <Result state={state} />
    </form>
  )
}

export function RemoveMachineButton({
  customerId,
  index,
  label,
}: {
  customerId: number
  index: number
  label: string
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(removeMachine, null)

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="index" value={index} />
      {/* As with order lines: a position only means something against the list
          that produced it, so the action re-checks what it is deleting. */}
      <input type="hidden" name="expect" value={label} />
      <button
        type="submit"
        title={`Премахни „${label}“`}
        aria-label={`Премахни ${label}`}
        className="w-6 h-6 inline-flex items-center justify-center text-ink-30 hover:text-danger hover:bg-paper cursor-pointer text-[15px] leading-none"
      >
        ×
      </button>
      {state && !state.ok && (
        <span role="status" className="block text-[11.5px] text-danger mt-1">
          {state.error}
        </span>
      )}
    </form>
  )
}
