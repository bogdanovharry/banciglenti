import type { CollectionConfig } from 'payload'

/**
 * Contact-form submissions.
 *
 * These are stored rather than only emailed, because email is the part most
 * likely to fail: no adapter is configured yet, and once one is, a bounced or
 * spam-filtered message would lose a customer enquiry silently. The database
 * is the record; email is the notification on top of it.
 *
 * Writes come only from /api/enquiries via the local API — `create` is closed
 * so the REST endpoint cannot be posted to directly.
 */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Запитване', plural: 'Запитвания' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'industry', 'phone', 'status', 'createdAt'],
    description: 'Запитвания от формата за контакт. Новите са със статус „Ново“.',
    listSearchableFields: ['name', 'email', 'company', 'message'],
    pagination: { defaultLimit: 50 },
    group: 'Поръчки',
  },
  access: {
    create: () => false, // only the route, through the local API
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: 'Статус',
      options: [
        { label: 'Ново', value: 'new' },
        { label: 'В процес', value: 'in_progress' },
        { label: 'Приключено', value: 'closed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'emailStatus',
      type: 'select',
      defaultValue: 'not_sent',
      label: 'Известяване по имейл',
      options: [
        { label: 'Не е изпратено', value: 'not_sent' },
        { label: 'Изпратено', value: 'sent' },
        { label: 'Грешка', value: 'failed' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Докато няма конфигуриран имейл доставчик, запитванията се пазят само тук. ' +
          'Проверявайте този списък.',
      },
    },
    { name: 'name', type: 'text', required: true, label: 'Име' },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true, label: 'Имейл' },
        { name: 'phone', type: 'text', label: 'Телефон' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'company', type: 'text', label: 'Компания' },
        {
          name: 'industry',
          type: 'select',
          label: 'Индустрия',
          options: ['Дърво', 'Метал', 'Храни', 'Хоби', 'Абразиви', 'Друго'].map((v) => ({
            label: v,
            value: v,
          })),
        },
      ],
    },
    { name: 'message', type: 'textarea', required: true, label: 'Съобщение' },
    {
      name: 'meta',
      type: 'group',
      label: 'Технически данни',
      admin: { description: 'Попълва се автоматично. Помага при спам.' },
      fields: [
        { name: 'userAgent', type: 'text', label: 'Браузър' },
        { name: 'referer', type: 'text', label: 'Страница' },
      ],
    },
  ],
  timestamps: true,
}
