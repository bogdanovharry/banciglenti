import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'brand', 'status', 'updatedAt'],
    group: 'Каталог',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Име на продукта',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Кратко описание',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Пълно описание',
    },
    {
      name: 'images',
      type: 'array',
      label: 'Изображения',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      label: 'Марка',
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Категории',
    },
    {
      name: 'basePrice',
      type: 'number',
      label: 'Базова цена (EUR)',
      min: 0,
    },
    {
      name: 'specs',
      type: 'group',
      label: 'Спецификации',
      fields: [
        { name: 'width', type: 'number', label: 'Ширина (mm)' },
        { name: 'thickness', type: 'number', label: 'Дебелина (mm)' },
        { name: 'material', type: 'text', label: 'Материал' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'active',
      options: [
        { label: 'Активен', value: 'active' },
        { label: 'Неактивен', value: 'inactive' },
        { label: 'Изчерпан', value: 'out_of_stock' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Препоръчан продукт',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
