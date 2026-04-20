import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt'],
    group: 'Съдържание',
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Заглавие' },
    { name: 'slug', type: 'text', required: true, unique: true },
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
