import type { CollectionConfig } from 'payload'

import { staffEditAdminDelete } from '../access'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: staffEditAdminDelete,
  labels: { singular: 'Страница', plural: 'Страници' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Съдържание',
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'body', type: 'richText', label: 'Съдържание' },
  ],
}
