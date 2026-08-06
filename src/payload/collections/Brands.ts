import type { CollectionConfig } from 'payload'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: { singular: 'Марка', plural: 'Марки' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'website'],
    group: 'Каталог',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Име',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Лого',
    },
    {
      name: 'website',
      type: 'text',
      label: 'Уебсайт',
    },
  ],
}
