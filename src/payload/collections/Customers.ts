import type { CollectionConfig } from 'payload'

import { isAdmin, isStaff, serverOnly } from '../access'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Клиент', plural: 'Клиенти' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'company', 'createdAt'],
    group: 'Поръчки',
  },
  // Staff keep the customer book current; removing a customer — and with it
  // the link from their orders — is an administrator's call.
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
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
      // A reverse-charge invoice rests on this, so no person may tick it —
      // only a VIES check running on the server.
      access: serverOnly,
      admin: {
        description: 'Отбелязва се автоматично при успешна проверка. Не отмятайте ръчно.',
      },
    },
    /**
     * Which machines this customer owns — the one thing here that has no
     * equivalent anywhere in the old platform, and the reason the CRM is worth
     * building at all.
     *
     * A bandsaw takes exactly one loop length. A customer with a Holzmann
     * HBS300J always needs 2 240 mm, every time, for as long as they own it.
     * Recording it once turns every repeat order from a conversation about
     * millimetres into a single line, and turns the customer list into a
     * mailing list for the right blade.
     *
     * The figures are copied in, not looked up through a relationship. The
     * registry in src/lib/machines.ts is a compilation from manufacturer
     * documentation and dealer sheets, and its own header warns that entries
     * are provisional — so a correction there must not silently change what a
     * customer was told their machine takes. `source` records where the numbers
     * came from, including "потвърдено от клиента", which outranks any sheet.
     */
    {
      name: 'machines',
      type: 'array',
      label: 'Машини на клиента',
      labels: { singular: 'Машина', plural: 'Машини' },
      admin: {
        description:
          'Размерът на лентата, който машината иска. Попълва се от регистъра при избор, ' +
          'но остава редактируем — клиентът знае машината си по-добре от каталога.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'brand', type: 'text', required: true, label: 'Марка' },
            { name: 'model', type: 'text', required: true, label: 'Модел' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'bladeLength', type: 'number', label: 'Дължина на лентата (мм)' },
            { name: 'bladeWidth', type: 'number', label: 'Ширина (мм)' },
            { name: 'bladeThickness', type: 'number', label: 'Дебелина (мм)' },
          ],
        },
        {
          name: 'source',
          type: 'text',
          label: 'Източник на размера',
          admin: { description: 'напр. „регистър“, „потвърдено от клиента“, „от стара поръчка“.' },
        },
        { name: 'notes', type: 'text', label: 'Бележка' },
      ],
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
