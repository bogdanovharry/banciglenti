import type { CollectionConfig } from 'payload'

import { staffEditAdminDelete } from '../access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: staffEditAdminDelete,
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
      name: 'ro',
      type: 'group',
      label: 'Română',
      admin: { description: 'По избор. Ако е празно, румънският текст идва от речника в src/lib/product-text.ts.' },
      fields: [
        { name: 'name', type: 'text', label: 'Име (RO)' },
        { name: 'description', type: 'textarea', label: 'Описание (RO)' },
      ],
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
