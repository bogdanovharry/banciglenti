import { ValidationError, type CollectionConfig } from 'payload'

import { isAdmin, isStaff } from '../access'

type LogRow = { id?: string | null; note?: string | null; author?: unknown; at?: string | null }

const authorId = (value: unknown): unknown =>
  value && typeof value === 'object' && 'id' in value ? (value as { id: unknown }).id : (value ?? null)

const instant = (value: string | null | undefined): number | null =>
  value ? new Date(value).getTime() : null

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Поръчка', plural: 'Поръчки' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'total', 'customer', 'createdAt'],
    description:
      'Само за преглед. Поръчките се обработват в /manage/orders — там статусът следва правилата, сумите се преизчисляват и всяка промяна влиза в историята.',
    listSearchableFields: ['orderNumber'],
    pagination: { defaultLimit: 50 },
    group: 'Поръчки',
  },
  /**
   * Read-only through Payload, on purpose.
   *
   * Editing an order here skipped everything that makes an order trustworthy:
   * the status could jump from cancelled to shipped, a shipping change left the
   * total unrecomputed, and nothing reached the history. Every one of those
   * rules lives in src/lib/manage/actions.ts, which writes through the Local API
   * and so is not affected by these settings; the storefront's order route is
   * not either. What is closed is the side door — this form and PATCH on
   * /api/orders/:id — for every account, administrators included.
   *
   * Deleting stays possible for an administrator, for test orders and spam.
   */
  access: {
    read: isStaff,
    create: () => false,
    update: () => false,
    delete: isAdmin,
  },
  hooks: {
    /**
     * History is append-only.
     *
     * Access control already keeps browsers out, so this guards against the
     * code: any write that drops, reorders or rewrites an existing entry is
     * refused, whoever makes it. An order's history is what gets argued about
     * weeks later, and it is only worth that if nothing in it can be changed.
     */
    beforeChange: [
      ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update' || !originalDoc || !Array.isArray((data as { log?: unknown }).log)) {
          return data
        }
        const before = ((originalDoc as { log?: LogRow[] | null }).log ?? []) as LogRow[]
        const after = (data as { log: LogRow[] }).log

        const intact =
          after.length >= before.length &&
          before.every((entry, i) => {
            const next = after[i]
            return (
              next !== undefined &&
              (next.note ?? '') === (entry.note ?? '') &&
              authorId(next.author) === authorId(entry.author) &&
              instant(next.at) === instant(entry.at)
            )
          })

        if (!intact) {
          throw new ValidationError({
            collection: 'orders',
            errors: [{ path: 'log', message: 'Историята на поръчката не се редактира — само се допълва.' }],
            req,
          })
        }
        return data
      },
    ],
  },
  fields: [
    // The order as a document, above the fields that edit it. See
    // src/payload/components/OrderSummary.tsx.
    {
      name: 'summary',
      type: 'ui',
      admin: {
        components: {
          Field: '@/payload/components/OrderSummary#OrderSummary',
        },
      },
    },
    // Both are in the summary card above — the number is also the page title,
    // and the customer's name, phone and email are on one line there. Repeating
    // them as locked inputs added nothing, and the relationship rendered as
    // "Неозаглавен - ID: 5" instead of the name it holds.
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      admin: { hidden: true },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      admin: { hidden: true },
    },
    // Hidden from the form: every line, its sizes and its totals are in the
    // summary card. Keeping the array here as well is what forced the screen
    // to scroll — the old platform fitted the whole order in one view and that
    // is the point of it.
    {
      name: 'items',
      type: 'array',
      label: 'Продукти',
      admin: { hidden: true },
      fields: [
        // Name first: it is what the row is. The two relationships come after,
        // and only appear for catalogue lines — a made-to-measure blade has no
        // product record to point at, so showing empty pickers on every custom
        // line was pure noise.
        { name: 'name', type: 'text', label: 'Артикул', admin: { readOnly: true } },
        {
          type: 'row',
          fields: [
            { name: 'quantity', type: 'number', required: true, label: 'Количество', admin: { readOnly: true } },
            { name: 'price', type: 'number', required: true, label: 'Ед. цена (EUR)', admin: { readOnly: true } },
            { name: 'sku', type: 'text', label: 'SKU', admin: { readOnly: true } },
          ],
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          label: 'Продукт от каталога',
          admin: {
            readOnly: true,
            condition: (_data, sibling) => Boolean(sibling?.product),
          },
        },
        {
          name: 'variant',
          type: 'relationship',
          relationTo: 'product-variants',
          label: 'Вариант',
          admin: {
            readOnly: true,
            condition: (_data, sibling) => Boolean(sibling?.variant),
          },
        },
        // Written by /api/checkout. It stays on the document because the order
        // route and the workshop both read it — but a JSON editor with line
        // numbers is a request to a programmer, not a work order. Hidden here
        // and rendered as fields by the panel below.
        {
          name: 'customSpecs',
          type: 'json',
          admin: { hidden: true },
        },
        {
          name: 'specsSummary',
          type: 'ui',
          admin: {
            condition: (_data, sibling) => Boolean(sibling?.customSpecs),
            components: {
              Field: '@/payload/components/SpecsSummary#SpecsSummary',
            },
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Статус',
      options: [
        { label: 'Чакаща', value: 'pending' },
        { label: 'Потвърдена', value: 'confirmed' },
        { label: 'В обработка', value: 'processing' },
        { label: 'Изпратена', value: 'shipped' },
        { label: 'Доставена', value: 'delivered' },
        { label: 'Отказана', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      // Every control on one line. Stacked full-width fields are what made this
      // three screens tall — the old platform put the whole order in one view
      // and that is the only thing that makes it quick to work.
      name: 'payment',
      type: 'group',
      label: 'Плащане',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'method',
              type: 'select',
              label: 'Метод',
              options: [
                { label: 'myPOS (карта)', value: 'mypos' },
                { label: 'Наложен платеж', value: 'cod' },
                { label: 'Банков превод', value: 'bank_transfer' },
              ],
            },
            {
              name: 'status',
              type: 'select',
              label: 'Статус на плащане',
              options: [
                { label: 'Очаква плащане', value: 'pending' },
                { label: 'Платена', value: 'paid' },
                { label: 'Неуспешна', value: 'failed' },
                { label: 'Възстановена', value: 'refunded' },
              ],
            },
            { name: 'transactionId', type: 'text', label: 'Transaction ID' },
          ],
        },
      ],
    },
    {
      name: 'shipping',
      type: 'group',
      label: 'Доставка',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'method',
              type: 'select',
              label: 'Метод',
              options: [
                { label: 'Куриер', value: 'courier' },
                { label: 'Лично вземане', value: 'pickup' },
              ],
            },
            { name: 'cost', type: 'number', label: 'Цена доставка (EUR)', defaultValue: 0 },
            { name: 'trackingNumber', type: 'text', label: 'Товарителница' },
          ],
        },
        /**
         * The courier office, which the old platform had and this did not.
         *
         * Most orders in this trade go to an Еконт or Спиди office rather than
         * to a street address — a blade is collected on the way past, not
         * waited in for. Without a field for it the office was being typed into
         * the address box, where the courier's own label printer cannot find it.
         */
        { name: 'office', type: 'text', label: 'Офис на куриера' },
        // Full width: it is an address, and it is also in the summary card, so
        // it is here only for correcting a typo before dispatch.
        { name: 'address', type: 'textarea', label: 'Адрес за доставка' },
      ],
    },
    // The three money fields sit in the sidebar, read-only, because /api/checkout
    // computed them from the price tables and re-verified every line. Editing
    // one here would silently disagree with what the customer was charged and
    // with what the accountant reconciles against.
    // Hidden from the form, not removed. The summary card at the top already
    // shows every one of these, formatted and adding up — repeating them in the
    // sidebar as locked inputs gave the reader nothing and cost them the space.
    // The values still exist on the document, and the API still returns them.
    { name: 'subtotal', type: 'number', admin: { hidden: true } },
    { name: 'tax', type: 'number', defaultValue: 0, admin: { hidden: true } },
    { name: 'total', type: 'number', required: true, admin: { hidden: true } },
    { name: 'vatRate', type: 'number', defaultValue: 0.2, admin: { hidden: true } },
    /**
     * Currency and rate appear only when they say something.
     *
     * With one market, "EUR" and "1" are noise on every order — they are the
     * only values they can hold. They become visible the moment an order
     * arrives in another currency, which is exactly when someone needs to see
     * at what rate it was taken.
     */
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'EUR',
      label: 'Валута на клиента',
      options: [
        { label: 'EUR', value: 'EUR' },
        { label: 'RON', value: 'RON' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.currency !== 'EUR',
      },
    },
    {
      name: 'exchangeRate',
      type: 'number',
      defaultValue: 1,
      label: 'Курс към EUR',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.currency !== 'EUR',
        description: 'Курсът, показан на клиента при поръчката.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { hidden: true }, // shown in the summary card
    },
    /**
     * Internal history, which the old platform had and this did not.
     *
     * A single "Бележки" box loses everything but the last edit — who called
     * the customer, why an order was refused, when the workshop confirmed the
     * size. Those are the questions asked weeks later, and a textarea cannot
     * answer them. Each entry keeps its author and time.
     */
    {
      name: 'log',
      type: 'array',
      label: 'Коментари по поръчката',
      labels: { singular: 'Коментар', plural: 'Коментари' },
      admin: {
        description:
          'Вътрешни бележки — клиентът не ги вижда. При отказ на поръчка тук се записва причината.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'note',
          type: 'textarea',
          required: true,
          label: 'Коментар',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              label: 'Автор',
              admin: { readOnly: true },
              /**
               * An existing entry keeps the author it was written with; a new
               * one is signed by whoever is making the request, whatever the
               * request claims. Rows are matched by id, which is why the
               * actions send existing rows back with theirs.
               */
              hooks: {
                beforeChange: [
                  ({ value, previousValue, previousSiblingDoc, req }) =>
                    (previousSiblingDoc as { id?: unknown } | undefined)?.id
                      ? (previousValue ?? value ?? null)
                      : (req.user?.id ?? value ?? null),
                ],
              },
            },
            {
              name: 'at',
              type: 'date',
              label: 'Дата',
              admin: {
                readOnly: true,
                date: { pickerAppearance: 'dayAndTime' },
              },
              // Same rule: the server's clock for a new entry, the original
              // time for one that already exists.
              hooks: {
                beforeChange: [
                  ({ value, previousValue, previousSiblingDoc }) =>
                    (previousSiblingDoc as { id?: unknown } | undefined)?.id
                      ? (previousValue ?? value ?? new Date().toISOString())
                      : new Date().toISOString(),
                ],
              },
            },
          ],
        },
      ],
    },
  ],
}
