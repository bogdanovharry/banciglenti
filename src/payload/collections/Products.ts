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
        {
          name: 'length',
          type: 'number',
          label: 'Дължина на контура (mm)',
          admin: { description: 'Обиколката на лентата — размерът, който трябва да съвпадне с машината.' },
        },
        { name: 'material', type: 'text', label: 'Материал' },
      ],
    },
    {
      name: 'machines',
      type: 'array',
      label: 'Пасва на машини',
      admin: {
        description:
          'Марка и модел на машините, за които е този размер. Показва се като филтър в каталога.',
      },
      fields: [
        { name: 'brand', type: 'text', required: true, label: 'Марка' },
        { name: 'model', type: 'text', required: true, label: 'Модел' },
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
      name: 'stock',
      type: 'number',
      label: 'Наличност (бр.)',
      defaultValue: 0,
      min: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Препоръчан продукт',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'topProduct',
      type: 'checkbox',
      label: 'TOP продукт',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Показва значка TOP в каталога.',
      },
    },
  ],
}
