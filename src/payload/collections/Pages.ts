import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Съдържание',
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие' },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'body', type: 'richText', label: 'Съдържание' },
  ],
}
