import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'status', 'total', 'createdAt'],
    group: 'Поръчки',
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'Номер на поръчка',
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Клиент',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Продукти',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Продукт' },
        { name: 'variant', type: 'relationship', relationTo: 'product-variants', label: 'Вариант' },
        { name: 'name', type: 'text', label: 'Име' },
        { name: 'sku', type: 'text', label: 'SKU' },
        { name: 'quantity', type: 'number', required: true, label: 'Количество' },
        { name: 'price', type: 'number', required: true, label: 'Цена (EUR)' },
        { name: 'customSpecs', type: 'json', label: 'Custom размери (ако има)' },
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
    {
      name: 'subtotal',
      type: 'number',
      label: 'Междинна сума (EUR)',
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      label: 'Обща сума (EUR)',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Бележки',
    },
  ],
}
