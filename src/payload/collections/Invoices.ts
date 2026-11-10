import type { CollectionConfig } from 'payload'

import { isStaff } from '../access'

/**
 * Issued invoices and credit/debit notes.
 *
 * Immutable by design. Nobody edits or deletes a row through Payload, and the
 * migration adds a database trigger that refuses UPDATE and DELETE even from the
 * Local API. A correction is a new row of type credit_note / debit_note pointing
 * at the original. Rows are created only by the invoicing code (Local API).
 *
 * Money is in integer minor units (bani) so nothing drifts by a cent.
 */
const never = () => false

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { singular: 'Фактура', plural: 'Фактури' },
  admin: { useAsTitle: 'number', defaultColumns: ['number', 'docType', 'issuedAt', 'totalBani'], group: 'Фактури' },
  access: { read: isStaff, create: never, update: never, delete: never },
  fields: [
    {
      name: 'docType',
      type: 'select',
      required: true,
      options: [
        { label: 'Фактура', value: 'invoice' },
        { label: 'Кредитно известие', value: 'credit_note' },
        { label: 'Дебитно известие', value: 'debit_note' },
      ],
    },
    // Series is a setting (instructions, section 5); whether notes share the
    // invoices' series is the owner's open decision, so both are just a value here.
    { name: 'series', type: 'text', required: true },
    {
      name: 'number',
      type: 'text',
      required: true,
      label: 'Номер (10 цифри)',
      validate: (v: string | null | undefined) => (v && /^[0-9]{10}$/.test(v) ? true : 'Десет арабски цифри.'),
    },
    { name: 'issuedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'taxPointAt', type: 'date', label: 'Дата на данъчното събитие' },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true },
    { name: 'relatedInvoice', type: 'relationship', relationTo: 'invoices', label: 'Към фактура' },
    {
      name: 'taxCase',
      type: 'select',
      required: true,
      options: [
        { label: 'А — стандартна ставка (OSS)', value: 'A' },
        { label: 'Б — вътреобщностна доставка, 0%', value: 'B' },
        { label: 'В — като А (валиден номер, доставка другаде)', value: 'C' },
      ],
    },
    { name: 'currency', type: 'text', required: true, defaultValue: 'RON' },
    {
      name: 'language',
      type: 'select',
      required: true,
      options: [
        { label: 'Румънски', value: 'ro' },
        { label: 'Български', value: 'bg' },
        { label: 'Двуезична', value: 'bilingual' },
      ],
    },
    { name: 'netBani', type: 'number', required: true },
    { name: 'vatBani', type: 'number', required: true },
    { name: 'totalBani', type: 'number', required: true },
    // Everything the document says, frozen at issue: supplier, buyer, lines,
    // rates, exchange rate. Regenerating the PDF reads only this.
    { name: 'snapshot', type: 'json', required: true },
    { name: 'pdfSha256', type: 'text', label: 'SHA-256 на PDF' },
    // Proof of transport: waybill, courier, dates, status, courier PDF if any.
    { name: 'shippingProof', type: 'json' },
    { name: 'viesCheck', type: 'relationship', relationTo: 'vies-checks' },
    { name: 'issuedBy', type: 'relationship', relationTo: 'users' },
    { name: 'reason', type: 'text', label: 'Основание (за известия)' },
  ],
}

/** One row per VIES lookup — at order time and again before issuing. */
export const ViesChecks: CollectionConfig = {
  slug: 'vies-checks',
  labels: { singular: 'Проверка във VIES', plural: 'Проверки във VIES' },
  admin: { useAsTitle: 'vatNumber', defaultColumns: ['vatNumber', 'result', 'stage', 'checkedAt'], group: 'Фактури' },
  access: { read: isStaff, create: never, update: never, delete: never },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true },
    { name: 'vatNumber', type: 'text', required: true },
    { name: 'countryCode', type: 'text', required: true },
    {
      name: 'stage',
      type: 'select',
      required: true,
      options: [
        { label: 'При поръчка', value: 'order' },
        { label: 'Преди издаване', value: 'before_issue' },
      ],
    },
    {
      name: 'result',
      type: 'select',
      required: true,
      options: [
        { label: 'Валиден', value: 'valid' },
        { label: 'Невалиден', value: 'invalid' },
        { label: 'Няма отговор', value: 'unavailable' },
      ],
    },
    { name: 'checkedAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    // The identifier VIES returns for the check, kept as evidence.
    { name: 'requestIdentifier', type: 'text' },
    { name: 'raw', type: 'json' },
  ],
}

/** Append-only audit trail: who did what to which document, when and why. */
export const InvoiceEvents: CollectionConfig = {
  slug: 'invoice-events',
  labels: { singular: 'Събитие по фактура', plural: 'Одитна следа' },
  admin: { defaultColumns: ['action', 'invoice', 'at'], group: 'Фактури' },
  access: { read: isStaff, create: never, update: never, delete: never },
  fields: [
    { name: 'invoice', type: 'relationship', relationTo: 'invoices' },
    { name: 'order', type: 'relationship', relationTo: 'orders' },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'Задържана', value: 'held' },
        { label: 'Издадена', value: 'issued' },
        { label: 'Кредитно известие', value: 'credit_note' },
        { label: 'Дебитно известие', value: 'debit_note' },
        { label: 'Изпратена', value: 'sent' },
      ],
    },
    { name: 'actor', type: 'relationship', relationTo: 'users' },
    { name: 'reason', type: 'text' },
    { name: 'at', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}

/**
 * Last number given per series. Incremented only by the single atomic
 * statement in the invoicing code (INSERT … ON CONFLICT DO UPDATE … RETURNING),
 * so concurrent orders cannot receive the same number.
 */
export const InvoiceCounters: CollectionConfig = {
  slug: 'invoice-counters',
  labels: { singular: 'Брояч', plural: 'Броячи на фактури' },
  admin: { useAsTitle: 'series', group: 'Фактури' },
  access: { read: isStaff, create: never, update: never, delete: never },
  fields: [
    { name: 'series', type: 'text', required: true, unique: true },
    { name: 'lastValue', type: 'number', required: true, defaultValue: 0 },
  ],
}
