import type { CollectionConfig } from 'payload'

import { staffEditAdminDelete } from '../access'
import { slugify } from '../../lib/slugify'

export const Articles: CollectionConfig = {
  slug: 'articles',
  access: staffEditAdminDelete,
  labels: { singular: 'Статия', plural: 'Статии' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'market', 'category', 'status', 'publishedAt'],
    group: 'Съдържание',
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Адрес (slug)',
      admin: { description: 'Попълва се само от заглавието, ако го оставите празно. Само малки латински букви, цифри и тирета.' },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            const source = (typeof value === 'string' && value.trim()) || (typeof data?.title === 'string' ? data.title : '')
            return slugify(source)
          },
        ],
      },
    },
    {
      name: 'market',
      type: 'select',
      defaultValue: 'bg',
      required: true,
      label: 'За кой магазин',
      options: [
        { label: 'България', value: 'bg' },
        { label: 'Румъния', value: 'ro' },
        { label: 'Всички магазини', value: 'all' },
      ],
      admin: { position: 'sidebar', description: 'Статията се вижда само в избрания магазин и се пише на неговия език.' },
    },
    { name: 'category', type: 'select', label: 'Категория', options: [
      { label: 'Блог', value: 'blog' },
      { label: 'Техническа информация', value: 'technical' },
    ]},
    { name: 'excerpt', type: 'textarea', label: 'Резюме' },
    { name: 'body', type: 'richText', label: 'Съдържание' },
    { name: 'featuredImage', type: 'upload', relationTo: 'media', label: 'Изображение' },
    { name: 'publishedAt', type: 'date', label: 'Дата на публикуване', admin: { position: 'sidebar' } },
    { name: 'status', type: 'select', defaultValue: 'draft', label: 'Статус', options: [
      { label: 'Чернова', value: 'draft' },
      { label: 'Публикувана', value: 'published' },
    ], admin: { position: 'sidebar' }},
  ],
}
