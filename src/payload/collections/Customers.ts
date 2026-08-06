import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Клиент', plural: 'Клиенти' },
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
    {
      // Was `eik`, the Bulgarian company number. Romania issues a CUI and
      // Greece an ΑΦΜ, so the field is named for what it holds rather than for
      // one country's version of it.
      name: 'taxId',
      type: 'text',
      label: 'ЕИК / CUI / регистрационен номер',
    },
    {
      name: 'vatNumber',
      type: 'text',
      label: 'ДДС номер (VIES)',
      admin: {
        description:
          'За клиенти извън България валиден номер означава обратно начисляване — 0% ДДС. ' +
          'Изисква проверка във VIES и запазена товарителница (CMR) като доказателство, ' +
          'че стоката е напуснала страната.',
      },
    },
    {
      name: 'vatNumberValidated',
      type: 'checkbox',
      label: 'Проверен във VIES',
      defaultValue: false,
      admin: {
        description: 'Отбелязва се автоматично при успешна проверка. Не отмятайте ръчно.',
      },
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'Адреси',
      fields: [
        { name: 'label', type: 'text', label: 'Наименование (напр. Офис, Склад)' },
        { name: 'street', type: 'text', label: 'Улица' },
        { name: 'city', type: 'text', label: 'Град' },
        { name: 'postalCode', type: 'text', label: 'Пощенски код' },
        {
          // Without this an address is unshippable outside Bulgaria, and the
          // order route cannot tell a domestic sale from an intra-community one.
          name: 'country',
          type: 'select',
          label: 'Държава',
          defaultValue: 'BG',
          options: [
            { label: 'България', value: 'BG' },
            { label: 'Румъния', value: 'RO' },
            { label: 'Гърция', value: 'GR' },
          ],
        },
        { name: 'isDefault', type: 'checkbox', label: 'По подразбиране' },
      ],
    },
  ],
}
