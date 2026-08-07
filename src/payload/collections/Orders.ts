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
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'Номер на поръчка',
      admin: { readOnly: true },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Клиент',
      admin: { readOnly: true },
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
        {
          name: 'customSpecs',
          type: 'json',
          label: 'Размери по поръчка',
          admin: {
            readOnly: true,
            condition: (_data, sibling) => Boolean(sibling?.customSpecs),
            description:
              'Точните размери, по които цехът изработва лентата. Записани при поръчката и проверени от сървъра — затова не се редактират.',
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
    {
      name: 'subtotal',
      type: 'number',
      label: 'Междинна сума (EUR)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'tax',
      type: 'number',
      label: 'ДДС (EUR)',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      label: 'ОБЩА СУМА (EUR)',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Изчислено от сървъра при поръчката. Не се редактира.',
      },
    },
    {
      name: 'vatRate',
      type: 'number',
      label: 'ДДС ставка',
      defaultValue: 0.2,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: '0.2 = 20%. Ставката към момента на поръчката — пази се, защото се променя.',
      },
    },
    // Every money field above is EUR — the authored currency. These two record
    // what the buyer actually saw, so an order stays reconcilable after the
    // display rate is revised.
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
      admin: { position: 'sidebar' },
    },
    {
      name: 'exchangeRate',
      type: 'number',
      defaultValue: 1,
      label: 'Курс към EUR',
      admin: {
        position: 'sidebar',
        description: 'Курсът, показан на клиента при поръчката. 1 за EUR.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Бележки',
    },
  ],
}
