import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Поръчка', plural: 'Поръчки' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'status', 'total', 'customer', 'createdAt'],
    description:
      'Нови поръчки са със статус „Чакаща“. Сумите и артикулите са изчислени и проверени от сървъра при поръчката и не се редактират — променят се само статусът, плащането и товарителницата.',
    listSearchableFields: ['orderNumber'],
    pagination: { defaultLimit: 50 },
    group: 'Поръчки',
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
    {
      name: 'items',
      type: 'array',
      label: 'Продукти',
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
        // Written by /api/orders. It stays on the document because the order
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
      name: 'payment',
      type: 'group',
      label: 'Плащане',
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
        { name: 'status', type: 'select', label: 'Статус на плащане', options: [
          { label: 'Очаква плащане', value: 'pending' },
          { label: 'Платена', value: 'paid' },
          { label: 'Неуспешна', value: 'failed' },
          { label: 'Възстановена', value: 'refunded' },
        ]},
        { name: 'transactionId', type: 'text', label: 'Transaction ID' },
      ],
    },
    {
      name: 'shipping',
      type: 'group',
      label: 'Доставка',
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
        { name: 'address', type: 'textarea', label: 'Адрес за доставка' },
        { name: 'cost', type: 'number', label: 'Цена доставка (EUR)', defaultValue: 0 },
        { name: 'trackingNumber', type: 'text', label: 'Tracking номер' },
      ],
    },
    // The three money fields sit in the sidebar, read-only, because /api/orders
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
      label: 'Коментар от клиента',
      admin: {
        readOnly: true,
        description: 'Каквото клиентът е написал при поръчката.',
      },
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
              // Stamped on create so an entry cannot be attributed to someone else.
              hooks: {
                beforeChange: [({ value, req }) => value ?? req.user?.id ?? null],
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
              hooks: {
                beforeChange: [({ value }) => value ?? new Date().toISOString()],
              },
            },
          ],
        },
      ],
    },
  ],
}
