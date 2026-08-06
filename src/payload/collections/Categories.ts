import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категория', plural: 'Категории' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'slug', 'sortOrder'],
    description: 'Дървовидна структура. Родителската категория показва всичко под нея.',
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Родителска категория',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Изображение',
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Подредба',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
