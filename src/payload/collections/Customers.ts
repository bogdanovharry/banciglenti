import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'company', 'createdAt'],
    group: 'Поръчки',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Име' },
    { name: 'email', type: 'email', required: true, label: 'Email' },
    { name: 'phone', type: 'text', label: 'Телефон' },
    { name: 'company', type: 'text', label: 'Фирма' },
    { name: 'eik', type: 'text', label: 'ЕИК' },
    { name: 'vatNumber', type: 'text', label: 'ДДС номер' },
    {
      name: 'addresses',
      type: 'array',
      label: 'Адреси',
      fields: [
        { name: 'label', type: 'text', label: 'Наименование (напр. Офис, Склад)' },
        { name: 'street', type: 'text', label: 'Улица' },
        { name: 'city', type: 'text', label: 'Град' },
        { name: 'postalCode', type: 'text', label: 'Пощенски код' },
        { name: 'isDefault', type: 'checkbox', label: 'По подразбиране' },
      ],
    },
  ],
}
